import React, { useState } from 'react';
import { 
  Play, 
  Copy, 
  Check, 
  ExternalLink, 
  Smartphone, 
  Monitor, 
  Sparkles,
  Info,
  Layers,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { generatePlatformLinks, generateTextPlaylist, isIOS } from '../utils/platformLinks';
import { formatTotalDuration } from '../utils/formatters';

export default function PlatformActions({ playlist, onShowToast }) {
  const [copiedType, setCopiedType] = useState(null);
  const [clickedMelonParts, setClickedMelonParts] = useState({});
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
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      // Custom scheme like melonapp://, bugs3://, cromegenie://
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

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/20 rounded-2xl p-4 md:p-5 shadow-2xl space-y-5">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            원클릭 플레이리스트 담기 (PC / 모바일)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            사용하시는 음원 사이트 버튼을 누르면 PC 플레이어 또는 모바일 앱으로 자동 전송됩니다.
          </p>
        </div>
      </div>

      {/* Main One-Click Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. MELON */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 flex flex-col justify-between space-y-3.5 hover:border-emerald-400/50 transition-colors shadow-lg">
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

          {/* Melon Links Section */}
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
                  멜론 플레이어는 중복 곡을 자동 제거하므로, 아래 버튼들을 순서대로 누르면 전곡이 정상 추가됩니다.
                </p>

                {/* Sequential Part Buttons */}
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

                {/* Single Overwrite Option */}
                <button
                  onClick={() => handleOpenLink(links.melon.full, '멜론 플레이어')}
                  className="w-full py-1 text-[10px] text-slate-400 hover:text-emerald-300 hover:underline text-center cursor-pointer transition-colors block"
                >
                  전체 한 번에 담기 (중복 1회만 반영)
                </button>
              </div>
            ) : (
              /* Melon Single Click */
              <button
                onClick={() => handleOpenLink(links.melon.full, '멜론')}
                disabled={playlist.length === 0}
                className="w-full py-2.5 px-3 rounded-lg bg-[#00cd3c] hover:bg-[#00b835] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>멜론 플레이어 원클릭 담기</span>
              </button>
            )}

            <p className="text-[10px] text-slate-400 text-center">
              * PC 멜론 플레이어 및 모바일 멜론 앱 모두 지원
            </p>
          </div>
        </div>

        {/* 2. GENIE */}
        <div className="bg-sky-950/40 border border-sky-500/30 rounded-xl p-4 flex flex-col justify-between space-y-3.5 hover:border-sky-400/50 transition-colors shadow-lg">
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
            {/* Genie PC Player Link */}
            <button
              onClick={() => handleOpenLink(links.genie.pc, '지니 PC')}
              disabled={playlist.length === 0}
              className="w-full py-2.5 px-3 rounded-lg bg-[#0092fa] hover:bg-[#0081dd] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>지니 PC 웹 플레이어 실행</span>
            </button>

            {/* Genie Mobile App Link */}
            <button
              onClick={() => handleOpenLink(links.genie.app, '지니 모바일')}
              disabled={playlist.length === 0}
              className="w-full py-2 px-3 rounded-lg bg-sky-900/40 hover:bg-sky-800/50 text-sky-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-all border border-sky-700/40 cursor-pointer disabled:opacity-40"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>지니 모바일 앱 실행</span>
            </button>

            <p className="text-[10px] text-slate-400 text-center">
              * `shareProcessV2?xgnm=` 기반 자동 재생목록 추가
            </p>
          </div>
        </div>

        {/* 3. BUGS */}
        <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-4 flex flex-col justify-between space-y-3.5 hover:border-rose-400/50 transition-colors shadow-lg">
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
            {/* Bugs PC Player Link */}
            <button
              onClick={() => handleOpenLink(links.bugs.pc, '벅스 PC')}
              disabled={playlist.length === 0}
              className="w-full py-2.5 px-3 rounded-lg bg-[#f9423a] hover:bg-[#e0342c] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>벅스 PC 웹 플레이어 실행</span>
            </button>

            {/* Bugs Mobile App Link */}
            <button
              onClick={() => handleOpenLink(links.bugs.app, '벅스 모바일')}
              disabled={playlist.length === 0}
              className="w-full py-2 px-3 rounded-lg bg-rose-900/40 hover:bg-rose-800/50 text-rose-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-all border border-rose-700/40 cursor-pointer disabled:opacity-40"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>벅스 모바일 앱 실행</span>
            </button>

            <p className="text-[10px] text-slate-400 text-center">
              * `newPlayer?trackId=` 기반 자동 재생목록 추가
            </p>
          </div>
        </div>
      </div>

      {/* Copy Text / Share Buttons */}
      <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Info className="w-3.5 h-3.5 text-emerald-400" />
          <span>텍스트로 복사하거나 커뮤니티(트위터/카페/팬카페)에 스밍리스트를 공유할 수 있습니다.</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCopy(generateTextPlaylist(playlist, totalDurationFormatted), 'text', '스밍리스트가 텍스트로 복사되었습니다!')}
            className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
          >
            {copiedType === 'text' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>텍스트 리스트 복사</span>
          </button>
        </div>
      </div>
    </div>
  );
}
