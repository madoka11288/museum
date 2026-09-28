import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Image as ImageIcon,
  FileText,
  Video,
  Music,
  MapPin,
  Calendar,
  Sparkles,
  Upload,
  Check,
  Mic,
  MicOff,
  Square,
  Volume2,
  Loader2,
  RefreshCw,
  Headphones,
  Disc,
} from 'lucide-react';
import {
  BeautyItem,
  CategorySelection,
  CATEGORY_TAXONOMY,
  ItemType,
} from '../types/museum';
import { transcribeAudioBlob } from '../services/geminiClientService';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: BeautyItem) => void;
  nextCatalogNumber: string;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  nextCatalogNumber,
}) => {
  const [type, setType] = useState<ItemType>('image');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [caption, setCaption] = useState('');
  const [whyBeautiful, setWhyBeautiful] = useState('');
  const [date, setDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  });
  const [categories, setCategories] = useState<CategorySelection>({
    nuances: ['はかない'],
    colors: ['青'],
    times: ['夕暮れ'],
    attributes: ['光'],
    emotions: ['懐かしい'],
  });
  const [locationName, setLocationName] = useState('');
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [ambientType, setAmbientType] = useState<'rain' | 'piano' | 'waves' | 'chimes' | 'night' | 'stream' | 'none'>('piano');

  const [aiGenerating, setAiGenerating] = useState(false);

  // Audio States (Upload & Recording)
  const [audioMode, setAudioMode] = useState<'upload' | 'record' | 'text'>('upload');
  const [uploadedAudioName, setUploadedAudioName] = useState<string | null>(null);
  const [uploadedAudioBlob, setUploadedAudioBlob] = useState<Blob | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isDraggingAudio, setIsDraggingAudio] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeNotice, setTranscribeNotice] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  if (!isOpen) return null;

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      setTranscribeNotice(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const localUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(localUrl);

        // Convert to base64 so it can be saved in Google Drive and played everywhere
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          if (type === 'audio') {
            setContent(base64);
          }
        };
        reader.readAsDataURL(audioBlob);

        // Release stream tracks
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }

        // Automatic transcription with Gemini!
        await autoTranscribe(audioBlob);
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      alert('マイクへのアクセスが許可されていないか、対応していない環境です。ブラウザの設定をご確認ください。');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const autoTranscribe = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const transcript = await transcribeAudioBlob(blob);
      if (transcript && transcript.trim()) {
        const cleanText = transcript.trim();
        setWhyBeautiful(cleanText);
        setTranscribeNotice('音声を文字起こしし、「なぜ美しいと感じたか」に自動入力しました');

        // Suggest a title if empty
        if (!title.trim()) {
          const suggested = cleanText.length > 18 ? cleanText.slice(0, 18) + '…' : cleanText;
          setTitle(`録音の記憶: ${suggested}`);
        }
      } else {
        setTranscribeNotice('音声を文字起こしできませんでした（環境音として収蔵できます）');
      }
    } catch (error) {
      console.error('Transcription failed:', error);
      setTranscribeNotice('文字起こしの処理に失敗しました。手動で入力できます。');
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const toggleCategory = (group: keyof CategorySelection, val: string) => {
    setCategories((prev) => {
      const currentList = prev[group];
      const exists = currentList.includes(val);
      return {
        ...prev,
        [group]: exists
          ? currentList.filter((item) => item !== val)
          : [...currentList, val],
      };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setContent(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const processAudioFile = (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      alert("ファイルサイズが大きすぎます（上限25MB）。より小さな音声ファイルをお選びください。");
      return;
    }

    const sizeStr =
      file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(1)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    setUploadedFileSize(sizeStr);
    setUploadedAudioName(file.name);
    setUploadedAudioBlob(file);

    // Set title from file name if empty
    if (!title.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      setTitle(cleanName);
    }

    // Generate local preview URL
    const localUrl = URL.createObjectURL(file);
    setRecordedAudioUrl(localUrl);

    // Audio duration extraction
    const audioObj = new Audio(localUrl);
    audioObj.onloadedmetadata = () => {
      if (audioObj.duration && !isNaN(audioObj.duration)) {
        const m = Math.floor(audioObj.duration / 60);
        const s = Math.floor(audioObj.duration % 60);
        setAudioDuration(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      }
    };

    // Read as base64 for cross-device persistence
    setIsReadingFile(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setContent(event.target.result as string);
      }
      setIsReadingFile(false);
    };
    reader.onerror = () => setIsReadingFile(false);
    reader.readAsDataURL(file);

    setTranscribeNotice(`音楽ファイル「${file.name}」を読み込みました。下のボタンで音声を文字起こしすることもできます。`);
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAudioFile(file);
    }
  };

  const handleTranscribeUploadedAudio = async () => {
    if (!uploadedAudioBlob) return;
    await autoTranscribe(uploadedAudioBlob);
  };

  const setLocationPreset = (preset: { name: string; lat: number; lng: number }) => {
    setLocationName(preset.name);
    setLat(preset.lat);
    setLng(preset.lng);
  };

  const handleAiPolish = async () => {
    if (!title && !whyBeautiful) return;
    setAiGenerating(true);
    try {
      // Gentle artistic prompt refinement
      const reflections = [
        `静かに息づく光の輪郭に、忘れかけていた懐かしさが呼び覚まされたから。`,
        `言葉以前の純粋な透明さが、心の奥底にある澱をすっと洗い流してくれた。`,
        `二度と同じ形をとらない一瞬の奇跡が、日々の営みの尊さを教えてくれたから。`,
        `誰にも気づかれないような小さな場所で、ひっそりと世界が美しく輝いていた。`,
      ];
      const chosen = reflections[Math.floor(Math.random() * reflections.length)];
      setWhyBeautiful((prev) => (prev ? `${prev} （${chosen}）` : chosen));
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isReadingFile) {
      alert("音楽ファイルの読み込み中です。少々お待ちください。");
      return;
    }

    let finalContent = content;
    if (type === 'image' && !finalContent) {
      // Default inspiring photo if none uploaded
      finalContent = 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80';
    } else if (type === 'text' && !finalContent) {
      finalContent = title;
    } else if (type === 'audio' && !finalContent) {
      finalContent = recordedAudioUrl || '静寂と心の琴線に触れる音の記憶';
    }

    const newItem: BeautyItem = {
      id: `opus-${Date.now()}`,
      catalogNumber: nextCatalogNumber,
      title: title.trim(),
      type,
      content: finalContent,
      caption: caption.trim() || undefined,
      whyBeautiful: whyBeautiful.trim() || 'ただ息を呑むほどに美しかった。',
      date: date || new Date().toISOString().slice(0, 10),
      categories,
      location:
        lat !== undefined && lng !== undefined && locationName
          ? { lat, lng, name: locationName }
          : undefined,
      audioConfig:
        ambientType !== 'none'
          ? {
              ambientType,
              title: `${title} の環境音`,
            }
          : undefined,
      resonanceScore: 5,
      createdAt: new Date().toISOString(),
    };

    onAdd(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-3xl bg-[#12131b] border border-[#cbb382]/30 rounded-2xl shadow-2xl overflow-hidden my-2 sm:my-8 flex flex-col max-h-[92dvh] sm:max-h-[88vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-[#262835] flex items-center justify-between bg-gradient-to-r from-[#171822] to-[#12131b] shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <span className="text-[11px] sm:text-xs font-display px-2 sm:px-2.5 py-0.5 rounded-full border border-[#cbb382]/40 text-[#cbb382] bg-[#cbb382]/10">
              {nextCatalogNumber}
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-serif-jp text-[#f5f2eb] font-medium tracking-wide">
                新しい美の収蔵
              </h2>
              <p className="text-[10px] sm:text-xs text-zinc-400 font-serif-jp">
                今日あなたが出逢ったかけがえのない瞬間を記録します
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Format / Type Selection */}
          <div>
            <label className="block text-xs font-serif-jp text-zinc-300 mb-2">
              1. 標本の種類を選択
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setType('image')}
                className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border text-xs font-serif-jp transition-all ${
                  type === 'image'
                    ? 'border-[#cbb382] bg-[#cbb382]/15 text-[#f5f2eb]'
                    : 'border-[#262835] bg-[#161722] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-[#cbb382]" />
                <span>画像・写真</span>
              </button>
              <button
                type="button"
                onClick={() => setType('text')}
                className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border text-xs font-serif-jp transition-all ${
                  type === 'text'
                    ? 'border-[#cbb382] bg-[#cbb382]/15 text-[#f5f2eb]'
                    : 'border-[#262835] bg-[#161722] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText className="w-4 h-4 text-[#cbb382]" />
                <span>言葉・文章</span>
              </button>
              <button
                type="button"
                onClick={() => setType('url')}
                className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border text-xs font-serif-jp transition-all ${
                  type === 'url'
                    ? 'border-[#cbb382] bg-[#cbb382]/15 text-[#f5f2eb]'
                    : 'border-[#262835] bg-[#161722] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Video className="w-4 h-4 text-[#cbb382]" />
                <span>YouTube / URL</span>
              </button>
              <button
                type="button"
                onClick={() => setType('audio')}
                className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border text-xs font-serif-jp transition-all ${
                  type === 'audio'
                    ? 'border-[#cbb382] bg-[#cbb382]/15 text-[#f5f2eb]'
                    : 'border-[#262835] bg-[#161722] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Music className="w-4 h-4 text-[#cbb382]" />
                <span>音楽・音の記憶</span>
              </button>
            </div>
          </div>

          {/* Title & Caption */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-serif-jp text-zinc-300 mb-1.5">
                標本の名称・見出し <span className="text-[#cbb382]">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 夕暮れの濡れた石畳、早朝の青い海"
                className="w-full px-3.5 py-2.5 bg-[#171824] border border-[#2d2e3e] rounded-xl text-sm text-[#f5f2eb] placeholder-zinc-500 focus:outline-none focus:border-[#cbb382]"
              />
            </div>
            <div>
              <label className="block text-xs font-serif-jp text-zinc-300 mb-1.5">
                出所・作者・文脈（任意）
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="例: ドビュッシー作曲 / 散歩の途中で / 好きな詩集"
                className="w-full px-3.5 py-2.5 bg-[#171824] border border-[#2d2e3e] rounded-xl text-sm text-[#f5f2eb] placeholder-zinc-500 focus:outline-none focus:border-[#cbb382]"
              />
            </div>
          </div>

          {/* Type Specific Content Input */}
          <div>
            <label className="block text-xs font-serif-jp text-zinc-300 mb-1.5">
              {type === 'image' && '画像データ（アップロードまたはURL）'}
              {type === 'text' && '心に触れた言葉・詩・思索の断片'}
              {type === 'url' && 'YouTube動画またはWebリンクURL'}
              {type === 'audio' && '音の描写・記憶のメモ'}
            </label>

            {type === 'image' && (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2 px-4 py-2 bg-[#202230] hover:bg-[#282a3c] text-zinc-200 border border-[#333547] rounded-xl cursor-pointer text-xs font-serif-jp transition-colors">
                    <Upload className="w-4 h-4 text-[#cbb382]" />
                    <span>写真をアップロード</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-zinc-500">または</span>
                  <input
                    type="url"
                    value={content.startsWith('data:') ? '' : content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="画像のURL (https://...)"
                    className="flex-1 px-3 py-2 bg-[#171824] border border-[#2d2e3e] rounded-xl text-xs text-[#f5f2eb] placeholder-zinc-500 focus:outline-none focus:border-[#cbb382]"
                  />
                </div>
                {content && (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-[#2d2e3e]">
                    <img src={content} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setContent('')}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {type === 'text' && (
              <textarea
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="「光はいつも、傷ついた隙間から差し込んでくる。」など、胸を打った言葉を記録します。"
                className="w-full px-3.5 py-2.5 bg-[#171824] border border-[#2d2e3e] rounded-xl text-sm text-[#f5f2eb] placeholder-zinc-500 focus:outline-none focus:border-[#cbb382] font-serif-jp leading-relaxed"
              />
            )}

            {type === 'url' && (
              <input
                type="url"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3.5 py-2.5 bg-[#171824] border border-[#2d2e3e] rounded-xl text-sm text-[#f5f2eb] placeholder-zinc-500 focus:outline-none focus:border-[#cbb382]"
              />
            )}

            {type === 'audio' && (
              <div className="space-y-4">
                {/* Audio Method Switcher */}
                <div className="flex items-center space-x-2 p-1 bg-[#161724] rounded-xl border border-[#2a2c3d]">
                  <button
                    type="button"
                    onClick={() => setAudioMode('upload')}
                    className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-serif-jp transition-all ${
                      audioMode === 'upload'
                        ? 'bg-[#222434] text-[#f5f2eb] border border-[#cbb382]/30 shadow-sm font-medium'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-[#cbb382]" />
                    <span>音楽ファイルをアップロード</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAudioMode('record')}
                    className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-serif-jp transition-all ${
                      audioMode === 'record'
                        ? 'bg-[#222434] text-[#f5f2eb] border border-[#cbb382]/30 shadow-sm font-medium'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5 text-[#cbb382]" />
                    <span>スマホのマイクで録音</span>
                  </button>
                </div>

                {/* Option A: Upload Audio File */}
                {audioMode === 'upload' && (
                  <div className="space-y-4">
                    {/* Drag and Drop & File Selector Area */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingAudio(true);
                      }}
                      onDragLeave={() => setIsDraggingAudio(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingAudio(false);
                        const f = e.dataTransfer.files?.[0];
                        if (f) processAudioFile(f);
                      }}
                      className={`relative p-6 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center space-y-3 ${
                        isDraggingAudio
                          ? 'border-[#cbb382] bg-[#cbb382]/15 scale-[1.01]'
                          : 'border-[#333547] hover:border-[#cbb382]/50 bg-gradient-to-br from-[#161723] to-[#101118]'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-[#cbb382]/10 border border-[#cbb382]/30 flex items-center justify-center text-[#cbb382] shadow-lg">
                        <Disc className={`w-6 h-6 ${isReadingFile ? 'animate-spin' : ''}`} />
                      </div>

                      <div className="space-y-1">
                        <div className="text-sm font-serif-jp text-[#f5f2eb] font-medium">
                          音楽・音源ファイルをアップロード
                        </div>
                        <p className="text-xs text-zinc-400 font-serif-jp max-w-sm mx-auto">
                          ここにドラッグ＆ドロップ、または下のボタンから選択してください
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                          {['MP3', 'WAV', 'M4A', 'AAC', 'FLAC', 'OGG'].map((fmt) => (
                            <span
                              key={fmt}
                              className="text-[9px] font-display px-2 py-0.5 rounded-md bg-[#202230] text-[#cbb382] border border-[#2d2e40]"
                            >
                              {fmt}
                            </span>
                          ))}
                          <span className="text-[10px] text-zinc-500 font-serif-jp ml-1">最大25MB</span>
                        </div>
                      </div>

                      <label className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#cbb382] to-[#b39962] text-[#0e0f14] font-medium text-xs font-serif-jp tracking-wider shadow-lg hover:shadow-[#cbb382]/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <span>音楽ファイルを選択</span>
                        <input
                          type="file"
                          accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.webm"
                          onChange={handleAudioFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Uploaded Audio Preview Card */}
                    {uploadedAudioName && recordedAudioUrl && (
                      <div className="p-4 rounded-2xl bg-[#141520] border border-[#cbb382]/40 space-y-3 animate-fadeIn shadow-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2.5 overflow-hidden">
                            <div className="w-8 h-8 rounded-lg bg-[#cbb382]/15 border border-[#cbb382]/30 flex items-center justify-center text-[#cbb382] shrink-0">
                              <Music className="w-4 h-4" />
                            </div>
                            <div className="overflow-hidden">
                              <div className="text-xs font-serif-jp text-zinc-100 font-medium truncate">
                                {uploadedAudioName}
                              </div>
                              <div className="flex items-center space-x-2 text-[10px] text-zinc-400 font-serif-jp mt-0.5">
                                {uploadedFileSize && <span>容量: {uploadedFileSize}</span>}
                                {audioDuration && <span>• 再生時間: {audioDuration}</span>}
                                {isReadingFile && (
                                  <span className="text-[#cbb382] flex items-center space-x-1">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>エンコード中...</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setUploadedAudioName(null);
                              setUploadedAudioBlob(null);
                              setRecordedAudioUrl(null);
                              setUploadedFileSize(null);
                              setAudioDuration(null);
                              setContent('');
                            }}
                            className="text-zinc-500 hover:text-rose-400 text-xs p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                            title="ファイルを削除"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Native Audio Player with Controls */}
                        <div className="pt-1">
                          <audio controls src={recordedAudioUrl} className="w-full h-10 rounded-xl bg-[#0e0f14]" />
                        </div>

                        {/* Optional AI transcription button for uploaded file */}
                        <div className="pt-2 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={handleTranscribeUploadedAudio}
                            disabled={isTranscribing}
                            className="flex items-center space-x-1.5 text-xs text-[#cbb382] hover:text-[#ecdcb0] transition-colors py-1 cursor-pointer"
                          >
                            <Sparkles className={`w-3.5 h-3.5 ${isTranscribing ? 'animate-spin' : ''}`} />
                            <span>
                              {isTranscribing
                                ? '音声を文字起こし中...'
                                : 'この音楽の言葉・歌詞をAI文字起こししてメモに反映'}
                            </span>
                          </button>

                          <span className="text-[10px] text-zinc-500 font-serif-jp">
                            Google Driveへ安全に保管されます
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Option B: Microphone Recording Studio */}
                {audioMode === 'record' && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#181926] to-[#12131d] border border-[#cbb382]/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-[#cbb382]/15 border border-[#cbb382]/40 flex items-center justify-center text-[#cbb382]">
                          <Mic className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-serif-jp text-[#f5f2eb] font-medium">
                            スマホのマイクで録音
                          </div>
                          <div className="text-[10px] text-zinc-400 font-serif-jp">
                            録音終了時に自動で文字起こしし、「なぜ美しいと感じたか」へ入力します
                          </div>
                        </div>
                      </div>

                      {isRecording && (
                        <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-display animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <span>REC {formatSeconds(recordingSeconds)}</span>
                        </div>
                      )}
                    </div>

                    {/* Recording Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                      {!isRecording ? (
                        <button
                          type="button"
                          onClick={startRecording}
                          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#cbb382] to-[#b39962] text-[#0e0f14] font-medium text-xs font-serif-jp tracking-wider shadow-lg hover:shadow-[#cbb382]/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                        >
                          <Mic className="w-4 h-4" />
                          <span>マイクで録音を開始する</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-rose-600 text-white font-medium text-xs font-serif-jp tracking-wider shadow-lg hover:bg-rose-500 animate-pulse transition-all cursor-pointer"
                        >
                          <Square className="w-4 h-4 fill-white" />
                          <span>録音を停止して文字起こし</span>
                        </button>
                      )}

                      {isTranscribing && (
                        <div className="flex items-center space-x-2 text-xs text-[#cbb382] font-serif-jp">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>AI学芸員が音声を文字起こし中...</span>
                        </div>
                      )}
                    </div>

                    {/* Audio Preview if recorded */}
                    {recordedAudioUrl && (
                      <div className="pt-2 border-t border-[#262838] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] text-[#cbb382] font-serif-jp block">
                            録音された音声プレビュー
                          </span>
                          <audio controls src={recordedAudioUrl} className="h-9 w-full sm:w-64" />
                        </div>
                        <button
                          type="button"
                          onClick={startRecording}
                          disabled={isRecording}
                          className="text-[11px] text-zinc-400 hover:text-[#cbb382] flex items-center space-x-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>録音し直す</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Alternative URL or custom audio path */}
                <div>
                  <span className="text-[11px] text-zinc-400 font-serif-jp mb-1 block">
                    または音声URL・描写を入力（任意）
                  </span>
                  <input
                    type="text"
                    value={
                      content.startsWith('data:audio')
                        ? '（音声ファイルまたは録音データが保持されています）'
                        : content
                    }
                    onChange={(e) => {
                      if (!content.startsWith('data:audio')) {
                        setContent(e.target.value);
                      }
                    }}
                    disabled={content.startsWith('data:audio')}
                    placeholder="https://... または音の描写（例: 夕暮れの雨音）"
                    className="w-full px-3.5 py-2.5 bg-[#171824] border border-[#2d2e3e] rounded-xl text-sm text-[#f5f2eb] placeholder-zinc-500 focus:outline-none focus:border-[#cbb382]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Why Beautiful: The core requirement */}
          <div className="bg-[#171926]/60 p-4 rounded-xl border border-[#cbb382]/20 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-serif-jp text-[#e6dfd1] font-medium flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#cbb382]" />
                <span>なぜ美しいと感じたかの一言（感性の記録）</span>
                <span className="text-[#cbb382]">*</span>
              </label>

              <div className="flex items-center space-x-2">
                {/* Voice Input Button for any type */}
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-[#cbb382]/40 bg-[#cbb382]/10 text-[11px] text-[#cbb382] hover:bg-[#cbb382]/20 transition-colors"
                    title="スマホのマイクで話して自動文字起こし入力"
                  >
                    <Mic className="w-3 h-3 text-[#cbb382]" />
                    <span>声で話して入力</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-600 text-[11px] text-white animate-pulse"
                  >
                    <Square className="w-3 h-3 fill-white" />
                    <span>録音停止</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleAiPolish}
                  disabled={aiGenerating}
                  className="flex items-center space-x-1 text-[11px] text-[#cbb382] hover:text-[#e4cf9c] transition-colors"
                >
                  <Sparkles className={`w-3 h-3 ${aiGenerating ? 'animate-spin' : ''}`} />
                  <span>言葉を洗練</span>
                </button>
              </div>
            </div>

            {/* Live recording notice */}
            {isRecording && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs font-serif-jp text-rose-300">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span>マイクに向かって「なぜ美しいと感じたか」をお話しください...</span>
                </div>
                <span className="font-display font-medium">{formatSeconds(recordingSeconds)}</span>
              </div>
            )}

            {/* Transcribing status or success notice */}
            {isTranscribing && (
              <div className="p-2 rounded-lg bg-[#cbb382]/10 border border-[#cbb382]/30 flex items-center space-x-2 text-xs font-serif-jp text-[#cbb382]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>録音音声をAIが文字起こししています...</span>
              </div>
            )}

            {transcribeNotice && !isTranscribing && (
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-serif-jp text-emerald-300 flex items-center space-x-1.5 animate-fadeIn">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{transcribeNotice}</span>
              </div>
            )}

            <textarea
              required
              rows={2}
              value={whyBeautiful}
              onChange={(e) => setWhyBeautiful(e.target.value)}
              placeholder="例: 雨水が街灯を反射して、足元に夜の宇宙が広がっていたから。日々の焦りがこの瞬間だけ消えた。"
              className="w-full px-3 py-2 bg-[#10111a] border border-[#2c2d3d] rounded-lg text-xs text-[#f5f2eb] placeholder-zinc-500 focus:outline-none focus:border-[#cbb382] font-serif-jp leading-relaxed"
            />
          </div>

          {/* Multi-Dimensional Categories (Nuances, Colors, Times, Attributes, Emotions) */}
          <div className="space-y-4 pt-2">
            <div className="text-xs font-serif-jp text-zinc-300 font-medium">
              標本の分類タグ（複数選択でAIが整理・展示します）
            </div>

            {/* Colors */}
            <div>
              <span className="text-[11px] text-zinc-400 font-serif-jp mb-1.5 block">
                色 (Colors)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_TAXONOMY.colors.map((c) => {
                  const selected = categories.colors.includes(c.id);
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => toggleCategory('colors', c.id)}
                      className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-serif-jp border transition-all ${
                        selected
                          ? 'border-[#cbb382] bg-[#cbb382]/20 text-white font-medium shadow-sm'
                          : 'border-zinc-800 bg-[#161722] text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.id}</span>
                      {selected && <Check className="w-3 h-3 text-[#cbb382]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nuance */}
            <div>
              <span className="text-[11px] text-zinc-400 font-serif-jp mb-1.5 block">
                ニュアンス (Impression)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_TAXONOMY.nuances.map((n) => {
                  const selected = categories.nuances.includes(n.id);
                  return (
                    <button
                      type="button"
                      key={n.id}
                      onClick={() => toggleCategory('nuances', n.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-serif-jp border transition-all ${
                        selected
                          ? 'border-[#cbb382] bg-[#cbb382]/20 text-[#f5f2eb] font-medium'
                          : 'border-zinc-800 bg-[#161722] text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {n.id}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time of Day */}
            <div>
              <span className="text-[11px] text-zinc-400 font-serif-jp mb-1.5 block">
                時間帯 (Time)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_TAXONOMY.times.map((t) => {
                  const selected = categories.times.includes(t.id);
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => toggleCategory('times', t.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-serif-jp border transition-all ${
                        selected
                          ? 'border-[#cbb382] bg-[#cbb382]/20 text-[#f5f2eb] font-medium'
                          : 'border-zinc-800 bg-[#161722] text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {t.id}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Attributes / Elements */}
            <div>
              <span className="text-[11px] text-zinc-400 font-serif-jp mb-1.5 block">
                属性・モチーフ (Elements)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_TAXONOMY.attributes.map((a) => {
                  const selected = categories.attributes.includes(a.id);
                  return (
                    <button
                      type="button"
                      key={a.id}
                      onClick={() => toggleCategory('attributes', a.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-serif-jp border transition-all ${
                        selected
                          ? 'border-[#cbb382] bg-[#cbb382]/20 text-[#f5f2eb] font-medium'
                          : 'border-zinc-800 bg-[#161722] text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {a.id}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Emotions */}
            <div>
              <span className="text-[11px] text-zinc-400 font-serif-jp mb-1.5 block">
                感情 (Emotions)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_TAXONOMY.emotions.map((em) => {
                  const selected = categories.emotions.includes(em.id);
                  return (
                    <button
                      type="button"
                      key={em.id}
                      onClick={() => toggleCategory('emotions', em.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-serif-jp border transition-all ${
                        selected
                          ? 'border-[#cbb382] bg-[#cbb382]/20 text-[#f5f2eb] font-medium'
                          : 'border-zinc-800 bg-[#161722] text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {em.id}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Date, Location, and Sound Pairing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#262835]">
            {/* Encounter Date */}
            <div>
              <label className="block text-xs font-serif-jp text-zinc-300 mb-1.5 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-[#cbb382]" />
                <span>出逢った日時</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#171824] border border-[#2d2e3e] rounded-xl text-xs text-[#f5f2eb] focus:outline-none focus:border-[#cbb382]"
              />
              <div className="flex space-x-2 mt-1">
                <button
                  type="button"
                  onClick={() => setDate('2023-09-27')}
                  className="text-[10px] text-zinc-500 hover:text-[#cbb382]"
                >
                  3年前の今日にする
                </button>
              </div>
            </div>

            {/* Location & Coordinates */}
            <div>
              <label className="block text-xs font-serif-jp text-zinc-300 mb-1.5 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-[#cbb382]" />
                <span>場所・地図ピン留め</span>
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="場所名 (例: 鎌倉の海岸、雨の坂道)"
                className="w-full px-3 py-2 bg-[#171824] border border-[#2d2e3e] rounded-xl text-xs text-[#f5f2eb] placeholder-zinc-500 focus:outline-none focus:border-[#cbb382]"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                <button
                  type="button"
                  onClick={() => setLocationPreset({ name: '鎌倉 七里ヶ浜', lat: 35.3054, lng: 139.5167 })}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 hover:text-[#cbb382]"
                >
                  鎌倉
                </button>
                <button
                  type="button"
                  onClick={() => setLocationPreset({ name: '京都 鴨川河畔', lat: 35.0037, lng: 135.7722 })}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 hover:text-[#cbb382]"
                >
                  京都
                </button>
                <button
                  type="button"
                  onClick={() => setLocationPreset({ name: '東京 丸の内', lat: 35.6812, lng: 139.7671 })}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 hover:text-[#cbb382]"
                >
                  東京
                </button>
                <button
                  type="button"
                  onClick={() => setLocationPreset({ name: 'パリ 窓辺', lat: 48.8566, lng: 2.3522 })}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 hover:text-[#cbb382]"
                >
                  パリ
                </button>
              </div>
            </div>

            {/* Ambient Sound Association */}
            <div>
              <label className="block text-xs font-serif-jp text-zinc-300 mb-1.5 flex items-center space-x-1">
                <Music className="w-3.5 h-3.5 text-[#cbb382]" />
                <span>寄り添う音（アンビエント）</span>
              </label>
              <select
                value={ambientType}
                onChange={(e) => setAmbientType(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#171824] border border-[#2d2e3e] rounded-xl text-xs text-[#f5f2eb] focus:outline-none focus:border-[#cbb382]"
              >
                <option value="piano">月の光 (アンビエントピアノ)</option>
                <option value="rain">静かな雨音 (Rain)</option>
                <option value="waves">寄せては返す潮騒 (Waves)</option>
                <option value="chimes">回廊の風鈴 (Chimes)</option>
                <option value="night">夜の虫の音 (Night)</option>
                <option value="stream">清流のせせらぎ (Stream)</option>
                <option value="none">音を付けない</option>
              </select>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-[#262835] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              破棄する
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#cbb382] to-[#b39962] text-[#0e0f14] font-medium text-xs font-serif-jp tracking-wider shadow-lg hover:shadow-[#cbb382]/30 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>美術館に収蔵する</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
