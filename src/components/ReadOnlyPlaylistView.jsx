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
  Plus,
  Apple,
  Link2,
  Trash2
} from 'lucide-react';
import { formatSecondsToTime, formatTotalDuration, formatDate } from '../utils/formatters';
import { generatePlatformLinks, generateTextPlaylist, generateAllUrlsText } from '../utils/platformLinks';

function YoutubeIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

export default function ReadOnlyPlaylistView({
  title = '포레스텔라 1시간 스밍리스트',
  creator = '숲별',
  desc = '',
  playlist = [],
  artists = [],
  youtubeUrl: initialYoutubeUrl = '',
  created = '',
  daysElapsed = 0,
  isExpired = false,
  isOld = false,
  onGoToGenerator,
  onShowToast
}) {
  const [copiedType, setCopiedType] = useState(null);
  const [clickedMelonParts, setClickedMelonParts] = useState({});
  const [youtubeInput, setYoutubeInput] = useState(initialYoutubeUrl || '');

  // Sync when initialYoutubeUrl changes
  React.useEffect(() => {
    if (initialYoutubeUrl !== undefined) {
      setYoutubeInput(initialYoutubeUrl || '');
    }
  }, [initialYoutubeUrl]);

  const totalSeconds = playlist.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalDurationFormatted = formatTotalDuration(totalSeconds);
  const links = generatePlatformLinks(playlist, { youtubeUrl: youtubeInput.trim() });

  const handleCopy = (text, type, successMsg) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    if (onShowToast) onShowToast(successMsg);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleOpenLink = (url, platformName) => {
    if (!url) {
      if (onShowToast) onShowToast(`${platformName} 곡 정보 또는 링크가 없습니다.`);
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

  const handleMelonPartClick = (part, deviceKey, deviceName) => {
    const targetUrl = part[deviceKey] || part.url || part.pc;
    handleOpenLink(targetUrl, `멜론(${deviceName}) Part ${part.partIndex}`);
    setClickedMelonParts(prev => ({
      ...prev,
      [`${deviceKey}-${part.partIndex}`]: true
    }));
    if (onShowToast) {
      onShowToast(`멜론 ${part.partIndex}차 리스트(${part.count}곡) 담기를 실행했습니다.`);
    }
  };

  const getArtistBadge = (artistType) => {
    const found = artists.find(a => a.id === artistType);
    return found ? found.badgeColor : 'bg-slate-800 text-slate-300 border-slate-700';
  };

  // Reusable Melon Buttons Box
  const renderMelonBox = (deviceKey, deviceLabel) => {
    const melonDirectUrl = links.melon[deviceKey] || links.melon.full || links.melon.pc;

    return (
      <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-3.5 flex flex-col justify-between space-y-2.5 hover:border-emerald-400/50 transition-colors shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#00cd3c] text-slate-950 flex items-center justify-center font-black text-xs shadow-sm">
              M
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-100">멜론</span>
              <span className="text-[10px] text-emerald-400/80 ml-1 font-mono">({deviceLabel})</span>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
            {links.melon.count}곡
          </span>
        </div>

        <div className="space-y-1.5">
          {links.melon.hasDuplicates ? (
            <div className="space-y-1.5 p-2 rounded-xl bg-slate-950/80 border border-emerald-500/20">
              <div className="flex items-center justify-between text-[10px] text-emerald-300 font-semibold">
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-emerald-400" />
                  중복곡 분할 담기 ({links.melon.parts.length}단계)
                </span>
                <span className="text-[9px] text-slate-400">순서대로 클릭</span>
              </div>

              <div className="grid grid-cols-2 gap-1 pt-0.5">
                {links.melon.parts.map((part) => {
                  const isClicked = clickedMelonParts[`${deviceKey}-${part.partIndex}`];
                  return (
                    <button
                      key={part.partIndex}
                      onClick={() => handleMelonPartClick(part, deviceKey, deviceLabel)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer border ${
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
                onClick={() => handleOpenLink(melonDirectUrl, `멜론(${deviceLabel})`)}
                className="w-full py-0.5 text-[9px] text-slate-400 hover:text-emerald-300 hover:underline text-center cursor-pointer transition-colors block"
              >
                전체 한 번에 담기 (중복 1회만 반영)
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleOpenLink(melonDirectUrl, `멜론(${deviceLabel})`)}
              disabled={playlist.length === 0}
              className="w-full py-2.5 px-3 rounded-xl bg-[#00cd3c] hover:bg-[#00b835] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-40"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>멜론 담기</span>
            </button>
          )}
        </div>
      </div>
    );
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
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleCopy(window.location.href, 'link', '스밍리스트 공유 링크가 복사되었습니다! 🔗')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            >
              {copiedType === 'link' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>공유 링크 복사</span>
            </button>
            <button
              onClick={() => handleCopy(generateTextPlaylist(playlist, totalDurationFormatted), 'text', '전체 곡 목록 텍스트가 복사되었습니다! 📋')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            >
              {copiedType === 'text' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>곡 리스트 복사</span>
            </button>
            <button
              onClick={() => handleCopy(generateAllUrlsText(playlist, totalDurationFormatted, { title, youtubeUrl: youtubeInput.trim() }), 'urls', '모든 기기 원클릭 스밍 URL 모음이 복사되었습니다! 🔗')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-500/30 shadow-sm"
            >
              {copiedType === 'urls' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span>전체 URL 복사</span>
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

      {/* Expiration Hard Block Warning */}
      {isExpired && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border-2 border-rose-500/60 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div>
              <h3 className="text-sm font-bold text-rose-300">
                공유 리스트 유효기간 만료 (최대 1년 경과)
              </h3>
              <p className="text-xs text-rose-200/90 mt-0.5">
                이 공유 리스트는 보관 유효기간(최대 1년)이 만료되었습니다. 최신 곡 데이터로 새로운 1시간 스밍리스트를 생성해주세요.
              </p>
            </div>
          </div>
          <button
            onClick={onGoToGenerator}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex-shrink-0 cursor-pointer shadow-md transition-all whitespace-nowrap"
          >
            새 리스트 생성하기 &rarr;
          </button>
        </div>
      )}

      {/* 6-Month Retention Caution Banner */}
      {isOld && !isExpired && (
        <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              이 공유 리스트는 생성된 지 <strong className="text-amber-300">6개월이 경과</strong>했습니다. (생성일: {created || '이전 생성'})
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap font-mono">
            최대 1년 후 만료
          </span>
        </div>
      )}

      {/* 2. ONE-CLICK PLATFORM ACTION CARDS (3 SECTIONS ALL AT ONCE) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-6">
        <div className="pb-2 border-b border-slate-800">
          <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            원클릭 플레이리스트 담기 (PC • 갤럭시 • 아이폰)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            사용하시는 기기 환경에 맞는 바로가기 버튼을 누르면 해당 플레이어나 앱으로 전송됩니다.
          </p>
        </div>

        {/* ---------------- PC SECTION ---------------- */}
        <div className="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Monitor className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span>PC</span>
              <span className="text-xs text-slate-400 font-normal">(웹 브라우저 & PC 플레이어)</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {/* Melon Windows */}
            {renderMelonBox('pc_win', 'Windows')}

            {/* Melon Mac */}
            {renderMelonBox('pc_mac', 'Mac')}

            <div className="bg-sky-950/30 border border-sky-500/30 rounded-2xl p-3.5 flex flex-col justify-between space-y-2.5 hover:border-sky-400/50 transition-colors shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#0092fa] text-white flex items-center justify-center font-black text-xs shadow-sm">
                    G
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-100">지니</span>
                    <span className="text-[10px] text-sky-400/80 ml-1 font-mono">(PC 웹)</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300">
                  {links.genie.count}곡
                </span>
              </div>
              <button
                onClick={() => handleOpenLink(links.genie.pc, '지니')}
                disabled={playlist.length === 0}
                className="w-full py-2.5 px-3 rounded-xl bg-[#0092fa] hover:bg-[#0081dd] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-40"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>지니 PC 플레이어</span>
              </button>
            </div>

            <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-3.5 flex flex-col justify-between space-y-2.5 hover:border-rose-400/50 transition-colors shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#f9423a] text-white flex items-center justify-center font-black text-xs shadow-sm">
                    B
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-100">벅스</span>
                    <span className="text-[10px] text-rose-400/80 ml-1 font-mono">(PC 웹)</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                  {links.bugs.count}곡
                </span>
              </div>
              <button
                onClick={() => handleOpenLink(links.bugs.pc, '벅스')}
                disabled={playlist.length === 0}
                className="w-full py-2.5 px-3 rounded-xl bg-[#f9423a] hover:bg-[#e0342c] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-40"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>벅스 PC 플레이어</span>
              </button>
            </div>

            {links.youtube.url && (
              <div className="bg-red-950/40 border border-red-500/40 rounded-2xl p-3.5 flex flex-col justify-between space-y-2.5 hover:border-red-400/60 transition-colors shadow-sm animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#ff0000] text-white flex items-center justify-center font-black text-xs shadow-sm">
                      <YoutubeIcon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-100">유튜브</span>
                      <span className="text-[10px] text-red-400/80 ml-1 font-mono">(MV/음원)</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                    연결됨 🔗
                  </span>
                </div>
                <button
                  onClick={() => handleOpenLink(links.youtube.url, '유튜브')}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#ff0000] hover:bg-[#e60000] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>유튜브 바로가기</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ---------------- GALAXY SECTION ---------------- */}
        <div className="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Smartphone className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span>갤럭시</span>
              <span className="text-xs text-slate-400 font-normal">(안드로이드 모바일 앱)</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {renderMelonBox('android', '안드로이드 앱')}

            <div className="bg-sky-950/30 border border-sky-500/30 rounded-2xl p-3.5 flex flex-col justify-between space-y-2.5 hover:border-sky-400/50 transition-colors shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#0092fa] text-white flex items-center justify-center font-black text-xs shadow-sm">
                    G
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-100">지니</span>
                    <span className="text-[10px] text-sky-400/80 ml-1 font-mono">(안드로이드 앱)</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300">
                  {links.genie.count}곡
                </span>
              </div>
              <button
                onClick={() => handleOpenLink(links.genie.android, '지니')}
                disabled={playlist.length === 0}
                className="w-full py-2.5 px-3 rounded-xl bg-[#0092fa] hover:bg-[#0081dd] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-40"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>지니 앱 실행</span>
              </button>
            </div>

            <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-3.5 flex flex-col justify-between space-y-2.5 hover:border-rose-400/50 transition-colors shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#f9423a] text-white flex items-center justify-center font-black text-xs shadow-sm">
                    B
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-100">벅스</span>
                    <span className="text-[10px] text-rose-400/80 ml-1 font-mono">(안드로이드 앱)</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                  {links.bugs.count}곡
                </span>
              </div>
              <button
                onClick={() => handleOpenLink(links.bugs.android, '벅스')}
                disabled={playlist.length === 0}
                className="w-full py-2.5 px-3 rounded-xl bg-[#f9423a] hover:bg-[#e0342c] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-40"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>벅스 앱 실행</span>
              </button>
            </div>
          </div>
        </div>

        {/* ---------------- IPHONE & IPAD (IOS) SECTION ---------------- */}
        <div className="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30">
              <Apple className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span>아이폰 • 아이패드</span>
              <span className="text-xs text-slate-400 font-normal">(iOS / iPadOS)</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Melon iPhone */}
            {renderMelonBox('ios', '아이폰 앱')}

            {/* Melon iPad */}
            {renderMelonBox('ipad', '아이패드 앱')}

            {/* Genie iOS */}
            <div className="bg-sky-950/30 border border-sky-500/30 rounded-2xl p-3.5 flex flex-col justify-between space-y-2.5 hover:border-sky-400/50 transition-colors shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#0092fa] text-white flex items-center justify-center font-black text-xs shadow-sm">
                    G
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-100">지니</span>
                    <span className="text-[10px] text-sky-400/80 ml-1 font-mono">(iOS)</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300">
                  {links.genie.count}곡
                </span>
              </div>
              <button
                onClick={() => handleOpenLink(links.genie.ios, '지니')}
                disabled={playlist.length === 0}
                className="w-full py-2.5 px-3 rounded-xl bg-[#0092fa] hover:bg-[#0081dd] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-40"
              >
                <Apple className="w-3.5 h-3.5" />
                <span>지니 앱 실행</span>
              </button>
            </div>

            {/* Bugs iOS */}
            <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-3.5 flex flex-col justify-between space-y-2.5 hover:border-rose-400/50 transition-colors shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#f9423a] text-white flex items-center justify-center font-black text-xs shadow-sm">
                    B
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-100">벅스</span>
                    <span className="text-[10px] text-rose-400/80 ml-1 font-mono">(iOS)</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                  {links.bugs.count}곡
                </span>
              </div>
              <button
                onClick={() => handleOpenLink(links.bugs.ios, '벅스')}
                disabled={playlist.length === 0}
                className="w-full py-2.5 px-3 rounded-xl bg-[#f9423a] hover:bg-[#e0342c] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-40"
              >
                <Apple className="w-3.5 h-3.5" />
                <span>벅스 앱 실행</span>
              </button>
            </div>
          </div>
        </div>

        {/* ---------------- YOUTUBE URL INPUT FORM AT BOTTOM ---------------- */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <YoutubeIcon className="w-4 h-4 text-red-400" />
              <span>유튜브 (YouTube / YouTube Music) 링크 등록</span>
            </label>
            {youtubeInput && (
              <button
                onClick={() => setYoutubeInput('')}
                className="text-[11px] text-slate-500 hover:text-rose-400 flex items-center gap-0.5 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>링크 지우기</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Link2 className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={youtubeInput}
                onChange={(e) => setYoutubeInput(e.target.value)}
                placeholder="유튜브 MV 또는 재생목록 링크를 입력하면 PC 섹션에 바로가기 버튼이 나타납니다 (예: https://youtu.be/...)"
                className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-red-500 transition-colors font-mono"
              />
            </div>
            {youtubeInput && (
              <button
                onClick={() => handleOpenLink(youtubeInput, '유튜브')}
                className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors flex-shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>열기</span>
              </button>
            )}
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
