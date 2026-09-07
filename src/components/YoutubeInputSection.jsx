import React from 'react';
import { Link2, Trash2, ExternalLink } from 'lucide-react';

function YoutubeIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

export default function YoutubeInputSection({
  youtubeUrl = '',
  onChangeYoutubeUrl,
  onShowToast
}) {
  const handleOpenLink = (url) => {
    if (!url) return;
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

  const handleClear = () => {
    if (onChangeYoutubeUrl) {
      onChangeYoutubeUrl('');
      if (onShowToast) onShowToast('유튜브 링크가 삭제되었습니다.');
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 md:p-5 shadow-xl space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
          <YoutubeIcon className="w-4 h-4 text-red-500" />
          <span>유튜브 (YouTube / YouTube Music) 링크 등록</span>
        </label>

        {youtubeUrl && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
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
            value={youtubeUrl}
            onChange={(e) => onChangeYoutubeUrl && onChangeYoutubeUrl(e.target.value)}
            placeholder="유튜브 MV 또는 재생목록 링크를 입력하세요 (예: https://youtu.be/...)"
            className="w-full pl-8 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-red-500/80 transition-colors font-mono"
          />
        </div>

        {youtubeUrl && (
          <button
            type="button"
            onClick={() => handleOpenLink(youtubeUrl)}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors flex-shrink-0 shadow-sm"
            title="입력한 링크 테스트 열기"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>열기</span>
          </button>
        )}
      </div>
      <p className="text-[11px] text-slate-400 leading-relaxed">
        💡 유튜브 링크를 입력하면 하단 원클릭 담기(PC) 및 전체 URL 복사에 유튜브 바로가기가 자동으로 포함됩니다.
      </p>
    </div>
  );
}
