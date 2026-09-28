import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Calendar,
  MapPin,
  Volume2,
  VolumeX,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { BeautyItem } from '../types/museum';
import { generateBookPreface } from '../services/geminiClientService';
import { ambientAudio } from '../utils/audioSynth';

interface DigitalBookViewProps {
  items: BeautyItem[];
  onSelectItem: (item: BeautyItem) => void;
}

export const DigitalBookView: React.FC<DigitalBookViewProps> = ({
  items,
  onSelectItem,
}) => {
  const DEFAULT_PREFACE = `日常という名の広大な海から、すくい上げられた幾千の光滴。
私たちが「美しい」と感じるとき、世界はほんの少しだけその秘密を開示してくれるのかもしれません。
ここに編まれた標本たちは、あなたが立ち止まり、息を呑み、心を通わせた確かな証拠です。
ページをめくるたび、忘れかけていたあの日の風の匂いや、夕暮れの光が再びあなたの胸を満たすことを祈って。`;

  const DEFAULT_AFTERWORD = `美しさは、遠くの名画の中にだけあるのではありません。
濡れたアスファルトに映る街灯、ふと胸をかすめた旋律、旅先で見上げた名もなき星空。
この一冊の図録は、あなたが今日まで生きてきた優しさの軌跡そのものです。`;

  // Current spread page index: 0 = Cover, 1 = Preface & TOC, 2..N = Spreads, Last = Afterword
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [preface, setPreface] = useState<string>(DEFAULT_PREFACE);
  const [afterword, setAfterword] = useState<string>(DEFAULT_AFTERWORD);
  const [isLoadingPreface, setIsLoadingPreface] = useState<boolean>(false);
  const [ambientActive, setAmbientActive] = useState<boolean>(false);
  const hasLoadedRef = React.useRef(false);

  // Load preface on demand
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    let isMounted = true;
    async function loadPreface() {
      try {
        const res = await generateBookPreface(items, '美の標本録', '第一巻：日常のきらめき');
        if (isMounted && res.preface) {
          setPreface(res.preface);
          setAfterword(res.afterword);
        }
      } catch (e) {
        // Keeps graceful default preface
      }
    }
    loadPreface();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleBookBgm = () => {
    if (ambientActive) {
      ambientAudio.stop();
      setAmbientActive(false);
    } else {
      ambientAudio.play('piano');
      setAmbientActive(true);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Total pages: Cover (0), Preface & Contents (1), Items (2 to items.length + 1), Colophon (items.length + 2)
  const totalPages = items.length + 2;

  const currentItemIndex = currentPage - 2;
  const currentItem = currentItemIndex >= 0 && currentItemIndex < items.length ? items[currentItemIndex] : null;

  return (
    <div className="space-y-6 pb-20">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#232532]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-display text-[#cbb382] uppercase tracking-[0.2em] mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Digital Art Monograph</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif-jp text-[#f5f2eb] font-medium tracking-wide">
            美の標本録（デジタル図録）
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-serif-jp mt-1">
            保存された美の断片から自動生成された一冊の美術書。
          </p>
        </div>

        {/* Ambient audio & Print tool */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleBookBgm}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-serif-jp transition-all ${
              ambientActive
                ? 'border-[#cbb382] bg-[#cbb382]/15 text-[#cbb382]'
                : 'border-[#2d2e3e] bg-[#141520] text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {ambientActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>読書用BGM ({ambientActive ? '再生中' : '月の光'})</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-[#2d2e3e] bg-[#141520] text-xs font-serif-jp text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>印刷 / 保存</span>
          </button>
        </div>
      </div>

      {/* Book Presentation Canvas */}
      <div className="relative max-w-5xl mx-auto">
        {/* Book Container with elegant leather/linen book aesthetic */}
        <div className="min-h-[560px] md:min-h-[620px] bg-[#12131b] border-2 border-[#2b2c3a] rounded-3xl shadow-2xl p-4 sm:p-8 relative overflow-hidden book-shadow">
          {/* Subtle page spine texture down the center on desktop */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 bg-gradient-to-r from-black/40 via-black/10 to-black/40 pointer-events-none z-20" />

          {/* PAGE 0: COVER */}
          {currentPage === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-6 sm:p-12 space-y-8 bg-gradient-to-b from-[#181926] to-[#0f1017] rounded-2xl border border-[#cbb382]/30 shadow-inner relative">
              <div className="space-y-4 max-w-lg">
                <div className="w-16 h-16 mx-auto rounded-full border-2 border-[#cbb382] bg-[#141520] flex items-center justify-center text-[#cbb382] shadow-xl">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="text-xs font-display uppercase tracking-[0.3em] text-[#cbb382]">
                  Cabinet of Fleeting Wonders
                </div>
                <h1 className="text-3xl sm:text-5xl font-serif-jp text-[#f7f4ee] font-medium tracking-widest gold-shimmer">
                  美 の 標 本 録
                </h1>
                <p className="text-sm font-serif-jp text-zinc-400 tracking-wider">
                  第一巻：日常のきらめきと光の余白
                </p>
              </div>

              <div className="pt-6 border-t border-[#cbb382]/20 text-xs font-serif-jp text-zinc-400 space-y-1">
                <div>今日見つけた美しいもの美術館 蔵版</div>
                <div className="text-[11px] text-zinc-500">総収蔵標本数: {items.length} 点</div>
              </div>

              <button
                onClick={() => setCurrentPage(1)}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-full bg-[#cbb382] text-[#0e0f14] font-serif-jp text-xs font-medium hover:bg-[#d9c497] transition-all cursor-pointer shadow-lg"
              >
                <span>頁をめくる (序文へ)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* PAGE 1: PREFACE & TABLE OF CONTENTS */}
          {currentPage === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[500px] p-4 sm:p-8">
              {/* Left Column: AI Curator's Preface */}
              <div className="flex flex-col justify-between space-y-6 md:pr-6 md:border-r border-[#262838]">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-xs font-display text-[#cbb382] uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Preface / 序文</span>
                  </div>
                  <h3 className="text-xl font-serif-jp text-[#f5f2eb] font-medium">
                    世界への愛おしいまなざし
                  </h3>
                  <div className="font-serif-jp text-xs sm:text-sm text-[#dedad2] leading-relaxed whitespace-pre-line italic">
                    {isLoadingPreface ? '学芸員が序文を編纂しております...' : preface}
                  </div>
                </div>

                <div className="text-xs font-serif-jp text-[#cbb382] text-right">
                  — 学芸員 リュミエール 記
                </div>
              </div>

              {/* Right Column: Table of Contents */}
              <div className="flex flex-col justify-between space-y-4 md:pl-2">
                <div className="space-y-3">
                  <div className="text-xs font-display text-[#cbb382] uppercase tracking-widest">
                    Contents / 収蔵目録
                  </div>
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-2">
                    {items.map((item, idx) => (
                      <div
                        key={item.id}
                        onClick={() => setCurrentPage(idx + 2)}
                        className="flex items-baseline justify-between p-2 rounded-lg hover:bg-[#1a1b28] cursor-pointer text-xs font-serif-jp transition-colors group"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span className="text-[10px] text-[#cbb382] font-display">
                            {item.catalogNumber}
                          </span>
                          <span className="text-zinc-300 group-hover:text-white truncate">
                            {item.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-display shrink-0 ml-2">
                          p. {idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#262838]">
                  <button
                    onClick={() => setCurrentPage(0)}
                    className="text-xs text-zinc-400 hover:text-white font-serif-jp flex items-center space-x-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>表紙へ</span>
                  </button>
                  <button
                    onClick={() => setCurrentPage(2)}
                    className="text-xs text-[#cbb382] hover:underline font-serif-jp flex items-center space-x-1"
                  >
                    <span>第1作へ</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PAGES 2..N: SPREAD FOR A SINGLE ITEM */}
          {currentPage >= 2 && currentItem && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[500px] p-2 sm:p-6">
              {/* Left Spread: High-res Visual / Specimen Exhibit */}
              <div className="flex flex-col justify-between items-center bg-[#0a0b0f] rounded-2xl border border-[#222432] p-4 sm:p-6 relative overflow-hidden">
                <div className="w-full flex items-center justify-between text-[10px] text-zinc-500 font-display pb-2 border-b border-zinc-900">
                  <span>{currentItem.catalogNumber}</span>
                  <span>PL.{currentItemIndex + 1}</span>
                </div>

                {currentItem.type === 'image' && (
                  <div className="my-auto w-full max-h-[380px] overflow-hidden rounded-xl border border-zinc-800 shadow-2xl flex items-center justify-center">
                    <img
                      src={currentItem.content}
                      alt={currentItem.title}
                      className="max-h-[380px] w-full object-contain"
                    />
                  </div>
                )}

                {currentItem.type === 'text' && (
                  <div className="my-auto text-center p-6 space-y-4">
                    <blockquote className="font-serif-jp text-base sm:text-lg text-[#f5f2eb] leading-relaxed italic">
                      “{currentItem.content}”
                    </blockquote>
                    {currentItem.caption && (
                      <div className="text-xs text-[#cbb382] font-serif-jp">— {currentItem.caption}</div>
                    )}
                  </div>
                )}

                {currentItem.type === 'url' && (
                  <div className="my-auto text-center p-6 space-y-2">
                    <div className="text-xs font-display text-[#cbb382]">AUDIO-VISUAL ARCHIVE</div>
                    <div className="text-sm font-serif-jp text-zinc-200">{currentItem.title}</div>
                    <p className="text-xs text-zinc-500 font-serif-jp">{currentItem.content}</p>
                  </div>
                )}

                {currentItem.type === 'audio' && (
                  <div className="my-auto text-center p-4 sm:p-6 space-y-3 w-full">
                    <div className="w-16 h-16 mx-auto rounded-full border border-[#cbb382]/40 bg-[#161724] flex items-center justify-center text-[#cbb382] shadow-xl">
                      <Volume2 className="w-7 h-7 animate-pulse" />
                    </div>
                    <div className="text-sm font-serif-jp text-zinc-200 font-medium">{currentItem.title}</div>
                    {(currentItem.content.startsWith('data:') ||
                      currentItem.content.startsWith('blob:') ||
                      currentItem.content.startsWith('http') ||
                      currentItem.content.includes('.mp3') ||
                      currentItem.content.includes('.wav') ||
                      currentItem.content.includes('.m4a')) ? (
                      <div className="w-full max-w-xs mx-auto space-y-1.5 pt-1">
                        <audio controls src={currentItem.content} className="w-full h-9 rounded-lg" />
                        <span className="text-[10px] text-[#cbb382] font-serif-jp block">
                          標本音源（タップで再生）
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400 font-serif-jp">{currentItem.content}</p>
                    )}
                  </div>
                )}

                <div className="w-full text-center text-[10px] text-zinc-600 font-serif-jp pt-2">
                  今日見つけた美しいもの美術館 収蔵標本
                </div>
              </div>

              {/* Right Spread: Literary Text & "Why Beautiful" */}
              <div className="flex flex-col justify-between space-y-6 md:pl-2">
                <div className="space-y-4">
                  {/* Meta header */}
                  <div className="flex items-center space-x-3 text-xs text-zinc-400 font-serif-jp">
                    <span className="flex items-center space-x-1 text-[#cbb382]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{currentItem.date}</span>
                    </span>
                    {currentItem.location && (
                      <span className="flex items-center space-x-1 text-zinc-300">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{currentItem.location.name}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl sm:text-2xl font-serif-jp text-[#f5f2eb] font-medium leading-snug">
                    {currentItem.title}
                  </h3>

                  {currentItem.caption && currentItem.type !== 'text' && (
                    <p className="text-xs text-zinc-400 font-serif-jp -mt-2">
                      出所・作者: {currentItem.caption}
                    </p>
                  )}

                  {/* Core Prompt Requirement: Why Beautiful */}
                  <div className="p-4 rounded-xl bg-[#171825] border-l-2 border-[#cbb382] space-y-1.5 shadow-inner">
                    <div className="text-[11px] font-serif-jp text-[#cbb382] font-medium flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>なぜ美しいと感じたか（感性の覚書）</span>
                    </div>
                    <p className="text-sm font-serif-jp text-[#dedad2] leading-relaxed italic">
                      「{currentItem.whyBeautiful}」
                    </p>
                  </div>

                  {/* Classification seals */}
                  <div className="space-y-1.5 pt-2">
                    <div className="text-[10px] text-zinc-500 font-serif-jp uppercase">分類銘（Seals）</div>
                    <div className="flex flex-wrap gap-1.5">
                      {currentItem.categories.colors.map((c) => (
                        <span
                          key={c}
                          className="text-[10px] px-2 py-0.5 rounded-full border border-blue-500/30 text-blue-300 bg-blue-950/20 font-serif-jp"
                        >
                          色: {c}
                        </span>
                      ))}
                      {currentItem.categories.nuances.map((n) => (
                        <span
                          key={n}
                          className="text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30 text-amber-300 bg-amber-950/20 font-serif-jp"
                        >
                          印象: {n}
                        </span>
                      ))}
                      {currentItem.categories.times.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-2 py-0.5 rounded-full border border-purple-500/30 text-purple-300 bg-purple-950/20 font-serif-jp"
                        >
                          時間: {t}
                        </span>
                      ))}
                      {currentItem.categories.attributes.map((a) => (
                        <span
                          key={a}
                          className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 text-emerald-300 bg-emerald-950/20 font-serif-jp"
                        >
                          属性: {a}
                        </span>
                      ))}
                      {currentItem.categories.emotions.map((em) => (
                        <span
                          key={em}
                          className="text-[10px] px-2 py-0.5 rounded-full border border-rose-500/30 text-rose-300 bg-rose-950/20 font-serif-jp"
                        >
                          感情: {em}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Page Navigation & inspect trigger */}
                <div className="flex items-center justify-between pt-4 border-t border-[#262838] text-xs font-serif-jp">
                  <button
                    onClick={() => onSelectItem(currentItem)}
                    className="text-[#cbb382] hover:underline"
                  >
                    詳細カードを開く
                  </button>
                  <span className="text-zinc-500 font-display">
                    {currentItemIndex + 1} / {items.length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* LAST PAGE: AFTERWORD */}
          {currentPage === items.length + 2 && (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-6 sm:p-12 space-y-6 max-w-xl mx-auto">
              <div className="text-xs font-display text-[#cbb382] uppercase tracking-[0.2em]">
                Afterword / 跋文
              </div>
              <h3 className="text-2xl font-serif-jp text-[#f5f2eb] font-medium">
                美しさは続いてゆく
              </h3>
              <p className="font-serif-jp text-xs sm:text-sm text-[#dedad2] leading-relaxed whitespace-pre-line italic">
                {afterword}
              </p>
              <div className="pt-6 border-t border-zinc-800 text-[11px] text-zinc-500 font-serif-jp space-y-1">
                <div>今日見つけた美しいもの美術館 謹製</div>
                <div>私たちが生きる日々のすべてに、光あれ。</div>
              </div>
              <button
                onClick={() => setCurrentPage(0)}
                className="text-xs text-[#cbb382] hover:underline font-serif-jp"
              >
                表紙に戻る
              </button>
            </div>
          )}
        </div>

        {/* Bottom Page Navigation Controls */}
        <div className="mt-6 flex items-center justify-between text-xs font-serif-jp text-zinc-400">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="flex items-center space-x-1 px-4 py-2 rounded-xl border border-[#2d2e3e] bg-[#141520] hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>前の頁</span>
          </button>

          {/* Page index slider */}
          <div className="flex items-center space-x-3">
            <span className="text-zinc-500 font-display">
              {currentPage === 0
                ? '表紙'
                : currentPage === 1
                ? '序文・目次'
                : currentPage > items.length + 1
                ? '跋文'
                : `標本 ${currentPage - 1} / ${items.length}`}
            </span>
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center space-x-1 px-4 py-2 rounded-xl border border-[#2d2e3e] bg-[#141520] hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors cursor-pointer"
          >
            <span>次の頁</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
