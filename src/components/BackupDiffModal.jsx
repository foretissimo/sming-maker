import React, { useState, useMemo } from 'react';
import { 
  X, 
  GitCompare, 
  RotateCcw, 
  Plus, 
  Minus, 
  Edit3, 
  FileJson, 
  CheckCircle2, 
  AlertCircle, 
  Music, 
  Clock, 
  Sparkles,
  ArrowRight,
  Code
} from 'lucide-react';
import { formatSecondsToTime } from '../utils/formatters';

export default function BackupDiffModal({
  isOpen,
  onClose,
  snapshotName = '백업 스냅샷',
  snapshotDate = '',
  backupData = null, // { songs: [], recommended: {} }
  currentSongs = [],
  currentRecommended = null,
  onRestore,
  onShowToast
}) {
  const [viewMode, setViewMode] = useState('smart'); // 'smart' | 'raw'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'added' | 'removed' | 'modified' | 'rec'

  // Parse backup songs & recommended
  const backupSongs = useMemo(() => {
    if (!backupData) return [];
    if (Array.isArray(backupData.songs)) return backupData.songs;
    if (Array.isArray(backupData)) return backupData;
    return [];
  }, [backupData]);

  const backupRec = useMemo(() => {
    if (!backupData) return null;
    return backupData.recommended || null;
  }, [backupData]);

  // Compute Smart Diff
  const diffResult = useMemo(() => {
    if (!backupSongs || backupSongs.length === 0) {
      return { added: [], removed: [], modified: [], unchanged: 0, recChanges: [] };
    }

    const currentMap = new Map(currentSongs.map(s => [s.id, s]));
    const backupMap = new Map(backupSongs.map(s => [s.id, s]));

    const added = []; // in current but not in backup
    const removed = []; // in backup but not in current
    const modified = []; // in both but fields changed

    // Find added & modified
    currentSongs.forEach(curr => {
      const bkp = backupMap.get(curr.id);
      if (!bkp) {
        added.push(curr);
      } else {
        const changes = [];
        if (curr.title !== bkp.title) changes.push({ field: '곡명', from: bkp.title, to: curr.title });
        if (curr.artist !== bkp.artist) changes.push({ field: '가수', from: bkp.artist, to: curr.artist });
        if (curr.duration !== bkp.duration) {
          changes.push({ 
            field: '재생시간', 
            from: formatSecondsToTime(bkp.duration), 
            to: formatSecondsToTime(curr.duration) 
          });
        }
        if (curr.isTitle !== bkp.isTitle) {
          changes.push({ field: '타이틀 여부', from: bkp.isTitle ? '타이틀' : '일반', to: curr.isTitle ? '타이틀' : '일반' });
        }
        
        // Platform IDs diff
        const currP = curr.platformIds || {};
        const bkpP = bkp.platformIds || {};
        if ((currP.melon || '') !== (bkpP.melon || '')) {
          changes.push({ field: '멜론 ID', from: bkpP.melon || '(없음)', to: currP.melon || '(없음)' });
        }
        if ((currP.genie || '') !== (bkpP.genie || '')) {
          changes.push({ field: '지니 ID', from: bkpP.genie || '(없음)', to: currP.genie || '(없음)' });
        }
        if ((currP.bugs || '') !== (bkpP.bugs || '')) {
          changes.push({ field: '벅스 ID', from: bkpP.bugs || '(없음)', to: currP.bugs || '(없음)' });
        }

        if (changes.length > 0) {
          modified.push({ song: curr, changes });
        }
      }
    });

    // Find removed (in backup but deleted in current)
    backupSongs.forEach(bkp => {
      if (!currentMap.has(bkp.id)) {
        removed.push(bkp);
      }
    });

    // Recommended list diff
    const recChanges = [];
    const bkpRecSongs = (backupRec && Array.isArray(backupRec.songs)) ? backupRec.songs : [];
    const currRecSongs = (currentRecommended && Array.isArray(currentRecommended.songs)) ? currentRecommended.songs : [];

    if (bkpRecSongs.length !== currRecSongs.length) {
      recChanges.push(`추천곡 수: 백업(${bkpRecSongs.length}곡) ➔ 현재(${currRecSongs.length}곡)`);
    }

    const bkpRecTitles = bkpRecSongs.map(s => s.title || s.id).join(' > ');
    const currRecTitles = currRecSongs.map(s => s.title || s.id).join(' > ');
    if (bkpRecTitles !== currRecTitles) {
      recChanges.push('추천 리스트 곡 배치 순서 또는 구성이 다릅니다.');
    }

    const unchanged = currentSongs.length - added.length - modified.length;

    return { added, removed, modified, unchanged, recChanges };
  }, [currentSongs, backupSongs, currentRecommended, backupRec]);

  if (!isOpen || !backupData) return null;

  const totalDifferences = diffResult.added.length + diffResult.removed.length + diffResult.modified.length + diffResult.recChanges.length;

  const handleExecuteRestore = () => {
    const ok = window.confirm(`[${snapshotName}] 백업 데이터로 현재 데이터를 복구하시겠습니까?`);
    if (!ok) return;
    if (onRestore) {
      onRestore(backupData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-slate-950 shadow-lg shadow-indigo-950/60 flex-shrink-0">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-100">
                  데이터 버전 비교 (Diff Viewer)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">
                  {snapshotName}
                </span>
                {snapshotDate && (
                  <span className="text-[11px] text-slate-400 font-medium">
                    ({snapshotDate})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                선택한 백업 시점 데이터와 현재 적용 중인 최신 데이터의 차이점을 한눈에 확인합니다.
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

        {/* Diff Summary Bar */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs flex-shrink-0">
          {/* Quick Stats */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700">
              <span>현재: <strong className="text-emerald-400">{currentSongs.length}곡</strong></span>
              <span className="text-slate-600">vs</span>
              <span>백업: <strong className="text-indigo-300">{backupSongs.length}곡</strong></span>
            </div>

            {totalDifferences === 0 ? (
              <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>데이터 완전 일치 (변경사항 없음)</span>
              </span>
            ) : (
              <>
                {diffResult.added.length > 0 && (
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                    <Plus className="w-3 h-3" />
                    <span>신규 추가 {diffResult.added.length}곡</span>
                  </span>
                )}
                {diffResult.removed.length > 0 && (
                  <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-1">
                    <Minus className="w-3 h-3" />
                    <span>삭제됨 {diffResult.removed.length}곡</span>
                  </span>
                )}
                {diffResult.modified.length > 0 && (
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                    <Edit3 className="w-3 h-3" />
                    <span>속성 변경 {diffResult.modified.length}곡</span>
                  </span>
                )}
              </>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('smart')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'smart' 
                  ? 'bg-emerald-600 text-slate-950 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              스마트 비교
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'raw' 
                  ? 'bg-emerald-600 text-slate-950 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>JSON Raw Diff</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 text-xs">
          {viewMode === 'smart' ? (
            <div className="space-y-4">
              {totalDifferences === 0 && (
                <div className="p-12 text-center bg-slate-950/60 border border-slate-800 rounded-3xl space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                  <h4 className="text-base font-bold text-slate-200">
                    현재 데이터와 백업 데이터가 완전히 일치합니다!
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    곡 수({currentSongs.length}곡), 메타데이터, 플랫폼 ID 및 추천 리스트 구성에 아무런 차이가 없습니다.
                  </p>
                </div>
              )}

              {/* Recommended List Differences */}
              {diffResult.recChanges.length > 0 && (
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-2">
                  <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>🌲 음총팀 추천 스밍리스트 변경사항</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                    {diffResult.recChanges.map((change, idx) => (
                      <li key={idx}>{change}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 1. Added Songs (In current, but not in backup) */}
              {diffResult.added.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <Plus className="w-3.5 h-3.5" />
                    <span>현재 버전에 새로 추가된 곡 ({diffResult.added.length}곡)</span>
                  </h4>
                  <div className="space-y-1.5">
                    {diffResult.added.map((song) => (
                      <div
                        key={song.id}
                        className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between gap-3 text-emerald-200"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 font-black flex items-center justify-center text-xs">
                            +
                          </span>
                          <div>
                            <span className="font-bold text-slate-100">{song.title}</span>
                            <span className="text-slate-400 text-[11px] ml-2">({song.artist})</span>
                          </div>
                        </div>
                        <div className="text-slate-400 font-mono text-[11px]">
                          {formatSecondsToTime(song.duration)} · ID: {song.id}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Modified Songs */}
              {diffResult.modified.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>속성 변경된 곡 ({diffResult.modified.length}곡)</span>
                  </h4>
                  <div className="space-y-2">
                    {diffResult.modified.map(({ song, changes }) => (
                      <div
                        key={song.id}
                        className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-100">{song.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {song.id}</span>
                        </div>
                        <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                          {changes.map((c, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-[11px]">
                              <span className="font-semibold text-amber-300 w-20 flex-shrink-0">{c.field}:</span>
                              <span className="text-rose-400 line-through truncate max-w-[140px] sm:max-w-xs">{c.from}</span>
                              <ArrowRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
                              <span className="text-emerald-400 font-bold truncate max-w-[140px] sm:max-w-xs">{c.to}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Removed Songs (In backup, but deleted in current) */}
              {diffResult.removed.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <Minus className="w-3.5 h-3.5" />
                    <span>현재 버전에서 삭제된 곡 ({diffResult.removed.length}곡)</span>
                  </h4>
                  <div className="space-y-1.5">
                    {diffResult.removed.map((song) => (
                      <div
                        key={song.id}
                        className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between gap-3 text-rose-200"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-300 font-black flex items-center justify-center text-xs">
                            -
                          </span>
                          <div>
                            <span className="font-bold text-slate-100 line-through">{song.title}</span>
                            <span className="text-slate-400 text-[11px] ml-2">({song.artist})</span>
                          </div>
                        </div>
                        <div className="text-slate-400 font-mono text-[11px]">
                          {formatSecondsToTime(song.duration)} · ID: {song.id}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Raw JSON Comparison */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full">
              <div className="space-y-1.5 flex flex-col">
                <div className="flex items-center justify-between font-bold text-indigo-300 text-xs">
                  <span>선택한 백업 시점 ({snapshotName})</span>
                  <span className="text-[10px] text-slate-500 font-mono">{backupSongs.length}곡</span>
                </div>
                <pre className="flex-1 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-auto max-h-[50vh] leading-relaxed custom-scrollbar">
                  {JSON.stringify(backupData, null, 2)}
                </pre>
              </div>

              <div className="space-y-1.5 flex flex-col">
                <div className="flex items-center justify-between font-bold text-emerald-300 text-xs">
                  <span>현재 적용 중인 최신 데이터</span>
                  <span className="text-[10px] text-slate-500 font-mono">{currentSongs.length}곡</span>
                </div>
                <pre className="flex-1 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-auto max-h-[50vh] leading-relaxed custom-scrollbar">
                  {JSON.stringify({ songs: currentSongs, recommended: currentRecommended }, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition-colors"
          >
            닫기
          </button>

          <button
            type="button"
            onClick={handleExecuteRestore}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black cursor-pointer shadow-lg shadow-indigo-950/60 transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>이 백업 버전으로 복구하기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
