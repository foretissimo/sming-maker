import React, { useState, useMemo } from 'react';
import { Search, X, Plus, Check, Music, Calendar } from 'lucide-react';
import { formatSecondsToTime, formatDate } from '../utils/formatters';


export default function SongCatalogModal({
  isOpen,
  onClose,
  allSongs,
  onAddSong,
  currentPlaylist,
  artists = []
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtist, setSelectedArtist] = useState('all');
  const [onlyTitle, setOnlyTitle] = useState(false);
  const [recentlyAddedId, setRecentlyAddedId] = useState(null);

  const filteredSongs = useMemo(() => {
    return allSongs.filter(song => {
      // Artist filter
      if (selectedArtist !== 'all' && song.artistType !== selectedArtist) {
        return false;
      }
      // Title filter
      if (onlyTitle && !song.isTitle) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = song.title.toLowerCase().includes(q);
        const matchesArtist = song.artist.toLowerCase().includes(q);
        const matchesAlbum = song.album?.toLowerCase().includes(q);
        const matchesTag = song.tags?.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesArtist && !matchesAlbum && !matchesTag) {
          return false;
        }
      }
      return true;
    });
  }, [allSongs, searchQuery, selectedArtist, onlyTitle]);

  if (!isOpen) return null;

  const handleAdd = (song) => {
    onAddSong(song);
    setRecentlyAddedId(song.id);
    setTimeout(() => setRecentlyAddedId(null), 800);
  };

  const getSongCountInPlaylist = (songId) => {
    return currentPlaylist.filter(s => s.id === songId).length;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-slate-100">곡 검색 및 직접 추가</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Filters */}
        <div className="p-4 bg-slate-950/50 border-b border-slate-800 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="곡명, 앨범명, 가수 검색..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedArtist('all')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap cursor-pointer transition-colors ${
                selectedArtist === 'all'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              전체
            </button>
            {artists.map(a => (
              <button
                key={a.id}
                onClick={() => setSelectedArtist(a.id)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  selectedArtist === a.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                {a.name}
              </button>
            ))}
            <button
              onClick={() => setOnlyTitle(!onlyTitle)}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap cursor-pointer transition-colors ml-auto ${
                onlyTitle
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              ⭐ 타이틀곡만
            </button>
          </div>
        </div>

        {/* Songs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredSongs.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              검색 결과가 없습니다.
            </div>
          ) : (
            filteredSongs.map((song) => {
              const inPlaylistCount = getSongCountInPlaylist(song.id);
              const isJustAdded = recentlyAddedId === song.id;

              return (
                <div
                  key={song.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-200 truncate">
                        {song.title}
                      </span>
                      {song.isTitle && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          ⭐ 타이틀
                        </span>
                      )}
                      {inPlaylistCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          리스트에 {inPlaylistCount}개 포함
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 truncate">
                      <span className="text-slate-300">{song.artist}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400 truncate">{song.album}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-500 flex items-center gap-0.5">
                        <Calendar className="w-3 h-3" />
                        {formatDate(song.releaseDate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs font-mono text-slate-400">
                      {formatSecondsToTime(song.duration)}
                    </span>
                    <button
                      onClick={() => handleAdd(song)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        isJustAdded
                          ? 'bg-emerald-500 text-slate-950 scale-105'
                          : 'bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/40 text-emerald-300 hover:text-white'
                      }`}
                    >
                      {isJustAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>추가됨!</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>담기</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>총 {filteredSongs.length}곡 검색됨</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
