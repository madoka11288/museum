import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Filter,
  Grid,
  Layers,
  Search,
  Calendar,
  MapPin,
  Heart,
  Volume2,
  RefreshCw,
  SlidersHorizontal,
  Check,
  Play,
  Pause,
  Music,
} from 'lucide-react';
import {
  BeautyItem,
  ThematicRoom,
  CATEGORY_TAXONOMY,
} from '../types/museum';

interface ExhibitionGalleriesProps {
  items: BeautyItem[];
  thematicRooms: ThematicRoom[];
  onSelectItem: (item: BeautyItem) => void;
  onRefreshCuratedRooms: () => void;
  isCuratingRooms: boolean;
}

export const ExhibitionGalleries: React.FC<ExhibitionGalleriesProps> = ({
  items,
  thematicRooms,
  onSelectItem,
  onRefreshCuratedRooms,
  isCuratingRooms,
}) => {
  const [viewMode, setViewMode] = useState<'rooms' | 'codex'>('rooms');
  const [activeRoomId, setActiveRoomId] = useState<string>(
    thematicRooms[0]?.id || 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedNuances, setSelectedNuances] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Toggle helper
  const toggleSelection = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    val: string
  ) => {
    if (list.includes(val)) {
      setList(list.filter((x) => x !== val));
    } else {
      setList([...list, val]);
    }
  };

  const clearAllFilters = () => {
    setSelectedColors([]);
    setSelectedNuances([]);
    setSelectedTimes([]);
    setSelectedAttributes([]);
    setSelectedEmotions([]);
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedColors.length > 0 ||
    selectedNuances.length > 0 ||
    selectedTimes.length > 0 ||
    selectedAttributes.length > 0 ||
    selectedEmotions.length > 0 ||
    searchQuery.trim().length > 0;

  // Filter items for Codex mode
  const filteredItems = items.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchWhy = item.whyBeautiful.toLowerCase().includes(q);
      const matchCaption = item.caption?.toLowerCase().includes(q);
      if (!matchTitle && !matchWhy && !matchCaption) return false;
    }

    if (
      selectedColors.length > 0 &&
      !selectedColors.some((c) => item.categories.colors.includes(c))
    ) {
      return false;
    }

    if (
      selectedNuances.length > 0 &&
      !selectedNuances.some((n) => item.categories.nuances.includes(n))
    ) {
      return false;
    }

    if (
      selectedTimes.length > 0 &&
      !selectedTimes.some((t) => item.categories.times.includes(t))
    ) {
      return false;
    }

    if (
      selectedAttributes.length > 0 &&
      !selectedAttributes.some((a) => item.categories.attributes.includes(a))
    ) {
      return false;
    }

    if (
      selectedEmotions.length > 0 &&
      !selectedEmotions.some((e) => item.categories.emotions.includes(e))
    ) {
      return false;
    }

    return true;
  });

  const currentRoom = thematicRooms.find((r) => r.id === activeRoomId) || thematicRooms[0];
  const roomItems = currentRoom
    ? items.filter((it) => currentRoom.itemIds.includes(it.id))
    : items;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#232532]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-display text-[#cbb382] uppercase tracking-[0.2em] mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Exhibition & Specimen Codex</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif-jp text-[#f5f2eb] font-medium tracking-wide">
            美術館 展示室・美の図鑑
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-serif-jp mt-1">
            AI学芸員が色・時間・感情から美を再構築した特別展示室と、全収蔵品の標本図鑑。
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center space-x-2 bg-[#14151f] p-1 rounded-xl border border-[#282a3a]">
          <button
            onClick={() => setViewMode('rooms')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-serif-jp transition-all ${
              viewMode === 'rooms'
                ? 'bg-[#222434] text-[#f5f2eb] border border-[#cbb382]/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#cbb382]" />
            <span>AI特別展示室</span>
          </button>
          <button
            onClick={() => setViewMode('codex')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-serif-jp transition-all ${
              viewMode === 'codex'
                ? 'bg-[#222434] text-[#f5f2eb] border border-[#cbb382]/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5 text-[#cbb382]" />
            <span>全収蔵品・図鑑 ({items.length})</span>
          </button>
        </div>
      </div>

      {/* MODE 1: AI Thematic Rooms */}
      {viewMode === 'rooms' && (
        <div className="space-y-6">
          {/* Room Selector Tabs & Re-curate button */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {thematicRooms.map((room) => {
                const isActive = room.id === activeRoomId;
                return (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoomId(room.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-serif-jp border transition-all cursor-pointer ${
                      isActive
                        ? 'border-[#cbb382] bg-gradient-to-r from-[#1c1d29] to-[#161722] text-[#f5f2eb] shadow-md shadow-[#cbb382]/5'
                        : 'border-[#262838] bg-[#12131b] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <span className="font-medium">{room.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400">
                      {items.filter((it) => room.itemIds.includes(it.id)).length}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={onRefreshCuratedRooms}
              disabled={isCuratingRooms}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-[#2d2e3e] text-xs font-serif-jp text-zinc-300 hover:text-[#cbb382] hover:border-[#cbb382]/40 bg-[#141520] transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCuratingRooms ? 'animate-spin text-[#cbb382]' : ''}`} />
              <span>AI学芸員に再編成を依頼</span>
            </button>
          </div>

          {/* Current Room Concept Banner */}
          {currentRoom && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#161724] to-[#0f1017] border border-[#cbb382]/25 shadow-xl relative overflow-hidden">
              <div className="relative z-10 space-y-2 max-w-3xl">
                <span className="text-[11px] font-display uppercase tracking-widest text-[#cbb382]">
                  Thematic Room
                </span>
                <h3 className="text-xl sm:text-2xl font-serif-jp text-[#f5f2eb] font-medium tracking-wide">
                  {currentRoom.name}
                </h3>
                <p className="text-xs text-[#cbb382] font-serif-jp tracking-wider">
                  — {currentRoom.subtitle}
                </p>
                <p className="text-xs sm:text-sm text-zinc-300 font-serif-jp leading-relaxed pt-1">
                  {currentRoom.concept}
                </p>
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-[#cbb382]/10 to-transparent pointer-events-none" />
            </div>
          )}

          {/* Masonry / Codex Grid for Current Room */}
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {roomItems.map((item) => (
              <SpecimenCard key={item.id} item={item} onSelect={() => onSelectItem(item)} />
            ))}
          </div>

          {roomItems.length === 0 && (
            <div className="text-center py-16 text-zinc-500 font-serif-jp text-sm">
              この展示室に該当する収蔵品は現在ございません。
            </div>
          )}
        </div>
      )}

      {/* MODE 2: Comprehensive Codex / Pinterest Compendium */}
      {viewMode === 'codex' && (
        <div className="space-y-6">
          {/* Search Bar & Multi-filter trigger */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="収蔵品名、なぜ美しいと感じたか、言葉を検索..."
                className="w-full pl-9 pr-4 py-2 bg-[#141520] border border-[#2d2e3e] rounded-xl text-xs text-[#f5f2eb] placeholder-zinc-500 focus:outline-none focus:border-[#cbb382]"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-serif-jp border transition-all ${
                  hasActiveFilters || showFilterDrawer
                    ? 'border-[#cbb382] bg-[#cbb382]/15 text-[#f5f2eb]'
                    : 'border-[#2d2e3e] bg-[#141520] text-zinc-300 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#cbb382]" />
                <span>分類フィルター</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-[#cbb382]" />
                )}
              </button>

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-zinc-500 hover:text-zinc-300 underline font-serif-jp"
                >
                  クリア
                </button>
              )}
            </div>
          </div>

          {/* Expandable Filter Drawer */}
          {showFilterDrawer && (
            <div className="p-5 rounded-2xl bg-[#141520] border border-[#282a3a] space-y-4">
              <div className="text-xs font-serif-jp text-zinc-300 font-medium">
                色・印象・時間・属性・感情による絞り込み（複数選択）
              </div>

              {/* Colors */}
              <div>
                <span className="text-[11px] text-zinc-400 font-serif-jp mb-1.5 block">色</span>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_TAXONOMY.colors.map((c) => {
                    const sel = selectedColors.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleSelection(selectedColors, setSelectedColors, c.id)}
                        className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-serif-jp border transition-all ${
                          sel
                            ? 'border-[#cbb382] bg-[#cbb382]/20 text-white font-medium'
                            : 'border-zinc-800 bg-[#191a26] text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: c.hex }} />
                        <span>{c.id}</span>
                        {sel && <Check className="w-3 h-3 text-[#cbb382]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nuances */}
              <div>
                <span className="text-[11px] text-zinc-400 font-serif-jp mb-1.5 block">印象</span>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_TAXONOMY.nuances.map((n) => {
                    const sel = selectedNuances.includes(n.id);
                    return (
                      <button
                        key={n.id}
                        onClick={() => toggleSelection(selectedNuances, setSelectedNuances, n.id)}
                        className={`px-2.5 py-1 rounded-full text-xs font-serif-jp border transition-all ${
                          sel
                            ? 'border-[#cbb382] bg-[#cbb382]/20 text-white font-medium'
                            : 'border-zinc-800 bg-[#191a26] text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        {n.id}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Attributes */}
              <div>
                <span className="text-[11px] text-zinc-400 font-serif-jp mb-1.5 block">属性</span>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_TAXONOMY.attributes.map((a) => {
                    const sel = selectedAttributes.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        onClick={() => toggleSelection(selectedAttributes, setSelectedAttributes, a.id)}
                        className={`px-2.5 py-1 rounded-full text-xs font-serif-jp border transition-all ${
                          sel
                            ? 'border-[#cbb382] bg-[#cbb382]/20 text-white font-medium'
                            : 'border-zinc-800 bg-[#191a26] text-zinc-400 hover:border-zinc-700'
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
                <span className="text-[11px] text-zinc-400 font-serif-jp mb-1.5 block">感情</span>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_TAXONOMY.emotions.map((em) => {
                    const sel = selectedEmotions.includes(em.id);
                    return (
                      <button
                        key={em.id}
                        onClick={() => toggleSelection(selectedEmotions, setSelectedEmotions, em.id)}
                        className={`px-2.5 py-1 rounded-full text-xs font-serif-jp border transition-all ${
                          sel
                            ? 'border-[#cbb382] bg-[#cbb382]/20 text-white font-medium'
                            : 'border-zinc-800 bg-[#191a26] text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        {em.id}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Results Count & Pinterest Grid */}
          <div className="flex items-center justify-between text-xs text-zinc-400 font-serif-jp">
            <span>該当収蔵品: {filteredItems.length} 点</span>
          </div>

          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {filteredItems.map((item) => (
              <SpecimenCard key={item.id} item={item} onSelect={() => onSelectItem(item)} />
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-20 bg-[#12131b] border border-[#232532] rounded-2xl p-8 space-y-3">
              <Sparkles className="w-8 h-8 text-zinc-600 mx-auto" />
              <div className="text-zinc-400 font-serif-jp text-sm">
                条件に一致する美の標本が見つかりませんでした。
              </div>
              <button
                onClick={clearAllFilters}
                className="text-xs text-[#cbb382] hover:underline font-serif-jp"
              >
                すべてのフィルターを解除
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Specimen Card: Pinterest masonry feel meets Game Encyclopedia Codex card
const SpecimenCard: React.FC<{ item: BeautyItem; onSelect: () => void }> = ({
  item,
  onSelect,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isPlayable =
    item.type === 'audio' &&
    (item.content.startsWith('data:') ||
      item.content.startsWith('blob:') ||
      item.content.startsWith('http') ||
      item.content.includes('.mp3') ||
      item.content.includes('.wav') ||
      item.content.includes('.m4a'));

  const toggleInlineAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlayingAudio(true);
    }
  };

  return (
    <div
      onClick={onSelect}
      className="break-inside-avoid group relative bg-[#13141d] border border-[#262838] hover:border-[#cbb382]/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-[#cbb382]/10 hover:-translate-y-1 cursor-pointer flex flex-col"
    >
      {/* Top Media or Quote Box */}
      {item.type === 'image' && (
        <div className="relative overflow-hidden aspect-[4/3] bg-black">
          <img
            src={item.content}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#13141d] via-transparent to-black/30" />
        </div>
      )}

      {item.type === 'text' && (
        <div className="p-6 bg-gradient-to-br from-[#181a26] to-[#12131c] border-b border-[#222432] relative overflow-hidden">
          <blockquote className="font-serif-jp text-sm text-[#f5f2eb] leading-relaxed line-clamp-4 italic">
            “{item.content}”
          </blockquote>
          {item.caption && (
            <div className="text-[10px] text-[#cbb382] font-serif-jp mt-2 text-right">
              — {item.caption}
            </div>
          )}
        </div>
      )}

      {item.type === 'url' && (
        <div className="relative aspect-video bg-[#1a1b26] flex items-center justify-center p-4">
          <div className="text-center space-y-1">
            <span className="text-[10px] font-display text-[#cbb382] uppercase tracking-wider block">
              Audio / Video Specimen
            </span>
            <div className="text-xs text-zinc-300 font-serif-jp font-medium line-clamp-2">
              {item.title}
            </div>
          </div>
        </div>
      )}

      {item.type === 'audio' && (
        <div className="p-5 bg-gradient-to-br from-[#191b29] to-[#11121a] flex items-center justify-between border-b border-[#222432]">
          <div className="flex items-center space-x-3 overflow-hidden">
            {isPlayable && (
              <audio
                ref={audioRef}
                src={item.content}
                onEnded={() => setIsPlayingAudio(false)}
                onPause={() => setIsPlayingAudio(false)}
                onPlay={() => setIsPlayingAudio(true)}
                className="hidden"
              />
            )}
            <button
              type="button"
              onClick={isPlayable ? toggleInlineAudio : undefined}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
                isPlayingAudio
                  ? 'border-[#cbb382] bg-[#cbb382] text-[#0e0f14] shadow-lg shadow-[#cbb382]/30 scale-105'
                  : 'border-[#cbb382]/40 bg-[#222434] text-[#cbb382] hover:bg-[#cbb382]/20'
              }`}
              title={isPlayingAudio ? '音声を一時停止' : '音声を再生'}
            >
              {isPlayingAudio ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : isPlayable ? (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <div className="overflow-hidden">
              <span className="text-[10px] font-display text-[#cbb382] uppercase tracking-wider block">
                Music Artifact
              </span>
              <div className="text-xs text-zinc-200 font-serif-jp font-medium truncate">
                {item.title}
              </div>
            </div>
          </div>

          {isPlayingAudio && (
            <div className="flex items-end space-x-0.5 h-4 shrink-0">
              <span className="w-0.5 h-3 bg-[#cbb382] animate-bounce" />
              <span className="w-0.5 h-4 bg-[#cbb382] animate-bounce delay-75" />
              <span className="w-0.5 h-2 bg-[#cbb382] animate-bounce delay-150" />
            </div>
          )}
        </div>
      )}

      {/* Catalog Number & Date Ribbon */}
      <div className="px-4 pt-3 flex items-center justify-between text-[10px] text-zinc-400 font-serif-jp">
        <span className="font-display text-[#cbb382] tracking-wider px-1.5 py-0.5 rounded bg-[#cbb382]/10 border border-[#cbb382]/20">
          {item.catalogNumber}
        </span>
        <div className="flex items-center space-x-1 text-zinc-400">
          <Calendar className="w-3 h-3" />
          <span>{item.date}</span>
        </div>
      </div>

      {/* Body: Title & "Why Beautiful" */}
      <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-serif-jp text-[#f5f2eb] font-medium leading-snug group-hover:text-[#ecdcb0] transition-colors">
            {item.title}
          </h4>

          {/* Why Beautiful snippet */}
          <p className="text-xs font-serif-jp text-[#dedad2] italic mt-1.5 line-clamp-2 leading-relaxed bg-[#171824] p-2 rounded-lg border-l border-[#cbb382]">
            「{item.whyBeautiful}」
          </p>
        </div>

        {/* Bottom tags & Location preview */}
        <div className="pt-2 border-t border-[#202230] space-y-1.5">
          {item.location && (
            <div className="flex items-center space-x-1 text-[10px] text-zinc-400 font-serif-jp truncate">
              <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
              <span className="truncate">{item.location.name}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-1">
            {item.categories.colors.slice(0, 1).map((c) => (
              <span
                key={c}
                className="text-[9px] px-1.5 py-0.2 rounded-full border border-blue-500/30 text-blue-300 bg-blue-950/20 font-serif-jp"
              >
                {c}
              </span>
            ))}
            {item.categories.nuances.slice(0, 1).map((n) => (
              <span
                key={n}
                className="text-[9px] px-1.5 py-0.2 rounded-full border border-amber-500/30 text-amber-300 bg-amber-950/20 font-serif-jp"
              >
                {n}
              </span>
            ))}
            {item.categories.emotions.slice(0, 1).map((e) => (
              <span
                key={e}
                className="text-[9px] px-1.5 py-0.2 rounded-full border border-rose-500/30 text-rose-300 bg-rose-950/20 font-serif-jp"
              >
                {e}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
