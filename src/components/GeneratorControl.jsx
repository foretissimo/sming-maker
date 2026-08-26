import React from 'react';
import { Sparkles, RotateCcw, Plus, Dice5 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function GeneratorControl({
  onGenerate,
  onOpenCatalog,
  onReset,
  onLoadRecommended,
  playlistLength
}) {
  const handleGenerateClick = () => {
    onGenerate();
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10b981', '#34d399', '#6ee7b7', '#f59e0b']
      });
    } catch (e) {
      // ignore
    }
  };

  const handleRecommendedClick = () => {
    if (onLoadRecommended) {
      onLoadRecommended();
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.8 },
          colors: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899']
        });
      } catch (e) {}
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 bg-slate-900/90 border border-emerald-500/30 rounded-2xl shadow-xl">
      {/* Official Recommended CTA */}
      <button
        onClick={handleRecommendedClick}
        className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-400/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 text-amber-300 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-amber-500/50 shadow-md shadow-amber-950/40 cursor-pointer transition-all active:scale-[0.99] whitespace-nowrap"
        title="포레스텔라 음원총공팀 공식 1시간 스밍리스트 불러오기"
      >
        <span className="text-sm">⭐</span>
        <span>음총팀 추천</span>
      </button>

      {/* Main Auto Generate CTA */}
      <button
        onClick={handleGenerateClick}
        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 hover:shadow-emerald-500/20 transition-all duration-200 cursor-pointer transform active:scale-[0.99]"
      >
        <Dice5 className="w-4 h-4 text-slate-950 fill-current" />
        <span>1시간 스밍리스트 자동 생성</span>
        <Sparkles className="w-3.5 h-3.5 text-emerald-900" />
      </button>

      {/* Right: Manual add & reset */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenCatalog}
          className="flex-1 sm:flex-initial py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>곡 직접 추가</span>
        </button>

        <button
          onClick={onReset}
          disabled={playlistLength === 0}
          className="py-3 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          title="재생목록 초기화"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
