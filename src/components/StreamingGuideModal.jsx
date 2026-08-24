import React from 'react';
import { X, CheckCircle, AlertTriangle, Volume2, Repeat, ListPlus, Trash2 } from 'lucide-react';

export default function StreamingGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-emerald-950/30">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌲</span>
            <div>
              <h3 className="text-base font-bold text-slate-100">음원 스트리밍(스밍) 필수 가이드</h3>
              <p className="text-xs text-emerald-400">차트 집계 누락 방지를 위한 필수 설정 체크리스트</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs sm:text-sm text-slate-300">
          {/* Rule 1: Playlist clear & duplicate allowed */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <Trash2 className="w-4 h-4 text-emerald-400" />
              <span>1. 기존 재생목록 비우기 & 중복곡 담기 허용</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              원클릭 링크를 누르기 전, 음악 앱의 기존 재생목록을 완전히 삭제(비우기)해 주세요. 또한 앱 설정에서 <strong className="text-slate-200">'중복곡 담기 허용'</strong>이 켜져 있어야 타이틀곡이 1시간 내에 중복으로 담겨 스밍됩니다.
            </p>
          </div>

          {/* Rule 2: Playback Settings */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-teal-300 font-bold">
              <Repeat className="w-4 h-4 text-teal-400" />
              <span>2. 전체 반복 재생 ON / 셔플(랜덤) OFF</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              플레이어 재생 모드는 반드시 <strong>전체 반복 재생 (🔄)</strong>으로 설정하고, <strong>셔플(무작위) 재생과 한곡 반복은 꺼주세요.</strong> 리스트 순서대로 끊김 없이 완곡 재생되어야 1시간 주기로 온전히 집계됩니다.
            </p>
          </div>

          {/* Rule 3: Volume & Mute */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>3. 음원 앱 자체 볼륨은 1 이상 유지</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              음원 앱 자체 볼륨을 0(음소거)으로 설정하면 스트리밍 스트림이 차트에 미반영될 수 있습니다. 조용히 들어야 할 경우 <strong>기기 미디어 볼륨을 줄이거나 더미 이어폰(헤드셋)을 연결</strong>해 주세요.
            </p>
          </div>

          {/* Rule 4: Platform specific notes */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-rose-300 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>4. 플랫폼별 유의사항</span>
            </div>
            <ul className="text-slate-400 text-xs space-y-1.5 list-disc list-inside">
              <li><strong className="text-slate-200">멜론:</strong> 안드로이드/iOS 전용 딥링크를 지원하며, PC는 멜론 플레이어 스키마로 연결됩니다.</li>
              <li><strong className="text-slate-200">지니/벅스:</strong> 원클릭 버튼 터치 시 앱의 재생목록에 즉시 리스트가 추가됩니다.</li>
              <li><strong className="text-slate-200">데이터/캐시:</strong> 원활한 스밍과 누락 방지를 위해 주 1~2회 앱 캐시를 삭제해 주는 것을 권장합니다.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-950/90 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
}
