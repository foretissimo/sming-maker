import React, { useState, useEffect } from 'react';
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
  Trash2,
  Apple,
  Radio,
  Plus
} from 'lucide-react';
import { 
  generatePlatformLinks, 
  generateTextPlaylist, 
  getDefaultDeviceCategory 
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
  youtubeUrl: initialYoutubeUrl = '', 
  onChangeYoutubeUrl,
  onShowToast 
}) {
  const [deviceCategory, setDeviceCategory] = useState(() => getDefaultDeviceCategory());
  const [copiedType, setCopiedType] = useState(null);
  const [clickedMelonParts, setClickedMelonParts] = useState({});

  // YouTube input state (persisted to LocalStorage if onChangeYoutubeUrl not passed)
  const [youtubeInput, setYoutubeInput] = useState(() => {
    try {
      return initialYoutubeUrl || localStorage.getItem('sming_youtube_url') || '';
    } catch (e) {
      return '';
    }
  });

  const links = generatePlatformLinks(playlist, { youtubeUrl: youtubeInput.trim() });
  const totalSeconds = playlist.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalDurationFormatted = formatTotalDuration(totalSeconds);

  // Sync YouTube URL
  const handleSaveYoutube = (val) => {
    setYoutubeInput(val);
    try {
      localStorage.setItem('sming_youtube_url', val);
    } catch (e) {}
    if (onChangeYoutubeUrl) onChangeYoutubeUrl(val);
  };

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
      {/* Header & Device Category Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div>
          <h3 className="text-base font-bold bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            원클릭 플레이리스트 담기
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            기기 환경에 맞춰 원클릭으로 음원 사이트에 스트리밍 리스트를 전송합니다.
          </p>
        </div>

        {/* 3-Category Device Switcher */}
        <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
          <button
            onClick={() => setDeviceCategory('pc')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              deviceCategory === 'pc'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>PC</span>
          </button>

          <button
            onClick={() => setDeviceCategory('ios')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              deviceCategory === 'ios'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>아이폰</span>
          </button>

          <button
            onClick={() => setDeviceCategory('android')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              deviceCategory === 'android'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>갤럭시</span>
          </button>
        </div>
      </div>

      {/* Main Platform Cards Grid based on selected category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* 1. MELON CARD (PC / iOS / Android) */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between space-y-3.5 hover:border-emerald-400/50 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#00cd3c] text-slate-950 flex items-center justify-center font-black text-xs shadow-md">
                M
              </div>
              <div>
                <span className="text-sm font-bold text-slate-100">멜론</span>
                <span className="text-[10px] text-slate-400 ml-1.5">
                  {deviceCategory === 'pc' ? 'PC 플레이어' : deviceCategory === 'ios' ? 'iOS 앱' : '안드로이드 앱'}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
              {links.melon.count}곡
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
                  멜론 중복 누락 방지를 위해 순서대로 눌러주세요.
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
                  onClick={() => handleOpenLink(links.melon.full, '멜론')}
                  className="w-full py-1 text-[10px] text-slate-400 hover:text-emerald-300 hover:underline text-center cursor-pointer transition-colors block"
                >
                  전체 한 번에 담기 (중복 1회만 반영)
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleOpenLink(links.melon.full, '멜론')}
                disabled={playlist.length === 0}
                className="w-full py-2.5 px-3 rounded-xl bg-[#00cd3c] hover:bg-[#00b835] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-40"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>멜론 원클릭 담기</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. GENIE CARD (PC / iOS / Android) */}
        <div className="bg-sky-950/40 border border-sky-500/30 rounded-2xl p-4 flex flex-col justify-between space-y-3.5 hover:border-sky-400/50 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0092fa] text-white flex items-center justify-center font-black text-xs shadow-md">
                G
              </div>
              <div>
                <span className="text-sm font-bold text-slate-100">지니</span>
                <span className="text-[10px] text-slate-400 ml-1.5">
                  {deviceCategory === 'pc' ? 'PC 웹플레이어' : deviceCategory === 'ios' ? 'iOS 앱' : '안드로이드 앱'}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300">
              {links.genie.count}곡
            </span>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleOpenLink(deviceCategory === 'pc' ? links.genie.pc : links.genie.app, '지니')}
              disabled={playlist.length === 0}
              className="w-full py-2.5 px-3 rounded-xl bg-[#0092fa] hover:bg-[#0081dd] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-40"
            >
              {deviceCategory === 'pc' ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
              <span>
                {deviceCategory === 'pc' ? '지니 PC 웹 플레이어 실행' : '지니 모바일 앱 실행'}
              </span>
            </button>
          </div>
        </div>

        {/* 3. BUGS CARD (PC / iOS / Android) */}
        <div className="bg-rose-950/40 border border-rose-500/30 rounded-2xl p-4 flex flex-col justify-between space-y-3.5 hover:border-rose-400/50 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#f9423a] text-white flex items-center justify-center font-black text-xs shadow-md">
                B
              </div>
              <div>
                <span className="text-sm font-bold text-slate-100">벅스</span>
                <span className="text-[10px] text-slate-400 ml-1.5">
                  {deviceCategory === 'pc' ? 'PC 웹플레이어' : deviceCategory === 'ios' ? 'iOS 앱' : '안드로이드 앱'}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
              {links.bugs.count}곡
            </span>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleOpenLink(deviceCategory === 'pc' ? links.bugs.pc : links.bugs.app, '벅스')}
              disabled={playlist.length === 0}
              className="w-full py-2.5 px-3 rounded-xl bg-[#f9423a] hover:bg-[#e0342c] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-40"
            >
              {deviceCategory === 'pc' ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
              <span>
                {deviceCategory === 'pc' ? '벅스 PC 웹 플레이어 실행' : '벅스 모바일 앱 실행'}
              </span>
            </button>
          </div>
        </div>

        {/* 4. YOUTUBE CARD (Dynamic: Appears in PC / Mobile when YouTube URL is entered) */}
        {links.youtube.url && (
          <div className="bg-red-950/40 border border-red-500/40 rounded-2xl p-4 flex flex-col justify-between space-y-3.5 hover:border-red-400/60 transition-colors shadow-lg animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#ff0000] text-white flex items-center justify-center font-black text-xs shadow-md">
                  <YoutubeIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-100">유튜브</span>
                  <span className="text-[10px] text-red-300 ml-1.5">MV / 음원</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                연결됨 🔗
              </span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleOpenLink(links.youtube.url, '유튜브')}
                className="w-full py-2.5 px-3 rounded-xl bg-[#ff0000] hover:bg-[#e60000] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>유튜브 바로가기 / 재생</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* YouTube URL Input Form at the bottom of One-Click Panel */}
      <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <YoutubeIcon className="w-4 h-4 text-red-400" />
            <span>유튜브 (YouTube / YouTube Music) 링크 등록</span>
          </label>

          {youtubeInput && (
            <button
              onClick={() => handleSaveYoutube('')}
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
              onChange={(e) => handleSaveYoutube(e.target.value)}
              placeholder="유튜브 MV 또는 재생목록 링크를 입력하면 상단에 원클릭 버튼이 생성됩니다 (예: https://youtu.be/...)"
              className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-red-500 transition-colors font-mono"
            />
          </div>

          {youtubeInput && (
            <button
              onClick={() => handleOpenLink(youtubeInput, '유튜브')}
              className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors flex-shrink-0"
              title="입력한 링크 테스트 열기"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>열기</span>
            </button>
          )}
        </div>
      </div>

      {/* Copy Text Playlist Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
        <span className="text-slate-400 font-mono">
          총 {playlist.length}곡 • {totalDurationFormatted}
        </span>

        <button
          onClick={() => handleCopy(generateTextPlaylist(playlist, totalDurationFormatted), 'text', '텍스트 리스트가 클립보드에 복사되었습니다! 📋')}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
        >
          {copiedType === 'text' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>스밍리스트 텍스트 복사 (카페/SNS용)</span>
        </button>
      </div>
    </div>
  );
}
