import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  Loader2, 
  Link2,
  Zap,
  Music2
} from 'lucide-react';
import { generateShareUrl, createShortUrl } from '../utils/shareUtils';
import { formatSecondsToTime } from '../utils/formatters';

export default function ShareModal({
  isOpen,
  onClose,
  playlist = [],
  youtubeUrl = '',
  onShowToast
}) {
  const [title, setTitle] = useState('🌲 포레스텔라 1시간 추천 스밍리스트');
  const [creator, setCreator] = useState('숲별');
  const [desc, setDesc] = useState('');
  const [customYoutubeUrl, setCustomYoutubeUrl] = useState(youtubeUrl);
  
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [isShortening, setIsShortening] = useState(false);
  const [copiedType, setCopiedType] = useState(null);

  // Calculate duration
  const totalDuration = playlist.reduce((sum, s) => sum + (s.duration || 0), 0);
  const formattedTime = formatSecondsToTime(totalDuration);

  // Generate initial compact URL when modal opens or inputs change
  useEffect(() => {
    if (!isOpen || playlist.length === 0) return;
    const url = generateShareUrl({
      title,
      creator,
      desc,
      youtubeUrl: customYoutubeUrl,
      playlist
    });
    setGeneratedUrl(url);
    setShortUrl(''); // reset short URL until requested or auto-generated
  }, [isOpen, title, creator, desc, customYoutubeUrl, playlist]);

  if (!isOpen) return null;

  const handleCreateShortUrl = async () => {
    if (!generatedUrl) return;
    setIsShortening(true);
    try {
      const short = await createShortUrl(generatedUrl);
      setShortUrl(short);
      if (short !== generatedUrl) {
        onShowToast('⚡ 초단축 링크가 생성되었습니다!');
      } else {
        onShowToast('자체 압축 단축 링크가 준비되었습니다.');
      }
    } catch (e) {
      setShortUrl(generatedUrl);
    } finally {
      setIsShortening(false);
    }
  };

  const handleCopy = (urlToCopy, type = 'short') => {
    if (!urlToCopy) return;
    navigator.clipboard.writeText(urlToCopy);
    setCopiedType(type);
    onShowToast('📋 공유 링크가 클립보드에 복사되었습니다!');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleOpenViewer = () => {
    if (!generatedUrl) return;
    window.open(shortUrl || generatedUrl, '_blank');
  };

  const handleTwitterShare = () => {
    const shareLink = shortUrl || generatedUrl;
    const tweetText = `[스밍 메이커] ${title} (${formattedTime})\n\n포레스텔라 원클릭 스트리밍 리스트를 확인해보세요! 🌲🎧\n`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareLink)}`;
    window.open(twitterUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/60 flex-shrink-0">
              <Share2 className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  1회성 스밍리스트 공유 링크 생성
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {playlist.length}곡 · {formattedTime}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                로그인 없이 누구나 1초 만에 링크를 만들어 팬들과 공유할 수 있습니다.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* Expiration Notice Alert (Mandatory Requirement) */}
          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>⏰ 1회성 공유 리스트 보관 기간 안내</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              생성된 1회성 공유 링크는 <strong className="text-amber-300">6개월간 유지가 권장</strong>되며, 시스템상 <strong className="text-slate-200">생성일로부터 최대 1년(365일) 후 자동 만료</strong>됩니다.
            </p>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 flex items-center justify-between">
              <span>리스트 제목</span>
              <span className="text-[10px] text-slate-500 font-normal">공유 뷰어 상단에 표시</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 🌲 2026 THE LEGACY 1시간 최적 올스밍"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Creator & MV Link Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Creator */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">작성자 닉네임</label>
              <input
                type="text"
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                placeholder="예: 숲별 / 음총팀"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* YouTube MV Link */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">유튜브 MV 링크 (선택)</label>
              <input
                type="text"
                value={customYoutubeUrl}
                onChange={(e) => setCustomYoutubeUrl(e.target.value)}
                placeholder="https://youtu.be/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Description / Cheering Message */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">한줄 소개 / 응원 메시지 (선택)</label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="예: 타이틀곡 3회 반복 배치로 집계 효율을 극대화한 60분 리스트입니다!"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Generated Share URL Box */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-xs">
                <Link2 className="w-4 h-4" />
                <span>자체 압축 공유 링크</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {shortUrl ? '초단축 링크 준비됨' : `${generatedUrl.length}자 (초소형 압축)`}
              </span>
            </div>

            {/* URL Display Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shortUrl || generatedUrl}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-[11px] text-slate-300 select-all focus:outline-none"
              />
              <button
                onClick={() => handleCopy(shortUrl || generatedUrl, 'main')}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                {copiedType === 'main' ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Copy className="w-3.5 h-3.5" />}
                <span>복사</span>
              </button>
            </div>

            {/* Action Buttons: Shorten & Share */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {!shortUrl && (
                <button
                  type="button"
                  onClick={handleCreateShortUrl}
                  disabled={isShortening}
                  className="px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900/80 border border-indigo-500/40 text-indigo-300 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                  title="TinyURL로 20자 초단축 링크를 생성합니다."
                >
                  {isShortening ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 text-amber-400" />}
                  <span>{isShortening ? '단축 중...' : '⚡ TinyURL 초단축 링크 생성'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleTwitterShare}
                className="px-3 py-1.5 rounded-lg bg-sky-950/80 hover:bg-sky-900/80 border border-sky-500/40 text-sky-300 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <span>🐦 X(트위터) 공유</span>
              </button>

              <button
                type="button"
                onClick={handleOpenViewer}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-all ml-auto"
              >
                <span>공유 뷰어로 열기</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition-colors"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={() => handleCopy(shortUrl || generatedUrl, 'footer')}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black cursor-pointer shadow-lg shadow-emerald-950/60 transition-all flex items-center gap-1.5"
          >
            {copiedType === 'footer' ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4 text-slate-950" />}
            <span>링크 복사하고 닫기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
