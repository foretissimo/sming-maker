import React, { useState } from 'react';
import { 
  Play, 
  Copy, 
  Check, 
  ExternalLink, 
  Smartphone, 
  Monitor, 
  Sparkles, 
  Layers, 
  Link2, 
  Apple, 
  Radio 
} from 'lucide-react';
import { 
  generatePlatformLinks, 
  generateTextPlaylist, 
  generateProxyUrlsText, 
  generateOriginalUrlsText,
  toProxyUrl
} from '../utils/platformLinks';
import { formatTotalDuration } from '../utils/formatters';

function YoutubeIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

export default function PlatformActions({ 
  playlist, 
  youtubeUrl = '', 
  onShowToast 
}) {
  const [copiedType, setCopiedType] = useState(null);
  const [clickedMelonParts, setClickedMelonParts] = useState({});

  const youtubeTrimmed = (youtubeUrl || '').trim();
  const links = generatePlatformLinks(playlist, { youtubeUrl: youtubeTrimmed });
  const totalSeconds = playlist.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalDurationFormatted = formatTotalDuration(totalSeconds);

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
    const target = toProxyUrl(url);
    if (target.startsWith('http://') || target.startsWith('https://')) {
      const opened = window.open(target, '_blank', 'noopener,noreferrer');
      if (!opened || opened.closed || typeof opened.closed === 'undefined') {
        window.location.href = target;
      }
    } else {
      window.location.href = target;
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
          {links.melon.hasDuplicates && deviceKey !== 'ipad' ? (
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
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/20 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-6">
      {/* Title */}
      <div className="pb-2 border-b border-slate-800/80">
        <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          원클릭 플레이리스트 담기 (PC • 갤럭시 • 아이폰)
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          기기 환경에 맞는 바로가기 버튼을 누르면 해당 플레이어나 앱으로 스밍 목록이 즉시 전송됩니다.
        </p>
      </div>

      {/* 🌊 멜론 뮤직웨이브 (상시 운영) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-950 to-teal-950/60 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg hover:border-emerald-400/60 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00cd3c] text-slate-950 flex items-center justify-center font-black text-lg shadow-md flex-shrink-0">
            🌊
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>멜론 뮤직웨이브 (Music Wave)</span>
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00cd3c]/20 text-[#00cd3c] border border-[#00cd3c]/40 animate-pulse">
                상시 운영 🟢
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              포레스텔라 공식 멜론 뮤직웨이브 채널에서 24시간 실시간 함께 듣기 & 채팅에 참여하세요!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap">
          <a
            href="http://forestellastream.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer whitespace-nowrap active:scale-[0.98]"
            title="포레스텔라 음원총공팀 공식 홈페이지"
          >
            <span>🌲 음총팀 홈</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href="https://into.melon.com/bridge/kakaotalk/musicwave/VvseWVazR3I9q3Kuzn_eFA?type=channel&t=1751896537993"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-[#00cd3c] hover:bg-[#00b835] text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950/50 cursor-pointer whitespace-nowrap active:scale-[0.98]"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>뮤직웨이브 입장하기</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. PC SECTION */}
      {/* ========================================================================= */}
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

          {/* Genie PC */}
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

          {/* Bugs PC */}
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

          {/* YouTube PC (Appears when YouTube URL is entered) */}
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

      {/* ========================================================================= */}
      {/* 2. GALAXY (ANDROID) SECTION */}
      {/* ========================================================================= */}
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
          {/* Melon Galaxy */}
          {renderMelonBox('android', '안드로이드 앱')}

          {/* Genie Galaxy */}
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

          {/* Bugs Galaxy */}
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

      {/* ========================================================================= */}
      {/* 3. IPHONE & IPAD (IOS) SECTION */}
      {/* ========================================================================= */}
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

          {/* Genie iPhone/iPad */}
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

          {/* Bugs iPhone/iPad */}
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

      {/* Copy Text Playlist & All URLs Footer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
        <span className="text-slate-400 font-mono">
          총 {playlist.length}곡 • {totalDurationFormatted}
        </span>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleCopy(generateTextPlaylist(playlist, totalDurationFormatted), 'text', '스밍리스트 곡 목록 텍스트가 클립보드에 복사되었습니다! 📋')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
          >
            {copiedType === 'text' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>전체 곡 리스트 복사</span>
          </button>

          <button
            onClick={() => handleCopy(generateProxyUrlsText(playlist, totalDurationFormatted, { youtubeUrl: youtubeTrimmed }), 'proxy_urls', '🌐 SNS/카페 공유용 웹 프록시(HTTPS) 전체 URL 모음이 복사되었습니다! 🔗')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-500/30 shadow-sm"
            title="트위터, 다음/네이버 카페, 카카오톡 어디서나 클릭 시 앱이 즉시 실행되는 HTTPS 링크 모음"
          >
            {copiedType === 'proxy_urls' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span>🌐 웹 프록시 전체 URL 복사 (SNS/카페용)</span>
          </button>

          <button
            onClick={() => handleCopy(generateOriginalUrlsText(playlist, totalDurationFormatted, { youtubeUrl: youtubeTrimmed }), 'orig_urls', '📱 앱 직접 실행용 원본 스키마 URL 모음이 복사되었습니다! 📱')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700 shadow-sm"
            title="기기 단축어 또는 앱 직접 실행용 원본 스키마 URI 링크 모음"
          >
            {copiedType === 'orig_urls' ? <Check className="w-3.5 h-3.5 text-slate-100" /> : <Smartphone className="w-3.5 h-3.5 text-slate-400" />}
            <span>📱 앱 원본 전체 URL 복사</span>
          </button>
        </div>
      </div>
    </div>
  );
}
