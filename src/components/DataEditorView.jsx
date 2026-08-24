import React, { useState, useMemo, useEffect } from 'react';
import { 
  Music, 
  Users, 
  RefreshCw, 
  Download, 
  Upload, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  FileJson,
  Calendar,
  Clock,
  Code2,
  Save,
  FileCode,
  Zap,
  Loader2,
  ArrowUpDown,
  ListFilter,
  ShieldCheck,
  AlertTriangle,
  RotateCw
} from 'lucide-react';
import { formatSecondsToTime, formatDate } from '../utils/formatters';
import SongEditorModal from './SongEditorModal';
import ArtistEditorModal from './ArtistEditorModal';
import { syncArtistTracks } from '../utils/platformSync';

export default function DataEditorView({
  songs,
  onUpdateSongs,
  artists,
  onUpdateArtists,
  onResetToDefault,
  onShowToast
}) {
  const [activeTab, setActiveTab] = useState('artist_songs'); // 'artist_songs' | 'all_songs' | 'raw_json' | 'sync'
  
  // Selected artist in artist-centric view (Default: '완전체' 우선 선택, LocalStorage 기억)
  const [selectedArtistId, setSelectedArtistId] = useState(() => {
    try {
      const saved = localStorage.getItem('sming_editor_selected_artist');
      if (saved && artists.some(a => a.id === saved)) {
        return saved;
      }
    } catch (e) {}
    const groupArtist = artists.find(a => a.category === 'group' || a.id === 'group');
    return groupArtist ? groupArtist.id : (artists[0]?.id || 'group');
  });

  // Persist selectedArtistId to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('sming_editor_selected_artist', selectedArtistId);
    } catch (e) {}
  }, [selectedArtistId]);

  const [artistSongSearch, setArtistSongSearch] = useState('');
  const [sortBy, setSortBy] = useState('date_desc'); // 'date_desc' | 'date_asc' | 'title' | 'duration'


  // Global search for all_songs tab
  const [searchQuery, setSearchQuery] = useState('');
  const [filterArtist, setFilterArtist] = useState('all');
  const [copiedType, setCopiedType] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync states for individual / all artists
  const [syncingArtistId, setSyncingArtistId] = useState(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncProgressText, setSyncProgressText] = useState('');

  // Raw JSON Editor State
  const [rawTarget, setRawTarget] = useState('songs'); // 'songs' | 'artists'
  const [rawText, setRawText] = useState('');
  const [jsonError, setJsonError] = useState(null);

  // Sync raw text when switching to raw_json tab or when songs/artists update
  useEffect(() => {
    if (rawTarget === 'songs') {
      setRawText(JSON.stringify(songs, null, 2));
    } else {
      setRawText(JSON.stringify(artists, null, 2));
    }
    setJsonError(null);
  }, [rawTarget, activeTab, songs, artists]);

  // Modals
  const [editingSong, setEditingSong] = useState(null);
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState(null);
  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false);

  // Active artist object in artist-centric view
  const currentArtistObj = useMemo(() => {
    return artists.find(a => a.id === selectedArtistId) || artists[0];
  }, [artists, selectedArtistId]);

  // Songs filtered and sorted for the selected artist
  const artistSongs = useMemo(() => {
    if (!currentArtistObj) return [];
    let list = songs.filter(s => s.artistType === currentArtistObj.id);

    // Search filter
    if (artistSongSearch.trim()) {
      const q = artistSongSearch.toLowerCase();
      list = list.filter(s => 
        s.title?.toLowerCase().includes(q) ||
        s.album?.toLowerCase().includes(q) ||
        s.releaseDate?.includes(q) ||
        s.platformIds?.melon?.includes(q) ||
        s.platformIds?.genie?.includes(q) ||
        s.platformIds?.bugs?.includes(q)
      );
    }

    // Sort
    return list.sort((a, b) => {
      if (sortBy === 'date_desc') {
        return (b.releaseDate || '').localeCompare(a.releaseDate || '');
      } else if (sortBy === 'date_asc') {
        return (a.releaseDate || '').localeCompare(b.releaseDate || '');
      } else if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      } else if (sortBy === 'duration') {
        return (b.duration || 0) - (a.duration || 0);
      }
      return 0;
    });
  }, [songs, currentArtistObj, artistSongSearch, sortBy]);

  // Filtered songs for all_songs tab
  const filteredAllSongs = useMemo(() => {
    return songs.filter(song => {
      if (filterArtist !== 'all' && song.artistType !== filterArtist) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = song.title?.toLowerCase().includes(q);
        const matchesArtist = song.artist?.toLowerCase().includes(q);
        const matchesAlbum = song.album?.toLowerCase().includes(q);
        const matchesDate = song.releaseDate?.includes(q);
        const matchesId = song.platformIds?.melon?.includes(q) || song.platformIds?.genie?.includes(q) || song.platformIds?.bugs?.includes(q);
        if (!matchesTitle && !matchesArtist && !matchesAlbum && !matchesDate && !matchesId) return false;
      }
      return true;
    });
  }, [songs, searchQuery, filterArtist]);

  // Handle Song CRUD
  const handleSaveSong = (savedSong) => {
    const songWithFlag = {
      ...savedSong,
      userEdited: true // mark as manually edited
    };
    const exists = songs.some(s => s.id === songWithFlag.id);
    if (exists) {
      onUpdateSongs(songs.map(s => s.id === songWithFlag.id ? songWithFlag : s));
      onShowToast(`'${songWithFlag.title}' 곡 정보가 수정되었습니다. (사용자 수정 보호 활성화)`);
    } else {
      onUpdateSongs([songWithFlag, ...songs]);
      onShowToast(`새 곡 '${songWithFlag.title}'이(가) 등록되었습니다. (사용자 수정 보호 활성화)`);
    }
  };

  const handleDeleteSong = (songId, title) => {
    if (window.confirm(`'${title}' 곡을 데이터베이스에서 삭제하시겠습니까?`)) {
      onUpdateSongs(songs.filter(s => s.id !== songId));
      onShowToast(`'${title}' 곡이 삭제되었습니다.`);
    }
  };

  const handleDuplicateSong = (song) => {
    const duplicated = {
      ...song,
      id: `song-${Date.now()}`,
      title: `${song.title} (사본)`,
      userEdited: true
    };
    onUpdateSongs([duplicated, ...songs]);
    onShowToast(`'${song.title}' 곡이 복제되었습니다.`);
  };

  // Toggle userEdited flag
  const handleToggleUserEdited = (songId) => {
    onUpdateSongs(songs.map(s => {
      if (s.id === songId) {
        const nextState = !s.userEdited;
        onShowToast(`'${s.title}' 곡의 사용자 수정 보호가 ${nextState ? '설정' : '해제'}되었습니다.`);
        return { ...s, userEdited: nextState };
      }
      return s;
    }));
  };

  // Handle Artist CRUD
  const handleSaveArtist = (savedArtist) => {
    const exists = artists.some(a => a.id === savedArtist.id);
    if (exists) {
      onUpdateArtists(artists.map(a => a.id === savedArtist.id ? savedArtist : a));
      onShowToast(`아티스트 '${savedArtist.name}' 정보가 수정되었습니다.`);
    } else {
      onUpdateArtists([...artists, savedArtist]);
      setSelectedArtistId(savedArtist.id);
      onShowToast(`새 아티스트 '${savedArtist.name}'이(가) 추가되었습니다.`);
    }
  };

  const handleDeleteArtist = (artistId, name) => {
    if (artists.length <= 1) {
      alert('최소 1명의 아티스트는 유지되어야 합니다.');
      return;
    }
    if (window.confirm(`'${name}' 아티스트를 삭제하시겠습니까?`)) {
      const nextArtists = artists.filter(a => a.id !== artistId);
      onUpdateArtists(nextArtists);
      setSelectedArtistId(nextArtists[0]?.id || 'group');
      onShowToast(`아티스트 '${name}'이(가) 삭제되었습니다.`);
    }
  };

  // Platform Sync for a Single Artist (Supports 'smart' or 'overwrite')
  const handleSyncSingleArtist = async (artist, mode = 'smart') => {
    if (mode === 'overwrite') {
      const ok = window.confirm(
        `[${artist.name}] 아티스트의 모든 곡을 음원 사이트 최신 원본 데이터로 전체 덮어쓰시겠습니까?\n(직접 수정한 곡 정보가 모두 원본으로 초기화됩니다)`
      );
      if (!ok) return;
    }

    setSyncingArtistId(artist.id);
    try {
      const { updatedSongs, stats } = await syncArtistTracks(
        artist,
        songs,
        (msg) => setSyncProgressText(msg),
        { mode }
      );
      onUpdateSongs(updatedSongs);

      if (mode === 'smart') {
        onShowToast(
          `[${artist.name}] 스마트 동기화 완료! (+${stats.addedCount}곡 추가, ${stats.updatedCount}곡 갱신${stats.protectedCount ? `, ${stats.protectedCount}곡 수정본 보호됨 🛡️` : ''})`
        );
      } else {
        onShowToast(
          `[${artist.name}] 전체 원본 덮어쓰기 완료! (+${stats.addedCount}곡 추가, ${stats.updatedCount}곡 갱신) ✨`
        );
      }
    } catch (err) {
      alert(`[${artist.name}] 동기화 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setSyncingArtistId(null);
      setSyncProgressText('');
    }
  };

  // Platform Sync for ALL Artists (Supports 'smart' or 'overwrite')
  const handleSyncAllArtists = async (mode = 'smart') => {
    if (isSyncingAll) return;

    if (mode === 'overwrite') {
      const ok = window.confirm(
        '등록된 모든 아티스트의 음원 데이터를 플랫폼 원본으로 전체 덮어쓰시겠습니까?\n(사용자가 직접 수정한 곡 정보가 모두 원본 데이터로 초기화됩니다)'
      );
      if (!ok) return;
    }

    setIsSyncingAll(true);
    let current = [...songs];
    let totalAdded = 0;
    let totalUpdated = 0;
    let totalProtected = 0;

    try {
      for (let i = 0; i < artists.length; i++) {
        const a = artists[i];
        const { updatedSongs, stats } = await syncArtistTracks(
          a,
          current,
          (msg) => setSyncProgressText(`[${i + 1}/${artists.length}] ${msg}`),
          { mode }
        );
        current = updatedSongs;
        totalAdded += stats.addedCount;
        totalUpdated += stats.updatedCount;
        totalProtected += (stats.protectedCount || 0);
      }
      onUpdateSongs(current);

      if (mode === 'smart') {
        onShowToast(
          `전체 아티스트 스마트 동기화 완료! (+${totalAdded}곡 추가, ${totalUpdated}곡 갱신${totalProtected ? `, ${totalProtected}곡 수정본 보호됨 🛡️` : ''})`
        );
      } else {
        onShowToast(
          `전체 아티스트 원본 덮어쓰기 완료! (+${totalAdded}곡 추가, ${totalUpdated}곡 갱신) ✨`
        );
      }
    } catch (err) {
      alert(`전체 동기화 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setIsSyncingAll(false);
      setSyncProgressText('');
    }
  };

  // Raw JSON Save
  const handleSaveRawJson = () => {
    try {
      const parsed = JSON.parse(rawText);
      if (!Array.isArray(parsed)) {
        setJsonError('최상위 구조는 배열([]) 형태여야 합니다.');
        return;
      }

      if (rawTarget === 'songs') {
        onUpdateSongs(parsed);
        onShowToast(`음원 목록(${parsed.length}곡)이 직접 수정되어 적용되었습니다! ✨`);
      } else {
        onUpdateArtists(parsed);
        onShowToast(`아티스트 목록(${parsed.length}명)이 직접 수정되어 적용되었습니다! ✨`);
      }
      setJsonError(null);
    } catch (e) {
      setJsonError(`JSON 문법 오류: ${e.message}`);
    }
  };

  // Format JSON
  const handlePrettifyRawJson = () => {
    try {
      const parsed = JSON.parse(rawText);
      setRawText(JSON.stringify(parsed, null, 2));
      setJsonError(null);
      onShowToast('JSON 서식이 깔끔하게 정렬되었습니다.');
    } catch (e) {
      setJsonError(`서식 정렬 불가: ${e.message}`);
    }
  };

  // Remote Sync from GitHub Raw
  const handleSyncFromGithub = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('https://raw.githubusercontent.com/foretissimo/sming-maker/main/src/data/songs.json');
      if (!res.ok) throw new Error('GitHub 최신 데이터를 가져올 수 없습니다.');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        onUpdateSongs(data);
        onShowToast(`GitHub 최신 데이터(${data.length}곡)와 성공적으로 동기화되었습니다! 🚀`);
      }
    } catch (e) {
      alert(`동기화 실패: ${e.message}\n로컬 저장소의 데이터를 유지합니다.`);
    } finally {
      setIsSyncing(false);
    }
  };

  // JSON Export & Copy
  const handleExportJson = (data, filename) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast(`${filename} 파일이 다운로드되었습니다.`);
  };

  const handleCopyJson = (data, type) => {
    const jsonStr = JSON.stringify(data, null, 2);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(jsonStr);
      setCopiedType(type);
      onShowToast('JSON 데이터가 클립보드에 복사되었습니다.');
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  // JSON Import
  const handleImportJsonFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed)) {
          if (parsed[0]?.category) {
            onUpdateArtists(parsed);
            onShowToast(`아티스트 목록(${parsed.length}명)을 성공적으로 불러왔습니다.`);
          } else {
            onUpdateSongs(parsed);
            onShowToast(`음원 데이터(${parsed.length}곡)를 성공적으로 불러왔습니다.`);
          }
        }
      } catch (err) {
        alert('올바른 JSON 파일 형식이 아닙니다.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Count user-edited songs
  const userEditedCount = useMemo(() => {
    return songs.filter(s => s.userEdited).length;
  }, [songs]);

  return (
    <div className="space-y-6">
      {/* Sub Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg">
        <div className="flex gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('artist_songs')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'artist_songs'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>아티스트별 곡 관리 & 편집</span>
          </button>

          <button
            onClick={() => setActiveTab('all_songs')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all_songs'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>전체 음원 목록 ({songs.length}곡)</span>
            {userEditedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30">
                수정 {userEditedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('raw_json')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'raw_json'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Code2 className="w-4 h-4 text-teal-400" />
            <span>JSON 텍스트 직접 편집</span>
          </button>

          <button
            onClick={() => setActiveTab('sync')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sync'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>백업 / 내보내기</span>
          </button>
        </div>

        {/* Global Dual Sync Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Mode 1: Smart Sync (Protects User Edits) */}
          <button
            onClick={() => handleSyncAllArtists('smart')}
            disabled={isSyncingAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 text-xs font-bold cursor-pointer shadow-md disabled:opacity-50 transition-all"
            title="사용자가 직접 수정한 곡 정보를 보존하면서, 신곡 추가 및 미수정 곡의 발매일/길이를 동기화합니다."
          >
            {isSyncingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" /> : <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />}
            <span>{isSyncingAll ? '동기화 중...' : '⚡ 스마트 동기화 (수정본 보호)'}</span>
          </button>

          {/* Mode 2: Overwrite All (Full Platform Reset) */}
          <button
            onClick={() => handleSyncAllArtists('overwrite')}
            disabled={isSyncingAll}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 text-xs font-semibold cursor-pointer disabled:opacity-50 transition-all"
            title="사용자 수정 내역을 무시하고 음원 사이트 원본 데이터로 전체 덮어씁니다."
          >
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span className="hidden sm:inline">전체 원본 덮어쓰기</span>
          </button>
        </div>
      </div>

      {/* Sync Progress Banner */}
      {syncProgressText && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-medium animate-pulse shadow-sm">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400 flex-shrink-0" />
          <span>{syncProgressText}</span>
        </div>
      )}

      {/* TAB 1: ARTIST-CENTRIC SONG VIEW & EDITING */}
      {activeTab === 'artist_songs' && currentArtistObj && (
        <div className="space-y-5">
          {/* Artist Selector Pills Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                조회 및 편집할 아티스트 선택
              </span>
              <button
                onClick={() => { setEditingArtist(null); setIsArtistModalOpen(true); }}
                className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Plus className="w-3 h-3" />
                <span>새 아티스트 등록</span>
              </button>
            </div>

            {/* Artist Pills */}
            <div className="flex flex-wrap gap-2">
              {artists.map((artist) => {
                const isSelected = artist.id === selectedArtistId;
                const count = songs.filter(s => s.artistType === artist.id).length;
                const editedCount = songs.filter(s => s.artistType === artist.id && s.userEdited).length;
                return (
                  <button
                    key={artist.id}
                    onClick={() => { setSelectedArtistId(artist.id); setArtistSongSearch(''); }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center gap-2 ${
                      isSelected
                        ? `${artist.badgeColor} shadow-md shadow-emerald-950/40 ring-1 ring-emerald-400/40 scale-105`
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span>{artist.name}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/80 text-slate-300 border border-slate-700/60 font-mono">
                      {count}곡
                    </span>
                    {editedCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-violet-400" title={`수정된 곡 ${editedCount}개 포함`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Artist Detailed Card & Dual Sync Actions */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded-xl text-sm font-bold border ${currentArtistObj.badgeColor}`}>
                  {currentArtistObj.name}
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    {currentArtistObj.name} 음원 관리
                  </h3>
                  <p className="text-xs text-slate-400">
                    {currentArtistObj.category === 'group' ? '그룹(완전체)' : '솔로(개인)'} • 등록된 곡 총 <strong className="text-emerald-300">{artistSongs.length}곡</strong>
                    {artistSongs.filter(s => s.userEdited).length > 0 && (
                      <span className="ml-1.5 text-violet-300 font-medium">
                        (직접 수정됨 {artistSongs.filter(s => s.userEdited).length}곡)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Action Buttons for this Artist */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* 1. Smart Sync (Protects Edits) */}
                <button
                  onClick={() => handleSyncSingleArtist(currentArtistObj, 'smart')}
                  disabled={syncingArtistId === currentArtistObj.id || isSyncingAll}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 text-xs font-bold cursor-pointer disabled:opacity-50 transition-all shadow-sm"
                  title="직접 수정한 곡은 건너뛰고 나머지 곡만 최신 데이터로 동기화합니다."
                >
                  <ShieldCheck className={`w-3.5 h-3.5 text-emerald-400 ${syncingArtistId === currentArtistObj.id ? 'animate-spin' : ''}`} />
                  <span>{syncingArtistId === currentArtistObj.id ? '동기화 중...' : '🔄 스마트 동기화'}</span>
                </button>

                {/* 2. Overwrite Sync */}
                <button
                  onClick={() => handleSyncSingleArtist(currentArtistObj, 'overwrite')}
                  disabled={syncingArtistId === currentArtistObj.id || isSyncingAll}
                  className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-950 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 text-xs font-medium cursor-pointer disabled:opacity-50 transition-all"
                  title="사용자 수정을 무시하고 이 아티스트의 모든 곡을 원본으로 덮어씁니다."
                >
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  <span>원본 덮어쓰기</span>
                </button>

                <button
                  onClick={() => {
                    setEditingSong({
                      id: `song-${Date.now()}`,
                      title: '',
                      artist: currentArtistObj.name,
                      artistType: currentArtistObj.id,
                      album: '',
                      releaseDate: '',
                      duration: 225,
                      isTitle: false,
                      userEdited: true,
                      platformIds: { melon: '', genie: '', bugs: '' },
                      tags: []
                    });
                    setIsSongModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-md transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>새 곡 등록</span>
                </button>

                <button
                  onClick={() => { setEditingArtist(currentArtistObj); setIsArtistModalOpen(true); }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors border border-slate-700"
                  title="아티스트 ID 수정"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Platform Cross-Verification Links Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              {/* Melon */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-[#00cd3c] text-slate-950 flex items-center justify-center font-black text-[10px]">M</span>
                  <span className="text-slate-400">멜론 ID:</span>
                  <span className="font-mono text-emerald-400 font-bold">{currentArtistObj.platformArtistIds?.melon || '미설정'}</span>
                </div>
                {currentArtistObj.platformArtistIds?.melon && (
                  <a
                    href={`https://www.melon.com/artist/timeline.htm?artistId=${currentArtistObj.platformArtistIds.melon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px] font-medium"
                  >
                    공식 곡 목록 <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Genie */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-[#0092fa] text-white flex items-center justify-center font-black text-[10px]">G</span>
                  <span className="text-slate-400">지니 ID:</span>
                  <span className="font-mono text-sky-400 font-bold">{currentArtistObj.platformArtistIds?.genie || '미설정'}</span>
                </div>
                {currentArtistObj.platformArtistIds?.genie && (
                  <a
                    href={`https://www.genie.co.kr/detail/artistInfo?xxnm=${currentArtistObj.platformArtistIds.genie}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:underline flex items-center gap-1 text-[11px] font-medium"
                  >
                    공식 곡 목록 <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Bugs */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-[#f9423a] text-white flex items-center justify-center font-black text-[10px]">B</span>
                  <span className="text-slate-400">벅스 ID:</span>
                  <span className="font-mono text-rose-400 font-bold">{currentArtistObj.platformArtistIds?.bugs || '미설정'}</span>
                </div>
                {currentArtistObj.platformArtistIds?.bugs && (
                  <a
                    href={`https://music.bugs.co.kr/artist/${currentArtistObj.platformArtistIds.bugs}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rose-400 hover:underline flex items-center gap-1 text-[11px] font-medium"
                  >
                    공식 곡 목록 <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Search, Sort & Filter Bar for this Artist */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={artistSongSearch}
                onChange={(e) => setArtistSongSearch(e.target.value)}
                placeholder={`[${currentArtistObj.name}] 곡명, 앨범명, 발매일, SongID 검색...`}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                정렬:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="date_desc">📅 발매일 최신순 (최근곡 우선)</option>
                <option value="date_asc">📅 발매일 오래된순 (과거순)</option>
                <option value="title">🔤 곡명 가나다순</option>
                <option value="duration">⏱️ 재생시간 긴 순</option>
              </select>
            </div>
          </div>

          {/* Songs Table for this Artist */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="py-3 px-3 w-12 text-center">#</th>
                    <th className="py-3 px-4">곡명 & 앨범</th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">📅 발매일 / 등록일</th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">⏱️ 재생시간</th>
                    <th className="py-3 px-3">음원 사이트 곡 ID (교차검증 🔗)</th>
                    <th className="py-3 px-3 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {artistSongs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-500">
                        {artistSongSearch ? '검색 조건에 맞는 곡이 없습니다.' : `등록된 '${currentArtistObj.name}' 곡이 없습니다. [새 곡 등록] 또는 [음원 자동 동기화]를 실행해 보세요.`}
                      </td>
                    </tr>
                  ) : (
                    artistSongs.map((song, idx) => {
                      return (
                        <tr key={song.id} className="hover:bg-slate-950/40 transition-colors">
                          {/* Index */}
                          <td className="py-3 px-3 text-center font-mono text-slate-500">
                            {idx + 1}
                          </td>

                          {/* Title & Album */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-100 text-xs sm:text-sm">{song.title}</span>
                              {song.isTitle && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  ⭐ 타이틀
                                </span>
                              )}
                              {song.userEdited && (
                                <button
                                  onClick={() => handleToggleUserEdited(song.id)}
                                  className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-0.5 cursor-pointer hover:bg-violet-500/30"
                                  title="사용자가 직접 수정한 곡입니다. 스마트 동기화 시 데이터가 보호됩니다. 클릭하면 보호 해제/설정 가능"
                                >
                                  <span>✍️ 수정됨</span>
                                </button>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                              <span className="text-slate-400">{song.album}</span>
                            </div>
                          </td>

                          {/* Release Date */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {song.releaseDate && song.releaseDate.trim() ? (
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-200">
                                <Calendar className="w-3 h-3 text-emerald-400" />
                                <span>{formatDate(song.releaseDate)}</span>
                              </div>
                            ) : (
                              <span className="text-slate-600 font-mono text-xs">-</span>
                            )}
                          </td>

                          {/* Duration */}
                          <td className="py-3 px-3 text-center font-mono text-slate-300 whitespace-nowrap">
                            <span className="font-semibold">{formatSecondsToTime(song.duration)}</span>
                            <span className="block text-[10px] text-slate-500">({song.duration}초)</span>
                          </td>

                          {/* Platform Song IDs */}
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                              {/* Melon */}
                              {song.platformIds?.melon ? (
                                <a
                                  href={`https://www.melon.com/song/detail.htm?songId=${song.platformIds.melon}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/40 text-emerald-300 flex items-center gap-1 transition-colors"
                                  title="멜론 곡 상세 페이지에서 일치 여부 확인"
                                >
                                  <span>M: {song.platformIds.melon}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ) : (
                                <span className="px-1.5 py-0.5 text-slate-600 rounded bg-slate-950/60">M: -</span>
                              )}

                              {/* Genie */}
                              {song.platformIds?.genie ? (
                                <a
                                  href={`https://www.genie.co.kr/detail/songInfo?xgnm=${song.platformIds.genie}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-0.5 rounded bg-sky-950/60 hover:bg-sky-900 border border-sky-700/40 text-sky-300 flex items-center gap-1 transition-colors"
                                  title="지니 곡 상세 페이지에서 일치 여부 확인"
                                >
                                  <span>G: {song.platformIds.genie}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ) : (
                                <span className="px-1.5 py-0.5 text-slate-600 rounded bg-slate-950/60">G: -</span>
                              )}

                              {/* Bugs */}
                              {song.platformIds?.bugs ? (
                                <a
                                  href={`https://music.bugs.co.kr/track/${song.platformIds.bugs}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-700/40 text-rose-300 flex items-center gap-1 transition-colors"
                                  title="벅스 곡 상세 페이지에서 일치 여부 확인"
                                >
                                  <span>B: {song.platformIds.bugs}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ) : (
                                <span className="px-1.5 py-0.5 text-slate-600 rounded bg-slate-950/60">B: -</span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => { setEditingSong(song); setIsSongModalOpen(true); }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800 cursor-pointer"
                                title="곡 정보 수정"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDuplicateSong(song)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-slate-800 cursor-pointer"
                                title="복제"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSong(song.id, song.title)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 cursor-pointer"
                                title="삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL SONGS MANAGEMENT */}
      {activeTab === 'all_songs' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="곡명, 앨범명, 가수, 발매일, 또는 SongID 검색..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">가수 필터:</span>
              <select
                value={filterArtist}
                onChange={(e) => setFilterArtist(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">전체 아티스트 ({songs.length}곡)</option>
                {artists.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({songs.filter(s => s.artistType === a.id).length}곡)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* All Songs Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="py-3 px-3 w-12 text-center">#</th>
                    <th className="py-3 px-4">곡명 & 앨범</th>
                    <th className="py-3 px-3">가수</th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">📅 발매일</th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">⏱️ 시간</th>
                    <th className="py-3 px-3">플랫폼별 곡 ID (교차검증 🔗)</th>
                    <th className="py-3 px-3 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAllSongs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-500">
                        검색 조건에 맞는 음원이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredAllSongs.map((song, idx) => {
                      const artistObj = artists.find(a => a.id === song.artistType);
                      return (
                        <tr key={song.id} className="hover:bg-slate-950/40 transition-colors">
                          <td className="py-3 px-3 text-center font-mono text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-100">{song.title}</span>
                              {song.isTitle && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  ⭐ 타이틀
                                </span>
                              )}
                              {song.userEdited && (
                                <button
                                  onClick={() => handleToggleUserEdited(song.id)}
                                  className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-0.5 cursor-pointer hover:bg-violet-500/30"
                                  title="사용자가 직접 수정한 곡입니다. 스마트 동기화 시 데이터가 보호됩니다."
                                >
                                  <span>✍️ 수정됨</span>
                                </button>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                              {song.album}
                            </div>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                              artistObj ? artistObj.badgeColor : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}>
                              {song.artist}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap font-mono text-[11px] text-slate-300">
                            {song.releaseDate && song.releaseDate.trim() ? formatDate(song.releaseDate) : <span className="text-slate-600 font-mono text-xs">-</span>}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-300 whitespace-nowrap">
                            {formatSecondsToTime(song.duration)}
                            <span className="block text-[10px] text-slate-500">({song.duration}s)</span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                              {song.platformIds?.melon ? (
                                <a
                                  href={`https://www.melon.com/song/detail.htm?songId=${song.platformIds.melon}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/40 text-emerald-300 flex items-center gap-1 transition-colors"
                                >
                                  <span>M: {song.platformIds.melon}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ) : (
                                <span className="text-slate-600">M: -</span>
                              )}

                              {song.platformIds?.genie ? (
                                <a
                                  href={`https://www.genie.co.kr/detail/songInfo?xgnm=${song.platformIds.genie}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-0.5 rounded bg-sky-950/60 hover:bg-sky-900 border border-sky-700/40 text-sky-300 flex items-center gap-1 transition-colors"
                                >
                                  <span>G: {song.platformIds.genie}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ) : (
                                <span className="text-slate-600">G: -</span>
                              )}

                              {song.platformIds?.bugs ? (
                                <a
                                  href={`https://music.bugs.co.kr/track/${song.platformIds.bugs}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-700/40 text-rose-300 flex items-center gap-1 transition-colors"
                                >
                                  <span>B: {song.platformIds.bugs}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ) : (
                                <span className="text-slate-600">B: -</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => { setEditingSong(song); setIsSongModalOpen(true); }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800 cursor-pointer"
                                title="수정"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDuplicateSong(song)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-slate-800 cursor-pointer"
                                title="복제"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSong(song.id, song.title)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 cursor-pointer"
                                title="삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RAW JSON CODE EDITOR (DIRECT FREEDOM TO EDIT) */}
      {activeTab === 'raw_json' && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          {/* Header & Mode Switcher */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-emerald-400" />
                <h4 className="text-base font-bold text-slate-100">JSON 텍스트 직접 편집기</h4>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                아래 텍스트 창에서 곡 또는 아티스트 데이터를 직접 JSON으로 수정하고 <strong>[변경사항 적용]</strong>을 누르세요.
              </p>
            </div>

            {/* Target Switcher */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRawTarget('songs')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  rawTarget === 'songs'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                songs.json ({songs.length}곡)
              </button>
              <button
                onClick={() => setRawTarget('artists')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  rawTarget === 'artists'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                artists.json ({artists.length}명)
              </button>
            </div>
          </div>

          {/* Local File Path Guide */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <FileCode className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-slate-400">로컬 소스 파일 경로:</span>
              <code className="text-emerald-300 font-mono text-[11px] truncate bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {rawTarget === 'songs' ? 'src/data/songs.json' : 'src/data/artists.json'}
              </code>
            </div>
            <button
              onClick={() => handleCopyJson(rawTarget === 'songs' ? songs : artists, 'raw_target')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer flex-shrink-0"
            >
              {copiedType === 'raw_target' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>전체 복사</span>
            </button>
          </div>

          {/* Error Banner */}
          {jsonError && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{jsonError}</span>
            </div>
          )}

          {/* Large Code Textarea */}
          <div className="relative">
            <textarea
              value={rawText}
              onChange={(e) => { setRawText(e.target.value); setJsonError(null); }}
              rows={22}
              spellCheck={false}
              className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-emerald-400 leading-relaxed focus:outline-none focus:border-emerald-500 transition-colors selection:bg-emerald-600 selection:text-slate-950"
            />
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex gap-2">
              <button
                onClick={handlePrettifyRawJson}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                JSON 서식 정리 (Prettify)
              </button>
              <button
                onClick={() => {
                  if (rawTarget === 'songs') setRawText(JSON.stringify(songs, null, 2));
                  else setRawText(JSON.stringify(artists, null, 2));
                  setJsonError(null);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 text-xs transition-colors cursor-pointer border border-slate-800"
              >
                되돌리기
              </button>
            </div>

            <button
              onClick={handleSaveRawJson}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/60 cursor-pointer"
            >
              <Save className="w-4 h-4 fill-current" />
              <span>변경사항 즉시 적용하기</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: DATA SYNC, EXPORT & BACKUP */}
      {activeTab === 'sync' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Remote Sync Panel */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-bold text-slate-100">GitHub 원격 최신 데이터 동기화</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              GitHub 저장소(`foretissimo/sming-maker`)의 메인 브랜치에 업데이트된 최신 곡 목록을 웹 브라우저로 즉시 불러와 동기화합니다.
            </p>
            <button
              onClick={handleSyncFromGithub}
              disabled={isSyncing}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? '동기화 진행 중...' : 'GitHub에서 최신 데이터 가져오기'}</span>
            </button>
          </div>

          {/* Reset to Default */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-400" />
              <h4 className="text-sm font-bold text-slate-100">초기 기본 데이터셋 복원</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              사용자 정의 수정 사항을 취소하고 웹앱에 내장된 원본 기본 포레스텔라 & 4인 솔로 데이터셋으로 되돌립니다.
            </p>
            <button
              onClick={() => {
                if (window.confirm('모든 사용자 수정 사항을 취소하고 기본 데이터셋으로 초기화하시겠습니까?')) {
                  onResetToDefault();
                  onShowToast('기본 데이터셋으로 초기화되었습니다.');
                }
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>기본 데이터로 초기화</span>
            </button>
          </div>

          {/* Export JSON (For committing back to Git) */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-sky-400" />
              <h4 className="text-sm font-bold text-slate-100">JSON 파일 내보내기 & 복사</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              편집기에서 수정한 최신 곡 목록 또는 아티스트 데이터를 JSON 파일로 다운로드하거나 복사하여 GitHub 저장소 파일로 덮어쓸 수 있습니다.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleExportJson(songs, 'songs.json')}
                className="py-2 px-3 rounded-xl bg-sky-950 hover:bg-sky-900 border border-sky-600/40 text-sky-300 text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>songs.json 다운로드</span>
              </button>
              <button
                onClick={() => handleCopyJson(songs, 'songs')}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5"
              >
                {copiedType === 'songs' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>곡 JSON 복사</span>
              </button>
            </div>
          </div>

          {/* Import JSON File */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-rose-400" />
              <h4 className="text-sm font-bold text-slate-100">JSON 파일 직접 불러오기</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              수정한 `songs.json` 또는 `artists.json` 파일을 선택하여 현재 브라우저에 즉시 로드합니다.
            </p>
            <label className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 cursor-pointer">
              <Upload className="w-4 h-4 text-rose-400" />
              <span>JSON 파일 선택하여 적용</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJsonFile}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {/* Modals */}
      <SongEditorModal
        isOpen={isSongModalOpen}
        onClose={() => setIsSongModalOpen(false)}
        onSave={handleSaveSong}
        songToEdit={editingSong}
        artists={artists}
      />

      <ArtistEditorModal
        isOpen={isArtistModalOpen}
        onClose={() => setIsArtistModalOpen(false)}
        onSave={handleSaveArtist}
        artistToEdit={editingArtist}
      />
    </div>
  );
}
