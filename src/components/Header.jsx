import React from 'react';
import { Sparkles, HelpCircle, Share2, Music2, Database, Key, Lock, LogOut, ShieldCheck } from 'lucide-react';
import { getCurrentCreator } from '../utils/creatorStorage';

export default function Header({
  activeView,
  onChangeView,
  onOpenGuide,
  onOpenCreatorStudio,
  onShare,
  showEditor = false,
  isAdminLoggedIn = false,
  onOpenAdminLogin,
  onAdminLogout
}) {
  const creator = getCurrentCreator();

  return (
    <header className="border-b border-emerald-900/30 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        {/* Left: Brand */}
        <div 
          onClick={() => onChangeView('generator')}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/50 flex-shrink-0">
            <span className="text-lg">🌲</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-emerald-400 via-teal-200 to-amber-200 bg-clip-text text-transparent">
                스밍 메이커
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hidden md:inline-block">
                Sming Maker
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              포레스텔라 & 솔로 4인 원클릭 스밍리스트 생성 & 발행
            </p>
          </div>
        </div>

        {/* Center: Main View Toggle */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => onChangeView('generator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeView === 'generator'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music2 className="w-3.5 h-3.5" />
            <span>스밍 생성기</span>
          </button>

          {(showEditor || isAdminLoggedIn) && (
            <button
              onClick={() => onChangeView('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeView === 'editor'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>음원 데이터 & 추천 편집기</span>
            </button>
          )}

          {activeView === 'readonly' && (
            <button
              onClick={() => onChangeView('readonly')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/50 shadow-sm whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>공유 뷰어 (Read-Only)</span>
            </button>
          )}
        </div>

        {/* Right: Actions & Creator Studio & Admin Mode */}
        <div className="flex items-center gap-1.5">
          {/* Admin Mode Badge or Login Button */}
          {isAdminLoggedIn ? (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-500/40 text-xs text-amber-300 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">음총팀 모드</span>
              </div>
              <button
                onClick={onAdminLogout}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                title="음총팀 관리자 로그아웃"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAdminLogin}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-400 hover:text-slate-200 font-medium transition-all cursor-pointer"
              title="포레스텔라 음총팀 관리자 로그인"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">음총팀</span>
            </button>
          )}

          <button
            onClick={onOpenCreatorStudio}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-950 to-teal-950 hover:from-emerald-900 hover:to-teal-900 border border-emerald-500/40 text-xs text-emerald-300 font-bold transition-all cursor-pointer shadow-sm shadow-emerald-950/50"
            title="크리에이터 스튜디오 & 스밍리스트 발행"
          >
            <Key className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">
              {creator ? `👑 ${creator.name}` : '리스트 발행'}
            </span>
          </button>

          {activeView === 'generator' && (
            <>
              <button
                onClick={onOpenGuide}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-emerald-300 font-medium transition-all cursor-pointer shadow-sm hover:border-emerald-500/30"
                title="스밍 가이드 보기"
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">가이드</span>
              </button>

              <button
                onClick={onShare}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/40 text-xs text-emerald-200 font-medium transition-all cursor-pointer shadow-sm"
                title="리스트 링크 공유"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden md:inline">공유</span>
              </button>
            </>
          )}

          <a
            href="https://github.com/foretissimo/sming-maker"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="GitHub 저장소"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}
