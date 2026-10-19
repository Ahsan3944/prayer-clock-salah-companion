import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Compass,
  Crosshair,
  MapPin,
  RotateCw,
  Sparkles,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  calculateDistanceToKaaba,
  calculateQiblaBearing,
  getCardinalDirection,
} from '../../services/qibla';

interface QiblaCompassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QiblaCompassModal: React.FC<QiblaCompassModalProps> = ({ isOpen, onClose }) => {
  const { activeLocation, setActiveLocation, prayerSettings } = useApp();

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: activeLocation.latitude,
    lng: activeLocation.longitude,
  });
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Compass heading state
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [hasOrientationSupport, setHasOrientationSupport] = useState<boolean>(false);
  const [permissionRequested, setPermissionRequested] = useState<boolean>(false);
  const [manualHeadingOffset, setManualHeadingOffset] = useState<number>(0);

  // Sync coords when active location changes
  useEffect(() => {
    setCoords({
      lat: activeLocation.latitude,
      lng: activeLocation.longitude,
    });
  }, [activeLocation]);

  // Request high-accuracy GPS on user action
  const fetchPreciseGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation API not supported in your browser');
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setGpsAccuracy(Math.round(accuracy));
        setIsLocating(false);

        // Update active location
        setActiveLocation({
          id: `gps_live_${latitude.toFixed(2)}_${longitude.toFixed(2)}`,
          name: 'Precise GPS Location',
          country: 'Current Position',
          latitude,
          longitude,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          isAutomatic: true,
          lastUpdated: Date.now(),
        });
      },
      (err) => {
        setIsLocating(false);
        setGpsError(err.message || 'Location permission denied');
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  // Device orientation / magnetometer listener
  useEffect(() => {
    if (!isOpen) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // iOS webkitCompassHeading provides true north heading directly
      if ((e as any).webkitCompassHeading !== undefined) {
        const heading = (e as any).webkitCompassHeading;
        setDeviceHeading(heading);
        setHasOrientationSupport(true);
      } else if (e.alpha !== null) {
        // Standard Android / Web orientation
        const heading = e.absolute ? (360 - e.alpha) % 360 : 360 - e.alpha;
        setDeviceHeading((heading + 360) % 360);
        setHasOrientationSupport(true);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [isOpen]);

  // Handle iOS 13+ permission request
  const requestIOSOrientationPermission = async () => {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        setPermissionRequested(true);
        if (response === 'granted') {
          setHasOrientationSupport(true);
        } else {
          setGpsError('Motion sensor permission was denied on iOS');
        }
      } catch (err) {
        console.warn('iOS orientation permission error', err);
      }
    }
  };

  // Calculate Qibla angle from user position
  const qiblaAngle = calculateQiblaBearing(coords.lat, coords.lng);
  const distanceKm = calculateDistanceToKaaba(coords.lat, coords.lng);
  const cardinalStr = getCardinalDirection(qiblaAngle);

  // Heading calculation: If device has orientation, use it; else fallback to manual slider
  const effectiveHeading = hasOrientationSupport ? deviceHeading : manualHeadingOffset;

  // Needle angle relative to device top (0° is straight ahead)
  const needleRotation = (qiblaAngle - effectiveHeading + 360) % 360;

  // Is aligned with Qibla (within ±4 degrees)
  const isAligned = needleRotation <= 4 || needleRotation >= 356;

  // Trigger haptic pulse when aligned
  useEffect(() => {
    if (
      isOpen &&
      isAligned &&
      prayerSettings.vibrationEnabled &&
      typeof navigator !== 'undefined' &&
      'vibrate' in navigator
    ) {
      try {
        navigator.vibrate([30, 40, 50]);
      } catch (e) {}
    }
  }, [isOpen, isAligned, prayerSettings.vibrationEnabled]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 select-none">
      <div className="w-full max-w-md max-h-[96vh] rounded-3xl bg-gradient-to-b from-slate-950 via-[#03231a] to-slate-950 border border-emerald-900/60 text-white shadow-2xl flex flex-col overflow-hidden relative">
        {/* Subtle Ambient Gold Glow at Top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-400/10 blur-3xl rounded-full pointer-events-none" />

        {/* Top Header */}
        <div className="p-4 border-b border-emerald-900/40 flex items-center justify-between shrink-0 bg-slate-950/60 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-900/40 border border-amber-400/40 text-amber-400 shadow-sm">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Qibla Direction</span>
                {isAligned && (
                  <span className="flex items-center gap-1 text-[10px] bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-amber-300 border border-amber-400/50 px-2 py-0.5 rounded-full font-semibold shadow-xs animate-pulse">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Facing Kaaba
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-emerald-300/80">
                Direction to Al-Ka'bah al-Musharrafah (Makkah)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-between gap-5 relative z-10">
          {/* Location & GPS Status Bar */}
          <div className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900/70 border border-emerald-900/50 text-xs backdrop-blur-xs">
            <div className="flex items-center gap-2 truncate">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-slate-200 block truncate">
                  {coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E
                </span>
                <span className="text-[10px] text-emerald-300/80 block truncate">
                  {activeLocation.name} {gpsAccuracy ? `(±${gpsAccuracy}m GPS accuracy)` : ''}
                </span>
              </div>
            </div>

            <button
              onClick={fetchPreciseGPS}
              disabled={isLocating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600/30 to-amber-600/30 hover:from-emerald-600/40 hover:to-amber-600/40 text-amber-300 border border-amber-400/40 font-semibold text-[11px] transition-all shrink-0 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Pinpointing...' : 'Precise GPS'}</span>
            </button>
          </div>

          {gpsError && (
            <div className="w-full text-xs text-rose-300 bg-rose-950/40 border border-rose-800/60 p-2.5 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{gpsError}</span>
            </div>
          )}

          {/* COMPASS VISUAL DIAL CONTAINER */}
          <div className="relative flex items-center justify-center my-1">
            {/* 1. Golden Aura Glow (Active when aligned) */}
            <div
              className={`absolute w-72 h-72 sm:w-80 sm:h-80 rounded-full transition-all duration-500 pointer-events-none ${
                isAligned
                  ? 'bg-gradient-to-tr from-amber-500/25 via-emerald-500/20 to-amber-300/30 blur-2xl scale-110 opacity-100'
                  : 'bg-emerald-950/20 blur-xl scale-95 opacity-40'
              }`}
            />

            {/* 2. Focused Conical Alignment Beam (Shoots upward to Kaaba when aligned) */}
            <div
              className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 w-16 h-28 pointer-events-none transition-all duration-300 ${
                isAligned
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-75'
              }`}
            >
              <div className="w-full h-full bg-gradient-to-t from-amber-400/40 via-emerald-400/30 to-transparent blur-md rounded-t-full" />
            </div>

            {/* 3. Luxury Outer Housing Bezel */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full p-2 bg-gradient-to-b from-amber-400/40 via-slate-900 to-emerald-900/60 rounded-full shadow-[0_0_35px_rgba(4,120,87,0.3)] flex items-center justify-center">
              {/* Inner metallic chamber */}
              <div className="w-full h-full rounded-full bg-gradient-to-b from-[#021811] via-[#04241a] to-slate-950 border border-amber-400/30 shadow-inner relative flex items-center justify-center overflow-hidden">
                {/* ROTATING OUTER COMPASS RING (Rotates to device heading) */}
                <div
                  className="absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-out"
                  style={{ transform: `rotate(${-effectiveHeading}deg)` }}
                >
                  {/* High-Resolution SVG Dial Markings */}
                  <svg className="w-full h-full p-2" viewBox="0 0 240 240">
                    <defs>
                      <linearGradient id="goldRing" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
                        <stop offset="50%" stopColor="#d97706" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.8" />
                      </linearGradient>
                    </defs>

                    {/* Outer Gold Boundary Circle */}
                    <circle
                      cx="120"
                      cy="120"
                      r="104"
                      fill="none"
                      stroke="url(#goldRing)"
                      strokeWidth="1.5"
                      opacity="0.7"
                    />

                    {/* Inner Decorative Dial Ring */}
                    <circle
                      cx="120"
                      cy="120"
                      r="88"
                      fill="none"
                      stroke="rgba(251, 191, 36, 0.25)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />

                    {/* 72 Degree Tick Marks (Every 5° with 30° major ticks) */}
                    {Array.from({ length: 72 }).map((_, i) => {
                      const angle = i * 5;
                      const isMajor = angle % 30 === 0;
                      const isCardinal = angle % 90 === 0;
                      return (
                        <line
                          key={angle}
                          x1="120"
                          y1={isCardinal ? '18' : isMajor ? '20' : '23'}
                          x2="120"
                          y2="28"
                          stroke={
                            isCardinal
                              ? '#fbbf24'
                              : isMajor
                              ? 'rgba(251, 191, 36, 0.7)'
                              : 'rgba(255, 255, 255, 0.2)'
                          }
                          strokeWidth={isCardinal ? '2.5' : isMajor ? '1.8' : '0.8'}
                          transform={`rotate(${angle} 120 120)`}
                        />
                      );
                    })}

                    {/* Degree Numbers around the perimeter */}
                    {[
                      { deg: 0, text: '0°' },
                      { deg: 30, text: '30' },
                      { deg: 60, text: '60' },
                      { deg: 90, text: '90' },
                      { deg: 120, text: '120' },
                      { deg: 150, text: '150' },
                      { deg: 180, text: '180' },
                      { deg: 210, text: '210' },
                      { deg: 240, text: '240' },
                      { deg: 270, text: '270' },
                      { deg: 300, text: '300' },
                      { deg: 330, text: '330' },
                    ].map(({ deg, text }) => (
                      <text
                        key={deg}
                        x="120"
                        y="38"
                        textAnchor="middle"
                        fontSize="7"
                        fontFamily="monospace"
                        fontWeight="600"
                        fill="rgba(251, 191, 36, 0.65)"
                        transform={`rotate(${deg} 120 120)`}
                      >
                        {text}
                      </text>
                    ))}
                  </svg>

                  {/* Cardinal Points */}
                  <div className="absolute top-4 font-bold text-rose-500 text-sm font-mono tracking-wider drop-shadow-sm">
                    N
                  </div>
                  <div className="absolute right-5 font-bold text-amber-300 text-xs font-mono">
                    E
                  </div>
                  <div className="absolute bottom-4 font-bold text-amber-300 text-xs font-mono">
                    S
                  </div>
                  <div className="absolute left-5 font-bold text-amber-300 text-xs font-mono">
                    W
                  </div>
                </div>

                {/* ROTATING KAABA NEEDLE POINTER (Points toward Kaaba) */}
                <div
                  className="absolute inset-0 flex items-center justify-center transition-transform duration-150 ease-out pointer-events-none"
                  style={{ transform: `rotate(${needleRotation}deg)` }}
                >
                  <div className="relative w-full h-full flex flex-col items-center justify-start pt-5">
                    {/* Crowned Kaaba Emblem at pointer tip */}
                    <div className="flex flex-col items-center group">
                      <div
                        className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all duration-300 shadow-lg ${
                          isAligned
                            ? 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 border-white text-slate-950 scale-110 shadow-amber-500/60 animate-bounce'
                            : 'bg-gradient-to-br from-[#064e3b] to-slate-950 border-amber-400/80 text-amber-300 shadow-emerald-950/60'
                        }`}
                      >
                        {/* Authentic Kaaba Cube Graphic */}
                        <div className="relative w-4.5 h-4.5 bg-slate-950 rounded-xs border border-amber-300 flex flex-col justify-between p-0.5 overflow-hidden">
                          {/* Golden Kiswah Band */}
                          <div className="w-full h-1 bg-amber-400 rounded-2xs" />
                          {/* Kaaba Golden Door mark */}
                          <div className="w-1.5 h-2 bg-amber-400 self-end rounded-t-2xs" />
                        </div>
                      </div>

                      {/* Directional Arrowhead */}
                      <div
                        className={`w-0 h-0 border-x-7 border-x-transparent border-b-11 -mt-0.5 transition-colors ${
                          isAligned ? 'border-b-amber-300' : 'border-b-amber-400'
                        }`}
                      />
                    </div>

                    {/* Dual-Tapered Needle Spine */}
                    <div
                      className={`w-1.5 h-20 rounded-full transition-all duration-300 shadow-sm ${
                        isAligned
                          ? 'bg-gradient-to-b from-amber-300 via-amber-400 to-transparent shadow-amber-400/50'
                          : 'bg-gradient-to-b from-amber-400/90 via-emerald-500/60 to-transparent'
                      }`}
                    />
                  </div>

                  {/* Central Jewel Hub */}
                  <div className="absolute w-7 h-7 rounded-full bg-slate-950 border-2 border-amber-400 shadow-lg flex items-center justify-center">
                    <div
                      className={`w-2.5 h-2.5 rounded-full transition-colors ${
                        isAligned
                          ? 'bg-amber-300 shadow-[0_0_8px_#fde047] animate-ping'
                          : 'bg-emerald-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Static Device Top Center Notch Marker on Housing */}
                <div className="absolute top-1 w-3 h-2 bg-gradient-to-b from-amber-300 to-amber-500 rounded-b-xs shadow-md z-20" />
              </div>
            </div>
          </div>

          {/* Qibla Direction & Heading Metrics Strip */}
          <div className="w-full grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-slate-900/60 border border-emerald-900/40 text-center shadow-xs">
            <div>
              <span className="text-[10px] text-amber-300/80 uppercase font-semibold">Qibla Angle</span>
              <div className="text-lg font-bold font-mono text-amber-300 mt-0.5">
                {qiblaAngle}°
              </div>
              <span className="text-[10px] text-emerald-400 font-medium">{cardinalStr}</span>
            </div>

            <div className="border-x border-emerald-900/40">
              <span className="text-[10px] text-slate-400 uppercase font-medium">Device Heading</span>
              <div className="text-lg font-bold font-mono text-white mt-0.5">
                {Math.round(effectiveHeading)}°
              </div>
              <span className="text-[10px] text-slate-500">
                {hasOrientationSupport ? 'Live Sensor' : 'Manual'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-teal-300/80 uppercase font-semibold">Distance</span>
              <div className="text-lg font-bold font-mono text-teal-300 mt-0.5">
                {distanceKm.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">km to Makkah</span>
            </div>
          </div>

          {/* Orientation Sensor Guidance or Manual Rotation Slider */}
          <div className="w-full flex flex-col gap-2">
            {!hasOrientationSupport ? (
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-900/50 text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span className="flex items-center gap-1.5 font-semibold text-amber-300">
                    <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Heading Simulator (Desktop / Laptop)</span>
                  </span>
                  <span className="font-mono text-amber-300 font-bold">{manualHeadingOffset}°</span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="359"
                  value={manualHeadingOffset}
                  onChange={(e) => setManualHeadingOffset(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-400 cursor-pointer"
                />

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Tip: Rotate the slider above to test the compass. On mobile devices with a built-in compass sensor, hold your phone flat horizontally.
                </p>

                {typeof (DeviceOrientationEvent as any)?.requestPermission === 'function' &&
                  !permissionRequested && (
                    <button
                      onClick={requestIOSOrientationPermission}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 text-white font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Enable iPhone Compass Motion Sensor
                    </button>
                  )}
              </div>
            ) : (
              <div className="text-center text-xs text-emerald-300/90 flex items-center justify-center gap-1.5 py-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Hold phone flat horizontally. Rotate until the Kaaba aligns with the top notch!</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-emerald-900/40 bg-slate-950/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            {isAligned ? 'Aligned with Holy Kaaba' : `Turn ${Math.round(needleRotation)}° to align`}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-900 hover:from-emerald-700 hover:to-teal-800 text-white font-semibold text-xs transition-colors cursor-pointer border border-emerald-700/50 shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
