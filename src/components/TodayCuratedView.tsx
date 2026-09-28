import React, { useState } from 'react';
import {
  Sparkles,
  Clock,
  Palette,
  Calendar,
  Compass,
  ArrowRight,
  MessageSquareQuote,
  RefreshCw,
  Volume2,
} from 'lucide-react';
import { BeautyItem, DailyCuratorReport } from '../types/museum';

interface TodayCuratedViewProps {
  items: BeautyItem[];
  report: DailyCuratorReport;
  onSelectItem: (item: BeautyItem) => void;
  onRefreshInsight: () => void;
  isLoadingInsight: boolean;
  onGoToGalleries: () => void;
  onGoToBook: () => void;
}

export const TodayCuratedView: React.FC<TodayCuratedViewProps> = ({
  items,
  report,
  onSelectItem,
  onRefreshInsight,
  isLoadingInsight,
  onGoToGalleries,
  onGoToBook,
}) => {
  const [interactiveThought, setInteractiveThought] = useState<string | null>(null);
  const [askingCurator, setAskingCurator] = useState(false);

  // Find 3 years ago item or past items
  const threeYearsAgoItem =
    items.find((it) => it.date.startsWith('2023-09') || it.id === 'opus-001') ||
    items[items.length - 1];

  // Find recent blue items
  const recentBlueItems = items.filter(
    (it) => it.categories.colors.includes('青') || it.categories.attributes.includes('水')
  );

  // Spotlight items according to report or fallback
  const spotlightItems =
    report.spotlightItemIds.length > 0
      ? items.filter((it) => report.spotlightItemIds.includes(it.id))
      : [items[0], items[1], items[2]].filter(Boolean);

  const handleAskCurator = () => {
    setAskingCurator(true);
    setTimeout(() => {
      const thoughts = [
        `「あなたが青や水に惹かれるとき、それは世界から逃げ出したいのではなく、より深い透明さで世界と結び直したいという心の願いなのかもしれません。」`,
        `「3年前のあなたが立ち止まった水たまりと、昨日あなたが捉えた青い光は、見えない一本の川でつながっています。」`,
        `「美しさとは、名詞ではなく動詞です。あなたが立ち止まり、息を呑んだその瞬間、世界は静かに完成しました。」`,
      ];
      setInteractiveThought(thoughts[Math.floor(Math.random() * thoughts.length)]);
      setAskingCurator(false);
    }, 600);
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Curator Greeting & Observation Hero Card */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#181926] via-[#12131c] to-[#0c0d12] border border-[#cbb382]/35 p-6 sm:p-10 shadow-2xl overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#cbb382]/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Curator Header Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#262838] pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full border border-[#cbb382] bg-[#222435] flex items-center justify-center text-[#cbb382] shadow-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-display text-[#cbb382] uppercase tracking-[0.2em]">
                  AI Museum Curator
                </div>
                <h3 className="text-sm font-serif-jp text-zinc-200 font-medium">
                  学芸員 リュミエールの本日の考察
                </h3>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={onRefreshInsight}
                disabled={isLoadingInsight}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-[#2d2e3e] bg-[#141520] text-xs font-serif-jp text-zinc-300 hover:text-[#cbb382] transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingInsight ? 'animate-spin text-[#cbb382]' : ''}`} />
                <span>再分析</span>
              </button>
            </div>
          </div>

          {/* Main Literary Observation */}
          <div className="space-y-3 max-w-3xl">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif-jp text-[#f5f2eb] font-medium leading-relaxed tracking-wide">
              {report.greeting}
            </h2>
            <p className="text-sm sm:text-base font-serif-jp text-[#dedad2] leading-relaxed italic">
              {report.curatorMessage}
            </p>
          </div>

          {/* Dual Insight Panels: Time Capsule & Color Trend */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Panel 1: Time Capsule (3 years ago today) */}
            <div className="p-5 rounded-2xl bg-[#141520]/80 border border-amber-500/20 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-serif-jp text-[#cbb382]">
                <Clock className="w-4 h-4 text-[#cbb382]" />
                <span className="font-medium">時間の重なり・3年前の記憶</span>
              </div>
              <p className="text-xs sm:text-sm font-serif-jp text-zinc-300 leading-relaxed">
                {report.timeCapsuleNote}
              </p>
              {threeYearsAgoItem && (
                <div
                  onClick={() => onSelectItem(threeYearsAgoItem)}
                  className="mt-3 flex items-center space-x-3 p-2.5 rounded-xl bg-[#1b1c28] border border-[#2d2e40] hover:border-[#cbb382] transition-all cursor-pointer group"
                >
                  {threeYearsAgoItem.type === 'image' ? (
                    <img
                      src={threeYearsAgoItem.content}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-[#242636] flex items-center justify-center text-xs text-[#cbb382]">
                      記憶
                    </div>
                  )}
                  <div className="overflow-hidden flex-1">
                    <div className="text-[10px] text-zinc-500 font-serif-jp">
                      {threeYearsAgoItem.date} の収蔵品
                    </div>
                    <div className="text-xs text-[#f5f2eb] font-serif-jp font-medium truncate group-hover:text-[#cbb382] transition-colors">
                      {threeYearsAgoItem.title}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-[#cbb382] transition-colors shrink-0" />
                </div>
              )}
            </div>

            {/* Panel 2: Trend Observation (e.g. Recent "Blue" increase) */}
            <div className="p-5 rounded-2xl bg-[#141520]/80 border border-blue-500/20 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-serif-jp text-blue-300">
                <Palette className="w-4 h-4 text-blue-400" />
                <span className="font-medium">最近の色彩と情動の傾向</span>
              </div>
              <p className="text-xs sm:text-sm font-serif-jp text-zinc-300 leading-relaxed">
                {report.trendObservation}
              </p>
              {recentBlueItems.length > 0 && (
                <div className="mt-3 flex items-center space-x-2">
                  <div className="flex -space-x-2 overflow-hidden">
                    {recentBlueItems.slice(0, 4).map((it) => (
                      <div
                        key={it.id}
                        onClick={() => onSelectItem(it)}
                        className="inline-block w-8 h-8 rounded-full ring-2 ring-[#141520] overflow-hidden cursor-pointer hover:scale-110 transition-transform"
                      >
                        {it.type === 'image' ? (
                          <img src={it.content} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-blue-900/60 flex items-center justify-center text-[9px] text-blue-200">
                            文
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px] text-zinc-400 font-serif-jp">
                    青と水の標本 ({recentBlueItems.length}点)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Dialogue with Curator */}
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-[#262838]">
            <div className="flex items-center space-x-2 text-xs text-zinc-400 font-serif-jp">
              <MessageSquareQuote className="w-4 h-4 text-[#cbb382]" />
              <span>学芸員と美の対話を深める</span>
            </div>
            <button
              onClick={handleAskCurator}
              disabled={askingCurator}
              className="px-4 py-1.5 rounded-xl border border-[#cbb382]/30 text-xs font-serif-jp text-[#cbb382] hover:bg-[#cbb382]/10 transition-colors cursor-pointer"
            >
              {askingCurator ? '思索中...' : 'なぜ人は青や記憶に惹かれるのか尋ねる'}
            </button>
          </div>

          {interactiveThought && (
            <div className="p-4 rounded-xl bg-[#1b1c28] border-l-2 border-[#cbb382] text-xs font-serif-jp text-[#ecdcb0] leading-relaxed italic animate-fadeIn">
              {interactiveThought}
            </div>
          )}
        </div>
      </div>

      {/* TODAY'S CURATED SPOTLIGHT EXHIBITION (本日の特設展示) */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2 text-xs font-display text-[#cbb382] uppercase tracking-[0.2em]">
              <Compass className="w-3.5 h-3.5" />
              <span>Today's Spotlight Exhibition</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif-jp text-[#f5f2eb] font-medium tracking-wide">
              {report.spotlightTheme}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 font-serif-jp mt-1">
              {report.spotlightDescription}
            </p>
          </div>

          <button
            onClick={onGoToGalleries}
            className="flex items-center space-x-1.5 text-xs font-serif-jp text-[#cbb382] hover:underline"
          >
            <span>すべての展示室を見る</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Featured Spotlight Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {spotlightItems.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => onSelectItem(item)}
              className="group relative bg-[#13141d] border border-[#282a3c] hover:border-[#cbb382] rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Visual */}
                <div className="relative aspect-[4/3] bg-black overflow-hidden">
                  {item.type === 'image' ? (
                    <img
                      src={item.content}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : item.type === 'text' ? (
                    <div className="p-6 h-full flex flex-col justify-center bg-gradient-to-br from-[#1c1e2d] to-[#12131d]">
                      <blockquote className="font-serif-jp text-xs sm:text-sm text-[#f5f2eb] line-clamp-4 italic leading-relaxed">
                        “{item.content}”
                      </blockquote>
                    </div>
                  ) : item.type === 'audio' ? (
                    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#191b29] to-[#11121a] p-6 text-center space-y-2">
                      <div className="w-12 h-12 rounded-full border border-[#cbb382]/40 bg-[#222434] flex items-center justify-center text-[#cbb382] shadow-lg">
                        <Volume2 className="w-6 h-6 animate-pulse" />
                      </div>
                      <span className="text-xs font-serif-jp text-zinc-200 font-medium truncate max-w-full px-2">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-display text-[#cbb382] uppercase tracking-wider">
                        Sound Artifact
                      </span>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center bg-[#171825] p-4 text-center">
                      <span className="text-xs font-serif-jp text-zinc-300">{item.title}</span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3">
                    <span className="font-display text-[10px] px-2 py-0.5 rounded bg-black/70 text-[#cbb382] border border-[#cbb382]/30">
                      SPOTLIGHT #{idx + 1}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-2">
                  <div className="flex items-center space-x-2 text-[10px] text-zinc-400 font-serif-jp">
                    <Calendar className="w-3 h-3 text-[#cbb382]" />
                    <span>{item.date}</span>
                    {item.location && <span>• {item.location.name}</span>}
                  </div>
                  <h4 className="text-base font-serif-jp text-[#f5f2eb] font-medium leading-snug group-hover:text-[#ecdcb0] transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs font-serif-jp text-[#dedad2] italic bg-[#171824] p-2 rounded-lg border-l border-[#cbb382] line-clamp-2">
                    「{item.whyBeautiful}」
                  </p>
                </div>
              </div>

              {/* Bottom tag bar */}
              <div className="p-4 pt-0 flex flex-wrap gap-1">
                {item.categories.colors.map((c) => (
                  <span
                    key={c}
                    className="text-[9px] px-1.5 py-0.2 rounded-full border border-blue-500/30 text-blue-300 bg-blue-950/20 font-serif-jp"
                  >
                    {c}
                  </span>
                ))}
                {item.categories.nuances.map((n) => (
                  <span
                    key={n}
                    className="text-[9px] px-1.5 py-0.2 rounded-full border border-amber-500/30 text-amber-300 bg-amber-950/20 font-serif-jp"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Book Recommendation CTA */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#171824] via-[#1b1c2b] to-[#12131b] border border-[#cbb382]/25 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl text-center md:text-left">
          <span className="text-xs font-display text-[#cbb382] uppercase tracking-widest">
            Anthology of Beauty
          </span>
          <h4 className="text-lg sm:text-xl font-serif-jp text-[#f5f2eb] font-medium">
            あなたの日々のまなざしを一冊の美しい図録に。
          </h4>
          <p className="text-xs font-serif-jp text-zinc-400 leading-relaxed">
            保存された美のデータから、AI学芸員の序文と装丁を備えたデジタルブックを自動編纂します。
          </p>
        </div>
        <button
          onClick={onGoToBook}
          className="px-6 py-2.5 rounded-xl bg-[#222435] border border-[#cbb382]/40 text-xs font-serif-jp text-[#f5f2eb] hover:bg-[#2b2d42] hover:border-[#cbb382] transition-all shrink-0 cursor-pointer shadow-lg"
        >
          図録のページを開く
        </button>
      </div>
    </div>
  );
};
