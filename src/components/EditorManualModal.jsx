import React, { useState } from 'react';
import { 
  BookOpen, 
  X, 
  AlertTriangle, 
  Rocket, 
  ShieldCheck, 
  Database, 
  Music, 
  Users, 
  Archive, 
  CheckCircle2, 
  ExternalLink,
  Laptop,
  Globe,
  Sparkles,
  HelpCircle
} from 'lucide-react';

export default function EditorManualModal({
  isOpen,
  onClose,
  onAcknowledge
}) {
  const [activeSubTab, setActiveSubTab] = useState('warning'); // 'warning' | 'menus' | 'song_ids' | 'workflow'
  const [dontShowAgain, setDontShowAgain] = useState(true);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('sming_editor_manual_read_v1', 'true');
      } catch (e) {}
    }
    if (onAcknowledge) onAcknowledge();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-950/60 flex-shrink-0">
              <BookOpen className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-100">
                  음총팀 음원 데이터 & 추천 편집기 매뉴얼
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  필독 가이드
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                포레스텔라 음원 데이터와 공식 추천 리스트를 안전하게 관리하는 방법
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

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-950/40 border-b border-slate-800/80 overflow-x-auto flex-shrink-0">
          <button
            onClick={() => setActiveSubTab('warning')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'warning'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>1. 핵심 주의사항 (로컬 vs 배포)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('menus')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'menus'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>2. 메뉴별 상세 기능 안내</span>
          </button>

          <button
            onClick={() => setActiveSubTab('song_ids')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'song_ids'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-sky-400" />
            <span>3. 음원 ID(멜론/지니/벅스) 찾는 법</span>
          </button>

          <button
            onClick={() => setActiveSubTab('workflow')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'workflow'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Rocket className="w-3.5 h-3.5 text-violet-400" />
            <span>4. 안전한 배포 4단계</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-200 text-xs sm:text-sm leading-relaxed custom-scrollbar flex-1">
          
          {/* TAB 1: WARNING & LOCAL VS GITHUB */}
          {activeSubTab === 'warning' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Critical Alert Box */}
              <div className="p-4 rounded-2xl bg-rose-950/40 border-2 border-rose-500/40 space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-black text-sm sm:text-base">
                  <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                  <span>⚠️ 가장 중요한 주의사항 (꼭 기억해주세요!)</span>
                </div>
                <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
                  이 편집기에서 데이터를 수정하고 <strong>[🚀 GitHub에 즉시 배포]</strong>를 누르면, <span className="text-amber-300 font-bold underline decoration-amber-400">전 세계 모든 팬과 사이트 방문자에게 즉시 실시간 반영</span>됩니다.
                </p>
                <p className="text-slate-300 text-xs leading-relaxed">
                  잘못된 음원 ID나 오타가 들어가면 수많은 숲별들의 멜론·지니·벅스 원클릭 스트리밍 연결이 실패할 수 있으니 배포 전 꼭 꼼꼼히 확인해주세요!
                </p>
              </div>

              {/* Local vs GitHub Comparison */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-teal-400" />
                  <span>내 브라우저(로컬 작업)와 GitHub 실제 배포의 차이점</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Local Box */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-teal-300 font-bold text-xs sm:text-sm">
                      <span className="text-base">🖥️</span>
                      <span>1. 편집기에서 수정 중일 때 (내 화면만)</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      곡을 추가하거나 추천 리스트 순서를 바꾼 내용은 <strong className="text-slate-200">현재 내 컴퓨터(브라우저)에만 임시 저장</strong>된 안전한 상태입니다.
                    </p>
                    <div className="p-2 rounded-lg bg-teal-950/30 border border-teal-500/20 text-[11px] text-teal-300">
                      💡 아직 다른 사용자에게는 보이지 않으므로 자유롭게 테스트하고 수정하셔도 안전합니다.
                    </div>
                  </div>

                  {/* Deploy Box */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-violet-500/30 space-y-2">
                    <div className="flex items-center gap-2 text-violet-300 font-bold text-xs sm:text-sm">
                      <span className="text-base">🚀</span>
                      <span>2. [GitHub에 즉시 배포] 클릭 시 (전체 반영)</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      우측 상단 <strong>[🚀 GitHub에 즉시 배포 & 백업]</strong> 버튼을 누르면 중앙 서버로 데이터가 전송되어 <strong className="text-slate-200">약 1~2분 후 실제 웹사이트에 전 세계 동시 반영</strong>됩니다.
                    </p>
                    <div className="p-2 rounded-lg bg-violet-950/30 border border-violet-500/20 text-[11px] text-violet-300">
                      ✨ 배포 시점마다 자동 백업 스냅샷이 저장되므로 언제든 1초 만에 원상 복구할 수 있습니다.
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety Net */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-emerald-300">
                    실수했어도 걱정 마세요! 언제든 되돌릴 수 있습니다.
                  </p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    배포할 때마다 과거 데이터가 <strong>[💾 백업 & 복구 센터]</strong>에 자동으로 영구 보관됩니다. 만약 잘못 배포하셨다면 복구 탭에서 <strong>[↺ 이 버전으로 복구]</strong> 버튼을 누르고 다시 배포하시면 바로 정상으로 되돌아옵니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MENU GUIDES */}
          {activeSubTab === 'menus' && (
            <div className="space-y-3.5 animate-fadeIn">
              {/* Menu 1 */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm">
                  <span className="text-base">🌲</span>
                  <span>1. 음총팀 추천 리스트 편집 (가장 많이 사용)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  팬들이 사이트에 접속했을 때 처음 보게 되는 <strong>공식 1시간 추천 스밍리스트</strong>를 편집하는 화면입니다.
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-400 pl-1">
                  <li><strong>곡 추가</strong>: 원하는 곡을 검색하여 리스트에 바로 추가합니다.</li>
                  <li><strong>순서 변경</strong>: 곡 오른쪽의 [▲ 위로] / [▼ 아래로] 버튼을 눌러 순서를 조정합니다.</li>
                  <li><strong>배속 및 타이틀곡 배치</strong>: 상단에 총 재생시간(목표: 60분 내외)이 실시간으로 계산되어 타이틀곡 강조 주기 등을 맞추기 쉽습니다.</li>
                </ul>
              </div>

              {/* Menu 2 */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs sm:text-sm">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>2. 아티스트별 곡 관리 & 편집 (신곡 등록 및 수정)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>완전체(포레스텔라) 및 4인 솔로 멤버</strong>(강형호, 배두훈, 조민규, 고우림)의 음원을 아티스트별로 모아서 관리합니다.
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-400 pl-1">
                  <li><strong>신곡 등록 (+ 새 곡 추가)</strong>: 새 앨범이나 신곡이 발매되었을 때 곡 제목, 앨범명, 재생시간, 플랫폼별 곡 ID를 등록합니다.</li>
                  <li><strong>곡 정보 수정 (연필 아이콘)</strong>: 기존 곡의 발매일, 재생시간, 타이틀곡 여부, 플랫폼 링크를 수정합니다.</li>
                </ul>
              </div>

              {/* Menu 3 */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-sky-300 font-bold text-xs sm:text-sm">
                  <Music className="w-4 h-4 text-sky-400" />
                  <span>3. 전체 음원 목록 (통합 검색 및 검증)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  등록된 180여 개 전체 음원을 한눈에 검색하고, 멜론/지니/벅스 ID가 누락된 곳이 없는지 확인할 수 있습니다.
                </p>
              </div>

              {/* Menu 4 */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-violet-300 font-bold text-xs sm:text-sm">
                  <Archive className="w-4 h-4 text-violet-400" />
                  <span>4. 백업 & 복구 센터 (데이터 안전 금고)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  언제든 원하는 시점의 데이터를 복구할 수 있는 보관소입니다. 배포 내역이 자동으로 기록되며, <strong>[↺ 이 버전으로 복구]</strong> 버튼 하나로 과거 데이터를 즉시 불러옵니다.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: PLATFORM SONG IDS */}
          {activeSubTab === 'song_ids' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-200">
                  💡 멜론 · 지니 · 벅스 곡 ID란 무엇인가요?
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  팬들이 웹사이트에서 <strong>[멜론 앱으로 듣기]</strong>, <strong>[지니 앱으로 듣기]</strong>, <strong>[벅스 앱으로 듣기]</strong>를 눌렀을 때 각 음원사 앱에서 해당 곡을 바로 재생목록에 담기 위해 필요한 고유 번호(숫자)입니다.
                </p>
              </div>

              {/* Step by Step Finder */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  플랫폼별 곡 ID 찾는 방법
                </h4>

                {/* Melon */}
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300 text-xs">🍈 멜론 (Melon) 곡 ID</span>
                    <span className="text-[10px] text-slate-400 font-mono">예: 38517300</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    멜론 웹사이트(melon.com)에서 곡을 검색하여 곡 상세 페이지로 들어갔을 때 주소창의 끝 번호입니다:
                  </p>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 break-all">
                    https://www.melon.com/song/detail.htm?songId=<strong className="text-emerald-300">38517300</strong>
                  </div>
                </div>

                {/* Genie */}
                <div className="p-3.5 rounded-xl bg-sky-950/30 border border-sky-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-300 text-xs">💙 지니뮤직 (Genie) 곡 ID</span>
                    <span className="text-[10px] text-slate-400 font-mono">예: 116376883</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    지니 웹사이트(genie.co.kr)에서 곡 상세 페이지 주소창의 끝 번호입니다:
                  </p>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 break-all">
                    https://www.genie.co.kr/detail/songInfo?xgnm=<strong className="text-sky-300">116376883</strong>
                  </div>
                </div>

                {/* Bugs */}
                <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-300 text-xs">🔴 벅스 (Bugs) 곡 ID</span>
                    <span className="text-[10px] text-slate-400 font-mono">예: 133584374</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    벅스 웹사이트(music.bugs.co.kr)에서 곡 상세 페이지 주소창의 끝 번호입니다:
                  </p>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 break-all">
                    https://music.bugs.co.kr/track/<strong className="text-rose-300">133584374</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WORKFLOW */}
          {activeSubTab === 'workflow' && (
            <div className="space-y-3.5 animate-fadeIn">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                실수 없는 안전한 4단계 수정 & 배포 순서
              </h4>

              <div className="space-y-2.5">
                {/* Step 1 */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-slate-200">편집기에서 데이터 수정 또는 추천 리스트 작성</h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      신곡을 추가하거나 추천 리스트 탭에서 원하는 곡 순서를 자유롭게 조정합니다.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-slate-200">총 재생시간 및 곡 ID 최종 점검</h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      추천 리스트 상단의 총 재생시간(약 59~60분)과 플랫폼별 ID가 잘 들어가 있는지 눈으로 확인합니다.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-slate-200">[🚀 GitHub에 즉시 배포 & 백업] 버튼 클릭</h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      우측 상단의 배포 버튼을 누르고 메모(예: 신곡 발매 추천리스트 업데이트)를 입력한 뒤 배포를 완료합니다.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    4
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-slate-200">1~2분 후 실제 웹사이트에서 확인</h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      배포 후 약 1~2분이 지나면 웹사이트(<a href="https://foretissimo.github.io/sming-maker/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">foretissimo.github.io/sming-maker/</a>)에 접속하여 변경 내용이 잘 반영되었는지 확인합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-800 border-slate-700"
            />
            <span>이 매뉴얼을 확인했습니다 (다음 접속 시 자동으로 띄우지 않기)</span>
          </label>

          <button
            onClick={handleConfirm}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-xs sm:text-sm cursor-pointer shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 transform active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            <span>확인했습니다 & 편집 시작하기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
