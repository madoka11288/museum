import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Sparkles, Navigation, Calendar, Plus } from 'lucide-react';
import { BeautyItem } from '../types/museum';

interface MuseumMapViewProps {
  items: BeautyItem[];
  onSelectItem: (item: BeautyItem) => void;
  onOpenAddModalWithCoords?: (lat: number, lng: number, placeName?: string) => void;
}

export const MuseumMapView: React.FC<MuseumMapViewProps> = ({
  items,
  onSelectItem,
  onOpenAddModalWithCoords,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [selectedMapItem, setSelectedMapItem] = useState<BeautyItem | null>(null);

  // Items with location
  const geoItems = items.filter((it) => it.location && it.location.lat && it.location.lng);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Create map centered on Japan / Global view
    const initialLat = geoItems[0]?.location?.lat || 35.3054;
    const initialLng = geoItems[0]?.location?.lng || 139.5167;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 6,
      zoomControl: true,
    });

    // OpenStreetMap tile layer (no API key required, styled dark via CSS filter)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers whenever geoItems changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // Custom Golden Leaflet pin icon
    const createCustomIcon = (item: BeautyItem) => {
      const isImage = item.type === 'image';
      return L.divIcon({
        className: 'custom-museum-pin',
        html: `
          <div style="
            position: relative;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #141520;
            border: 2px solid #cbb382;
            box-shadow: 0 0 15px rgba(203, 179, 130, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            overflow: hidden;
            transition: transform 0.2s ease;
          ">
            ${
              isImage
                ? `<img src="${item.content}" style="width: 100%; height: 100%; object-fit: cover;" />`
                : `<span style="color: #cbb382; font-size: 13px;">✦</span>`
            }
          </div>
          <div style="
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 6px solid #cbb382;
          "></div>
        `,
        iconSize: [36, 42],
        iconAnchor: [18, 42],
        popupAnchor: [0, -42],
      });
    };

    geoItems.forEach((item) => {
      if (!item.location) return;
      const marker = L.marker([item.location.lat, item.location.lng], {
        icon: createCustomIcon(item),
      });

      marker.on('click', () => {
        setSelectedMapItem(item);
      });

      markersGroup.addLayer(marker);
    });

    if (geoItems.length > 0) {
      const bounds = L.latLngBounds(geoItems.map((it) => [it.location!.lat, it.location!.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [items]);

  const zoomToItem = (item: BeautyItem) => {
    if (!item.location || !mapInstanceRef.current) return;
    setSelectedMapItem(item);
    mapInstanceRef.current.flyTo([item.location.lat, item.location.lng], 13, { duration: 1.2 });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Map Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-[#232532]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-display text-[#cbb382] uppercase tracking-[0.2em] mb-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>Atlas of Encounters</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif-jp text-[#f5f2eb] font-medium tracking-wide">
            美の標本地図（散策の軌跡）
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-serif-jp mt-1">
            あなたが息を呑んだ地点の座標。日常の散歩道や旅先で収集された美のピン留めマップ。
          </p>
        </div>

        <div className="text-xs font-serif-jp text-zinc-400">
          位置情報付き収蔵品: <span className="text-[#cbb382] font-medium">{geoItems.length}</span> カ所
        </div>
      </div>

      {/* Main Map + Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[640px]">
        {/* Interactive Leaflet Map */}
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden border border-[#2d2e3e] shadow-2xl bg-[#090a0d] h-[380px] sm:h-[460px] lg:h-full">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Quick Map Overlay Guide */}
          <div className="absolute top-4 left-4 z-[400] bg-[#12131b]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#2d2e3e] text-[11px] font-serif-jp text-zinc-300 pointer-events-none flex items-center space-x-2">
            <Navigation className="w-3.5 h-3.5 text-[#cbb382]" />
            <span>ピンをクリックしてその場所の美を鑑賞</span>
          </div>

          {/* Selected Item Floating Bottom Card */}
          {selectedMapItem && (
            <div className="absolute bottom-4 left-4 right-4 z-[400] bg-[#141520]/95 backdrop-blur-md p-4 rounded-2xl border border-[#cbb382]/40 shadow-2xl flex items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-center space-x-3 overflow-hidden">
                {selectedMapItem.type === 'image' ? (
                  <img
                    src={selectedMapItem.content}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#cbb382]/30"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-[#202234] flex items-center justify-center text-[#cbb382] shrink-0 font-serif-jp text-xs">
                    言葉
                  </div>
                )}
                <div className="overflow-hidden space-y-1">
                  <div className="flex items-center space-x-2 text-[10px] text-zinc-400 font-serif-jp">
                    <span className="text-[#cbb382] font-display">{selectedMapItem.catalogNumber}</span>
                    <span>• {selectedMapItem.location?.name}</span>
                  </div>
                  <h4 className="text-sm font-serif-jp text-[#f5f2eb] font-medium truncate">
                    {selectedMapItem.title}
                  </h4>
                  <p className="text-xs font-serif-jp text-[#dedad2] italic truncate">
                    「{selectedMapItem.whyBeautiful}」
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => onSelectItem(selectedMapItem)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#cbb382] text-[#0e0f14] text-xs font-serif-jp font-medium hover:bg-[#d9c497] transition-colors cursor-pointer"
                >
                  鑑賞する
                </button>
                <button
                  onClick={() => setSelectedMapItem(null)}
                  className="text-zinc-500 hover:text-zinc-300 text-xs px-2"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Location list */}
        <div className="bg-[#12131b] border border-[#262838] rounded-2xl p-4 flex flex-col justify-between overflow-hidden">
          <div className="space-y-3 overflow-y-auto pr-1 flex-1">
            <h3 className="text-xs font-serif-jp text-zinc-300 font-medium pb-2 border-b border-zinc-800 flex items-center justify-between">
              <span>ピン留めされた地点一覧</span>
              <span className="text-[10px] text-zinc-500">クリックで地図移動</span>
            </h3>

            <div className="space-y-2">
              {geoItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => zoomToItem(item)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center space-x-3 ${
                    selectedMapItem?.id === item.id
                      ? 'border-[#cbb382] bg-[#1a1b26]'
                      : 'border-[#222432] bg-[#151622] hover:border-zinc-700 hover:bg-[#181926]'
                  }`}
                >
                  {item.type === 'image' ? (
                    <img
                      src={item.content}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#222435] flex items-center justify-center text-xs text-[#cbb382] shrink-0">
                      ✦
                    </div>
                  )}

                  <div className="overflow-hidden flex-1">
                    <div className="flex items-center space-x-1 text-[10px] text-zinc-400 font-serif-jp">
                      <MapPin className="w-3 h-3 text-[#cbb382]" />
                      <span className="truncate">{item.location?.name}</span>
                    </div>
                    <div className="text-xs font-serif-jp text-zinc-200 font-medium truncate">
                      {item.title}
                    </div>
                  </div>
                </div>
              ))}

              {geoItems.length === 0 && (
                <div className="text-center py-12 text-zinc-500 font-serif-jp text-xs">
                  まだ地図上にピン留めされた標本はありません。収蔵時に場所を追加できます。
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
