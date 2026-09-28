import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const isProd = process.env.NODE_ENV === "production";

app.use(express.json({ limit: "25mb" }));

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// In-memory cache to prevent exceeding API rate limits (Free Tier 5 req/min)
const cache: {
  dailyInsight?: { data: any; timestamp: number };
  curateRooms?: { data: any; timestamp: number };
  bookPreface?: { data: any; timestamp: number };
} = {};

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache for AI curation

// Helper for calling Gemini with retry and exponential backoff on 429
async function safeGenerateContent(params: any, maxRetries = 2): Promise<any> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err: any) {
      const is429 =
        err?.status === 429 ||
        err?.message?.includes("429") ||
        err?.message?.includes("RESOURCE_EXHAUSTED") ||
        err?.message?.includes("Quota exceeded");

      if (is429 && attempt < maxRetries) {
        // Wait 2.5s on 429 before retrying
        await new Promise((resolve) => setTimeout(resolve, 2500 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
}

// Fallback preface and afterword
const DEFAULT_BOOK_PREFACE = {
  preface: `日常という名の広大な海から、すくい上げられた幾千の光滴。
私たちが「美しい」と感じるとき、世界はほんの少しだけその秘密を開示してくれるのかもしれません。
ここに編まれた標本たちは、あなたが立ち止まり、息を呑み、心を通わせた確かな証拠です。
ページをめくるたび、忘れかけていたあの日の風の匂いや、夕暮れの光が再びあなたの胸を満たすことを祈って。`,
  afterword: `美しさは、遠くの名画の中にだけあるのではありません。
濡れたアスファルトに映る街灯、ふと胸をかすめた旋律、旅先で見上げた名もなき星空。
この一冊の図録は、あなたが今日まで生きてきた優しさの軌跡そのものです。`,
};

// API: Daily Curator Insight & Thematic Spotlight
app.post("/api/gemini/daily-insight", async (req, res) => {
  try {
    const { items, todayDate } = req.body;

    // Check cache first
    const now = Date.now();
    if (cache.dailyInsight && now - cache.dailyInsight.timestamp < CACHE_TTL_MS) {
      return res.json(cache.dailyInsight.data);
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        fallback: true,
        greeting: "日々の営みの中に佇む、名もなき美しさへようこそ。",
        trendObservation: "最近の収蔵品には「青」や「水」、静けさを湛えた光の記録が多く見受けられます。",
        timeCapsuleNote: "時を超えて残された記憶が、今日のまなざしと静かに呼応しています。",
        curatorMessage: "美学芸員より：世界が騒がしい日ほど、あなたの瞳が捉えた小さな透明さに救われます。本日はその中から、静謐を宿す展示をご用意しました。",
        spotlightTheme: "青と水が織りなす静謐の回廊",
        spotlightDescription: "日常の喧騒から少し離れ、心の内側に静かな波紋を広げた光と色の標本たち。",
        spotlightItemIds: ["opus-001", "opus-002", "opus-004"],
      });
    }

    const summaryList = (items || []).slice(0, 20).map((it: any) => ({
      id: it.id,
      title: it.title,
      type: it.type,
      date: it.date,
      whyBeautiful: it.whyBeautiful,
      categories: it.categories,
      locationName: it.locationName,
    }));

    const prompt = `あなたは「今日見つけた美しいものを保存する美術館」の思索的で洗練されたAI学芸員（キュレーター）です。
来館者（ユーザー）が日々集めた美しいものの収蔵データが与えられます。

今日の日付: ${todayDate || "2026年9月28日"}
現在の収蔵品リスト(抜粋):
${JSON.stringify(summaryList, null, 2)}

以下の観点で、思索的かつ文学的で心温まるキュレーションを行ってください：
1. 過去の同じ月日（または数年前の同じ季節・月）の記録や、時間の積み重なりへの言及（例：「3年前の今日保存した記憶」「昨年の秋に見つけた光」など）。該当がなければ「時の積み重なり」についての詩的言及。
2. 最近の収蔵傾向の分析（例：「最近『青』や『水』に心惹かれているようですね」「『孤独』や『夕暮れ』の静寂を愛おしむ眼差しが伺えます」など）。
3. 本日の推薦展示テーマ（スポットライト）と、それに該当する収蔵品IDの選定（3〜5点）。
4. 学芸員からの本日のメッセージ（短く詩的で、今日美しいものを探す励みになる言葉）。

必ず以下のJSON形式のみで出力してください（純粋なJSON）：
{
  "greeting": "冒頭の挨拶",
  "trendObservation": "最近の傾向の分析",
  "timeCapsuleNote": "過去の記憶や時間の重なりへの言及",
  "spotlightTheme": "本日の特集展示タイトル",
  "spotlightDescription": "本日の特集展示の趣旨",
  "curatorMessage": "学芸員からの本日のメッセージ",
  "spotlightItemIds": ["選定したアイテムIDの配列"]
}`;

    const response = await safeGenerateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    cache.dailyInsight = { data, timestamp: Date.now() };
    return res.json(data);
  } catch (error: any) {
    console.warn("Using graceful fallback for daily insight (Gemini busy or rate-limited)");
    const fallbackData = {
      fallback: true,
      greeting: "日々の営みの中に佇む、名もなき美しさへようこそ。",
      trendObservation: "最近の収蔵品には「青」や「水」、静けさを湛えた光の記録が多く見受けられます。",
      timeCapsuleNote: "時を超えて残された記憶が、今日のまなざしと静かに呼応しています。",
      spotlightTheme: "青と水が織りなす静謐の回廊",
      spotlightDescription: "日常の喧騒から少し離れ、心の内側に静かな波紋を広げた光と色の標本たち。",
      curatorMessage: "世界が騒がしい日ほど、あなたの瞳が捉えた小さな透明さに救われます。",
      spotlightItemIds: ["opus-001", "opus-002", "opus-004"],
    };
    cache.dailyInsight = { data: fallbackData, timestamp: Date.now() };
    return res.status(200).json(fallbackData);
  }
});

// API: Curate Exhibition Rooms
app.post("/api/gemini/curate-rooms", async (req, res) => {
  try {
    const { items } = req.body;

    // Check cache
    const now = Date.now();
    if (cache.curateRooms && now - cache.curateRooms.timestamp < CACHE_TTL_MS) {
      return res.json(cache.curateRooms.data);
    }

    const defaultRooms = [
      {
        id: "room-blue-water",
        name: "青と水面の回廊",
        subtitle: "透き通る記憶と静寂の標本",
        concept: "光を透かす水や青い時間帯に宿る、清らかな余白。",
        itemIds: (items || []).filter((it: any) =>
          it.categories?.colors?.includes("青") ||
          it.categories?.attributes?.includes("水")
        ).map((it: any) => it.id),
      },
      {
        id: "room-ephemeral-light",
        name: "はかなき光の標本室",
        subtitle: "消えゆくからこそ美しいものたち",
        concept: "夕暮れや影、二度と戻らない一瞬のきらめき。",
        itemIds: (items || []).filter((it: any) =>
          it.categories?.nuances?.includes("はかない") ||
          it.categories?.times?.includes("夕暮れ")
        ).map((it: any) => it.id),
      },
      {
        id: "room-quiet-solitude",
        name: "孤独と懐郷の小部屋",
        subtitle: "自分自身へと還る穏やかな時間",
        concept: "ひとり静かに夜の深さを味わい、遠い記憶を愛おしむ。",
        itemIds: (items || []).filter((it: any) =>
          it.categories?.emotions?.includes("孤独") ||
          it.categories?.emotions?.includes("懐かしい")
        ).map((it: any) => it.id),
      },
    ];

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({ rooms: defaultRooms });
    }

    const itemsSummary = (items || []).slice(0, 40).map((it: any) => ({
      id: it.id,
      title: it.title,
      categories: it.categories,
      whyBeautiful: it.whyBeautiful,
    }));

    const prompt = `あなたは美術展のキュレーションを設計する専門家です。
来館者が保存した美しいもののコレクションから、感性豊かなテーマ別の展示室（3〜4室）を自動編成してください。
収蔵品概要:
${JSON.stringify(itemsSummary, null, 2)}

以下のJSONフォーマットのみで出力してください:
{
  "rooms": [
    {
      "id": "room_unique_id",
      "name": "展示室の名前",
      "subtitle": "副題",
      "concept": "この展示室の美学的背景（80文字程度）",
      "itemIds": ["アイテムIDの配列"]
    }
  ]
}`;

    const response = await safeGenerateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    if (data.rooms && Array.isArray(data.rooms) && data.rooms.length > 0) {
      cache.curateRooms = { data, timestamp: Date.now() };
      return res.json(data);
    }
    return res.json({ rooms: defaultRooms });
  } catch (error: any) {
    console.warn("Using graceful default rooms (Gemini busy or rate-limited)");
    const fallbackRooms = {
      rooms: [
        {
          id: "room-blue-water",
          name: "青と水面の回廊",
          subtitle: "透き通る記憶と静寂の標本",
          concept: "光を透かす水や青い時間帯に宿る、清らかな余白。",
          itemIds: ["opus-001", "opus-002", "opus-003", "opus-004", "opus-005"],
        },
        {
          id: "room-ephemeral-light",
          name: "はかなき光の標本室",
          subtitle: "消えゆくからこそ美しいものたち",
          concept: "夕暮れや影、二度と戻らない一瞬のきらめき。",
          itemIds: ["opus-001", "opus-003", "opus-007"],
        },
        {
          id: "room-quiet-solitude",
          name: "孤独と懐郷の小部屋",
          subtitle: "自分自身へと還る穏やかな時間",
          concept: "ひとり静かに夜の深さを味わい、遠い記憶を愛おしむ。",
          itemIds: ["opus-004", "opus-005"],
        },
      ],
    };
    cache.curateRooms = { data: fallbackRooms, timestamp: Date.now() };
    return res.status(200).json(fallbackRooms);
  }
});

// API: Generate Digital Book Preface and Curatorial Essay
app.post("/api/gemini/generate-book-preface", async (req, res) => {
  try {
    const { items, bookTitle, volumeName } = req.body;

    // Check cache
    const now = Date.now();
    if (cache.bookPreface && now - cache.bookPreface.timestamp < CACHE_TTL_MS) {
      return res.json(cache.bookPreface.data);
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json(DEFAULT_BOOK_PREFACE);
    }

    const titlesAndNotes = (items || []).slice(0, 20).map((it: any) => ({
      title: it.title,
      whyBeautiful: it.whyBeautiful,
      date: it.date,
      tags: it.categories,
    }));

    const prompt = `あなたは高級美術図録の編纂者・哲学的キュレーターです。
来館者が保存した「日常の美しいもの」を一冊のデジタルアートブック（図録）として製本します。
書名: ${bookTitle || "美の標本録"}
巻: ${volumeName || "第一巻：日常のきらめき"}
収録作品抜粋:
${JSON.stringify(titlesAndNotes, null, 2)}

この図録の巻頭に掲げる「序文（Preface）」と、巻末を飾る「跋文（Afterword）」を、格調高く詩的で心に染み入る日本語で執筆してください。
形式:
{
  "preface": "序文（200〜300文字程度）",
  "afterword": "跋文（150〜250文字程度）"
}`;

    const response = await safeGenerateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    if (data.preface) {
      cache.bookPreface = { data, timestamp: Date.now() };
      return res.json(data);
    }
    return res.json(DEFAULT_BOOK_PREFACE);
  } catch (error: any) {
    console.warn("Using graceful default book preface (Gemini busy or rate-limited)");
    cache.bookPreface = { data: DEFAULT_BOOK_PREFACE, timestamp: Date.now() };
    return res.status(200).json(DEFAULT_BOOK_PREFACE);
  }
});

// API: Transcribe Smartphone/Device Recorded Audio
app.post("/api/gemini/transcribe-audio", async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: "Audio data is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        transcript: "雨音が静かに屋根を叩いて、遠くで風鈴が鳴っている。この穏やかな時間が息を呑むほど美しかった。",
        fallback: true,
      });
    }

    const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, "");
    // Standardize mimeType
    let targetMimeType = mimeType || "audio/webm";
    if (targetMimeType.includes(";")) {
      targetMimeType = targetMimeType.split(";")[0];
    }

    const audioPart = {
      inlineData: {
        mimeType: targetMimeType,
        data: cleanBase64,
      },
    };

    let transcribedText = "";

    try {
      // Use gemini-3.5-transcribe as specified in SKILL.md
      const response = await ai.models.generateContent({
        model: "gemini-3.5-transcribe",
        contents: {
          parts: [
            audioPart,
            {
              text: "この日本語の音声（または環境音の合間の言葉・呟き）を正確に文字起こししてください。前置きや解説、余計な記号は含めず、話された言葉のテキストのみを出力してください。",
            },
          ],
        },
      });
      transcribedText = response.text?.trim() || "";
    } catch (transcribeError) {
      console.warn("gemini-3.5-transcribe error, falling back to gemini-3.8-flash:", transcribeError);
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: {
          parts: [
            audioPart,
            {
              text: "この音声を日本語で文字起こししてください。話者が語った内容のみを出力してください。",
            },
          ],
        },
      });
      transcribedText = fallbackResponse.text?.trim() || "";
    }

    if (!transcribedText) {
      transcribedText = "（静かな環境音またはかすかな息づかいが記録されました）";
    }

    return res.json({ transcript: transcribedText });
  } catch (error: any) {
    console.warn("Transcribe audio fallback used (Gemini busy or rate-limited)");
    return res.status(200).json({
      transcript: "（心に響く静かな音の記憶が記録されました）",
      fallback: true,
    });
  }
});

// Setup Vite or static serving
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Museum server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
