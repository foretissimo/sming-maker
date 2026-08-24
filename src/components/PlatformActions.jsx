import React, { useState } from 'react';
import { 
  Play, 
  Copy, 
  Check, 
  ExternalLink, 
  Smartphone, 
  Monitor, 
  Sparkles,
  Info
} from 'lucide-react';
import { generatePlatformLinks, generateTextPlaylist, isIOS } from '../utils/platformLinks';
import { formatTotalDuration } from '../utils/formatters';

export default function PlatformActions({ playlist, onShowToast }) {
  const [copiedType, setCopiedType] = useState(null);
  const links = generatePlatformLinks(playlist);
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
      if (onShowToast) onShowToast(`${platformName} 곡 정보가 부족합니다.`);
      return;
    }
    window.location.href = url;
  };

  const isIosDevice = typeof window !== 'undefined' && isIOS();

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/20 rounded-2xl p-4 md:p-5 shadow-2xl space-y-5">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            원클릭 플레이리스트 담기
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            버튼을 누르면 음악 앱이 실행되며 재생목록에 자동 추가됩니다.
          </p>
        </div>
      </div>

      {/* Main One-Click Platform Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {/* 1. MELON */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3.5 flex flex-col justify-between space-y-3 hover:border-emerald-400/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#00cd3c] text-white flex items-center justify-center font-black text-xs shadow-md">
                M
              </div>
              <span className="text-sm font-bold text-slate-100">멜론 (Melon)</span>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
              {links.melon.count}곡
            </span>
          </div>

          <div className="space-y-1.5">
            {/* Melon Mobile Link */}
            <button
              onClick={() => handleOpenLink(isIosDevice ? links.melon.ios : links.melon.android, '멜론')}
              disabled={playlist.length === 0}
              className="w-full py-2 px-3 rounded-lg bg-[#00cd3c] hover:bg-[#00b835] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>멜론 원클릭 (모바일)</span>
            </button>

            {/* Melon PC Link */}
            <button
              onClick={() => handleOpenLink(links.melon.pc, '멜론 PC')}
              disabled={playlist.length === 0}
              className="w-full py-1.5 px-3 rounded-lg bg-emerald-900/40 hover:bg-emerald-800/50 text-emerald-200 font-medium text-[11px] flex items-center justify-center gap-1.5 transition-all border border-emerald-700/40 cursor-pointer disabled:opacity-40"
            >
              <Monitor className="w-3 h-3" />
              <span>멜론 PC 플레이어</span>
            </button>
          </div>
        </div>

        {/* 2. GENIE */}
        <div className="bg-sky-950/40 border border-sky-500/30 rounded-xl p-3.5 flex flex-col justify-between space-y-3 hover:border-sky-400/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0092fa] text-white flex items-center justify-center font-black text-xs shadow-md">
                G
              </div>
              <span className="text-sm font-bold text-slate-100">지니 (Genie)</span>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300">
              {links.genie.count}곡
            </span>
          </div>

          <div className="space-y-1.5">
            <button
              onClick={() => handleOpenLink(links.genie.app, '지니')}
              disabled={playlist.length === 0}
              className="w-full py-2 px-3 rounded-lg bg-[#0092fa] hover:bg-[#0081dd] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>지니 원클릭 실행</span>
            </button>

            <button
              onClick={() => handleOpenLink(links.genie.web, '지니 웹')}
              disabled={playlist.length === 0}
              className="w-full py-1.5 px-3 rounded-lg bg-sky-900/40 hover:bg-sky-800/50 text-sky-200 font-medium text-[11px] flex items-center justify-center gap-1.5 transition-all border border-sky-700/40 cursor-pointer disabled:opacity-40"
            >
              <ExternalLink className="w-3 h-3" />
              <span>지니 웹 플레이어</span>
            </button>
          </div>
        </div>

        {/* 3. BUGS */}
        <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-3.5 flex flex-col justify-between space-y-3 hover:border-rose-400/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#f9423a] text-white flex items-center justify-center font-black text-xs shadow-md">
                B
              </div>
              <span className="text-sm font-bold text-slate-100">벅스 (Bugs)</span>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
              {links.bugs.count}곡
            </span>
          </div>

          <div className="space-y-1.5">
            <button
              onClick={() => handleOpenLink(links.bugs.app, '벅스')}
              disabled={playlist.length === 0}
              className="w-full py-2 px-3 rounded-lg bg-[#f9423a] hover:bg-[#e0342c] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>벅스 원클릭 실행</span>
            </button>

            <button
              onClick={() => handleOpenLink(links.bugs.web, '벅스 웹')}
              disabled={playlist.length === 0}
              className="w-full py-1.5 px-3 rounded-lg bg-rose-900/40 hover:bg-rose-800/50 text-rose-200 font-medium text-[11px] flex items-center justify-center gap-1.5 transition-all border border-rose-700/40 cursor-pointer disabled:opacity-40"
            >
              <ExternalLink className="w-3 h-3" />
              <span>벅스 웹 플레이어</span>
            </button>
          </div>
        </div>

        {/* 4. VIBE */}
        <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-3.5 flex flex-col justify-between space-y-3 hover:border-purple-400/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#ff0055] text-white flex items-center justify-center font-black text-xs shadow-md">
                V
              </div>
              <span className="text-sm font-bold text-slate-100">바이브 (VIBE)</span>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
              {links.vibe.count}곡
            </span>
          </div>

          <button
            onClick={() => handleOpenLink(links.vibe.app, '바이브')}
            disabled={playlist.length === 0}
            className="w-full py-2 px-3 rounded-lg bg-[#ff0055] hover:bg-[#d90048] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-40"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>바이브 원클릭 실행</span>
          </button>
        </div>

        {/* 5. FLO */}
        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3.5 flex flex-col justify-between space-y-3 hover:border-indigo-400/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#3b47f7] text-white flex items-center justify-center font-black text-xs shadow-md">
                F
              </div>
              <span className="text-sm font-bold text-slate-100">플로 (FLO)</span>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
              {links.flo.count}곡
            </span>
          </div>

          <button
            onClick={() => handleOpenLink(links.flo.app, '플로')}
            disabled={playlist.length === 0}
            className="w-full py-2 px-3 rounded-lg bg-[#3b47f7] hover:bg-[#2b37d7] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-40"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>플로 앱 실행</span>
          </button>
        </div>

        {/* 6. TEXT COPY */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center font-black text-xs">
                📋
              </div>
              <span className="text-sm font-bold text-slate-100">리스트 텍스트 복사</span>
            </div>
          </div>

          <button
            onClick={() => handleCopy(generateTextPlaylist(playlist, totalDurationFormatted), 'text', '스밍리스트가 클립보드에 복사되었습니다!')}
            disabled={playlist.length === 0}
            className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700 cursor-pointer disabled:opacity-40"
          >
            {copiedType === 'text' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>복사 완료!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>스밍 목록 텍스트 복사</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ID Clipboard fast copy pills */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-400 text-[11px] flex items-center gap-1">
          <Info className="w-3 h-3 text-slate-500" />
          플랫폼별 Track ID만 복사:
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => handleCopy(links.melon.ids.join(','), 'melon_id', '멜론 곡 ID 목록이 복사되었습니다.')}
            className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-emerald-400 font-mono text-[11px] cursor-pointer"
          >
            멜론 ID ({links.melon.count})
          </button>
          <button
            onClick={() => handleCopy(links.genie.ids.join(';'), 'genie_id', '지니 곡 ID 목록이 복사되었습니다.')}
            className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-sky-400 font-mono text-[11px] cursor-pointer"
          >
            지니 ID ({links.genie.count})
          </button>
          <button
            onClick={() => handleCopy(links.bugs.ids.join('|'), 'bugs_id', '벅스 곡 ID 목록이 복사되었습니다.')}
            className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-rose-400 font-mono text-[11px] cursor-pointer"
          >
            벅스 ID ({links.bugs.count})
          </button>
        </div>
      </div>
    </div>
  );
}
