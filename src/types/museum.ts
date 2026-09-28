export type ItemType = 'image' | 'text' | 'url' | 'audio';

export interface CategorySelection {
  nuances: string[];     // かわいい, はかない, 静謐, 崇高, 鮮烈, 優美...
  colors: string[];       // 青, 白, 夕焼け色, 漆黒, 翠, 茜色, 黄金...
  times: string[];        // 朝, 昼, 夕暮れ, 夜・深夜, 雨の午後, 払暁...
  attributes: string[];   // 水, 光, 風, 植物/花, 建造物, 空・星, 人影/気配...
  emotions: string[];     // 懐かしい, 愛, 孤独, 切ない, 畏怖/驚き, 安らぎ, 祈り...
}

export interface MuseumLocation {
  lat: number;
  lng: number;
  name: string;
}

export interface AudioConfig {
  ambientType: 'rain' | 'piano' | 'waves' | 'chimes' | 'night' | 'stream' | 'none';
  customUrl?: string;
  title?: string;
}

export interface BeautyItem {
  id: string;
  catalogNumber: string; // e.g. "OPUS-001"
  title: string;
  type: ItemType;
  content: string; // Image URL/data, text content, YouTube/web URL, or audio description
  caption?: string; // Author, artist, or context
  whyBeautiful: string; // なぜ美しいと感じたか（心の一言）
  date: string; // YYYY-MM-DD or YYYY-MM-DD HH:mm
  categories: CategorySelection;
  location?: MuseumLocation;
  audioConfig?: AudioConfig;
  resonanceScore: number; // 1-5 scale (resonance index)
  curatorComment?: string;
  isFavorite?: boolean;
  createdAt: string;
}

export interface ThematicRoom {
  id: string;
  name: string;
  subtitle: string;
  concept: string;
  itemIds: string[];
  coverImageUrl?: string;
}

export interface DailyCuratorReport {
  greeting: string;
  trendObservation: string;
  timeCapsuleNote: string;
  spotlightTheme: string;
  spotlightDescription: string;
  curatorMessage: string;
  spotlightItemIds: string[];
}

export const CATEGORY_TAXONOMY = {
  nuances: [
    { id: 'はかない', label: 'はかない (Ephemeral)' },
    { id: 'かわいい', label: 'かわいい (Charming)' },
    { id: '静謐', label: '静謐 (Serene)' },
    { id: '崇高', label: '崇高 (Sublime)' },
    { id: '鮮烈', label: '鮮烈 (Vivid)' },
    { id: '優美', label: '優美 (Graceful)' },
    { id: '素朴', label: '素朴 (Rustic/Pure)' },
  ],
  colors: [
    { id: '青', label: '青 (Cerulean/Navy)', hex: '#3b82f6' },
    { id: '白', label: '白 (Pure White)', hex: '#f8fafc' },
    { id: '夕焼け色', label: '夕焼け色 (Sunset Amber)', hex: '#f59e0b' },
    { id: '漆黒', label: '漆黒 (Obsidian)', hex: '#1e293b' },
    { id: '翠', label: '翠・緑 (Verdant Emerald)', hex: '#10b981' },
    { id: '茜色', label: '茜色 (Crimson Rose)', hex: '#f43f5e' },
    { id: '黄金', label: '黄金 (Gilded Gold)', hex: '#eab308' },
    { id: '薄紫', label: '薄紫 (Lilac Mist)', hex: '#a855f7' },
  ],
  times: [
    { id: '朝', label: '朝・払暁 (Dawn/Morning)' },
    { id: '昼', label: '昼 (Noon/Daylight)' },
    { id: '夕暮れ', label: '夕暮れ (Twilight/Dusk)' },
    { id: '夜・深夜', label: '夜・深夜 (Night/Midnight)' },
    { id: '雨の午後', label: '雨の午後 (Rainy Afternoon)' },
  ],
  attributes: [
    { id: '水', label: '水 (Water/Rain/Ocean)' },
    { id: '光', label: '光 (Light/Shadows)' },
    { id: '風', label: '風 (Wind/Breeze)' },
    { id: '植物/花', label: '植物・花 (Flora)' },
    { id: '建造物', label: '建造物 (Architecture)' },
    { id: '空・星', label: '空・星 (Cosmos/Clouds)' },
    { id: '人影/気配', label: '人影・気配 (Human Silence)' },
  ],
  emotions: [
    { id: '懐かしい', label: '懐かしい (Nostalgia)' },
    { id: '愛', label: '愛 (Love/Tenderness)' },
    { id: '孤独', label: '孤独 (Solitude/Quietude)' },
    { id: '切ない', label: '切ない (Bittersweet)' },
    { id: '畏怖/驚き', label: '畏怖・驚き (Awe/Wonder)' },
    { id: '安らぎ', label: '安らぎ (Peace/Rest)' },
    { id: '祈り', label: '祈り (Prayer)' },
  ],
};

// Rich curated initial items to demonstrate the museum
export const INITIAL_BEAUTY_ITEMS: BeautyItem[] = [
  {
    id: 'opus-001',
    catalogNumber: 'OPUS-001',
    title: '3年前の今日、夕暮れの水たまりに落ちた光',
    type: 'image',
    content: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80',
    caption: '鴨川の河原にて / 2023年9月27日 17:42',
    whyBeautiful: '雨上がりの濡れた土と夕陽が重なって、アスファルトの水たまりの中にちいさな宇宙が浮かび上がっていたから。',
    date: '2023-09-27',
    categories: {
      nuances: ['はかない', '静謐'],
      colors: ['夕焼け色', '青'],
      times: ['夕暮れ', '雨の午後'],
      attributes: ['水', '光'],
      emotions: ['懐かしい', '切ない'],
    },
    location: {
      lat: 35.0037,
      lng: 135.7722,
      name: '京都 鴨川河川敷',
    },
    audioConfig: {
      ambientType: 'rain',
      title: '雨粒と夕風のアンビエント',
    },
    resonanceScore: 5,
    curatorComment: '【タイムカプセル収蔵】3年前に記録された水面の記憶。今なお色褪せない黄昏の残光が静かに揺れています。',
    isFavorite: true,
    createdAt: '2023-09-27T17:42:00.000Z',
  },
  {
    id: 'opus-002',
    catalogNumber: 'OPUS-002',
    title: '早朝の群青と海鳴りの呼吸',
    type: 'image',
    content: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    caption: '七里ヶ浜海岸 / 2026年9月26日 05:20',
    whyBeautiful: '誰もいない砂浜に打ち寄せる波が、夜の名残の深い青をゆっくりと朝の光へと溶かしていくグラデーションの荘厳さ。',
    date: '2026-09-26',
    categories: {
      nuances: ['静謐', '崇高', '優美'],
      colors: ['青', '白'],
      times: ['朝'],
      attributes: ['水', '風', '空・星'],
      emotions: ['安らぎ', '孤独', '畏怖/驚き'],
    },
    location: {
      lat: 35.3054,
      lng: 139.5167,
      name: '鎌倉 七里ヶ浜',
    },
    audioConfig: {
      ambientType: 'waves',
      title: '夜明けの潮騒',
    },
    resonanceScore: 5,
    curatorComment: '最近のコレクションに多く見られる「青」の極致。圧倒的な静寂の中に生命の鼓動を感じさせます。',
    isFavorite: true,
    createdAt: '2026-09-26T05:20:00.000Z',
  },
  {
    id: 'opus-003',
    catalogNumber: 'OPUS-003',
    title: '窓辺に落ちたガラス瓶の青い影',
    type: 'image',
    content: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80',
    caption: '古い書斎の窓際 / 2026年9月25日 14:15',
    whyBeautiful: '午後の斜光が古い青い薬瓶を通過したとき、白いレースのカーテンの上に水族館のような光の屈折が生まれたから。',
    date: '2026-09-25',
    categories: {
      nuances: ['かわいい', '静謐', 'はかない'],
      colors: ['青', '白'],
      times: ['昼'],
      attributes: ['光', '建造物'],
      emotions: ['懐かしい', '安らぎ'],
    },
    location: {
      lat: 35.6762,
      lng: 139.6503,
      name: '世田谷のアトリエ窓辺',
    },
    audioConfig: {
      ambientType: 'piano',
      title: '陽だまりの旋律',
    },
    resonanceScore: 4,
    curatorComment: '日常の些細な窓辺を美術館の一角へと変貌させた、眼差しの優しさが光る一点です。',
    createdAt: '2026-09-25T14:15:00.000Z',
  },
  {
    id: 'opus-004',
    catalogNumber: 'OPUS-004',
    title: '星野道夫の祈りのような一文',
    type: 'text',
    content: '「ぼくたちが毎日を生きている同じ瞬間、もうひとつの時間が流れている。悠久の時を刻む北の海で、ザトウクジラが今まさに水面を飛び跳ねているかもしれない。」',
    caption: '星野道夫『旅をする木』より',
    whyBeautiful: '東京の満員電車の中でこの言葉を思い出した瞬間、息苦しかった胸の奥に、冷たく澄んだ遥かな海風が吹き抜けたから。',
    date: '2026-09-27',
    categories: {
      nuances: ['崇高', '静謐'],
      colors: ['青', '白'],
      times: ['朝', '昼'],
      attributes: ['水', '空・星'],
      emotions: ['孤独', '祈り', '畏怖/驚き'],
    },
    location: {
      lat: 35.6812,
      lng: 139.7671,
      name: '東京駅 丸の内地下通路',
    },
    audioConfig: {
      ambientType: 'chimes',
      title: '記憶の鐘',
    },
    resonanceScore: 5,
    curatorComment: '視覚だけでなく、心に浮かぶ風景を収蔵するテキスト標本。孤独を崇高な連帯へと昇華させています。',
    isFavorite: true,
    createdAt: '2026-09-27T08:30:00.000Z',
  },
  {
    id: 'opus-005',
    catalogNumber: 'OPUS-005',
    title: '真夜中の静寂に溶けるドビュッシー「月の光」',
    type: 'audio',
    content: '深呼吸のように響くピアノの単音。鍵盤を離したあとの倍音の減衰が、深夜の部屋の暗闇に波紋のように広がっていく。',
    caption: 'Clair de Lune - Piano Solo',
    whyBeautiful: '音そのものよりも、音と音のあいだにある「沈黙」のほうが、夜の空気を豊かに満たしてくれたから。',
    date: '2026-09-24',
    categories: {
      nuances: ['優美', 'はかない', '静謐'],
      colors: ['青', '漆黒'],
      times: ['夜・深夜'],
      attributes: ['光', '風'],
      emotions: ['孤独', '愛', '安らぎ'],
    },
    location: {
      lat: 48.8566,
      lng: 2.3522,
      name: 'パリ サンジェルマンの夜道',
    },
    audioConfig: {
      ambientType: 'night',
      title: '月夜のピアノと鈴虫の息づかい',
    },
    resonanceScore: 5,
    curatorComment: '聴覚の美を保管する小部屋。夜の孤独をあたたかな毛布のように包み込んでくれます。',
    createdAt: '2026-09-24T23:50:00.000Z',
  },
  {
    id: 'opus-006',
    catalogNumber: 'OPUS-006',
    title: '雨降る森の苔寺と清冽な小川のせせらぎ',
    type: 'url',
    content: 'https://www.youtube.com/watch?v=WPni755-Krg',
    caption: '4K Cinematic Nature Ambience - Kyoto Temple Rain',
    whyBeautiful: '雨滴が幾重にも重なる青もみじの葉を叩き、古い石畳を濡らしながら小川へと注ぎ込む音と色彩のシンフォニーに心が洗われた。',
    date: '2026-09-22',
    categories: {
      nuances: ['静謐', '優美'],
      colors: ['翠', '青'],
      times: ['雨の午後'],
      attributes: ['水', '植物/花', '建造物'],
      emotions: ['安らぎ', '祈り'],
    },
    location: {
      lat: 35.0116,
      lng: 135.6778,
      name: '京都 嵐山 苔寺周辺',
    },
    audioConfig: {
      ambientType: 'stream',
      title: '清流のせせらぎ',
    },
    resonanceScore: 4,
    curatorComment: '雨という自然の恩寵が、緑と水を極限まで艶やかに際立たせた映像の標本です。',
    createdAt: '2026-09-22T15:10:00.000Z',
  },
  {
    id: 'opus-007',
    catalogNumber: 'OPUS-007',
    title: '秋の夕暮れ、茜色の飛行機雲',
    type: 'image',
    content: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1200&q=80',
    caption: '見晴らしの丘より / 2026年9月27日 18:05',
    whyBeautiful: '夕暮れが終わり夜に切り替わるほんの数分間、空を真っ二つに裂く一本の白線が燃えるようなピンクに染まっていたから。',
    date: '2026-09-27',
    categories: {
      nuances: ['はかない', '鮮烈'],
      colors: ['茜色', '夕焼け色', '青'],
      times: ['夕暮れ'],
      attributes: ['空・星', '光'],
      emotions: ['切ない', '懐かしい'],
    },
    location: {
      lat: 35.6267,
      lng: 139.7369,
      name: '品川 運河沿いの遊歩道',
    },
    audioConfig: {
      ambientType: 'piano',
      title: '黄昏の余韻',
    },
    resonanceScore: 4,
    curatorComment: '空という巨大なキャンバスに描かれた、二度と同じ形をとらない一回性の美。',
    createdAt: '2026-09-27T18:05:00.000Z',
  },
];
