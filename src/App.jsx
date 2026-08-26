import React, { useState, useEffect } from 'react';
import { ExternalLink, Users } from 'lucide-react';
import initialSongsData from './data/songs.json';
import initialArtistsData from './data/artists.json';
import initialRecommendedData from './data/recommendedPlaylist.json';
import Header from './components/Header';
import FilterSection from './components/FilterSection';
import GeneratorControl from './components/GeneratorControl';
import PlaylistView from './components/PlaylistView';
import ReadOnlyPlaylistView from './components/ReadOnlyPlaylistView';
import PlatformActions from './components/PlatformActions';
import SongCatalogModal from './components/SongCatalogModal';
import StreamingGuideModal from './components/StreamingGuideModal';
import ShareModal from './components/ShareModal';
import DataEditorView from './components/DataEditorView';
import AdminLoginModal from './components/AdminLoginModal';
import { generateStreamingList } from './utils/generator';
import { decodeShareablePlaylist, generateShareUrl } from './utils/shareUtils';
import { hydratePlaylistWithMasterSongs } from './utils/platformLinks';
import { isEditorEnabled } from './utils/env';
import { isAdminLoggedIn, clearAdminSession } from './utils/auth';

const DATASET_VERSION = '2026-08-26-v8-hydrate-master';

export default function App() {
  const showEditor = isEditorEnabled();
  // Main View Mode: 'generator' | 'editor' | 'readonly'
  const [activeView, setActiveView] = useState('generator');

  // Sound Team Admin Mode state
  const [isAdmin, setIsAdmin] = useState(() => isAdminLoggedIn());
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleAdminLogout = () => {
    clearAdminSession();
    setIsAdmin(false);
    if (activeView === 'editor') {
      setActiveView('generator');
    }
    showToast('음총팀 관리자 모드에서 로그아웃되었습니다.');
  };

  const handleLoginSuccess = (user) => {
    setIsAdmin(true);
    setActiveView('editor');
  };

  // Artists State with LocalStorage persistence
  const [artists, setArtists] = useState(() => {
    try {
      const savedVersion = localStorage.getItem('sming_artists_version');
      const saved = localStorage.getItem('sming_artists');
      if (saved && savedVersion === DATASET_VERSION) {
        return JSON.parse(saved);
      }
      localStorage.setItem('sming_artists_version', DATASET_VERSION);
      localStorage.setItem('sming_artists', JSON.stringify(initialArtistsData));
      return initialArtistsData;
    } catch (e) {
      return initialArtistsData;
    }
  });

  // Songs State with LocalStorage persistence & Automatic version upgrade
  const [allSongs, setAllSongs] = useState(() => {
    try {
      const savedVersion = localStorage.getItem('sming_songs_version');
      const saved = localStorage.getItem('sming_songs');
      if (saved && savedVersion === DATASET_VERSION) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= initialSongsData.length) {
          return parsed;
        }
      }
      // Upgrade to latest bundled songs dataset
      localStorage.setItem('sming_songs_version', DATASET_VERSION);
      localStorage.setItem('sming_songs', JSON.stringify(initialSongsData));
      return initialSongsData;
    } catch (e) {
      return initialSongsData;
    }
  });

  // Official Recommended Playlist State with LocalStorage persistence & version upgrade
  const [recommendedData, setRecommendedData] = useState(() => {
    try {
      const savedVersion = localStorage.getItem('sming_recommended_version');
      const saved = localStorage.getItem('sming_recommended');
      if (saved && savedVersion === DATASET_VERSION) {
        return JSON.parse(saved);
      }
      localStorage.setItem('sming_recommended_version', DATASET_VERSION);
      localStorage.setItem('sming_recommended', JSON.stringify(initialRecommendedData));
      return initialRecommendedData;
    } catch (e) {
      return initialRecommendedData;
    }
  });

  // Selected Artists in Generator: Default to '완전체' (localStorage 제거됨)
  const [selectedArtists, setSelectedArtists] = useState(() => {
    return initialRecommendedData?.selectedArtists || ['group'];
  });

  const [mode, setMode] = useState('title_focus');
  const [targetDurationMinutes, setTargetDurationMinutes] = useState(60);
  const [focusSongId, setFocusSongId] = useState(null);
  const [playlist, setPlaylist] = useState([]);

  // Shared Read-Only Playlist Metadata
  const [sharedData, setSharedData] = useState({
    title: '포레스텔라 1시간 스밍리스트',
    creator: '숲별',
    desc: '',
    playlist: []
  });
  
  // YouTube URL state
  const [youtubeUrl, setYoutubeUrl] = useState(() => {
    try {
      return localStorage.getItem('sming_youtube_url') || '';
    } catch (e) {
      return '';
    }
  });

  // Modals & Feedback
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isCreatorStudioOpen, setIsCreatorStudioOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Sync artists to LocalStorage
  const handleUpdateArtists = (newArtists) => {
    setArtists(newArtists);
    try {
      localStorage.setItem('sming_artists_version', DATASET_VERSION);
      localStorage.setItem('sming_artists', JSON.stringify(newArtists));
    } catch (e) {
      // ignore
    }
  };

  // Sync songs to LocalStorage and automatically re-hydrate current playlist
  const handleUpdateSongs = (newSongs) => {
    setAllSongs(newSongs);
    setPlaylist(prev => hydratePlaylistWithMasterSongs(prev, newSongs));
    try {
      localStorage.setItem('sming_songs_version', DATASET_VERSION);
      localStorage.setItem('sming_songs', JSON.stringify(newSongs));
    } catch (e) {
      // ignore
    }
  };

  // Sync official recommended playlist to LocalStorage
  const handleUpdateRecommended = (newRec) => {
    setRecommendedData(newRec);
    try {
      localStorage.setItem('sming_recommended_version', DATASET_VERSION);
      localStorage.setItem('sming_recommended', JSON.stringify(newRec));
    } catch (e) {
      // ignore
    }
  };

  // Reset to default bundled dataset (음총팀 추천곡 우선 복구)
  const handleResetToDefault = () => {
    try {
      localStorage.removeItem('sming_songs');
      localStorage.removeItem('sming_artists');
      localStorage.removeItem('sming_recommended');
      localStorage.removeItem('sming_selected_artists');
      localStorage.removeItem('sming_editor_selected_artist');
      localStorage.removeItem('sming_catalog_selected_artist');
    } catch (e) {}
    setAllSongs(initialSongsData);
    setArtists(initialArtistsData);
    setRecommendedData(initialRecommendedData);
    const defaultGroup = initialRecommendedData?.selectedArtists || ['group'];
    setSelectedArtists(defaultGroup);
    setFocusSongId(null);
    if (initialRecommendedData?.songs && initialRecommendedData.songs.length > 0) {
      setPlaylist(hydratePlaylistWithMasterSongs(initialRecommendedData.songs, initialSongsData));
    } else {
      setPlaylist(generateStreamingList(initialSongsData, {
        targetSeconds: 3600,
        mode: 'title_focus',
        selectedArtistTypes: defaultGroup
      }));
    }
  };

  // Load official recommended playlist on demand (Always hydrated with latest allSongs/songs.json)
  const handleLoadRecommended = () => {
    if (recommendedData && Array.isArray(recommendedData.songs) && recommendedData.songs.length > 0) {
      const freshSongs = hydratePlaylistWithMasterSongs(recommendedData.songs, allSongs);
      setPlaylist(freshSongs);
      if (recommendedData.selectedArtists && recommendedData.selectedArtists.length > 0) {
        setSelectedArtists(recommendedData.selectedArtists);
      }
      if (recommendedData.youtubeUrl) {
        setYoutubeUrl(recommendedData.youtubeUrl);
      }
      showToast('🌲 음총팀 공식 추천 1시간 스밍리스트를 불러왔습니다! ⭐');
    } else {
      showToast('음총팀 추천 리스트 데이터가 없습니다.');
    }
  };

  // Initialize playlist on mount or from URL params (?s=, ?share=, or ?songs=)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareToken = params.get('s') || params.get('share');
    const songIdsParam = params.get('songs');

    // 1. Check for Base64 encoded share token (?s=... or ?share=...)
    if (shareToken) {
      const decoded = decodeShareablePlaylist(shareToken, allSongs);
      if (decoded && decoded.playlist.length > 0) {
        setSharedData(decoded);
        setPlaylist(decoded.playlist);
        setActiveView('readonly');
        return;
      }
    }

    // 2. Check for legacy comma-separated IDs (?songs=...)
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
        setSharedData({
          title: '🌲 공유된 포레스텔라 스밍리스트',
          creator: '숲별',
          desc: '',
          playlist: restored
        });
        setPlaylist(restored);
        setActiveView('readonly');
        return;
      }
    }

    // 3. Default on first visit: Load Official Recommended Playlist hydrated with master allSongs!
    if (recommendedData && Array.isArray(recommendedData.songs) && recommendedData.songs.length > 0) {
      const recSongs = hydratePlaylistWithMasterSongs(recommendedData.songs, allSongs);
      setPlaylist(recSongs);
      if (recommendedData.selectedArtists) {
        setSelectedArtists(recommendedData.selectedArtists);
      }
      if (recommendedData.youtubeUrl) {
        setYoutubeUrl(recommendedData.youtubeUrl);
      }
      return;
    }

    // Fallback: Automatic generation
    const initialList = generateStreamingList(allSongs, {
      targetSeconds: 3600,
      mode: 'title_focus',
      selectedArtistTypes: selectedArtists
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

  const handleLoadPlaylistFromStudio = (newPlaylist) => {
    setPlaylist(newPlaylist);
    setActiveView('generator');
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
    setIsShareModalOpen(true);
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
        showEditor={showEditor}
        isAdminLoggedIn={isAdmin}
        onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
        onAdminLogout={handleAdminLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 space-y-6">
        {activeView === 'readonly' ? (
          /* READ-ONLY VIEWER VIEW (For shared links & fans) */
          <ReadOnlyPlaylistView
            title={sharedData.title}
            creator={sharedData.creator}
            desc={sharedData.desc}
            youtubeUrl={sharedData.youtubeUrl || youtubeUrl}
            created={sharedData.created}
            daysElapsed={sharedData.daysElapsed}
            isExpired={sharedData.isExpired}
            isOld={sharedData.isOld}
            playlist={playlist}
            artists={artists}
            onGoToGenerator={() => setActiveView('generator')}
            onShowToast={showToast}
          />
        ) : activeView === 'editor' && (showEditor || isAdmin) ? (
          /* Editor View */
          <DataEditorView
            songs={allSongs}
            onUpdateSongs={handleUpdateSongs}
            artists={artists}
            onUpdateArtists={handleUpdateArtists}
            recommendedData={recommendedData}
            onSaveRecommended={handleUpdateRecommended}
            onResetToDefault={handleResetToDefault}
            onShowToast={showToast}
          />
        ) : (
          /* GENERATOR VIEW (Default) */
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
                  onClick={() => setIsShareModalOpen(true)}
                  className="text-xs text-emerald-300 hover:text-emerald-200 font-bold underline cursor-pointer"
                >
                  🔗 1회성 리스트 공유 &rarr;
                </button>
                {(showEditor || isAdmin) && (
                  <>
                    <span className="text-slate-700">|</span>
                    <button
                      onClick={() => setActiveView('editor')}
                      className="text-xs text-slate-400 hover:text-emerald-300 underline font-medium cursor-pointer"
                    >
                      음원 데이터 검증/수정 &rarr;
                    </button>
                  </>
                )}
                <span className="text-slate-700">|</span>
                <button
                  onClick={() => setIsGuideOpen(true)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
                >
                  스밍 가이드 &rarr;
                </button>
              </div>
            </div>

            {/* Notice / Spin Feedback Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-slate-900/80 to-teal-950/50 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <span className="text-xl flex-shrink-0">📢</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100">스밍 메이커 오픈 안내 & 오류 제보</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">NOTICE</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    스밍 메이커가 오픈되었습니다! 신곡/수록곡 데이터 오류나 기능 건의사항은 스핀(Spin)으로 편하게 제보해주세요.
                  </p>
                </div>
              </div>

              <a
                href="https://spin-spin.com/live_in_fore?v=1787707988790"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-200 text-xs font-bold border border-emerald-500/40 cursor-pointer transition-all shadow-sm whitespace-nowrap flex-shrink-0"
              >
                <span>스핀(Spin) 오류 제보하기</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

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
                  onGenerate={handleGenerate}
                  onOpenCatalog={() => setIsCatalogOpen(true)}
                  onReset={handleReset}
                  playlistLength={playlist.length}
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
                  onLoadRecommended={handleLoadRecommended}
                  targetDurationSeconds={targetDurationMinutes * 60}
                  artists={artists}
                />
              </div>
            </div>

            {/* One-Click Action Platform Panel */}
            <PlatformActions
              playlist={playlist}
              youtubeUrl={youtubeUrl}
              onChangeYoutubeUrl={setYoutubeUrl}
              onShowToast={showToast}
            />
          </>
        )}
      </main>

      {/* Footer - Credits */}
      <footer className="mt-12 border-t border-slate-900 bg-slate-950/90 py-10 space-y-6">
        <div className="max-w-2xl mx-auto px-4 space-y-4">
          {/* Header Title */}
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800">
            <Users className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-indigo-300">
              만든 사람들 (Credits)
            </h3>
          </div>

          {/* Cards Container */}
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
            {/* Card 1: Feedback & Error Report */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-100">
                  오류 제보 및 피드백 문의
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Inquiry & Feedback
                </p>
              </div>

              <a
                href="https://spin-spin.com/live_in_fore?v=1787707988790"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-indigo-200 hover:text-white text-xs font-semibold border border-slate-700/80 flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shadow-sm"
              >
                <span>스핀(Spin)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Card 2: Developer Credits */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-100">
                  기획 및 제작
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Sming Maker Developer
                </p>
              </div>

              <a
                href="https://x.com/live_in_fore"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-indigo-200 hover:text-white text-xs font-semibold border border-slate-700/80 flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shadow-sm"
              >
                <span>@live_in_fore</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Copyright & Disclaimer */}
          <div className="text-center text-xs text-slate-500 space-y-1 pt-2">
            <p>포레스텔라 & 숲별을 위한 비영리 팬메이드 원클릭 스밍리스트 생성기입니다.</p>
            <p className="text-slate-600 text-[11px]">
              Made with 💚 for Forestella & Soopbyeol
            </p>
          </div>
        </div>
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

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        playlist={playlist}
        youtubeUrl={youtubeUrl}
        onShowToast={showToast}
      />

      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onShowToast={showToast}
      />
    </div>
  );
}
