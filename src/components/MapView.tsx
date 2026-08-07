import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Compass, Navigation, Maximize2, Layers, CheckCircle2, AlertTriangle, XCircle, Sparkles, Filter, X } from 'lucide-react';
import { useState, useMemo, FormEvent, useEffect, useCallback, useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents, ZoomControl, Circle } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';

// High Resolution Marker Icons
const createDefaultIcon = () => L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 28px; height: 28px; background: rgba(16, 185, 129, 0.25); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 18px; height: 18px; background: #10b981; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.5), 0 0 12px rgba(16,185,129,0.8); display: flex; align-items: center; justify-content: center;">
        <div style="width: 5px; height: 5px; background: #ffffff; border-radius: 50%;"></div>
      </div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
});

const createUserIcon = () => L.divIcon({
  className: 'user-location-icon',
  html: `
    <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 32px; height: 32px; background: rgba(59, 130, 246, 0.3); border-radius: 50%; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 20px; height: 20px; background: #3b82f6; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.6), 0 0 16px rgba(59,130,246,0.9); display: flex; align-items: center; justify-content: center;">
        <div style="width: 6px; height: 6px; background: #ffffff; border-radius: 50%;"></div>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

export interface PlantMarker {
  id: string;
  lat: number;
  lng: number;
  name: string;
  variety: string;
  family?: string;
  domain?: string;
  density?: string;
  healthStatus?: string;
  fullData?: any;
}

interface MapViewProps {
  markers: PlantMarker[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (marker: PlantMarker) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

// Controller component for smooth animated map panning
function MapController({ center, zoom, bounds }: { center?: [number, number], zoom?: number, bounds?: L.LatLngBoundsExpression }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true, duration: 1 });
    } else if (center) {
      map.flyTo(center, zoom || map.getZoom(), {
        duration: 1.2,
        easeLinearity: 0.25
      });
    }
  }, [center, zoom, bounds, map]);

  return null;
}

// Handler for map clicks
function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function MapView({ 
  markers, 
  center = [31.7917, -7.0926], // Default center Morocco agricultural zone
  zoom = 6, 
  onMapClick, 
  onMarkerClick 
}: MapViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const [mapZoom, setMapZoom] = useState<number>(zoom);
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState<L.LatLngBoundsExpression | undefined>();
  const [overlayType, setOverlayType] = useState<'none' | 'health' | 'density'>('none');
  const [isSearching, setIsSearching] = useState(false);
  const [mapType, setMapType] = useState<'satellite-4k' | 'plan-hd' | 'dark-hd' | 'esri-hd'>('satellite-4k');
  const [showLayersModal, setShowLayersModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Filter state
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedCulture, setSelectedCulture] = useState<string>('');
  const [selectedFamily, setSelectedFamily] = useState<string>('');
  
  // User Geolocation state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Memoized lists for filters
  const regionsList = useMemo(() => {
    const set = new Set<string>();
    markers.forEach(m => {
      if (m.fullData?.region) set.add(m.fullData.region);
      if (m.fullData?.wilaya) set.add(m.fullData.wilaya);
    });
    const defaults = ["Souss-Massa", "Gharb-Chrarda-Beni Hssen", "Marrakech-Safi", "Fès-Meknès", "Oriental", "Dakhla-Oued Ed-Dahab", "Tanger-Tétouan-Al Hoceïma", "Tadla-Azilal"];
    defaults.forEach(r => set.add(r));
    return Array.from(set);
  }, [markers]);

  const domainsList = useMemo(() => {
    const set = new Set<string>();
    markers.forEach(m => {
      if (m.domain) set.add(m.domain);
    });
    return Array.from(set);
  }, [markers]);

  const culturesList = useMemo(() => {
    const set = new Set<string>();
    markers.forEach(m => {
      if (m.name) set.add(m.name);
      if (m.variety) set.add(m.variety);
    });
    return Array.from(set);
  }, [markers]);

  const familiesList = useMemo(() => {
    const set = new Set<string>();
    markers.forEach(m => {
      if (m.family) set.add(m.family);
    });
    return Array.from(set);
  }, [markers]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedPeriod) count++;
    if (selectedRegion) count++;
    if (selectedDomain) count++;
    if (selectedCulture) count++;
    if (selectedFamily) count++;
    return count;
  }, [selectedPeriod, selectedRegion, selectedDomain, selectedCulture, selectedFamily]);

  const handleResetFilters = () => {
    setSelectedPeriod('');
    setSelectedRegion('');
    setSelectedDomain('');
    setSelectedCulture('');
    setSelectedFamily('');
  };

  // Initialize bounds on load
  useEffect(() => {
    if (markers.length > 0 && mapCenter[0] === center[0] && mapCenter[1] === center[1]) {
      const validMarkers = markers.filter(m => typeof m.lat === 'number' && typeof m.lng === 'number');
      if (validMarkers.length > 0) {
        const bounds = L.latLngBounds(validMarkers.map(m => [m.lat, m.lng]));
        setFitBoundsTrigger(bounds);
      }
    }
  }, [markers]);

  // Handle high precision user geolocation
  const handleLocateUser = useCallback(async () => {
    setIsLocating(true);
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { Geolocation } = await import('@capacitor/geolocation');
        let check = await Geolocation.checkPermissions();
        if (check.location !== 'granted') {
          check = await Geolocation.requestPermissions();
        }
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 12000 });
        const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy || 20 };
        setUserLocation(newLoc);
        setMapCenter([newLoc.lat, newLoc.lng]);
        setMapZoom(16);
      } else {
        if (!navigator.geolocation) throw new Error("Géolocalisation non disponible");
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy || 20 };
            setUserLocation(newLoc);
            setMapCenter([newLoc.lat, newLoc.lng]);
            setMapZoom(16);
            setIsLocating(false);
          },
          (err) => {
            console.warn("Geolocation warning:", err);
            setIsLocating(false);
          },
          { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
        );
      }
    } catch (e) {
      console.warn("User location error:", e);
    } finally {
      setIsLocating(false);
    }
  }, []);

  // Filter markers
  const filteredMarkers = useMemo(() => {
    return markers.filter(m => {
      if (typeof m.lat !== 'number' || typeof m.lng !== 'number') return false;
      
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        m.name.toLowerCase().includes(q) || 
        m.variety.toLowerCase().includes(q) ||
        (m.domain && m.domain.toLowerCase().includes(q)) ||
        (m.family && m.family.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (selectedRegion) {
        const reg = (m.fullData?.region || m.fullData?.wilaya || '').toLowerCase();
        if (reg && !reg.includes(selectedRegion.toLowerCase())) return false;
      }

      if (selectedDomain && m.domain !== selectedDomain) return false;
      if (selectedCulture && m.name !== selectedCulture && m.variety !== selectedCulture) return false;
      if (selectedFamily && m.family !== selectedFamily) return false;

      return true;
    });
  }, [markers, searchQuery, selectedRegion, selectedDomain, selectedCulture, selectedFamily]);

  // Search execution (Nominatim + local fallback)
  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setMapCenter([lat, lon]);
          setMapZoom(14);
          setIsSearching(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Geocoding fetch warning:", err);
    }

    // Local marker fallback
    if (filteredMarkers.length > 0) {
      const first = filteredMarkers[0];
      setMapCenter([first.lat, first.lng]);
      setMapZoom(15);
    }
    setIsSearching(false);
  };

  // Recalibrate / Fit all bounds
  const handleRecalibrate = () => {
    if (filteredMarkers.length > 0) {
      const bounds = L.latLngBounds(filteredMarkers.map(m => [m.lat, m.lng]));
      setFitBoundsTrigger(bounds);
    } else if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      setFitBoundsTrigger(bounds);
    }
  };

  // Color generator for custom indicators
  const getMarkerColor = (marker: PlantMarker) => {
    if (overlayType === 'health') {
      const status = (marker.healthStatus || '').toLowerCase();
      if (status.includes('excellent') || status.includes('bonne') || status.includes('sain')) return '#10b981'; // Green
      if (status.includes('moyen') || status.includes('stress') || status.includes('modéré')) return '#f59e0b'; // Amber
      if (status.includes('mauvais') || status.includes('malade') || status.includes('critique')) return '#ef4444'; // Red
      return '#3b82f6'; // Blue
    }
    if (overlayType === 'density') {
      const density = parseFloat(marker.density || '0');
      if (density > 5) return '#8b5cf6'; // Violet high
      if (density > 2) return '#a78bfa'; // Violet medium
      return '#c4b5fd'; // Violet light
    }
    return '#10b981';
  };

  const createCustomIcon = (color: string) => {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
          <div style="width: 16px; height: 16px; background-color: ${color}; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.6), 0 0 10px ${color};"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12]
    });
  };

  // Custom cluster group icon builder
  const createClusterCustomIcon = (cluster: any) => {
    const count = cluster.getChildCount();
    let size = 36;
    if (count > 50) size = 46;
    else if (count > 15) size = 40;

    return L.divIcon({
      html: `<div class="custom-map-cluster" style="width: ${size}px; height: ${size}px; font-size: ${size > 40 ? 14 : 12}px;">${count}</div>`,
      className: 'custom-cluster-wrapper',
      iconSize: L.point(size, size, true)
    });
  };

  return (
    <div className="h-full w-full relative flex flex-col bg-[#0b0f0c]">
      {/* Top Floating Glass Control Bar */}
      <div 
        className="absolute top-3 right-3 z-[1000] flex items-center gap-2 pointer-events-auto"
        onTouchStart={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Filter Modal Trigger Button */}
        <button
          type="button"
          onClick={() => setShowFilterModal(true)}
          className={`p-2.5 bg-[#121814]/95 backdrop-blur-xl hover:bg-emerald-500/20 active:scale-95 rounded-2xl border shadow-2xl flex items-center gap-1.5 text-xs font-bold transition-all shrink-0 light-mode-map-btn ${
            activeFiltersCount > 0 
              ? 'text-emerald-300 border-emerald-500/50 bg-emerald-500/20 ring-2 ring-emerald-500/30 light-mode-map-btn-active' 
              : 'text-slate-200 border-white/10 hover:text-emerald-400'
          }`}
          title="Filtres de la carte"
        >
          <Filter size={18} className={activeFiltersCount > 0 ? "text-emerald-400 fill-emerald-400/20 map-control-icon" : "text-emerald-400 map-control-icon"} />
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Layer Picker Button */}
        <button
          type="button"
          onClick={() => setShowLayersModal(true)}
          className="p-2.5 bg-[#121814]/95 backdrop-blur-xl hover:bg-emerald-500/20 active:scale-95 text-emerald-400 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-1.5 text-xs font-bold transition-all shrink-0 light-mode-map-btn"
          title="Fonds de carte"
        >
          <Layers size={18} className="map-control-icon" />
        </button>

        {/* Marker Counter Pill */}
        <div className="px-3 py-2.5 bg-[#121814]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl flex items-center gap-1.5 text-xs font-semibold text-emerald-400 shrink-0 light-mode-map-btn">
          <MapPin size={14} className="text-emerald-400 map-control-icon" />
          <span className="map-control-text">{filteredMarkers.length}</span>
        </div>
      </div>

      {/* Main Ultra HD Map Container */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          style={{ height: '100%', width: '100%' }} 
          zoomControl={false}
          preferCanvas={true} // High efficiency HTML5 Canvas rendering for max FPS speed
          keepBuffer={2}       // Optimized tile buffer to load tiles fast without network congestion
          updateWhenIdle={true} // Wait for pan pauses before requesting extra tiles
          updateWhenZooming={false}
          maxZoom={22}
        >
          <ZoomControl position="bottomright" />
          <MapController center={mapCenter} zoom={mapZoom} bounds={fitBoundsTrigger} />
          <MapClickHandler onMapClick={onMapClick} />

          {/* Optimized Fast Tile Layer Providers */}
          {mapType === 'satellite-4k' && (
            <TileLayer
              attribution='&copy; Google Maps Satellite'
              url="https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
              tileSize={256}
              zoomOffset={0}
              maxNativeZoom={20}
              maxZoom={22}
            />
          )}

          {mapType === 'plan-hd' && (
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a> Voyager HD'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              subdomains={['a', 'b', 'c', 'd']}
              maxNativeZoom={19}
              maxZoom={22}
            />
          )}

          {mapType === 'dark-hd' && (
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a> Dark Matter HD'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains={['a', 'b', 'c', 'd']}
              maxNativeZoom={19}
              maxZoom={22}
            />
          )}

          {mapType === 'esri-hd' && (
            <TileLayer
              attribution='&copy; Esri World Imagery HD'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxNativeZoom={19}
              maxZoom={22}
            />
          )}

          {/* User Location GPS Marker */}
          {userLocation && (
            <>
              <Marker position={[userLocation.lat, userLocation.lng]} icon={createUserIcon()}>
                <Popup>
                  <div className="p-2 text-center">
                    <p className="font-bold text-blue-400 text-xs flex items-center justify-center gap-1">
                      <Navigation size={12} className="animate-pulse" /> Vous êtes ici
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Précision: ~{Math.round(userLocation.accuracy)}m</p>
                  </div>
                </Popup>
              </Marker>
              <Circle 
                center={[userLocation.lat, userLocation.lng]} 
                radius={userLocation.accuracy} 
                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 1.5, dashArray: '4, 4' }}
              />
            </>
          )}

          {/* Marker Cluster Group */}
          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterCustomIcon}
            maxClusterRadius={45}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
          >
            {filteredMarkers.map((marker) => {
              const icon = overlayType === 'none' 
                ? createDefaultIcon() 
                : createCustomIcon(getMarkerColor(marker));

              const imgUrl = marker.fullData?.imageUrl || marker.fullData?.image || marker.fullData?.photoUrl;

              return (
                <Marker 
                  key={marker.id} 
                  position={[marker.lat, marker.lng]}
                  icon={icon}
                  eventHandlers={{
                    click: () => {
                      if (onMarkerClick) onMarkerClick(marker);
                    }
                  }}
                >
                  <Popup>
                    <div className="w-56 overflow-hidden">
                      {imgUrl && (
                        <div className="h-28 w-full relative overflow-hidden rounded-t-xl bg-slate-900 -mx-[14px] -mt-[12px] mb-2 border-b border-white/10">
                          <img 
                            src={imgUrl} 
                            alt={marker.name} 
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#121814] via-transparent to-transparent"></div>
                          {marker.family && (
                            <span className="absolute bottom-1.5 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-md text-[9px] font-bold text-emerald-300 border border-white/10">
                              {marker.family}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="font-bold text-emerald-400 text-sm leading-tight">{marker.name}</h3>
                        </div>

                        <p className="text-[11px] text-slate-300 font-medium italic">{marker.variety}</p>

                        <div className="pt-2 border-t border-white/10 space-y-1">
                          {marker.domain && (
                            <p className="text-[10px] text-slate-300 flex items-center gap-1.5">
                              <MapPin size={11} className="text-emerald-400 shrink-0" />
                              <span className="truncate">{marker.domain}</span>
                            </p>
                          )}

                          {marker.healthStatus && (
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getMarkerColor(marker) }}></span>
                              <span className="text-slate-400">Santé:</span>
                              <span className="font-bold text-slate-200">{marker.healthStatus}</span>
                            </div>
                          )}

                          {marker.density && (
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <Sparkles size={11} className="text-violet-400 shrink-0" />
                              <span className="text-slate-400">Densité:</span>
                              <span className="font-bold text-slate-200">{marker.density}</span>
                            </div>
                          )}
                        </div>

                        {onMarkerClick && (
                          <button
                            onClick={() => onMarkerClick(marker)}
                            className="w-full mt-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[10px] uppercase tracking-wider rounded-lg border border-emerald-500/30 transition-all flex items-center justify-center gap-1 shadow-md"
                          >
                            Examiner en détail
                          </button>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        </MapContainer>

        {/* Map Filter Modal */}
        {showFilterModal && (
          <div 
            className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
            onClick={() => setShowFilterModal(false)}
          >
            <div 
              className="w-full sm:max-w-md bg-[#121814] map-modal-card border border-white/15 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 animate-in slide-in-from-bottom-5 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 map-modal-header">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl map-control-icon">
                    <Filter size={20} strokeWidth={2.2} />
                  </div>
                  <h3 className="font-bold text-lg text-white map-modal-title tracking-tight">Filtres de la carte</h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowFilterModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer map-modal-subtitle"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Form Fields */}
              <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh] bg-[#121814] map-modal-body">
                {/* PÉRIODE */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-slate-400 map-modal-label uppercase tracking-wider">
                    PÉRIODE
                  </label>
                  <div className="relative">
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="w-full bg-[#1a231d] map-modal-select border border-white/10 hover:border-emerald-500/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl px-4 py-3 text-slate-200 text-sm font-semibold appearance-none transition-all outline-none cursor-pointer pr-10"
                    >
                      <option value="" className="bg-[#121814] text-slate-100">Toute période</option>
                      <option value="today" className="bg-[#121814] text-slate-100">Aujourd'hui</option>
                      <option value="7d" className="bg-[#121814] text-slate-100">7 derniers jours</option>
                      <option value="30d" className="bg-[#121814] text-slate-100">30 derniers jours</option>
                      <option value="3m" className="bg-[#121814] text-slate-100">3 derniers mois</option>
                      <option value="year" className="bg-[#121814] text-slate-100">Cette année</option>
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 map-modal-subtitle">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* RÉGION */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-slate-400 map-modal-label uppercase tracking-wider">
                    RÉGION
                  </label>
                  <div className="relative">
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className="w-full bg-[#1a231d] map-modal-select border border-white/10 hover:border-emerald-500/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl px-4 py-3 text-slate-200 text-sm font-semibold appearance-none transition-all outline-none cursor-pointer pr-10"
                    >
                      <option value="" className="bg-[#121814] text-slate-100">Toutes les régions</option>
                      {regionsList.map(r => (
                        <option key={r} value={r} className="bg-[#121814] text-slate-100">{r}</option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 map-modal-subtitle">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* DOMAINE */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-slate-400 map-modal-label uppercase tracking-wider">
                    DOMAINE
                  </label>
                  <div className="relative">
                    <select
                      value={selectedDomain}
                      onChange={(e) => setSelectedDomain(e.target.value)}
                      className="w-full bg-[#1a231d] map-modal-select border border-white/10 hover:border-emerald-500/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl px-4 py-3 text-slate-200 text-sm font-semibold appearance-none transition-all outline-none cursor-pointer pr-10"
                    >
                      <option value="" className="bg-[#121814] text-slate-100">Tous les domaines</option>
                      {domainsList.map(d => (
                        <option key={d} value={d} className="bg-[#121814] text-slate-100">{d}</option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 map-modal-subtitle">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* CULTURE */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-slate-400 map-modal-label uppercase tracking-wider">
                    CULTURE
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCulture}
                      onChange={(e) => setSelectedCulture(e.target.value)}
                      className="w-full bg-[#1a231d] map-modal-select border border-white/10 hover:border-emerald-500/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl px-4 py-3 text-slate-200 text-sm font-semibold appearance-none transition-all outline-none cursor-pointer pr-10"
                    >
                      <option value="" className="bg-[#121814] text-slate-100">Toutes les cultures</option>
                      {culturesList.map(c => (
                        <option key={c} value={c} className="bg-[#121814] text-slate-100">{c}</option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 map-modal-subtitle">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* FAMILLE */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-slate-400 map-modal-label uppercase tracking-wider">
                    FAMILLE
                  </label>
                  <div className="relative">
                    <select
                      value={selectedFamily}
                      onChange={(e) => setSelectedFamily(e.target.value)}
                      className="w-full bg-[#1a231d] map-modal-select border border-white/10 hover:border-emerald-500/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl px-4 py-3 text-slate-200 text-sm font-semibold appearance-none transition-all outline-none cursor-pointer pr-10"
                    >
                      <option value="" className="bg-[#121814] text-slate-100">Toutes les familles</option>
                      {familiesList.map(f => (
                        <option key={f} value={f} className="bg-[#121814] text-slate-100">{f}</option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 map-modal-subtitle">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Action Buttons */}
              <div className="px-6 py-4 border-t border-white/10 bg-[#121814] map-modal-footer flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-5 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-sm rounded-2xl transition-all cursor-pointer map-modal-reset-btn"
                >
                  Réinitialiser
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilterModal(false)}
                  className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-2xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer text-center uppercase tracking-wider map-modal-[#2d6a4f]-btn"
                >
                  Voir la carte
                </button>
              </div>
            </div>
          </div>
        )}
        {showLayersModal && (
          <div 
            className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
            onClick={() => setShowLayersModal(false)}
          >
            <div 
              className="w-full sm:max-w-md bg-[#121814] map-modal-card border border-white/15 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 animate-in slide-in-from-bottom-5 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 map-modal-header">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl map-control-icon">
                    <Layers size={20} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white map-modal-title tracking-tight">Type de Fond de Carte</h3>
                    <p className="text-xs text-slate-400 map-modal-subtitle font-medium">Sélectionnez la résolution d'affichage idéale</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowLayersModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer map-modal-subtitle"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Layer Options Grid */}
              <div className="p-6 grid grid-cols-2 gap-3 bg-[#121814] map-modal-body">
                {/* Satellite 4K */}
                <button
                  type="button"
                  onClick={() => {
                    setMapType('satellite-4k');
                    setShowLayersModal(false);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-3 min-h-[95px] cursor-pointer map-modal-layer-btn ${
                    mapType === 'satellite-4k' 
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/20 map-modal-layer-btn-active' 
                      : 'bg-[#1a231d] border-white/10 hover:border-white/25 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-2xl">🛰️</span>
                    {mapType === 'satellite-4k' && <CheckCircle2 size={18} className="text-emerald-400 map-control-icon" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white map-modal-layer-title">Satellite 4K</h4>
                    <p className="text-[10px] text-slate-400 map-modal-layer-desc mt-0.5 font-medium">Google Hybrid Haute Résolution</p>
                  </div>
                </button>

                {/* Esri Aérien HD */}
                <button
                  type="button"
                  onClick={() => {
                    setMapType('esri-hd');
                    setShowLayersModal(false);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-3 min-h-[95px] cursor-pointer map-modal-layer-btn ${
                    mapType === 'esri-hd' 
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/20 map-modal-layer-btn-active' 
                      : 'bg-[#1a231d] border-white/10 hover:border-white/25 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-2xl">🌍</span>
                    {mapType === 'esri-hd' && <CheckCircle2 size={18} className="text-emerald-400 map-control-icon" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white map-modal-layer-title">Esri Aérien HD</h4>
                    <p className="text-[10px] text-slate-400 map-modal-layer-desc mt-0.5 font-medium">Imagerie Mondiale Ultra Claire</p>
                  </div>
                </button>

                {/* Plan HD */}
                <button
                  type="button"
                  onClick={() => {
                    setMapType('plan-hd');
                    setShowLayersModal(false);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-3 min-h-[95px] cursor-pointer map-modal-layer-btn ${
                    mapType === 'plan-hd' 
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/20 map-modal-layer-btn-active' 
                      : 'bg-[#1a231d] border-white/10 hover:border-white/25 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-2xl">🗺️</span>
                    {mapType === 'plan-hd' && <CheckCircle2 size={18} className="text-emerald-400 map-control-icon" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white map-modal-layer-title">Plan HD</h4>
                    <p className="text-[10px] text-slate-400 map-modal-layer-desc mt-0.5 font-medium">Cartographie Routière Voyager</p>
                  </div>
                </button>

                {/* Sombre HD */}
                <button
                  type="button"
                  onClick={() => {
                    setMapType('dark-hd');
                    setShowLayersModal(false);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-3 min-h-[95px] cursor-pointer map-modal-layer-btn ${
                    mapType === 'dark-hd' 
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/20 map-modal-layer-btn-active' 
                      : 'bg-[#1a231d] border-white/10 hover:border-white/25 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-2xl">🌙</span>
                    {mapType === 'dark-hd' && <CheckCircle2 size={18} className="text-emerald-400 map-control-icon" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white map-modal-layer-title">Sombre HD</h4>
                    <p className="text-[10px] text-slate-400 map-modal-layer-desc mt-0.5 font-medium">Contraste élevé pour la nuit</p>
                  </div>
                </button>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/10 bg-[#121814] map-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowLayersModal(false)}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-2xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer text-center uppercase tracking-wider map-modal-[#2d6a4f]-btn"
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Overlay Color Legend (Bottom Left) */}
        {overlayType !== 'none' && (
          <div className="absolute bottom-6 left-3 bg-[#121814]/95 backdrop-blur-xl p-2.5 rounded-2xl shadow-2xl border border-white/10 z-[1000] text-[9px] font-bold uppercase tracking-wider space-y-1.5 min-w-[130px] pointer-events-auto light-mode-map-btn">
            <p className="text-slate-400 text-[8px] border-b border-white/10 pb-1 flex items-center justify-between map-control-text">
              <span>Légende {overlayType === 'health' ? 'Santé' : 'Densité'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </p>
            {overlayType === 'health' ? (
              <div className="space-y-1 pt-0.5">
                <div className="flex items-center gap-2 text-slate-200 map-control-text"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span> Sain / Excellent</div>
                <div className="flex items-center gap-2 text-slate-200 map-control-text"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span> Stress / Modéré</div>
                <div className="flex items-center gap-2 text-slate-200 map-control-text"><span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></span> Malade / Risque</div>
              </div>
            ) : (
              <div className="space-y-1 pt-0.5">
                <div className="flex items-center gap-2 text-slate-200 map-control-text"><span className="w-2.5 h-2.5 rounded-full bg-violet-600 shadow-sm shadow-violet-600/50"></span> Élevée ({'>'}5)</div>
                <div className="flex items-center gap-2 text-slate-200 map-control-text"><span className="w-2.5 h-2.5 rounded-full bg-violet-400 shadow-sm shadow-violet-400/50"></span> Moyenne ({'>'}2)</div>
                <div className="flex items-center gap-2 text-slate-200 map-control-text"><span className="w-2.5 h-2.5 rounded-full bg-violet-300 shadow-sm shadow-violet-300/50"></span> Faible</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
