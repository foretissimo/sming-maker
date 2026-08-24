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
  Loader2
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
  const [activeTab, setActiveTab] = useState('songs'); // 'songs' | 'artists' | 'raw_json' | 'sync'
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
  }, [rawTarget, activeTab]);

  // Modals
  const [editingSong, setEditingSong] = useState(null);
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState(null);
  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false);

  // Filtered songs
  const filteredSongs = useMemo(() => {
    return songs.filter(song => {
      if (filterArtist !== 'all' && song.artistType !== filterArtist) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = song.title?.toLowerCase().includes(q);
        const matchesArtist = song.artist?.toLowerCase().includes(q);
        const matchesAlbum = song.album?.toLowerCase().includes(q);
        const matchesId = song.platformIds?.melon?.includes(q) || song.platformIds?.genie?.includes(q) || song.platformIds?.bugs?.includes(q);
        if (!matchesTitle && !matchesArtist && !matchesAlbum && !matchesId) return false;
      }
      return true;
    });
  }, [songs, searchQuery, filterArtist]);

  // Handle Song CRUD
  const handleSaveSong = (savedSong) => {
    const exists = songs.some(s => s.id === savedSong.id);
    if (exists) {
      onUpdateSongs(songs.map(s => s.id === savedSong.id ? savedSong : s));
      onShowToast(`'${savedSong.title}' 곡 정보가 수정되었습니다.`);
    } else {
      onUpdateSongs([savedSong, ...songs]);
      onShowToast(`새 곡 '${savedSong.title}'이(가) 등록되었습니다.`);
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
      title: `${song.title} (사본)`
    };
    onUpdateSongs([duplicated, ...songs]);
    onShowToast(`'${song.title}' 곡이 복제되었습니다.`);
  };

  // Handle Artist CRUD
  const handleSaveArtist = (savedArtist) => {
    const exists = artists.some(a => a.id === savedArtist.id);
    if (exists) {
      onUpdateArtists(artists.map(a => a.id === savedArtist.id ? savedArtist : a));
      onShowToast(`아티스트 '${savedArtist.name}' 정보가 수정되었습니다.`);
    } else {
      onUpdateArtists([...artists, savedArtist]);
      onShowToast(`새 아티스트 '${savedArtist.name}'이(가) 추가되었습니다.`);
    }
  };

  const handleDeleteArtist = (artistId, name) => {
    if (artists.length <= 1) {
      alert('최소 1명의 아티스트는 유지되어야 합니다.');
      return;
    }
    if (window.confirm(`'${name}' 아티스트를 삭제하시겠습니까? 관련 곡들도 유지되거나 삭제될 수 있습니다.`)) {
      onUpdateArtists(artists.filter(a => a.id !== artistId));
      onShowToast(`아티스트 '${name}'이(가) 삭제되었습니다.`);
    }
  };

  // 1-Click Platform Sync for a Single Artist
  const handleSyncSingleArtist = async (artist) => {
    setSyncingArtistId(artist.id);
    try {
      const { updatedSongs, stats } = await syncArtistTracks(artist, songs);
      onUpdateSongs(updatedSongs);
      onShowToast(
        `[${artist.name}] 멜론(${stats.melonTracksCount}곡), 지니(${stats.genieTracksCount}곡), 벅스(${stats.bugsTracksCount}곡) 동기화 완료! (+${stats.addedCount}곡 추가, ${stats.updatedCount}곡 업데이트)`
      );
    } catch (err) {
      alert(`[${artist.name}] 동기화 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setSyncingArtistId(null);
    }
  };

  // 1-Click Platform Sync for ALL Artists
  const handleSyncAllArtists = async () => {
    if (isSyncingAll) return;
    setIsSyncingAll(true);
    let current = [...songs];
    let totalAdded = 0;
    let totalUpdated = 0;

    try {
      for (let i = 0; i < artists.length; i++) {
        const a = artists[i];
        setSyncProgressText(`[${i + 1}/${artists.length}] ${a.name} 음원 조회 및 동기화 중...`);
        const { updatedSongs, stats } = await syncArtistTracks(a, current);
        current = updatedSongs;
        totalAdded += stats.addedCount;
        totalUpdated += stats.updatedCount;
      }
      onUpdateSongs(current);
      onShowToast(`전체 ${artists.length}명 아티스트 음원 동기화 완료! (+${totalAdded}곡 추가, ${totalUpdated}곡 ID 업데이트) ✨`);
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

  return (
    <div className="space-y-6">
      {/* Sub Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-slate-900/90 border border-slate-800 rounded-2xl">
        <div className="flex gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('songs')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'songs'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>음원 목록 ({songs.length}곡)</span>
          </button>

          <button
            onClick={() => setActiveTab('artists')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'artists'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>아티스트 관리 & 동기화 ({artists.length}명)</span>
          </button>

          <button
            onClick={() => setActiveTab('raw_json')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'raw_json'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Code2 className="w-4 h-4 text-emerald-400" />
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

        {/* Quick Action in Header (Only in songs tab) */}
        {activeTab === 'songs' && (
          <button
            onClick={() => { setEditingSong(null); setIsSongModalOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer ml-auto"
          >
            <Plus className="w-4 h-4" />
            <span>새 음원 등록</span>
          </button>
        )}
      </div>

      {/* TAB 1: SONGS MANAGEMENT */}
      {activeTab === 'songs' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="곡명, 앨범명, 가수, 또는 SongID 검색..."
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

          {/* Songs Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="py-3 px-3 w-12 text-center">#</th>
                    <th className="py-3 px-4">곡명 & 앨범</th>
                    <th className="py-3 px-3">가수</th>
                    <th className="py-3 px-3 text-center">시간</th>
                    <th className="py-3 px-3">플랫폼별 곡 ID (교차검증 🔗)</th>
                    <th className="py-3 px-3 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSongs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-500">
                        검색 조건에 맞는 음원이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredSongs.map((song, idx) => {
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
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                              <span className="text-slate-500">{song.album}</span>
                              {song.releaseDate && (
                                <>
                                  <span className="text-slate-700">•</span>
                                  <span className="text-slate-500">{formatDate(song.releaseDate)}</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                              artistObj ? artistObj.badgeColor : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}>
                              {song.artist}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-300">
                            {formatSecondsToTime(song.duration)}
                            <span className="block text-[10px] text-slate-500">({song.duration}s)</span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
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
                                <span className="text-slate-600">M: 미등록</span>
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
                                <span className="text-slate-600">G: 미등록</span>
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
                                <span className="text-slate-600">B: 미등록</span>
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

      {/* TAB 2: ARTISTS MANAGEMENT & PLATFORM ID LOOKUP & SYNC */}
      {activeTab === 'artists' && (
        <div className="space-y-4">
          {/* Top Master Header with Global Sync & Add Artist */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-slate-900/80 to-teal-950/50 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm sm:text-base font-bold text-slate-100">
                  아티스트 ID 관리 & 음원 사이트 자동 데이터 동기화
                </h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                등록된 아티스트 ID를 기반으로 멜론, 지니, 벅스의 최신 곡 목록을 자동으로 조회하여 데이터베이스에 일괄 동기화합니다.
              </p>
              {syncProgressText && (
                <p className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5 animate-pulse pt-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{syncProgressText}</span>
                </p>
              )}
            </div>

            {/* Top Action Buttons: Sync All & Add Artist */}
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <button
                onClick={handleSyncAllArtists}
                disabled={isSyncingAll}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-950/60 cursor-pointer disabled:opacity-50 transition-all"
                title="등록된 전체 아티스트의 곡을 멜론/지니/벅스에서 자동 조회 및 동기화합니다."
              >
                {isSyncingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <Zap className="w-4 h-4 fill-current text-slate-950" />
                )}
                <span>{isSyncingAll ? '전체 동기화 진행 중...' : '⚡ 전체 아티스트 음원 자동 동기화'}</span>
              </button>

              <button
                onClick={() => { setEditingArtist(null); setIsArtistModalOpen(true); }}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>새 아티스트 등록</span>
              </button>
            </div>
          </div>

          {/* Artist Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {artists.map((artist) => {
              const songCount = songs.filter(s => s.artistType === artist.id).length;
              const isSyncingThis = syncingArtistId === artist.id || isSyncingAll;

              return (
                <div
                  key={artist.id}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 shadow-xl space-y-3.5"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${artist.badgeColor}`}>
                        {artist.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {artist.category === 'group' ? '그룹(완전체)' : '솔로(개인)'} • <strong className="text-slate-200">{songCount}곡</strong> 등록됨
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditingArtist(artist); setIsArtistModalOpen(true); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800 cursor-pointer"
                        title="아티스트 ID 수정"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteArtist(artist.id, artist.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 cursor-pointer"
                        title="아티스트 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Individual Artist Sync Action Button */}
                  <div className="pt-1">
                    <button
                      onClick={() => handleSyncSingleArtist(artist)}
                      disabled={isSyncingThis}
                      className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-300 hover:text-emerald-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncingThis ? 'animate-spin' : ''}`} />
                      <span>{isSyncingThis ? '음원 사이트 조회 및 동기화 중...' : `🔄 [${artist.name}] 음원 자동 조회 & 동기화`}</span>
                    </button>
                  </div>

                  {/* Platform IDs & direct verification links */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/60 text-xs">
                    {/* Melon */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-[#00cd3c] text-slate-950 flex items-center justify-center font-black text-[10px]">M</span>
                        <span className="text-slate-300 font-semibold">멜론:</span>
                        <span className="font-mono text-emerald-400 font-bold">{artist.platformArtistIds?.melon || '미설정'}</span>
                      </div>
                      {artist.platformArtistIds?.melon && (
                        <a
                          href={`https://www.melon.com/artist/timeline.htm?artistId=${artist.platformArtistIds.melon}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px] font-medium"
                        >
                          곡 전체 조회 <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Genie */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-[#0092fa] text-white flex items-center justify-center font-black text-[10px]">G</span>
                        <span className="text-slate-300 font-semibold">지니:</span>
                        <span className="font-mono text-sky-400 font-bold">{artist.platformArtistIds?.genie || '미설정'}</span>
                      </div>
                      {artist.platformArtistIds?.genie && (
                        <a
                          href={`https://www.genie.co.kr/detail/artistInfo?xxnm=${artist.platformArtistIds.genie}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-400 hover:underline flex items-center gap-1 text-[11px] font-medium"
                        >
                          곡 전체 조회 <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Bugs */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-[#f9423a] text-white flex items-center justify-center font-black text-[10px]">B</span>
                        <span className="text-slate-300 font-semibold">벅스:</span>
                        <span className="font-mono text-rose-400 font-bold">{artist.platformArtistIds?.bugs || '미설정'}</span>
                      </div>
                      {artist.platformArtistIds?.bugs && (
                        <a
                          href={`https://music.bugs.co.kr/artist/${artist.platformArtistIds.bugs}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-rose-400 hover:underline flex items-center gap-1 text-[11px] font-medium"
                        >
                          곡 전체 조회 <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
