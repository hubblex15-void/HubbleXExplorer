import React, { useState } from 'react';
import { useTallyStore } from '../../store/useTallyStore.tsx';
import { useTheme, THEMES } from '../theme/ThemeProvider.tsx';
import { Modal } from '../ui/Modal.tsx';
import { PixelButton } from '../ui/PixelButton.tsx';
import { ConfirmDialog } from '../ui/ConfirmDialog.tsx';
import {
  browserLocation,
  searchPlace,
  loadPlace,
  savePlace,
  ACTS,
  type Place,
} from '../../livingscene/index.ts';
import { WEATHER_PRESETS } from '../../lib/weatherPresets.ts';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { state, exportDataJson, importDataJson, eraseAllData, updateProfileName, updateSettings } = useTallyStore();
  const { themeId, setThemeId, motion, setMotion } = useTheme();

  // Name editing
  const [nameInput, setNameInput] = useState(state.profile.name);
  const [nameSaved, setNameSaved] = useState(false);

  // Sync nameInput if state.profile.name changes
  React.useEffect(() => {
    setNameInput(state.profile.name);
  }, [state.profile.name]);

  // Location card state
  const [currentPlace, setCurrentPlace] = useState<Place | null>(() => loadPlace());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    { name: string; lat: number; lon: number; country?: string; region?: string }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeoBlocked, setIsGeoBlocked] = useState(false);
  const [geoBlockedReason, setGeoBlockedReason] = useState<string>('');

  // Scene debug controls state
  const [debugHour, setDebugHour] = useState<number | null>(null);

  // Check geolocation and reload place on open
  React.useEffect(() => {
    if (!isOpen) return;
    setCurrentPlace(loadPlace());

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setIsGeoBlocked(true);
      setGeoBlockedReason('Geolocation is not supported in this browser. Use city search below.');
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then(status => {
          if (status.state === 'denied') {
            setIsGeoBlocked(true);
            setGeoBlockedReason('Geolocation is blocked by permissions in this preview frame. Use city search below.');
          }
          status.onchange = () => {
            if (status.state === 'denied') {
              setIsGeoBlocked(true);
              setGeoBlockedReason('Geolocation is blocked by permissions in this preview frame. Use city search below.');
            } else {
              setIsGeoBlocked(false);
            }
          };
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleUseMyLocation = async () => {
    setIsLocating(true);
    setSearchError(null);
    try {
      const p = await browserLocation();
      savePlace(p);
      setCurrentPlace(p);
      setSearchResults([]);
      setSearchQuery('');
      window.dispatchEvent(new CustomEvent('livingscene:place-changed'));
    } catch (err: any) {
      setIsGeoBlocked(true);
      setGeoBlockedReason(
        err?.message || 'Geolocation is blocked inside this preview frame. Use city search below.'
      );
    } finally {
      setIsLocating(false);
    }
  };

  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await searchPlace(searchQuery.trim());
      setSearchResults(results.slice(0, 6));
      if (results.length === 0) {
        setSearchError('No matching places found. Try another city name.');
      }
    } catch (err: any) {
      setSearchError(err?.message || 'Search request failed. Check network.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = (r: { name: string; lat: number; lon: number; country?: string; region?: string }) => {
    const labelParts = [r.name, r.region, r.country].filter(Boolean);
    const p: Place = {
      lat: r.lat,
      lon: r.lon,
      label: labelParts.join(', '),
    };
    savePlace(p);
    setCurrentPlace(p);
    setSearchResults([]);
    setSearchQuery('');
    window.dispatchEvent(new CustomEvent('livingscene:place-changed'));
  };

  const handleForgetPlace = () => {
    savePlace(null);
    setCurrentPlace(null);
    setSearchResults([]);
    setSearchQuery('');
    window.dispatchEvent(new CustomEvent('livingscene:place-changed'));
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileName(nameInput);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [showExportArea, setShowExportArea] = useState(false);
  const [exportedJson, setExportedJson] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isEraseConfirmOpen, setIsEraseConfirmOpen] = useState(false);

  const handleExport = () => {
    const json = exportDataJson();
    setExportedJson(json);
    setShowExportArea(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(exportedJson);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) return;

    const result = importDataJson(importText.trim());
    if (result.success) {
      setImportStatus({ message: 'Realm ledger successfully restored!', isError: false });
      setImportText('');
    } else {
      setImportStatus({ message: result.error || 'Failed to parse JSON file.', isError: true });
    }
  };

  const handleConfirmErase = () => {
    eraseAllData();
    setIsEraseConfirmOpen(false);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Realm settings & vault">
        <div className="space-y-6">
          {/* Adventurer Profile Name */}
          <div className="p-3 bg-cream-deep border-2 border-oak-dark">
            <label className="font-pixel-heading text-xs text-cocoa block mb-1 font-semibold">
              Adventurer name
            </label>
            <form onSubmit={handleSaveName} className="flex gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="Enter hero name..."
                className="flex-1 bg-cream border-2 border-oak-dark px-3 py-1 font-pixel-body text-base text-cocoa outline-none shadow-[inset_1px_1px_0_var(--cocoa-soft)]"
              />
              <PixelButton size="sm" variant="moss" type="submit">
                {nameSaved ? '✓ Saved' : 'Save'}
              </PixelButton>
            </form>
            <span className="font-pixel-body text-sm text-cocoa-soft mt-1 block">
              Displayed on the top HUD and quest certificates.
            </span>
          </div>

          {/* Scene Motion Preference */}
          <div className="p-3 bg-cream-deep border-2 border-oak-dark space-y-2">
            <label className="font-pixel-heading text-xs text-cocoa block font-semibold">
              Scene motion
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['full', 'calm', 'off'] as const).map(mode => {
                const currentMotion = state.profile.settings.motion || motion;
                const active = currentMotion === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setMotion(mode);
                      updateSettings({ motion: mode });
                    }}
                    className={`
                      py-1.5 px-2 text-center border-2 font-pixel-heading text-xs cursor-pointer select-none pixel-btn-block
                      ${
                        active
                          ? 'bg-cream text-cocoa border-honey shadow-[0_2px_0_var(--honey-dark)] font-bold'
                          : 'bg-cream-deep text-cocoa-soft border-oak-dark hover:bg-cream'
                      }
                    `}
                  >
                    {mode === 'full' ? 'Full' : mode === 'calm' ? 'Calm' : 'Off'}
                  </button>
                );
              })}
            </div>
            <span className="font-pixel-body text-sm text-cocoa-soft block">
              Adjusts cabin animation speed and frame rate.
            </span>
          </div>

          {/* Season Preference */}
          <div className="p-3 bg-cream-deep border-2 border-oak-dark space-y-2">
            <label className="font-pixel-heading text-xs text-cocoa block font-semibold">
              Season
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
              {(['auto', 'spring', 'summer', 'autumn', 'winter'] as const).map(s => {
                const active = (state.profile.settings.season || 'auto') === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => updateSettings({ season: s })}
                    className={`
                      py-1.5 px-1 sm:px-2 text-center border-2 font-pixel-heading text-xs capitalize cursor-pointer select-none pixel-btn-block
                      ${
                        active
                          ? 'bg-cream text-cocoa border-honey shadow-[0_2px_0_var(--honey-dark)] font-bold'
                          : 'bg-cream-deep text-cocoa-soft border-oak-dark hover:bg-cream'
                      }
                    `}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <span className="font-pixel-body text-sm text-cocoa-soft block">
              Auto changes with the calendar year, or locks the cabin to your favorite season.
            </span>
          </div>

          {/* Theme Chooser */}
          <div>
            <label className="font-pixel-heading text-xs text-cocoa block mb-2 font-semibold">
              Visual palette & theme
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Object.values(THEMES).map(t => {
                const active = themeId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setThemeId(t.id)}
                    className={`
                      p-2.5 text-left border-2 select-none cursor-pointer pixel-btn-block
                      ${
                        active
                          ? 'bg-cream-deep text-cocoa border-honey shadow-[0_2px_0_var(--honey-dark)] font-bold'
                          : 'bg-cream text-cocoa-soft border-oak-dark hover:bg-cream-deep'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="w-3.5 h-3.5 inline-block border border-cocoa"
                        style={{ backgroundColor: t.cream }}
                      />
                      <span
                        className="w-3.5 h-3.5 inline-block border border-cocoa"
                        style={{ backgroundColor: t.moss }}
                      />
                      <span
                        className="w-3.5 h-3.5 inline-block border border-cocoa"
                        style={{ backgroundColor: t.honey }}
                      />
                      <span
                        className="w-3.5 h-3.5 inline-block border border-cocoa"
                        style={{ backgroundColor: t.ember }}
                      />
                    </div>
                    <span className="font-pixel-heading text-xs block leading-tight text-cocoa">
                      {t.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location & Real-World Environment */}
          <div className="p-3 bg-cream-deep border-2 border-oak-dark space-y-3">
            <div>
              <span className="font-pixel-heading text-xs text-cocoa block font-semibold">
                Location & real-world environment
              </span>
              <span className="font-pixel-body text-sm text-cocoa-soft">
                Connect your real-world weather, sun, moon, and seasons to your cabin scene.
              </span>
            </div>

            {/* Current Chosen Place with Forget button */}
            {currentPlace && (
              <div className="p-2.5 bg-cream border-2 border-oak-dark flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="font-pixel-heading text-[10px] text-cocoa-soft block">
                    Active realm location
                  </span>
                  <span className="font-pixel-heading text-xs text-cocoa font-bold truncate block">
                    📍 {currentPlace.label || `${currentPlace.lat.toFixed(2)}°, ${currentPlace.lon.toFixed(2)}°`}
                  </span>
                </div>
                <PixelButton size="sm" variant="berry" onClick={handleForgetPlace}>
                  Forget
                </PixelButton>
              </div>
            )}

            {/* Geolocation status / button */}
            {isGeoBlocked ? (
              <p className="font-pixel-body text-xs text-berry bg-cream p-2 border border-berry">
                {geoBlockedReason ||
                  'Geolocation is blocked in this preview frame. Use city search below.'}
              </p>
            ) : (
              <div className="flex items-center gap-2">
                <PixelButton
                  size="sm"
                  variant="honey"
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={isLocating}
                >
                  {isLocating ? 'Locating...' : '📍 Use my location'}
                </PixelButton>
                <span className="font-pixel-body text-xs text-cocoa-soft">
                  Detects local coordinates
                </span>
              </div>
            )}

            {/* City search box */}
            <div className="space-y-1.5 pt-1 border-t border-oak-dark/30">
              <label className="font-pixel-heading text-xs text-cocoa block font-semibold">
                Search city or town
              </label>
              <form onSubmit={handleCitySearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="e.g. Kyoto, London, Denver..."
                  className="flex-1 bg-cream border-2 border-oak-dark px-3 py-1 font-pixel-body text-sm text-cocoa outline-none shadow-[inset_1px_1px_0_var(--cocoa-soft)]"
                />
                <PixelButton
                  size="sm"
                  variant="moss"
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </PixelButton>
              </form>

              {searchError && (
                <p className="font-pixel-body text-xs text-berry">{searchError}</p>
              )}

              {/* Up to 6 search results */}
              {searchResults.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="font-pixel-heading text-[10px] text-cocoa-soft block">
                    Select a place (up to 6 results):
                  </span>
                  <div className="grid grid-cols-1 gap-1">
                    {searchResults.map((r, idx) => {
                      const parts = [r.name, r.region, r.country].filter(Boolean);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectPlace(r)}
                          className="text-left px-2.5 py-1.5 bg-cream hover:bg-cream-deep border border-oak-dark font-pixel-body text-xs text-cocoa flex items-center justify-between cursor-pointer active:translate-y-0.5"
                        >
                          <span className="font-semibold">{parts.join(', ')}</span>
                          <span className="text-[10px] text-cocoa-soft">
                            {r.lat.toFixed(2)}°, {r.lon.toFixed(2)}°
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Developer -> Scene debug */}
          <div className="p-3 bg-cream-deep border-2 border-oak-dark space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-pixel-heading text-xs text-cocoa block font-semibold">
                  Developer • Scene debug
                </span>
                <span className="font-pixel-body text-sm text-cocoa-soft">
                  Override sun time, weather targets, and character animations for testing.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !Boolean(state.profile.settings.sceneDebug);
                  updateSettings({ sceneDebug: next });
                }}
                className={`py-1 px-3 border-2 font-pixel-heading text-xs cursor-pointer select-none pixel-btn-block ${
                  state.profile.settings.sceneDebug
                    ? 'bg-moss text-cream border-moss-dark font-bold'
                    : 'bg-cream text-cocoa-soft border-oak-dark'
                }`}
              >
                {state.profile.settings.sceneDebug ? 'Active' : 'Off'}
              </button>
            </div>

            {state.profile.settings.sceneDebug && (
              <div className="pt-2 border-t border-oak-dark space-y-3">
                {/* Time of day slider (0-24h) */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-pixel-heading text-cocoa">
                    <span>Time of day (0–24h)</span>
                    <span className="text-moss font-bold">
                      {debugHour !== null
                        ? `${String(Math.floor(debugHour)).padStart(2, '0')}:${String(Math.round((debugHour % 1) * 60)).padStart(2, '0')}`
                        : 'Real Time'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    step="0.25"
                    value={debugHour ?? 12}
                    onChange={e => {
                      const h = parseFloat(e.target.value);
                      setDebugHour(h);
                      window.dispatchEvent(new CustomEvent('livingscene:debug-time', { detail: h }));
                    }}
                    className="w-full accent-moss cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-pixel-body text-cocoa-soft">
                    <span>0h (Night)</span>
                    <span>6h (Dawn)</span>
                    <span>12h (Noon)</span>
                    <span>19h (Dusk)</span>
                    <span>24h</span>
                  </div>
                  {debugHour !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        setDebugHour(null);
                        window.dispatchEvent(new CustomEvent('livingscene:debug-time', { detail: null }));
                      }}
                      className="text-[11px] font-pixel-heading text-amber-dark underline cursor-pointer"
                    >
                      Reset to real clock time
                    </button>
                  )}
                </div>

                {/* Weather buttons */}
                <div className="space-y-1">
                  <span className="text-xs font-pixel-heading text-cocoa block">Weather</span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {(['clear', 'cloudy', 'rain', 'storm', 'snow', 'fog'] as const).map(wName => (
                      <button
                        key={wName}
                        type="button"
                        onClick={() => {
                          const target = WEATHER_PRESETS[wName];
                          window.dispatchEvent(new CustomEvent('livingscene:debug-weather', { detail: target }));
                        }}
                        className="py-1 px-1.5 text-center border-2 font-pixel-heading text-xs capitalize bg-cream text-cocoa border-oak-dark hover:bg-cream-deep cursor-pointer select-none pixel-btn-block"
                      >
                        {wName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Activity dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-pixel-heading text-cocoa block">Force Character Activity</label>
                  <select
                    onChange={e => {
                      if (e.target.value) {
                        window.dispatchEvent(new CustomEvent('livingscene:debug-activity', { detail: e.target.value }));
                      }
                    }}
                    defaultValue=""
                    className="w-full bg-cream border-2 border-oak-dark p-1.5 font-pixel-body text-sm text-cocoa outline-none shadow-[inset_1px_1px_0_var(--cocoa-soft)]"
                  >
                    <option value="" disabled>Choose an activity...</option>
                    {ACTS.map(act => (
                      <option key={act.id} value={act.id}>
                        {act.id} ({act.cat})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* System Specs */}
          <div className="p-3 bg-cream-deep border-2 border-oak-dark space-y-1.5 font-pixel-body text-base text-cocoa">
            <span className="font-pixel-heading text-xs text-cocoa block font-semibold">
              Realm system status
            </span>
            <p>
              • <strong>Storage engine:</strong> tallyrealm:v2 (v{state.version})
            </p>
            <p>
              • <strong>Living scene engine:</strong> Pixel software framebuffer
            </p>
          </div>

          {/* Data Backup: JSON Export */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-pixel-heading text-xs text-cocoa font-semibold">
                Backup ledger (JSON export)
              </label>
              <PixelButton size="sm" variant="oak" onClick={handleExport}>
                Generate JSON
              </PixelButton>
            </div>

            {showExportArea && (
              <div className="space-y-2 pt-1">
                <textarea
                  readOnly
                  value={exportedJson}
                  rows={4}
                  className="w-full bg-cream-deep text-cocoa border-2 border-oak-dark p-2 font-mono text-xs outline-none shadow-[inset_1px_1px_0_var(--cocoa-soft)]"
                />
                <PixelButton size="sm" variant="honey" onClick={handleCopy}>
                  {copySuccess ? '✓ Copied to clipboard!' : 'Copy to clipboard'}
                </PixelButton>
              </div>
            )}
          </div>

          {/* Data Restore: JSON Import */}
          <div className="space-y-2">
            <label className="font-pixel-heading text-xs text-cocoa block font-semibold">
              Restore ledger (JSON import)
            </label>
            <form onSubmit={handleImportSubmit} className="space-y-2">
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder="Paste previously exported JSON here..."
                rows={3}
                className="w-full bg-cream-deep border-2 border-oak-dark p-2 font-mono text-xs text-cocoa outline-none shadow-[inset_1px_1px_0_var(--cocoa-soft)]"
              />
              {importStatus && (
                <div
                  className={`p-2 border font-pixel-heading text-xs ${
                    importStatus.isError
                      ? 'bg-cream border-berry text-berry'
                      : 'bg-cream border-moss text-moss-dark'
                  }`}
                >
                  {importStatus.message}
                </div>
              )}
              <PixelButton size="sm" variant="moss" type="submit" disabled={!importText.trim()}>
                Restore from JSON
              </PixelButton>
            </form>
          </div>

          {/* Danger Zone: Erase All Data */}
          <div className="pt-4 border-t border-cream-deep flex items-center justify-between gap-4">
            <div>
              <span className="font-pixel-heading text-xs text-berry block font-semibold">
                Erase all data
              </span>
              <span className="font-pixel-body text-sm text-cocoa-soft">
                Delete all categories, trackers, quests, and logs to start completely fresh.
              </span>
            </div>
            <PixelButton size="sm" variant="berry" onClick={() => setIsEraseConfirmOpen(true)}>
              Erase all
            </PixelButton>
          </div>
        </div>
      </Modal>

      {/* In-app ConfirmDialog for Erase All Data */}
      <ConfirmDialog
        isOpen={isEraseConfirmOpen}
        title="Erase all realm data"
        message="Are you sure you want to erase all data? All categories, trackers, quests, and activity logs will be permanently deleted and cannot be undone."
        confirmLabel="Erase everything"
        cancelLabel="Cancel"
        variant="berry"
        onConfirm={handleConfirmErase}
        onCancel={() => setIsEraseConfirmOpen(false)}
      />
    </>
  );
};
