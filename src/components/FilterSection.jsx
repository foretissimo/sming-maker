import React from 'react';
import { Flame, Clock, Users, Sparkles, SlidersHorizontal, Disc3, CheckSquare, Square } from 'lucide-react';

export const DEFAULT_ARTISTS = [
  { id: 'group', name: '포레스텔라', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { id: 'jomingyu', name: '조민규', badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  { id: 'baedoohun', name: '배두훈', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { id: 'kanghyungho', name: '강형호(PITTA)', badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { id: 'gowoorim', name: '고우림', badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30' }
];

export const ARTISTS = DEFAULT_ARTISTS;


export const MODES = [
  {
    id: 'title_focus',
    name: '타이틀 집중 모드 (권장)',
    desc: '최신 타이틀(완전체/솔로)을 주기적으로 반복 배치해 음원 차트 반영 극대화',
    icon: Flame
  },
  {
    id: 'recent_first',
    name: '최신곡 우선',
    desc: '가장 최근 발매된 앨범/싱글 순으로 1시간 최적 조합',
    icon: Sparkles
  },
  {
    id: 'balanced',
    name: '완전체+솔로 균형',
    desc: '포레스텔라 단체곡과 멤버 솔로곡을 골고루 배합',
    icon: Users
  },
  {
    id: 'random',
    name: '랜덤 셔플',
    desc: '다양한 명곡들을 무작위로 1시간 조합',
    icon: Disc3
  }
];

export default function FilterSection({
  artists = DEFAULT_ARTISTS,
  selectedArtists,
  onChangeArtists,
  mode,
  onChangeMode,
  targetDurationMinutes,
  onChangeTargetDuration,
  focusSongId,
  onChangeFocusSong,
  allSongs
}) {
  const toggleArtist = (id) => {
    if (selectedArtists.includes(id)) {
      onChangeArtists(selectedArtists.filter(a => a !== id));
    } else {
      onChangeArtists([...selectedArtists, id]);
    }
  };

  const selectAllArtists = () => {
    onChangeArtists(artists.map(a => a.id));
  };

  const deselectAllArtists = () => {
    onChangeArtists([]);
  };

  const selectOnlyGroup = () => {
    const groupArtists = artists.filter(a => a.category === 'group' || a.id === 'group').map(a => a.id);
    onChangeArtists(groupArtists.length > 0 ? groupArtists : ['group']);
  };

  const selectOnlySolos = () => {
    const soloArtists = artists.filter(a => a.category === 'solo' || a.id !== 'group').map(a => a.id);
    onChangeArtists(soloArtists);
  };


  // Title song candidates for focus selector (filtered by selected artists if active)
  const availableTitleSongs = allSongs.filter(s => {
    if (!s.isTitle) return false;
    if (selectedArtists.length === 0) return true;
    return selectedArtists.includes(s.artistType);
  });

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 md:p-5 shadow-xl space-y-5">
      {/* 1. Artist Multi-select */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            아티스트 선택
          </label>
          
          {/* Quick Select / Deselect Action Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={selectAllArtists}
              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer border border-slate-700/60"
            >
              전체 선택
            </button>
            <button
              onClick={deselectAllArtists}
              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer border border-slate-700/60"
            >
              전체 해제
            </button>
            <button
              onClick={selectOnlyGroup}
              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/60"
            >
              완전체만
            </button>
            <button
              onClick={selectOnlySolos}
              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 transition-colors cursor-pointer border border-slate-700/60"
            >
              솔로곡만
            </button>
          </div>
        </div>

        {/* Artist Pills */}
        <div className="flex flex-wrap gap-2">
          {artists.map((artist) => {
            const isSelected = selectedArtists.includes(artist.id);
            return (
              <button
                key={artist.id}
                onClick={() => toggleArtist(artist.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer border flex items-center gap-1.5 ${
                  isSelected
                    ? `${artist.badgeColor} shadow-sm shadow-emerald-950/40 ring-1 ring-emerald-400/40 font-semibold`
                    : 'bg-slate-950/60 text-slate-400 border-slate-800/80 hover:bg-slate-800/50 hover:text-slate-300'
                }`}
              >
                <span>{artist.name}</span>
              </button>
            );
          })}
        </div>


        {selectedArtists.length === 0 && (
          <p className="text-[11px] text-amber-400/90 mt-2 bg-amber-950/20 border border-amber-900/30 px-2.5 py-1 rounded-lg">
            ⚠️ 선택된 아티스트가 없어 전체 곡 풀에서 1시간 조합을 생성합니다.
          </p>
        )}
      </div>

      {/* 2. Generation Mode */}
      <div>
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider mb-2.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400" />
          스밍 조합 모드
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {MODES.map((m) => {
            const isSelected = mode === m.id;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => onChangeMode(m.id)}
                className={`p-3 rounded-xl text-left border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-emerald-950/60 to-slate-900 border-emerald-500/50 shadow-md shadow-emerald-950/30'
                    : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700/80 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className={`text-xs font-bold ${isSelected ? 'text-emerald-200' : 'text-slate-300'}`}>
                    {m.name}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {m.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Duration & Focus Song Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800/60">
        {/* Target duration */}
        <div>
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            목표 스밍 시간 (정밀 맞춤)
          </label>
          <div className="flex gap-2">
            {[55, 60, 65].map((mins) => (
              <button
                key={mins}
                onClick={() => onChangeTargetDuration(mins)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  targetDurationMinutes === mins
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-slate-950/50 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {mins}분 {mins === 60 && '(정확)'}
              </button>
            ))}
          </div>
        </div>

        {/* Focus song selector (if in title focus mode) */}
        <div>
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            집중 스트리밍곡 (타이틀)
          </label>
          <select
            value={focusSongId || ''}
            onChange={(e) => onChangeFocusSong(e.target.value || null)}
            className="w-full bg-slate-950/80 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="">자동 선택 (선택 아티스트 최신 타이틀)</option>
            {availableTitleSongs.map((song) => (
              <option key={song.id} value={song.id}>
                [{song.artist}] {song.title} ({song.album})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
