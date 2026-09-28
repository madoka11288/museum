import React, { useState } from 'react';
import {
  Compass,
  BookOpen,
  MapPin,
  Sparkles,
  Plus,
  Volume2,
  VolumeX,
  Cloud,
  CheckCircle2,
  RefreshCw,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { ambientAudio } from '../utils/audioSynth';

interface HeaderProps {
  activeTab: 'galleries' | 'today' | 'map' | 'book';
  setActiveTab: (tab: 'galleries' | 'today' | 'map' | 'book') => void;
  onOpenAddModal: () => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  isSyncing: boolean;
  onSyncDrive: () => void;
  lastSyncedText: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  user,
  onLogin,
  onLogout,
  isSyncing,
  onSyncDrive,
  lastSyncedText,
}) => {
  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const [ambientType, setAmbientType] = useState<'rain' | 'piano' | 'waves' | 'chimes' | 'night'>('piano');
  const [showAmbientMenu, setShowAmbientMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const toggleAmbient = (type?: 'rain' | 'piano' | 'waves' | 'chimes' | 'night') => {
    const target = type || ambientType;
    if (ambientPlaying && (!type || type === ambientType)) {
      ambientAudio.stop();
      setAmbientPlaying(false);
    } else {
      setAmbientType(target);
      ambientAudio.play(target);
      setAmbientPlaying(true);
    }
    setShowAmbientMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0c0d10]/95 backdrop-blur-md border-b border-[#2d2e38] transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Concept */}
          <div className="flex items-center space-x-2.5 sm:space-x-4 cursor-pointer min-w-0" onClick={() => setActiveTab('today')}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-[#cbb382]/40 bg-gradient-to-br from-[#1a1b24] to-[#101117] flex items-center justify-center shadow-lg group-hover:border-[#cbb382] shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#cbb382]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-display tracking-[0.15em] sm:tracking-[0.2em] text-[10px] sm:text-xs text-[#cbb382] uppercase truncate">
                  Musée de la Beauté
                </span>
                <span className="hidden xs:inline text-[9px] sm:text-[10px] text-zinc-500 tracking-wider">個人収蔵庫</span>
              </div>
              <h1 className="text-xs sm:text-base md:text-lg font-serif-jp tracking-wide sm:tracking-wider text-[#f5f2eb] font-medium truncate">
                今日見つけた美しいもの美術館
              </h1>
            </div>
          </div>

          {/* Navigation Tabs (Desktop / Tablet) */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 p-1 bg-[#14151e]/80 rounded-xl border border-[#262835]">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-serif-jp tracking-wider transition-all ${
                activeTab === 'today'
                  ? 'bg-[#222432] text-[#f5f2eb] shadow-sm border border-[#cbb382]/30 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#191a24]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#cbb382]" />
              <span>今日の展示</span>
            </button>

            <button
              onClick={() => setActiveTab('galleries')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-serif-jp tracking-wider transition-all ${
                activeTab === 'galleries'
                  ? 'bg-[#222432] text-[#f5f2eb] shadow-sm border border-[#cbb382]/30 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#191a24]'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-[#cbb382]" />
              <span>展示室・図鑑</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-serif-jp tracking-wider transition-all ${
                activeTab === 'map'
                  ? 'bg-[#222432] text-[#f5f2eb] shadow-sm border border-[#cbb382]/30 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#191a24]'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-[#cbb382]" />
              <span>美の標本地図</span>
            </button>

            <button
              onClick={() => setActiveTab('book')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-serif-jp tracking-wider transition-all ${
                activeTab === 'book'
                  ? 'bg-[#222432] text-[#f5f2eb] shadow-sm border border-[#cbb382]/30 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#191a24]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#cbb382]" />
              <span>美の標本録 (図録)</span>
            </button>
          </nav>

          {/* Right Tools: Ambient Audio, Google Drive Sync, Curate Button */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            {/* Ambient Sound Controller */}
            <div className="relative">
              <button
                onClick={() => setShowAmbientMenu(!showAmbientMenu)}
                title="美術館の環境音"
                className={`p-2 rounded-xl border text-xs flex items-center space-x-1.5 transition-all ${
                  ambientPlaying
                    ? 'border-[#cbb382]/60 text-[#cbb382] bg-[#cbb382]/15 shadow-sm shadow-[#cbb382]/20'
                    : 'border-[#2d2e38] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 bg-[#12131a]'
                }`}
              >
                {ambientPlaying ? (
                  <>
                    <Volume2 className="w-4 h-4 animate-pulse text-[#cbb382]" />
                    <span className="hidden xl:inline text-[11px] font-serif-jp">
                      {ambientType === 'piano' ? '月の光' : ambientType === 'rain' ? '静かな雨' : ambientType === 'waves' ? '波の息吹' : ambientType === 'chimes' ? '風鈴' : '月夜'}
                    </span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span className="hidden xl:inline text-[11px] font-serif-jp">BGM</span>
                  </>
                )}
              </button>

              {showAmbientMenu && (
                <div className="absolute right-0 mt-2 w-52 sm:w-56 bg-[#161720] border border-[#2d2e38] rounded-2xl shadow-2xl py-2 z-50 text-xs animate-fadeIn">
                  <div className="px-3.5 py-1.5 text-[10px] text-zinc-400 font-serif-jp border-b border-zinc-800">
                    美術館の環境音（自然・旋律）
                  </div>
                  <button
                    onClick={() => toggleAmbient('piano')}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-zinc-800/60 ${
                      ambientPlaying && ambientType === 'piano' ? 'text-[#cbb382]' : 'text-zinc-300'
                    }`}
                  >
                    <span>月の光 (アンビエントピアノ)</span>
                    {ambientPlaying && ambientType === 'piano' && <span className="text-[10px] text-[#cbb382]">再生中</span>}
                  </button>
                  <button
                    onClick={() => toggleAmbient('rain')}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-zinc-800/60 ${
                      ambientPlaying && ambientType === 'rain' ? 'text-[#cbb382]' : 'text-zinc-300'
                    }`}
                  >
                    <span>雨音の余白 (Rain)</span>
                    {ambientPlaying && ambientType === 'rain' && <span className="text-[10px] text-[#cbb382]">再生中</span>}
                  </button>
                  <button
                    onClick={() => toggleAmbient('waves')}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-zinc-800/60 ${
                      ambientPlaying && ambientType === 'waves' ? 'text-[#cbb382]' : 'text-zinc-300'
                    }`}
                  >
                    <span>夜明けの潮騒 (Ocean Waves)</span>
                    {ambientPlaying && ambientType === 'waves' && <span className="text-[10px] text-[#cbb382]">再生中</span>}
                  </button>
                  <button
                    onClick={() => toggleAmbient('chimes')}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-zinc-800/60 ${
                      ambientPlaying && ambientType === 'chimes' ? 'text-[#cbb382]' : 'text-zinc-300'
                    }`}
                  >
                    <span>回廊の風鈴 (Wind Chimes)</span>
                    {ambientPlaying && ambientType === 'chimes' && <span className="text-[10px] text-[#cbb382]">再生中</span>}
                  </button>
                  <button
                    onClick={() => toggleAmbient('night')}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-zinc-800/60 ${
                      ambientPlaying && ambientType === 'night' ? 'text-[#cbb382]' : 'text-zinc-300'
                    }`}
                  >
                    <span>深夜の静寂と虫の声</span>
                    {ambientPlaying && ambientType === 'night' && <span className="text-[10px] text-[#cbb382]">再生中</span>}
                  </button>
                  {ambientPlaying && (
                    <button
                      onClick={() => toggleAmbient()}
                      className="w-full text-left px-3.5 py-2 text-rose-400 hover:text-rose-300 border-t border-zinc-800 mt-1"
                    >
                      音を止める
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Google Drive Status & Account */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border border-[#2d2e38] bg-[#12131a] hover:border-[#cbb382]/40 transition-all text-xs"
                  title="Google Drive 接続中"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full border border-zinc-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#202230] flex items-center justify-center text-[10px] text-[#cbb382]">
                      <UserIcon className="w-3 h-3" />
                    </div>
                  )}
                  <span className="hidden sm:inline text-zinc-300 font-serif-jp text-[11px] max-w-[80px] truncate">
                    {user.displayName || 'Google同期'}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-72 max-w-[90vw] bg-[#161720] border border-[#2d2e38] rounded-2xl shadow-2xl p-4 z-50 text-xs animate-fadeIn">
                    <div className="flex items-center space-x-2.5 pb-3 border-b border-zinc-800">
                      {user.photoURL && <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />}
                      <div className="overflow-hidden">
                        <div className="font-medium text-zinc-200 truncate">{user.displayName || 'Google User'}</div>
                        <div className="text-[10px] text-zinc-400 truncate">{user.email}</div>
                      </div>
                    </div>
                    <div className="py-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span>同期状態:</span>
                        <span className="text-emerald-400 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Google Drive連動中</span>
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        保管場所: あなたのGoogle Drive（非公開）
                      </div>
                      {lastSyncedText && (
                        <div className="text-[10px] text-zinc-400">最終同期: {lastSyncedText}</div>
                      )}
                    </div>
                    <div className="pt-2.5 border-t border-zinc-800 space-y-2">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onSyncDrive();
                        }}
                        disabled={isSyncing}
                        className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-[#222432] text-zinc-200 hover:text-white hover:bg-[#2b2d40] transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#cbb382]' : ''}`} />
                        <span>今すぐ同期する</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>ログアウト</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 rounded-xl border border-[#cbb382]/30 bg-[#161724] text-zinc-200 hover:border-[#cbb382] hover:text-[#f5f2eb] transition-all text-xs font-serif-jp"
                title="Google Driveに保存して複数端末で同期"
              >
                <Cloud className="w-3.5 h-3.5 text-[#cbb382]" />
                <span className="hidden sm:inline text-[11px]">Drive同期</span>
              </button>
            )}

            {/* Desktop Add Item CTA */}
            <button
              onClick={onOpenAddModal}
              className="hidden sm:flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#cbb382] to-[#b39962] text-[#0e0f14] font-medium text-xs font-serif-jp tracking-wider shadow-lg hover:shadow-[#cbb382]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>美を収蔵する</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Mobile Bottom Navigation Bar (Thumb Friendly) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0d12]/95 backdrop-blur-xl border-t border-[#232532] px-2 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-around relative">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-1 flex flex-col items-center py-1 transition-all ${
              activeTab === 'today' ? 'text-[#cbb382] font-medium' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-serif-jp mt-0.5">今日の展示</span>
          </button>

          <button
            onClick={() => setActiveTab('galleries')}
            className={`flex-1 flex flex-col items-center py-1 transition-all ${
              activeTab === 'galleries' ? 'text-[#cbb382] font-medium' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="text-[10px] font-serif-jp mt-0.5">展示室</span>
          </button>

          {/* Elevated Center Add Button */}
          <div className="flex-1 flex justify-center -mt-6">
            <button
              onClick={onOpenAddModal}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-[#cbb382] to-[#b39962] text-[#0e0f14] flex flex-col items-center justify-center shadow-lg shadow-[#cbb382]/30 active:scale-95 transition-transform cursor-pointer border-2 border-[#12131a]"
              title="美を収蔵する"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 flex flex-col items-center py-1 transition-all ${
              activeTab === 'map' ? 'text-[#cbb382] font-medium' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span className="text-[10px] font-serif-jp mt-0.5">標本地図</span>
          </button>

          <button
            onClick={() => setActiveTab('book')}
            className={`flex-1 flex flex-col items-center py-1 transition-all ${
              activeTab === 'book' ? 'text-[#cbb382] font-medium' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-[10px] font-serif-jp mt-0.5">図録</span>
          </button>
        </div>
      </div>
    </header>
  );
};
