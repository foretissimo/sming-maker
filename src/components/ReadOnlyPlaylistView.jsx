import React, { useState } from 'react';
import { 
  Music, 
  Sparkles, 
  Clock, 
  Copy, 
  Check, 
  ExternalLink, 
  Share2, 
  Play, 
  Smartphone, 
  Monitor, 
  Layers, 
  Calendar,
  Info,
  SlidersHorizontal,
  Plus
} from 'lucide-react';
import { formatSecondsToTime, formatTotalDuration, formatDate } from '../utils/formatters';
import { generatePlatformLinks, generateTextPlaylist } from '../utils/platformLinks';

export default function ReadOnlyPlaylistView({
  title = '포레스텔라 1시간 스밍리스트',
  creator = '숲별',
  desc = '',
  playlist = [],
  artists = [],
  onGoToGenerator,
  onShowToast
}) {
  const [copiedType, setCopiedType] = useState(null);
  const [clickedMelonParts, setClickedMelonParts] = useState({});

  const totalSeconds = playlist.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalDurationFormatted = formatTotalDuration(totalSeconds);
  const links = generatePlatformLinks(playlist);

  const handleCopy = (text, type, successMsg) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    if (onShowToast) onShowToast(successMsg);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleOpenLink = (url, platformName) => {
    if (!url) {
      if (onShowToast) onShowToast(`${platformName} 곡 정보가 부족합니다.`);
      return;
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 300);
    }
  };

  const handleMelonPartClick = (part) => {
    handleOpenLink(part.url, `멜론 Part ${part.partIndex}`);
    setClickedMelonParts(prev => ({
      ...prev,
      [part.partIndex]: true
    }));
    if (onShowToast) {
      onShowToast(`멜론 ${part.partIndex}차 리스트(${part.count}곡) 담기를 실행했습니다.`);
    }
  };

  const getArtistBadge = (artistType) => {
    const found = artists.find(a => a.id === artistType);
    return found ? found.badgeColor : 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. HERO HEADER BANNER */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-teal-950/50 border border-emerald-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                공유된 스밍리스트 (Read-Only)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700">
                ✍️ 작성자: <strong className="text-emerald-300 font-bold">{creator}</strong>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              {title}
            </h1>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="px-3.5 py-2 rounded-2xl bg-slate-950/80 border border-emerald-500/30 text-right">
              <div className="text-[11px] text-slate-400 font-medium">총 스밍 시간</div>
              <div className="text-sm sm:text-base font-black font-mono text-emerald-300">
                {totalDurationFormatted} <span className="text-xs font-normal text-slate-400">({playlist.length}곡)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notice / Description Box */}
        {desc && (
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="whitespace-pre-wrap">{desc}</p>
          </div>
        )}

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(window.location.href, 'link', '스밍리스트 공유 링크가 복사되었습니다! 🔗')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            >
              {copiedType === 'link' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>공유 링크 복사</span>
            </button>
            <button
              onClick={() => handleCopy(generateTextPlaylist(playlist, totalDurationFormatted), 'text', '텍스트 리스트가 복사되었습니다! 📋')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            >
              {copiedType === 'text' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>텍스트 복사</span>
            </button>
          </div>

          <button
            onClick={onGoToGenerator}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 cursor-pointer transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>나만의 스밍리스트 만들기 &rarr;</span>
          </button>
        </div>
      </div>

      {/* 2. ONE-CLICK PLATFORM BUTTONS (MELON / GENIE / BUGS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. MELON */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between space-y-3.5 hover:border-emerald-400/50 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#00cd3c] text-slate-950 flex items-center justify-center font-black text-xs shadow-md">
                M
              </div>
              <span className="text-sm font-bold text-slate-100">멜론 (Melon)</span>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
              총 {links.melon.count}곡
            </span>
          </div>

          <div className="space-y-2">
            {links.melon.hasDuplicates ? (
              <div className="space-y-2 p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/20">
                <div className="flex items-center justify-between text-[11px] text-emerald-300 font-semibold">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    중복곡 분할 담기 ({links.melon.parts.length}단계)
                  </span>
                  <span className="text-[10px] text-slate-400">순서대로 클릭</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  멜론 플레이어 중복 누락 방지를 위해 순서대로 눌러주세요.
                </p>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {links.melon.parts.map((part) => {
                    const isClicked = clickedMelonParts[part.partIndex];
                    return (
                      <button
                        key={part.partIndex}
                        onClick={() => handleMelonPartClick(part)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer border ${
                          isClicked
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                            : 'bg-[#00cd3c] hover:bg-[#00b835] text-slate-950 border-transparent shadow-sm'
                        }`}
                      >
                        {isClicked ? <Check className="w-3 h-3 text-emerald-400" /> : <Play className="w-3 h-3 fill-current" />}
                        <span>{part.partIndex}차 ({part.count}곡)</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handleOpenLink(links.melon.full, '멜론 플레이어')}
                  className="w-full py-1 text-[10px] text-slate-400 hover:text-emerald-300 hover:underline text-center cursor-pointer transition-colors block"
                >
                  전체 한 번에 담기 (중복 1회만 반영)
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleOpenLink(links.melon.full, '멜론')}
                disabled={playlist.length === 0}
                className="w-full py-2.5 px-3 rounded-lg bg-[#00cd3c] hover:bg-[#00b835] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-40"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>멜론 플레이어 원클릭 담기</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. GENIE */}
        <div className="bg-sky-950/40 border border-sky-500/30 rounded-2xl p-4 flex flex-col justify-between space-y-3.5 hover:border-sky-400/50 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0092fa] text-white flex items-center justify-center font-black text-xs shadow-md">
                G
              </div>
              <span className="text-sm font-bold text-slate-100">지니 (Genie)</span>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300">
              총 {links.genie.count}곡
            </span>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleOpenLink(links.genie.pc, '지니 PC')}
              disabled={playlist.length === 0}
              className="w-full py-2.5 px-3 rounded-lg bg-[#0092fa] hover:bg-[#0081dd] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-40"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>지니 PC 웹 플레이어 실행</span>
            </button>

            <button
              onClick={() => handleOpenLink(links.genie.app, '지니 모바일')}
              disabled={playlist.length === 0}
              className="w-full py-2 px-3 rounded-lg bg-sky-900/40 hover:bg-sky-800/50 text-sky-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-all border border-sky-700/40 cursor-pointer disabled:opacity-40"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>지니 모바일 앱 실행</span>
            </button>
          </div>
        </div>

        {/* 3. BUGS */}
        <div className="bg-rose-950/40 border border-rose-500/30 rounded-2xl p-4 flex flex-col justify-between space-y-3.5 hover:border-rose-400/50 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#f9423a] text-white flex items-center justify-center font-black text-xs shadow-md">
                B
              </div>
              <span className="text-sm font-bold text-slate-100">벅스 (Bugs)</span>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
              총 {links.bugs.count}곡
            </span>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleOpenLink(links.bugs.pc, '벅스 PC')}
              disabled={playlist.length === 0}
              className="w-full py-2.5 px-3 rounded-lg bg-[#f9423a] hover:bg-[#e0342c] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-40"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>벅스 PC 웹 플레이어 실행</span>
            </button>

            <button
              onClick={() => handleOpenLink(links.bugs.app, '벅스 모바일')}
              disabled={playlist.length === 0}
              className="w-full py-2 px-3 rounded-lg bg-rose-900/40 hover:bg-rose-800/50 text-rose-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-all border border-rose-700/40 cursor-pointer disabled:opacity-40"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>벅스 모바일 앱 실행</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. READ-ONLY TRACK LIST TABLE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">
              수록곡 목록 ({playlist.length}곡)
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-300 font-bold">
            {totalDurationFormatted}
          </span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {playlist.map((song, index) => {
            const badgeClass = getArtistBadge(song.artistType);

            return (
              <div
                key={song.uniqueKey || `${song.id}-${index}`}
                className="flex items-center justify-between p-3 sm:p-3.5 hover:bg-slate-950/40 transition-colors"
              >
                {/* Index + Title + Album */}
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <span className="w-5 text-center text-xs font-mono text-slate-500 font-bold">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">
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

                {/* Duration */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-mono text-slate-300 font-bold bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                    {formatSecondsToTime(song.duration)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
