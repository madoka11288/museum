import React, { useState } from 'react';
import {
  X,
  MapPin,
  Calendar,
  Volume2,
  VolumeX,
  Heart,
  Share2,
  Trash2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { BeautyItem } from '../types/museum';
import { ambientAudio } from '../utils/audioSynth';

interface ItemDetailModalProps {
  item: BeautyItem | null;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  onToggleFavorite,
  onDelete,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!item) return null;

  const toggleSound = () => {
    if (isPlayingAudio) {
      ambientAudio.stop();
      setIsPlayingAudio(false);
    } else {
      const type = item.audioConfig?.ambientType || 'piano';
      ambientAudio.play(type, item.audioConfig?.customUrl);
      setIsPlayingAudio(true);
    }
  };

  const copyReflection = () => {
    navigator.clipboard.writeText(
      `『${item.title}』\nなぜ美しいと感じたか: ${item.whyBeautiful}\n— 今日見つけた美しいもの美術館`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getYoutubeEmbed = (url: string) => {
    try {
      if (url.includes('youtube.com/watch?v=')) {
        const id = url.split('v=')[1]?.split('&')[0];
        return `https://www.youtube.com/embed/${id}?autoplay=0`;
      } else if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube.com/embed/${id}?autoplay=0`;
      }
    } catch (e) {}
    return null;
  };

  const ytEmbed = item.type === 'url' ? getYoutubeEmbed(item.content) : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-4xl bg-[#111219] border border-[#cbb382]/30 rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col md:flex-row max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={() => {
            if (isPlayingAudio) ambientAudio.stop();
            onClose();
          }}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 text-zinc-300 hover:text-white hover:bg-black transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Media / Visual Left Column */}
        <div className="md:w-1/2 bg-[#090a0d] flex items-center justify-center relative overflow-hidden min-h-[260px] sm:min-h-[300px] md:min-h-[480px]">
          {item.type === 'image' && (
            <img
              src={item.content}
              alt={item.title}
              className="w-full h-full object-cover max-h-[450px]"
            />
          )}

          {item.type === 'text' && (
            <div className="p-6 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 sm:space-y-6 max-w-md">
              <div className="w-12 h-12 rounded-full border border-[#cbb382]/40 flex items-center justify-center text-[#cbb382]">
                <Sparkles className="w-5 h-5" />
              </div>
              <blockquote className="font-serif-jp text-base sm:text-xl text-[#f3ede1] leading-relaxed tracking-wider italic">
                “{item.content}”
              </blockquote>
              {item.caption && (
                <div className="text-xs text-[#cbb382] font-serif-jp tracking-widest">
                  — {item.caption}
                </div>
              )}
            </div>
          )}

          {item.type === 'url' && (
            <div className="w-full h-full min-h-[260px] flex flex-col items-center justify-center p-4">
              {ytEmbed ? (
                <iframe
                  src={ytEmbed}
                  title={item.title}
                  className="w-full aspect-video rounded-xl shadow-lg border border-[#2d2e38]"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="text-center p-6 space-y-4">
                  <div className="text-zinc-300 text-sm font-serif-jp">{item.title}</div>
                  <a
                    href={item.content}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#222432] text-xs text-[#cbb382] hover:bg-[#2b2d40]"
                  >
                    <span>リンクを開く</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {item.type === 'audio' && (
            <div className="p-6 sm:p-8 text-center flex flex-col items-center justify-center space-y-4 sm:space-y-5 w-full">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-[#cbb382]/40 bg-[#161724] flex items-center justify-center text-[#cbb382] shadow-2xl">
                <Volume2 className="w-7 h-7 sm:w-8 sm:h-8 animate-pulse" />
              </div>
              <div className="font-serif-jp text-sm sm:text-base text-[#f5f2eb] font-medium">{item.caption || item.title}</div>
              {item.content.startsWith('data:') || item.content.startsWith('blob:') || item.content.startsWith('http') || item.content.includes('.mp3') || item.content.includes('.wav') || item.content.includes('.m4a') ? (
                <div className="w-full max-w-sm space-y-2 px-2">
                  <audio controls src={item.content} className="w-full rounded-xl bg-[#141520]" />
                  <span className="text-[10px] text-[#cbb382] font-serif-jp block">
                    収蔵された音楽・音声データ
                  </span>
                </div>
              ) : (
                <p className="text-xs text-zinc-400 font-serif-jp max-w-xs">{item.content}</p>
              )}
            </div>
          )}

          {/* Catalog badge overlay */}
          <div className="absolute top-4 left-4">
            <span className="font-display text-xs px-2.5 py-1 rounded bg-black/70 backdrop-blur-sm text-[#cbb382] border border-[#cbb382]/30">
              {item.catalogNumber}
            </span>
          </div>
        </div>

        {/* Details & Curatorial Note Right Column */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto space-y-6">
          <div className="space-y-4">
            {/* Header info: Date & Location */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 font-serif-jp">
              <div className="flex items-center space-x-1 text-[#cbb382]">
                <Calendar className="w-3.5 h-3.5" />
                <span>{item.date}</span>
              </div>
              {item.location && (
                <div className="flex items-center space-x-1 text-zinc-300">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{item.location.name}</span>
                </div>
              )}
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-serif-jp text-[#f5f2eb] font-medium leading-snug tracking-wide">
              {item.title}
            </h2>

            {item.caption && item.type !== 'text' && (
              <p className="text-xs text-zinc-400 font-serif-jp -mt-2">{item.caption}</p>
            )}

            {/* WHY BEAUTIFUL: Core Feature */}
            <div className="p-4 rounded-xl bg-[#171926] border-l-2 border-[#cbb382] space-y-2 shadow-inner">
              <div className="flex items-center space-x-1.5 text-xs text-[#cbb382] font-serif-jp">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="font-medium">なぜ美しいと感じたか（感性の記憶）</span>
              </div>
              <p className="text-sm font-serif-jp text-[#dedad2] leading-relaxed italic">
                「{item.whyBeautiful}」
              </p>
            </div>

            {/* Curator comment if available */}
            {item.curatorComment && (
              <div className="p-3 rounded-lg bg-[#14151f] border border-zinc-800 text-xs font-serif-jp text-zinc-400 space-y-1">
                <div className="text-[10px] uppercase text-[#cbb382] font-display tracking-wider">
                  学芸員の所感 (Curator Note)
                </div>
                <p>{item.curatorComment}</p>
              </div>
            )}

            {/* Tags / Categories across dimensions */}
            <div className="space-y-2 pt-2">
              <div className="text-[11px] text-zinc-500 font-serif-jp uppercase tracking-wider">
                収蔵分類インデックス
              </div>
              <div className="flex flex-wrap gap-1.5">
                {item.categories.colors.map((c) => (
                  <span
                    key={c}
                    className="px-2 py-0.5 rounded-full text-[11px] font-serif-jp border border-blue-500/30 bg-blue-950/20 text-blue-200"
                  >
                    色: {c}
                  </span>
                ))}
                {item.categories.nuances.map((n) => (
                  <span
                    key={n}
                    className="px-2 py-0.5 rounded-full text-[11px] font-serif-jp border border-amber-500/30 bg-amber-950/20 text-amber-200"
                  >
                    印象: {n}
                  </span>
                ))}
                {item.categories.times.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-full text-[11px] font-serif-jp border border-purple-500/30 bg-purple-950/20 text-purple-200"
                  >
                    時間: {t}
                  </span>
                ))}
                {item.categories.attributes.map((a) => (
                  <span
                    key={a}
                    className="px-2 py-0.5 rounded-full text-[11px] font-serif-jp border border-emerald-500/30 bg-emerald-950/20 text-emerald-200"
                  >
                    属性: {a}
                  </span>
                ))}
                {item.categories.emotions.map((em) => (
                  <span
                    key={em}
                    className="px-2 py-0.5 rounded-full text-[11px] font-serif-jp border border-rose-500/30 bg-rose-950/20 text-rose-200"
                  >
                    感情: {em}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-[#262835] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {item.audioConfig && item.audioConfig.ambientType !== 'none' && (
                <button
                  onClick={toggleSound}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-serif-jp transition-all ${
                    isPlayingAudio
                      ? 'border-[#cbb382] bg-[#cbb382]/20 text-[#cbb382]'
                      : 'border-[#2d2e38] text-zinc-300 hover:text-white bg-[#171822]'
                  }`}
                >
                  {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isPlayingAudio ? '音を止める' : '環境音を聴く'}</span>
                </button>
              )}

              <button
                onClick={copyReflection}
                className="p-2 rounded-xl border border-[#2d2e38] text-zinc-400 hover:text-zinc-200 bg-[#171822] text-xs transition-colors"
                title="感想をコピー"
              >
                <Share2 className="w-4 h-4" />
              </button>
              {copied && <span className="text-[10px] text-[#cbb382]">コピーしました</span>}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onToggleFavorite(item.id)}
                className={`p-2 rounded-xl border transition-colors ${
                  item.isFavorite
                    ? 'border-rose-500/50 text-rose-400 bg-rose-500/10'
                    : 'border-[#2d2e38] text-zinc-400 hover:text-rose-400 bg-[#171822]'
                }`}
                title="お気に入り"
              >
                <Heart className={`w-4 h-4 ${item.isFavorite ? 'fill-rose-400' : ''}`} />
              </button>

              <button
                onClick={() => {
                  if (window.confirm(`収蔵品「${item.title}」を美術館から除外しますか？`)) {
                    if (isPlayingAudio) ambientAudio.stop();
                    onDelete(item.id);
                    onClose();
                  }
                }}
                className="p-2 rounded-xl border border-zinc-800 text-zinc-500 hover:text-rose-400 hover:border-rose-900 bg-[#171822] transition-colors"
                title="収蔵を解除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
