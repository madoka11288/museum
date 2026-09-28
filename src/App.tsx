/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  BeautyItem,
  DailyCuratorReport,
  ThematicRoom,
  INITIAL_BEAUTY_ITEMS,
} from './types/museum';
import { Header } from './components/Header';
import { TodayCuratedView } from './components/TodayCuratedView';
import { ExhibitionGalleries } from './components/ExhibitionGalleries';
import { MuseumMapView } from './components/MuseumMapView';
import { DigitalBookView } from './components/DigitalBookView';
import { AddItemModal } from './components/AddItemModal';
import { ItemDetailModal } from './components/ItemDetailModal';
import {
  initAuth,
  googleSignIn,
  logout,
  loadMuseumFromDrive,
  saveMuseumToDrive,
} from './services/googleDriveService';
import {
  fetchDailyInsight,
  curateRoomsWithAI,
} from './services/geminiClientService';

const LOCAL_STORAGE_KEY = 'museum_beauty_items_vault_v1';

export default function App() {
  const [items, setItems] = useState<BeautyItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load local items:', e);
    }
    return INITIAL_BEAUTY_ITEMS;
  });

  const [activeTab, setActiveTab] = useState<'today' | 'galleries' | 'map' | 'book'>('today');
  const [selectedItem, setSelectedItem] = useState<BeautyItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Auth & Drive sync state
  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedText, setLastSyncedText] = useState('');
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // AI Curatorial states
  const [dailyReport, setDailyReport] = useState<DailyCuratorReport>({
    greeting: '日々の営みに佇む、名もなき美しさへようこそ。',
    trendObservation: '最近の収蔵品には「青」や「水」、静けさを湛えた光の記録が多く見受けられます。',
    timeCapsuleNote: '3年前に記録された記憶が、いま静かに今日のまなざしと呼応しています。',
    spotlightTheme: '青と水が織りなす静謐の回廊',
    spotlightDescription: '日常の喧騒から少し離れ、心の内側に静かな波紋を広げた光と色の標本たち。',
    curatorMessage: '世界が騒がしい日ほど、あなたの瞳が捉えた小さな透明さに救われます。',
    spotlightItemIds: ['opus-001', 'opus-002', 'opus-004'],
  });

  const [thematicRooms, setThematicRooms] = useState<ThematicRoom[]>([
    {
      id: 'room-blue-water',
      name: '青と水面の回廊',
      subtitle: '透き通る記憶と静寂の標本',
      concept: '光を透かす水や青い時間帯に宿る、清らかな余白と呼吸。',
      itemIds: ['opus-001', 'opus-002', 'opus-003', 'opus-004', 'opus-005'],
    },
    {
      id: 'room-ephemeral-light',
      name: 'はかなき光の標本室',
      subtitle: '消えゆくからこそ美しい瞬間',
      concept: '夕暮れ、薄明、二度と同じ形をとらない空と影の奇跡。',
      itemIds: ['opus-001', 'opus-003', 'opus-007'],
    },
    {
      id: 'room-quiet-solitude',
      name: '孤独と夜の静想室',
      subtitle: '自分自身へと還る穏やかな時間',
      concept: '深夜の静けさや、ひとり立ち止まることで出逢えたやわらかな言葉。',
      itemIds: ['opus-004', 'opus-005'],
    },
  ]);

  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [isCuratingRooms, setIsCuratingRooms] = useState(false);

  // Save to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [items]);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
        // Automatically sync from Google Drive upon sign-in
        syncFromDrive();
      },
      () => {
        setUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch initial AI Insights safely without bursting quota
  useEffect(() => {
    // Only refresh daily insight on initial load if needed
    const timer = setTimeout(() => {
      refreshDailyInsight();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const showToast = (msg: string) => {
    setSyncToast(msg);
    setTimeout(() => setSyncToast(null), 3500);
  };

  const syncFromDrive = async () => {
    setIsSyncing(true);
    try {
      const result = await loadMuseumFromDrive();
      if (result && result.items.length > 0) {
        // Merge or replace with Drive vault data
        setItems(result.items);
        setLastSyncedText(new Date(result.lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        showToast('Google Driveから収蔵品を読み込みました（非公開同期）');
      } else {
        // If file doesn't exist on Drive yet, push current items
        await saveMuseumToDrive(items);
        setLastSyncedText(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        showToast('Google Driveに収蔵庫を初期同期しました');
      }
    } catch (err: any) {
      console.error('Drive sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await saveMuseumToDrive(items);
      setLastSyncedText(new Date(res.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      showToast('Google Driveに最新の美を保存しました（自分専用）');
    } catch (err: any) {
      console.error('Manual drive sync error:', err);
      showToast('同期に失敗しました。再試行してください。');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        await syncFromDrive();
      }
    } catch (error: any) {
      console.error('Sign-in failed:', error);
      alert('Googleログインを完了できませんでした。');
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    showToast('ログアウトしました');
  };

  const refreshDailyInsight = async () => {
    setIsLoadingInsight(true);
    try {
      const rep = await fetchDailyInsight(items, '2026年9月28日');
      setDailyReport(rep);
    } finally {
      setIsLoadingInsight(false);
    }
  };

  const refreshThematicRooms = async () => {
    setIsCuratingRooms(true);
    try {
      const rooms = await curateRoomsWithAI(items);
      setThematicRooms(rooms);
    } finally {
      setIsCuratingRooms(false);
    }
  };

  const handleAddItem = async (newItem: BeautyItem) => {
    const updated = [newItem, ...items];
    setItems(updated);
    showToast(`収蔵品「${newItem.title}」を登録しました`);

    // If signed into Google Drive, automatically sync
    if (user) {
      try {
        await saveMuseumToDrive(updated);
        setLastSyncedText(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (e) {
        console.warn('Auto drive sync failed:', e);
      }
    }
  };

  const handleDeleteItem = async (id: string) => {
    const updated = items.filter((it) => it.id !== id);
    setItems(updated);
    showToast('収蔵品を解除しました');

    if (user) {
      try {
        await saveMuseumToDrive(updated);
        setLastSyncedText(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (e) {
        console.warn('Drive update after delete failed:', e);
      }
    }
  };

  const handleToggleFavorite = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, isFavorite: !it.isFavorite } : it))
    );
  };

  const nextCatalogNumber = `OPUS-${String(items.length + 1).padStart(3, '0')}`;

  return (
    <div className="min-h-screen bg-[#0c0d10] text-[#ede9e1] flex flex-col font-serif-jp selection:bg-[#cbb382]/30 selection:text-[#f8f5ee]">
      {/* Toast Notification */}
      {syncToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161724] border border-[#cbb382] text-xs font-serif-jp px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 text-[#f5f2eb] animate-fadeIn">
          <span className="text-[#cbb382]">✦</span>
          <span>{syncToast}</span>
        </div>
      )}

      {/* Museum Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isSyncing={isSyncing}
        onSyncDrive={handleManualSync}
        lastSyncedText={lastSyncedText}
      />

      {/* Main Exhibition Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-24 md:pb-12">
        {activeTab === 'today' && (
          <TodayCuratedView
            items={items}
            report={dailyReport}
            onSelectItem={setSelectedItem}
            onRefreshInsight={refreshDailyInsight}
            isLoadingInsight={isLoadingInsight}
            onGoToGalleries={() => setActiveTab('galleries')}
            onGoToBook={() => setActiveTab('book')}
          />
        )}

        {activeTab === 'galleries' && (
          <ExhibitionGalleries
            items={items}
            thematicRooms={thematicRooms}
            onSelectItem={setSelectedItem}
            onRefreshCuratedRooms={refreshThematicRooms}
            isCuratingRooms={isCuratingRooms}
          />
        )}

        {activeTab === 'map' && (
          <MuseumMapView items={items} onSelectItem={setSelectedItem} />
        )}

        {activeTab === 'book' && (
          <DigitalBookView items={items} onSelectItem={setSelectedItem} />
        )}
      </main>

      {/* Add New Beauty Item Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddItem}
        nextCatalogNumber={nextCatalogNumber}
      />

      {/* Inspect Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDeleteItem}
      />

      {/* Museum Footer */}
      <footer className="border-t border-[#1c1d26] py-8 text-center text-xs text-zinc-500 font-serif-jp space-y-2 mt-auto">
        <div className="flex items-center justify-center space-x-2">
          <span className="font-display tracking-widest text-[#cbb382]">
            MUSÉE DE LA BEAUTÉ ÉPHÉMÈRE
          </span>
        </div>
        <p className="text-[11px] text-zinc-600">
          今日見つけた美しいものを保存する美術館 — あなたの眼差しが世界を輝かせる。
        </p>
      </footer>
    </div>
  );
}
