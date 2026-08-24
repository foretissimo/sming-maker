import React, { useState, useEffect } from 'react';
import initialSongsData from './data/songs.json';
import initialArtistsData from './data/artists.json';
import Header from './components/Header';
import FilterSection from './components/FilterSection';
import GeneratorControl from './components/GeneratorControl';
import PlaylistView from './components/PlaylistView';
import PlatformActions from './components/PlatformActions';
import SongCatalogModal from './components/SongCatalogModal';
import StreamingGuideModal from './components/StreamingGuideModal';
import DataEditorView from './components/DataEditorView';
import { generateStreamingList } from './utils/generator';

export default function App() {
  // Main View Mode: 'generator' | 'editor'
  const [activeView, setActiveView] = useState('generator');

  // Artists State with LocalStorage persistence
  const [artists, setArtists] = useState(() => {
    try {
      const saved = localStorage.getItem('sming_artists');
      return saved ? JSON.parse(saved) : initialArtistsData;
    } catch (e) {
      return initialArtistsData;
    }
  });

  // Songs State with LocalStorage persistence
  const [allSongs, setAllSongs] = useState(() => {
    try {
      const saved = localStorage.getItem('sming_songs');
      return saved ? JSON.parse(saved) : initialSongsData;
    } catch (e) {
      return initialSongsData;
    }
  });

  // Generator Options
  const [selectedArtists, setSelectedArtists] = useState(() => artists.map(a => a.id));
  const [mode, setMode] = useState('title_focus');
  const [targetDurationMinutes, setTargetDurationMinutes] = useState(60);
  const [focusSongId, setFocusSongId] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  
  // Modals & Feedback
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Sync artists to LocalStorage
  const handleUpdateArtists = (newArtists) => {
    setArtists(newArtists);
    try {
      localStorage.setItem('sming_artists', JSON.stringify(newArtists));
    } catch (e) {
      // ignore
    }
  };

  // Sync songs to LocalStorage
  const handleUpdateSongs = (newSongs) => {
    setAllSongs(newSongs);
    try {
      localStorage.setItem('sming_songs', JSON.stringify(newSongs));
    } catch (e) {
      // ignore
    }
  };

  // Reset to default bundled dataset
  const handleResetToDefault = () => {
    try {
      localStorage.removeItem('sming_songs');
      localStorage.removeItem('sming_artists');
    } catch (e) {}
    setAllSongs(initialSongsData);
    setArtists(initialArtistsData);
    setSelectedArtists(initialArtistsData.map(a => a.id));
  };

  // Initialize playlist on mount or from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const songIdsParam = params.get('songs');

    if (songIdsParam) {
      const ids = songIdsParam.split(',');
      const restored = [];
      ids.forEach(id => {
        const found = allSongs.find(s => s.id === id);
        if (found) {
          restored.push({ ...found, uniqueKey: `${found.id}-${Math.random().toString(36).substr(2, 9)}` });
        }
      });
      if (restored.length > 0) {
        setPlaylist(restored);
        return;
      }
    }

    // Default initial generation
    const initialList = generateStreamingList(allSongs, {
      targetSeconds: 3600,
      mode: 'title_focus',
      selectedArtistTypes: artists.map(a => a.id)
    });
    setPlaylist(initialList);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleGenerate = () => {
    const newList = generateStreamingList(allSongs, {
      targetSeconds: targetDurationMinutes * 60,
      mode,
      selectedArtistTypes: selectedArtists,
      focusSongId
    });
    setPlaylist(newList);
    showToast('새로운 1시간 스밍리스트가 생성되었습니다! 🎵');
  };

  const handleMoveUp = (index) => {
    if (index <= 0) return;
    const next = [...playlist];
    const temp = next[index];
    next[index] = next[index - 1];
    next[index - 1] = temp;
    setPlaylist(next);
  };

  const handleMoveDown = (index) => {
    if (index >= playlist.length - 1) return;
    const next = [...playlist];
    const temp = next[index];
    next[index] = next[index + 1];
    next[index + 1] = temp;
    setPlaylist(next);
  };

  const handleRemove = (index) => {
    const next = playlist.filter((_, idx) => idx !== index);
    setPlaylist(next);
  };

  const handleAddSong = (song) => {
    setPlaylist(prev => [
      ...prev,
      { ...song, uniqueKey: `${song.id}-${Math.random().toString(36).substr(2, 9)}` }
    ]);
  };

  const handleReset = () => {
    if (window.confirm('재생목록을 비우시겠습니까?')) {
      setPlaylist([]);
      showToast('재생목록이 초기화되었습니다.');
    }
  };

  const handleShare = () => {
    if (playlist.length === 0) {
      showToast('공유할 곡이 없습니다.');
      return;
    }
    const songIds = playlist.map(s => s.id).join(',');
    const shareUrl = `${window.location.origin}${window.location.pathname}?songs=${songIds}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      showToast('스밍리스트 공유 링크가 복사되었습니다! 🔗');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl shadow-emerald-500/50 flex items-center gap-2 animate-bounce">
          <span>✨ {toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Header
        activeView={activeView}
        onChangeView={setActiveView}
        onOpenGuide={() => setIsGuideOpen(true)}
        onShare={handleShare}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 space-y-6">
        {activeView === 'generator' ? (
          <>
            {/* Hero Notice */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-teal-950/40 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌲✨</span>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-emerald-300">
                    포레스텔라 & 솔로 4인 원클릭 스밍 도우미
                  </h2>
                  <p className="text-xs text-slate-400">
                    차트 집계 주기에 맞춘 정확한 60분 리스트 자동 생성 및 멜론·지니·벅스 원클릭 스트리밍
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => setActiveView('editor')}
                  className="text-xs text-slate-400 hover:text-emerald-300 underline font-medium cursor-pointer"
                >
                  음원 데이터 검증/수정 &rarr;
                </button>
                <span className="text-slate-700">|</span>
                <button
                  onClick={() => setIsGuideOpen(true)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
                >
                  스밍 가이드 &rarr;
                </button>
              </div>
            </div>

            {/* Generator Controls CTA */}
            <GeneratorControl
              onGenerate={handleGenerate}
              onOpenCatalog={() => setIsCatalogOpen(true)}
              onReset={handleReset}
              playlistLength={playlist.length}
            />

            {/* 2-Column Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Filter & Mode Config (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <FilterSection
                  artists={artists}
                  selectedArtists={selectedArtists}
                  onChangeArtists={setSelectedArtists}
                  mode={mode}
                  onChangeMode={setMode}
                  targetDurationMinutes={targetDurationMinutes}
                  onChangeTargetDuration={setTargetDurationMinutes}
                  focusSongId={focusSongId}
                  onChangeFocusSong={setFocusSongId}
                  allSongs={allSongs}
                />
              </div>

              {/* Right: Playlist Table & Duration Info (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <PlaylistView
                  playlist={playlist}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  onRemove={handleRemove}
                  onAddCustom={() => setIsCatalogOpen(true)}
                  targetDurationSeconds={targetDurationMinutes * 60}
                  artists={artists}
                />
              </div>
            </div>

            {/* One-Click Action Platform Panel */}
            <PlatformActions
              playlist={playlist}
              onShowToast={showToast}
            />
          </>
        ) : (
          /* Editor View */
          <DataEditorView
            songs={allSongs}
            onUpdateSongs={handleUpdateSongs}
            artists={artists}
            onUpdateArtists={handleUpdateArtists}
            onResetToDefault={handleResetToDefault}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <p className="max-w-md mx-auto px-4">
          포레스텔라 & 숲별을 위한 비영리 팬메이드 원클릭 스밍리스트 생성기입니다.
          <br />
          <span className="text-slate-600 mt-1 inline-block">
            Made with 💚 for Forestella & Soopbyeol
          </span>
        </p>
      </footer>

      {/* Modals */}
      <SongCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        allSongs={allSongs}
        onAddSong={handleAddSong}
        currentPlaylist={playlist}
        artists={artists}
      />

      <StreamingGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
