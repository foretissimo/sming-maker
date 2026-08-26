import React from 'react';
import { 
  Megaphone, 
  X, 
  AlertTriangle, 
  ExternalLink, 
  Sparkles, 
  Users, 
  CheckCircle2, 
  Music, 
  HelpCircle,
  MessageSquareHeart
} from 'lucide-react';

export default function NoticeModal({
  isOpen,
  onClose
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/60 flex-shrink-0">
              <Megaphone className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-100">
                  스밍 메이커 오픈 공지사항
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  NOTICE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                업데이트 안내 및 음원 데이터 오류 제보 안내
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar text-xs sm:text-sm leading-relaxed text-slate-300">
          
          {/* 1. Open & Update Info */}
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>포레스텔라 원클릭 스밍 메이커 오픈 안내</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              숲별 여러분의 편리한 음원 총공을 위해 <strong>포레스텔라 & 솔로 4인 원클릭 스밍 메이커</strong>가 오픈되었습니다!
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-400 pl-1 pt-1">
              <li>차트 집계 주기에 맞춘 정확한 60분 최적화 스밍리스트 자동 생성</li>
              <li>멜론 · 지니 · 벅스 모바일 앱 및 PC 원클릭 바로 담기 지원</li>
              <li>음총팀 공식 추천 1시간 스밍리스트 원클릭 적용</li>
              <li>로그인 없는 간편한 1회성 단축 링크 공유 지원</li>
            </ul>
          </div>

          {/* 2. Platform Data Connection Caution & Report Request */}
          <div className="p-4 rounded-2xl bg-amber-950/40 border-2 border-amber-500/40 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-300 font-black text-xs sm:text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>음원 사이트 데이터 연결 오류 양해 및 제보 부탁드립니다</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              현재 각 음원사(멜론, 지니, 벅스)의 최신 수록곡 데이터와 앱 실행 딥링크를 연결하는 과정에서 <strong className="text-amber-300">일부 곡의 ID 누락 또는 연결 오류가 발생할 수 있습니다.</strong>
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              숲별 여러분의 너른 양해 부탁드리며, 잘못 연결된 곡이나 재생 오류를 발견하시면 아래 <strong>스핀(Spin) 링크</strong>로 편하게 제보해주시면 신속히 확인하여 수정하겠습니다!
            </p>

            <div className="pt-1">
              <a
                href="https://spin-spin.com/live_in_fore?v=1787707988790"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 cursor-pointer transition-all transform active:scale-98"
              >
                <MessageSquareHeart className="w-4 h-4 text-slate-950" />
                <span>스핀(Spin)으로 오류 제보 & 피드백 남기기 ↗</span>
              </a>
            </div>
          </div>

          {/* 3. Credits Section (포카 체커 스타일) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Users className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs sm:text-sm font-bold text-indigo-300">
                만든 사람들 (Credits)
              </h4>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              {/* Row 1: Feedback */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-3">
                <div>
                  <h5 className="text-xs font-bold text-slate-100">
                    오류 제보 및 피드백 문의
                  </h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Inquiry & Feedback
                  </p>
                </div>
                <a
                  href="https://spin-spin.com/live_in_fore?v=1787707988790"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-200 hover:text-white text-xs font-semibold border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shadow-sm"
                >
                  <span>스핀(Spin)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Row 2: Developer */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-3">
                <div>
                  <h5 className="text-xs font-bold text-slate-100">
                    기획 및 제작
                  </h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Sming Maker Developer
                  </p>
                </div>
                <a
                  href="https://x.com/live_in_fore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-200 hover:text-white text-xs font-semibold border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shadow-sm"
                >
                  <span>@live_in_fore</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm cursor-pointer shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            <span>확인했습니다</span>
          </button>
        </div>
      </div>
    </div>
  );
}
