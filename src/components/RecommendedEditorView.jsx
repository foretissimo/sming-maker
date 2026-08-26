import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Users, 
  Music, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Copy, 
  Save, 
  RotateCcw, 
  Search, 
  Check, 
  Clock, 
  Flame, 
  Layers,
  ExternalLink,
  SlidersHorizontal,
  Dice5,
  AlertCircle
} from 'lucide-react';
import { formatSecondsToTime } from '../utils/formatters';
import { generateStreamingList } from '../utils/generator';
import { hydratePlaylistWithMasterSongs } from '../utils/platformLinks';

export default function RecommendedEditorView({
  allSongs = [],
  artists = [],
  recommendedData,
  onSaveRecommended,
  onShowToast,
  onApplyToGenerator
}) {
  // Metadata state
  const [title, setTitle] = useState(recommendedData?.title || '🌲 포레스텔라 음총팀 공식 1시간 스밍리스트');
  const [creator, setCreator] = useState(recommendedData?.creator || '포레스텔라 음원총공팀');
  const [desc, setDesc] = useState(recommendedData?.desc || '');
  const [youtubeUrl, setYoutubeUrl] = useState(recommendedData?.youtubeUrl || '');
  
  // Selected artists for recommended playlist
  const [selectedArtists, setSelectedArtists] = useState(
    recommendedData?.selectedArtists && recommendedData.selectedArtists.length > 0
      ? recommendedData.selectedArtists
      : ['group']
  );

  // Songs in recommended playlist: Always hydrated with latest allSongs (songs.json)
  const [playlist, setPlaylist] = useState(() => {
    return hydratePlaylistWithMasterSongs(recommendedData?.songs || [], allSongs);
  });

  // Re-hydrate whenever master songs (songs.json) change
  React.useEffect(() => {
    setPlaylist(prev => hydratePlaylistWithMasterSongs(prev, allSongs));
  }, [allSongs]);

  // Song catalog search & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Toggle artist filter
  const toggleArtist = (artistId) => {
    if (selectedArtists.includes(artistId)) {
      setSelectedArtists(prev => prev.filter(id => id !== artistId));
    } else {
      setSelectedArtists(prev => [...prev, artistId]);
    }
  };

  const selectAllArtists = () => setSelectedArtists(artists.map(a => a.id));
  const selectOnlyGroup = () => setSelectedArtists(['group']);

  // Filter available songs for adding based on selectedArtists and search
  const availableSongs = useMemo(() => {
    return allSongs.filter(song => {
      // 1. Artist filter (if none selected, include all)
      if (selectedArtists.length > 0 && !selectedArtists.includes(song.artistType)) {
        return false;
      }
      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = (song.title || '').toLowerCase().includes(q);
        const matchesArtist = (song.artist || '').toLowerCase().includes(q);
        const matchesAlbum = (song.album || '').toLowerCase().includes(q);
        return matchesTitle || matchesArtist || matchesAlbum;
      }
      return true;
    });
  }, [allSongs, selectedArtists, searchQuery]);

  // Realtime Stats
  const totalDuration = useMemo(() => {
    return playlist.reduce((acc, s) => acc + (Number(s.duration) || 0), 0);
  }, [playlist]);

  const diffSeconds = totalDuration - 3600;
  const titleCount = useMemo(() => {
    return playlist.filter(s => s.isTitle).length;
  }, [playlist]);

  // Playlist Item Manipulation
  const handleAddSong = (song) => {
    const newItem = {
      ...song,
      uniqueKey: `${song.id}-${Math.random().toString(36).substr(2, 9)}`
    };
    setPlaylist(prev => [...prev, newItem]);
    if (onShowToast) onShowToast(`'${song.title}' 추가됨`);
  };

  const handleRemoveSong = (index) => {
    setPlaylist(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleMoveUp = (index) => {
    if (index <= 0) return;
    setPlaylist(prev => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return next;
    });
  };

  const handleMoveDown = (index) => {
    if (index >= playlist.length - 1) return;
    setPlaylist(prev => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return next;
    });
  };

  const handleDuplicate = (index) => {
    const song = playlist[index];
    const duplicate = {
      ...song,
      uniqueKey: `${song.id}-${Math.random().toString(36).substr(2, 9)}`
    };
    setPlaylist(prev => {
      const next = [...prev];
      next.splice(index + 1, 0, duplicate);
      return next;
    });
  };

  // Auto-generate 60m list based on selected artists
  const handleAutoGenerate = () => {
    const generated = generateStreamingList(allSongs, {
      targetSeconds: 3600,
      mode: 'title_focus',
      selectedArtistTypes: selectedArtists.length > 0 ? selectedArtists : ['group']
    });
    setPlaylist(generated);
    if (onShowToast) onShowToast('선택한 아티스트 기반으로 60분 스밍리스트를 자동 생성했습니다! 🎲');
  };

  // Save to recommendedPlaylist.json
  const handleSave = async () => {
    setIsSaving(true);
    const payload = {
      id: 'official-recommended-1',
      title: title.trim() || '🌲 포레스텔라 음총팀 공식 1시간 스밍리스트',
      creator: creator.trim() || '포레스텔라 음원총공팀',
      desc: desc.trim(),
      youtubeUrl: youtubeUrl.trim(),
      selectedArtists,
      updatedAt: new Date().toISOString().split('T')[0],
      songs: playlist
    };

    try {
      const res = await fetch('/api/save-recommended', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        if (onSaveRecommended) onSaveRecommended(payload);
        if (onShowToast) onShowToast('💾 recommendedPlaylist.json에 성공적으로 저장되었습니다!');
      } else {
        alert('저장 실패: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (e) {
      if (onSaveRecommended) onSaveRecommended(payload);
      if (onShowToast) onShowToast('로컬 메모리에 반영되었습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              👑 음총팀 관리자 전용
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-100 flex items-center gap-2">
              <span>🌲 음총팀 공식 추천 리스트 편집기</span>
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            사용자가 웹사이트에 첫 접속했을 때와 <strong>[⭐ 음총팀 추천]</strong> 버튼을 눌렀을 때 노출될 공식 1시간 스밍리스트를 편집합니다.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSave}
            disabled={isSaving || playlist.length === 0}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-950/60 cursor-pointer transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? '저장 중...' : 'recommendedPlaylist.json에 직접 저장'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Left (List & Meta) / Right (Song Catalog) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Metadata & Live Playlist Builder (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Metadata Box */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
              추천 리스트 기본 정보
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">리스트 제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">작성자 명의</label>
                <input
                  type="text"
                  value={creator}
                  onChange={(e) => setCreator(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">설명 / 공지사항</label>
              <textarea
                value={desc}
                rows={2}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="스밍 권장 안내 문구를 입력하세요..."
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">공식 유튜브 MV / 재생목록 링크 (선택)</label>
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtu.be/..."
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Live Stats Header */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-[10px] text-slate-400 block">총 곡수</span>
                <span className="text-base font-black text-slate-100">{playlist.length}곡</span>
              </div>
              <div className="w-[1px] h-6 bg-slate-800" />
              <div>
                <span className="text-[10px] text-slate-400 block">총 스밍 시간</span>
                <span className="text-base font-black font-mono text-emerald-300">
                  {formatSecondsToTime(totalDuration)}
                </span>
              </div>
              <div className="w-[1px] h-6 bg-slate-800" />
              <div>
                <span className="text-[10px] text-slate-400 block">타이틀곡 반복</span>
                <span className="text-base font-black text-amber-300">⭐ {titleCount}회</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                diffSeconds === 0 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : diffSeconds > 0 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
              }`}>
                60분 기준 {diffSeconds === 0 ? '정확히 일치 (0초)' : diffSeconds > 0 ? `+${diffSeconds}초` : `${diffSeconds}초`}
              </span>

              <button
                onClick={handleAutoGenerate}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold flex items-center gap-1 border border-slate-700 cursor-pointer"
                title="선택한 아티스트 기반으로 60분 자동 생성"
              >
                <Dice5 className="w-3.5 h-3.5" />
                <span>60분 자동 재편성</span>
              </button>
            </div>
          </div>

          {/* Playlist Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/60 shadow-lg">
            {playlist.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                편성된 곡이 없습니다. 오른쪽 곡 목록에서 <strong>[+ 추가]</strong> 버튼을 누르거나 <strong>[60분 자동 재편성]</strong>을 실행하세요.
              </div>
            ) : (
              playlist.map((song, idx) => {
                const artistObj = artists.find(a => a.id === song.artistType);
                const badgeColor = artistObj?.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700';

                return (
                  <div 
                    key={song.uniqueKey || `${song.id}-${idx}`}
                    className="p-3 flex items-center justify-between gap-2 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 text-center text-xs font-mono font-bold text-slate-500">
                        {String(idx + 1).padStart(2, '0')}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-200 truncate">
                            {song.title}
                          </span>
                          {song.isTitle && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              ⭐ 타이틀
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                          <span className={`px-1.5 py-0.2 rounded border ${badgeColor}`}>
                            {song.artist}
                          </span>
                          <span className="truncate">{song.album}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-mono font-semibold text-slate-300 px-2 py-0.5 bg-slate-950 rounded-md border border-slate-800">
                        {formatSecondsToTime(song.duration)}
                      </span>

                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => handleMoveUp(idx)}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                          title="위로 이동"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(idx)}
                          disabled={idx === playlist.length - 1}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                          title="아래로 이동"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(idx)}
                          className="p-1 text-slate-400 hover:text-emerald-300 cursor-pointer"
                          title="복제 (중복 추가)"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveSong(idx)}
                          className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Song Catalog Picker with Artist Filter (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Artist Multi-Select Filter */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                아티스트 선택 (곡 목록 필터)
              </label>

              <div className="flex items-center gap-1">
                <button
                  onClick={selectOnlyGroup}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  완전체만
                </button>
                <button
                  onClick={selectAllArtists}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 cursor-pointer"
                >
                  전체
                </button>
              </div>
            </div>

            {/* Artist Chips */}
            <div className="flex flex-wrap gap-1.5">
              {artists.map(artist => {
                const isSelected = selectedArtists.includes(artist.id);
                return (
                  <button
                    key={artist.id}
                    onClick={() => toggleArtist(artist.id)}
                    className={`px-2.5 py-1 rounded-xl text-xs transition-all cursor-pointer border flex items-center gap-1 ${
                      isSelected
                        ? `${artist.badgeColor} font-bold ring-1 ring-emerald-400/40 shadow-sm`
                        : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                    <span>{artist.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="곡명, 앨범명 검색..."
              className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Available Songs List */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 max-h-[560px] overflow-y-auto space-y-1 divide-y divide-slate-800/40">
            <div className="px-2 py-1 text-[11px] text-slate-400 font-semibold flex items-center justify-between">
              <span>추가 가능한 음원 ({availableSongs.length}곡)</span>
              <span>클릭하여 추가</span>
            </div>

            {availableSongs.map(song => {
              const artistObj = artists.find(a => a.id === song.artistType);
              const badgeColor = artistObj?.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700';

              return (
                <div 
                  key={song.id}
                  className="p-2 flex items-center justify-between gap-2 hover:bg-slate-800/50 rounded-xl transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-200 truncate">
                        {song.title}
                      </span>
                      {song.isTitle && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          ⭐ 타이틀
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 truncate">
                      <span className={`px-1 py-0.2 rounded text-[9px] border ${badgeColor}`}>
                        {song.artist}
                      </span>
                      <span className="truncate">{song.album}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] font-mono text-slate-400">
                      {formatSecondsToTime(song.duration)}
                    </span>
                    <button
                      onClick={() => handleAddSong(song)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3 h-3" />
                      <span>추가</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
