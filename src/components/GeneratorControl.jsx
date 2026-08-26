import React from 'react';
import { Sparkles, RotateCcw, Plus, Dice5 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function GeneratorControl({
  onGenerate,
  onOpenCatalog,
  onReset,
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

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-900/90 border border-emerald-500/30 rounded-2xl shadow-xl">
      {/* Main Auto Generate CTA */}
      <button
        onClick={handleGenerateClick}
        className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 hover:shadow-emerald-500/20 transition-all duration-200 cursor-pointer transform active:scale-[0.99]"
      >
        <Dice5 className="w-5 h-5 text-slate-950 fill-current" />
        <span>1시간 스밍리스트 자동 생성</span>
        <Sparkles className="w-4 h-4 text-emerald-900" />
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
