import React from 'react';
import { 
  Music, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Pin, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  PlusCircle
} from 'lucide-react';
import { formatSecondsToTime, formatTotalDuration } from '../utils/formatters';


export default function PlaylistView({
  playlist,
  onMoveUp,
  onMoveDown,
  onRemove,
  onAddCustom,
  targetDurationSeconds = 3600,
  artists = []
}) {
  const totalSeconds = playlist.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalDurationFormatted = formatTotalDuration(totalSeconds);
  const targetDurationFormatted = formatTotalDuration(targetDurationSeconds);

  // Time difference analysis
  const diff = totalSeconds - targetDurationSeconds;
  const isOptimal = Math.abs(diff) <= 120; // within +/- 2 minutes
  const progressPercent = Math.min(100, Math.round((totalSeconds / targetDurationSeconds) * 100));

  const getArtistBadge = (artistType) => {
    const found = artists.find(a => a.id === artistType);
    return found ? found.badgeColor : 'bg-slate-800 text-slate-300 border-slate-700';
  };


  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 md:p-5 shadow-xl space-y-4">
      {/* Playlist Stats Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Music className="w-4 h-4 text-emerald-400" />
              현재 생성된 스밍리스트
            </h2>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {playlist.length}곡
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            목표: {targetDurationFormatted} | 현재: <span className="font-semibold text-slate-200">{totalDurationFormatted}</span>
          </p>
        </div>

        {/* Optimal status indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isOptimal ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              1시간 최적화 완료
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              {diff > 0 ? `+${Math.round(diff / 60)}분 초과` : `-${Math.round(Math.abs(diff) / 60)}분 부족`}
            </div>
          )}

          <button
            onClick={onAddCustom}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 cursor-pointer transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            곡 추가
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isOptimal ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-orange-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Song List Items */}
      {playlist.length === 0 ? (
        <div className="py-12 text-center text-slate-500 space-y-3">
          <Music className="w-10 h-10 mx-auto text-slate-600 opacity-50" />
          <p className="text-sm">생성된 스밍리스트가 없습니다.</p>
          <button
            onClick={onAddCustom}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/50 cursor-pointer"
          >
            곡 검색 및 추가하기
          </button>
        </div>
      ) : (
        <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
          {playlist.map((song, index) => {
            const isFirst = index === 0;
            const isLast = index === playlist.length - 1;
            const badgeClass = getArtistBadge(song.artistType);

            return (
              <div
                key={song.uniqueKey || `${song.id}-${index}`}
                className="group flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all duration-150"
              >
                {/* Left: Index + Info */}
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <span className="w-5 text-center text-xs font-mono text-slate-500 group-hover:text-emerald-400 transition-colors">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-semibold text-slate-200 truncate">
                        {song.title}
                      </span>
                      {song.isTitle && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          ⭐ 타이틀
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 truncate flex-wrap">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] border ${badgeClass}`}>
                        {song.artist}
                      </span>
                      <span className="text-slate-400 truncate">{song.album}</span>
                      {song.releaseDate && song.releaseDate.trim() && (
                        <span className="text-slate-500 font-mono text-[10px] hidden sm:inline">
                          ({formatDate(song.releaseDate)})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Duration + Reorder / Delete Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-mono text-slate-400 group-hover:text-slate-300">
                    {formatSecondsToTime(song.duration)}
                  </span>

                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onMoveUp(index)}
                      disabled={isFirst}
                      className="p-1 rounded text-slate-400 hover:text-emerald-300 hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                      title="위로 이동"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onMoveDown(index)}
                      disabled={isLast}
                      className="p-1 rounded text-slate-400 hover:text-emerald-300 hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                      title="아래로 이동"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRemove(index)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 cursor-pointer ml-1"
                      title="목록에서 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
