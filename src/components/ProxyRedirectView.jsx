import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  Play, 
  Sparkles, 
  ArrowLeft, 
  Info
} from 'lucide-react';

function parsePlatformInfo(targetUrl) {
  if (!targetUrl) {
    return { name: '음악 앱', brandColor: '#10b981', iconText: '🎵', bgGradient: 'from-emerald-950/80 to-slate-900' };
  }
  const urlLower = targetUrl.toLowerCase();
  if (urlLower.startsWith('melonapp') || urlLower.startsWith('melonplayer') || urlLower.startsWith('melonipad')) {
    return { 
      name: '멜론 (Melon)', 
      brandColor: '#00cd3c', 
      textColor: 'text-[#00cd3c]',
      btnBg: 'bg-[#00cd3c] hover:bg-[#00b835] text-slate-950',
      iconText: 'M', 
      bgGradient: 'from-emerald-950/80 via-slate-900 to-teal-950/70',
      borderClass: 'border-emerald-500/40'
    };
  }
  if (urlLower.startsWith('ktolleh') || urlLower.startsWith('cromegenie') || urlLower.includes('genie.co.kr')) {
    return { 
      name: '지니 (Genie)', 
      brandColor: '#0092fa', 
      textColor: 'text-sky-400',
      btnBg: 'bg-[#0092fa] hover:bg-[#0081dd] text-white',
      iconText: 'G', 
      bgGradient: 'from-sky-950/80 via-slate-900 to-blue-950/70',
      borderClass: 'border-sky-500/40'
    };
  }
  if (urlLower.startsWith('bugs') || urlLower.includes('bugs.co.kr')) {
    return { 
      name: '벅스 (Bugs)', 
      brandColor: '#f9423a', 
      textColor: 'text-rose-400',
      btnBg: 'bg-[#f9423a] hover:bg-[#e0342c] text-white',
      iconText: 'B', 
      bgGradient: 'from-rose-950/80 via-slate-900 to-red-950/70',
      borderClass: 'border-rose-500/40'
    };
  }
  if (urlLower.startsWith('flomobile') || urlLower.includes('music-flo')) {
    return { 
      name: '플로 (FLO)', 
      brandColor: '#3c3df5', 
      textColor: 'text-indigo-400',
      btnBg: 'bg-[#3c3df5] hover:bg-[#2e2fe0] text-white',
      iconText: 'F', 
      bgGradient: 'from-indigo-950/80 via-slate-900 to-purple-950/70',
      borderClass: 'border-indigo-500/40'
    };
  }
  if (urlLower.startsWith('vibe') || urlLower.includes('vibe.naver')) {
    return { 
      name: '바이브 (VIBE)', 
      brandColor: '#ff1493', 
      textColor: 'text-pink-400',
      btnBg: 'bg-[#ff1493] hover:bg-[#e6007e] text-white',
      iconText: 'V', 
      bgGradient: 'from-pink-950/80 via-slate-900 to-rose-950/70',
      borderClass: 'border-pink-500/40'
    };
  }
  return { 
    name: '음악 스트리밍 앱', 
    brandColor: '#10b981', 
    textColor: 'text-emerald-400',
    btnBg: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    iconText: '🎵', 
    bgGradient: 'from-emerald-950/80 via-slate-900 to-teal-950/70',
    borderClass: 'border-emerald-500/40'
  };
}

export default function ProxyRedirectView({ targetUrl = '', onGoHome, onShowToast }) {
  const [copied, setCopied] = useState(false);
  const [hasTriggeredAuto, setHasTriggeredAuto] = useState(false);
  const info = parsePlatformInfo(targetUrl);

  const executeLaunch = () => {
    if (!targetUrl) return;
    try {
      window.location.href = targetUrl;
    } catch (e) {
      console.warn('Navigation failed', e);
    }
  };

  useEffect(() => {
    if (!targetUrl) return;
    // Attempt automatic launch after short paint delay
    const timer = setTimeout(() => {
      executeLaunch();
      setHasTriggeredAuto(true);
    }, 150);
    return () => clearTimeout(timer);
  }, [targetUrl]);

  const handleCopyLink = () => {
    if (!navigator.clipboard || !targetUrl) return;
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    if (onShowToast) onShowToast('앱 원본 URI 링크가 클립보드에 복사되었습니다! 📋');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className={`w-full max-w-lg rounded-3xl bg-gradient-to-b ${info.bgGradient} border ${info.borderClass} p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-scaleUp`}>
        
        {/* Brand Icon Header */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="relative">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-slate-950/80 transition-transform animate-pulse"
              style={{ backgroundColor: info.brandColor }}
            >
              {info.iconText}
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-900 border border-slate-700 text-xs shadow">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700">
              원클릭 프록시 게이트웨이 🔗
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 mt-2">
              <span className={info.textColor}>{info.name}</span> 앱으로 연결 중
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              음악 앱이 설치되어 있으면 자동으로 플레이리스트가 전송됩니다.
            </p>
          </div>
        </div>

        {/* Primary CTA Launch Button */}
        <div className="space-y-2 pt-2">
          <button
            onClick={executeLaunch}
            className={`w-full py-4 px-6 rounded-2xl ${info.btnBg} font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl shadow-slate-950/60 active:scale-[0.98]`}
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{info.name} 바로 열기 (실행)</span>
          </button>
          
          <p className="text-[11px] text-slate-400">
            앱이 자동으로 열리지 않으면 위의 큰 버튼을 터치해주세요.
          </p>
        </div>

        {/* In-App Browser Friendly Guide */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>카카오톡 · X(트위터) · 인스타그램 인앱 브라우저 팁</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 leading-relaxed">
            <li>일부 SNS 인앱 브라우저는 보안상 앱 자동 전환을 제한할 수 있습니다.</li>
            <li>앱이 실행되지 않는 경우, 상단/하단 메뉴 <strong className="text-slate-200">[···]</strong> 에서 <strong className="text-emerald-300">[다른 브라우저(Safari, Chrome)로 열기]</strong>를 선택하시면 가장 안정적입니다.</li>
            <li>음악 앱이 설치되어 있지 않다면 앱스토어/플레이스토어에서 앱을 먼저 설치해주세요.</li>
          </ul>
        </div>

        {/* Secondary Actions */}
        <div className="flex items-center justify-center gap-2 flex-wrap pt-2 border-t border-slate-800/80 text-xs">
          <button
            onClick={handleCopyLink}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>앱 원본 링크 복사</span>
          </button>

          <button
            onClick={onGoHome}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-500/30"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>스밍 메이커 홈으로 이동</span>
          </button>
        </div>

      </div>
    </div>
  );
}
