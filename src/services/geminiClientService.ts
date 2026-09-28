import { BeautyItem, DailyCuratorReport, ThematicRoom } from '../types/museum';

export async function fetchDailyInsight(
  items: BeautyItem[],
  todayDate: string
): Promise<DailyCuratorReport> {
  try {
    const res = await fetch('/api/gemini/daily-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, todayDate }),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch daily insight: ${res.status}`);
    }

    const data = await res.json();
    return {
      greeting: data.greeting || 'ようこそ、美の収蔵庫へ。',
      trendObservation:
        data.trendObservation ||
        '最近の収蔵品には「青」や「水」、静けさを湛えた光の記録が多く見受けられます。',
      timeCapsuleNote:
        data.timeCapsuleNote ||
        '過去の今日に保存された記憶が、現在のまなざしと静かに呼応しています。',
      spotlightTheme: data.spotlightTheme || '青と水が織りなす静謐の回廊',
      spotlightDescription:
        data.spotlightDescription ||
        '日常の喧騒から少し離れ、心の内側に静かな波紋を広げた光と色の標本たち。',
      curatorMessage:
        data.curatorMessage ||
        '世界が騒がしい日ほど、あなたの瞳が捉えた小さな透明さに救われます。',
      spotlightItemIds: data.spotlightItemIds || [],
    };
  } catch (error) {
    console.warn('Using client fallback for daily insight:', error);
    return {
      greeting: '本日の美の巡回へようこそ。',
      trendObservation: '最近は澄んだ「青」や「水」の標本が増えており、心が静寂を求めているようです。',
      timeCapsuleNote: '3年前の今日の記憶も、変わらぬ瑞々しさでここに息づいています。',
      spotlightTheme: '青と夕暮れの詩的交差点',
      spotlightDescription: '深まる秋の気配と、一瞬の光の余韻を集めた特別展示。',
      curatorMessage: '今日もあなたの眼差しが捉えた美しいものを、この収蔵庫でお待ちしています。',
      spotlightItemIds: items.slice(0, 3).map((it) => it.id),
    };
  }
}

export async function curateRoomsWithAI(items: BeautyItem[]): Promise<ThematicRoom[]> {
  try {
    const res = await fetch('/api/gemini/curate-rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });

    if (!res.ok) {
      throw new Error(`Curate rooms request failed: ${res.status}`);
    }

    const data = await res.json();
    if (data.rooms && Array.isArray(data.rooms)) {
      return data.rooms;
    }
  } catch (error) {
    console.warn('Using fallback room curation:', error);
  }

  // Sensible default thematic rooms
  return [
    {
      id: 'room-blue-water',
      name: '青と水面の回廊',
      subtitle: '透き通る記憶と静寂の標本',
      concept: '光を透かす水や青い時間帯に宿る、清らかな余白と呼吸。',
      itemIds: items
        .filter(
          (it) =>
            it.categories.colors.includes('青') ||
            it.categories.attributes.includes('水') ||
            it.categories.times.includes('朝')
        )
        .map((it) => it.id),
    },
    {
      id: 'room-ephemeral-light',
      name: 'はかなき光の標本室',
      subtitle: '消えゆくからこそ美しい瞬間',
      concept: '夕暮れ、薄明、二度と同じ形をとらない空と影の奇跡。',
      itemIds: items
        .filter(
          (it) =>
            it.categories.nuances.includes('はかない') ||
            it.categories.times.includes('夕暮れ') ||
            it.categories.colors.includes('夕焼け色')
        )
        .map((it) => it.id),
    },
    {
      id: 'room-quiet-solitude',
      name: '孤独と夜の静想室',
      subtitle: '自分自身へと還る穏やかな時間',
      concept: '深夜の静けさや、ひとり立ち止まることで出逢えたやわらかな言葉。',
      itemIds: items
        .filter(
          (it) =>
            it.categories.emotions.includes('孤独') ||
            it.categories.times.includes('夜・深夜') ||
            it.categories.emotions.includes('祈り')
        )
        .map((it) => it.id),
    },
    {
      id: 'room-nostalgia-love',
      name: '愛と追憶の小美術館',
      subtitle: '懐かしさと誰かを想うあたたかさ',
      concept: '日常の愛おしさ、昔日の風景が心に灯す小さな蝋燭の火。',
      itemIds: items
        .filter(
          (it) =>
            it.categories.emotions.includes('懐かしい') ||
            it.categories.emotions.includes('愛') ||
            it.categories.nuances.includes('かわいい')
        )
        .map((it) => it.id),
    },
  ];
}

export async function generateBookPreface(
  items: BeautyItem[],
  bookTitle?: string,
  volumeName?: string
): Promise<{ preface: string; afterword: string }> {
  try {
    const res = await fetch('/api/gemini/generate-book-preface', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, bookTitle, volumeName }),
    });

    if (!res.ok) {
      throw new Error(`Preface request failed: ${res.status}`);
    }

    const data = await res.json();
    return {
      preface:
        data.preface ||
        '日常という広大な海から、すくい上げられた幾千の光滴。ここに収められた標本たちは、あなたが立ち止まり、息を呑み、世界と愛を交わした確かな証拠です。',
      afterword:
        data.afterword ||
        '美しさは、遠くの額縁の中にだけあるのではありません。あなたの眼差しが触れた場所すべてが、今日からひとつの美術館になります。',
    };
  } catch (error) {
    console.warn('Fallback preface generated:', error);
    return {
      preface: `日常という名の広大な海から、すくい上げられた幾千の光滴。
私たちが「美しい」と感じるとき、世界はほんの少しだけその秘密を開示してくれるのかもしれません。
ここに編まれた標本たちは、あなたが立ち止まり、息を呑み、心を通わせた確かな証拠です。
ページをめくるたび、忘れかけていたあの日の風の匂いや、夕暮れの光が再びあなたの胸を満たすことを祈って。`,
      afterword: `美しさは、遠くの名画の中にだけあるのではありません。
濡れたアスファルトに映る街灯、ふと胸をかすめた旋律、旅先で見上げた名もなき星空。
この一冊の図録は、あなたが今日まで生きてきた優しさの軌跡そのものです。`,
    };
  }
}

// Transcribe audio recorded from smartphone microphone
export async function transcribeAudioBlob(blob: Blob): Promise<string> {
  try {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const res = await fetch('/api/gemini/transcribe-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioBase64: base64,
        mimeType: blob.type || 'audio/webm',
      }),
    });

    if (!res.ok) {
      throw new Error(`Transcription request failed: ${res.status}`);
    }

    const data = await res.json();
    return data.transcript || '';
  } catch (error) {
    console.warn('Transcription service notice:', error);
    return '（心に残る静かな音の情景が記録されました）';
  }
}

