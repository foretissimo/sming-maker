import React, { useState, useMemo } from 'react';
import { Search, X, Flame, Check, Music, Calendar, Clock, Sparkles } from 'lucide-react';
import { formatSecondsToTime, formatDate } from '../utils/formatters';

export default function FocusSongModal({
  isOpen,
  onClose,
  allSongs = [],
  artists = [],
  selectedSongId = null,
  onSelectSong
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterArtist, setFilterArtist] = useState('all');
  const [onlyTitle, setOnlyTitle] = useState(false);

  const filteredSongs = useMemo(() => {
    return allSongs.filter(song => {
      // Artist filter
      if (filterArtist !== 'all' && song.artistType !== filterArtist) {
        return false;
      }
      // Title filter
      if (onlyTitle && !song.isTitle) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = song.title?.toLowerCase().includes(q);
        const matchesArtist = song.artist?.toLowerCase().includes(q);
        const matchesAlbum = song.album?.toLowerCase().includes(q);
        const matchesTag = song.tags?.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesArtist && !matchesAlbum && !matchesTag) {
          return false;
        }
      }
      return true;
    });
  }, [allSongs, searchQuery, filterArtist, onlyTitle]);

  if (!isOpen) return null;

  const handleSelect = (songId) => {
    onSelectSong(songId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">집중 스트리밍곡 선택</h3>
              <p className="text-[11px] text-slate-400">
                스밍리스트에서 3회 이상 중점 반복 배치할 집중 곡(타이틀곡 또는 수록곡)을 지정합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="곡명, 앨범명, 가수 검색 (타이틀곡 및 모든 수록곡 포함)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills & Auto Option */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setFilterArtist('all')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  filterArtist === 'all'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                전체
              </button>
              {artists.map(a => (
                <button
                  key={a.id}
                  onClick={() => setFilterArtist(a.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap cursor-pointer transition-colors ${
                    filterArtist === a.id
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>

            <button
              onClick={() => setOnlyTitle(!onlyTitle)}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap cursor-pointer transition-colors ml-auto flex-shrink-0 ${
                onlyTitle
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              ⭐ 타이틀곡만
            </button>
          </div>
        </div>

        {/* Auto Option Bar */}
        <div className="px-4 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            선택된 아티스트의 최신 타이틀곡을 자동으로 집중곡으로 지정하려면:
          </span>
          <button
            onClick={() => handleSelect(null)}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer border ${
              selectedSongId === null
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            {selectedSongId === null ? '✓ 자동 선택 적용 중' : '🎯 자동 선택으로 되돌리기'}
          </button>
        </div>

        {/* Songs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredSongs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              검색 조건에 맞는 곡이 없습니다.
            </div>
          ) : (
            filteredSongs.map((song) => {
              const isSelected = selectedSongId === song.id;
              const artistObj = artists.find(a => a.id === song.artistType);

              return (
                <div
                  key={song.id}
                  onClick={() => handleSelect(song.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-950/40 border-rose-500/60 shadow-md ring-1 ring-rose-500/40'
                      : 'bg-slate-950/40 hover:bg-slate-950 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold truncate ${isSelected ? 'text-rose-200 font-bold' : 'text-slate-200'}`}>
                        {song.title}
                      </span>
                      {song.isTitle && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          ⭐ 타이틀
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 truncate">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] border ${
                        artistObj ? artistObj.badgeColor : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {song.artist}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400 truncate">{song.album}</span>
                      {song.releaseDate && song.releaseDate.trim() && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-500 flex items-center gap-0.5 font-mono">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {formatDate(song.releaseDate)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg">
                      {formatSecondsToTime(song.duration)}
                    </span>
                    <button
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all pointer-events-none ${
                        isSelected
                          ? 'bg-rose-500 text-slate-950 shadow-md'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>선택됨</span>
                        </>
                      ) : (
                        <span>선택</span>
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
