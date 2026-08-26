import React, { useState, useEffect } from 'react';
import { 
  Archive, 
  RotateCcw, 
  Download, 
  Upload, 
  Trash2, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  GitBranch, 
  Loader2, 
  FileJson, 
  Plus, 
  Database,
  Calendar,
  User,
  GitCompare
} from 'lucide-react';
import BackupDiffModal from './BackupDiffModal';
import { 
  getLocalBackupSnapshots, 
  saveLocalBackupSnapshot, 
  deleteLocalBackupSnapshot, 
  listGithubBackups, 
  fetchGithubBackupContent 
} from '../utils/githubApi';
import { getStoredGithubToken } from '../utils/auth';

export default function BackupManagerTab({
  songs,
  recommendedData,
  onRestoreSongs,
  onRestoreRecommended,
  onShowToast
}) {
  const [localSnapshots, setLocalSnapshots] = useState(() => getLocalBackupSnapshots());
  const [githubBackups, setGithubBackups] = useState([]);
  const [isLoadingGithub, setIsLoadingGithub] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [manualMemo, setManualMemo] = useState('');
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [diffModalState, setDiffModalState] = useState({
    isOpen: false,
    name: '',
    date: '',
    data: null
  });

  const token = getStoredGithubToken();

  // Refresh snapshots
  const refreshLocalSnapshots = () => {
    setLocalSnapshots(getLocalBackupSnapshots());
  };

  // Fetch GitHub Backups
  const handleFetchGithubBackups = async () => {
    if (!token) return;
    setIsLoadingGithub(true);
    try {
      const items = await listGithubBackups(token);
      setGithubBackups(items);
    } catch (e) {
      console.error('Failed to list GitHub backups:', e);
    } finally {
      setIsLoadingGithub(false);
    }
  };

  useEffect(() => {
    if (token) {
      handleFetchGithubBackups();
    }
  }, [token]);

  // Create manual local snapshot
  const handleCreateManualSnapshot = () => {
    const memo = manualMemo.trim() || '수동 백업 생성';
    const snap = saveLocalBackupSnapshot({
      songs,
      recommended: recommendedData,
      author: '음총팀',
      description: memo
    });
    if (snap) {
      refreshLocalSnapshots();
      setManualMemo('');
      setIsCreatingSnapshot(false);
      onShowToast('📦 현재 상태의 백업 스냅샷이 성공적으로 생성되었습니다!');
    }
  };

  // Open Diff Modal for Local Snapshot
  const handleOpenLocalDiff = (snap) => {
    setDiffModalState({
      isOpen: true,
      name: snap.description || '로컬 스냅샷',
      date: snap.dateFormatted || '',
      data: {
        songs: snap.songs || [],
        recommended: snap.recommended || null
      }
    });
  };

  // Open Diff Modal for GitHub Cloud Backup
  const handleOpenGithubDiff = async (item) => {
    try {
      onShowToast('GitHub 백업 내용을 불러오는 중...');
      const data = await fetchGithubBackupContent(token, item.path);
      setDiffModalState({
        isOpen: true,
        name: item.name,
        date: 'GitHub Cloud Storage',
        data
      });
    } catch (err) {
      alert(`백업 파일 로드 실패: ${err.message}`);
    }
  };

  // Restore directly from diff modal
  const handleRestoreFromDiff = (backupDataToRestore) => {
    if (!backupDataToRestore) return;
    if (backupDataToRestore.songs && Array.isArray(backupDataToRestore.songs)) {
      onRestoreSongs(backupDataToRestore.songs);
    }
    if (backupDataToRestore.recommended) {
      onRestoreRecommended(backupDataToRestore.recommended);
    }
    onShowToast('↺ 선택한 백업 상태로 데이터가 복구되었습니다! ✨');
  };

  // Restore local snapshot
  const handleRestoreLocalSnapshot = (snapshot) => {
    const ok = window.confirm(
      `[${snapshot.dateFormatted}] 시점의 백업으로 복구하시겠습니까?\n\n- 전체 음원: ${snapshot.songCount}곡\n- 추천 리스트: ${snapshot.recommendedCount}곡\n- 메모: ${snapshot.description}`
    );
    if (!ok) return;

    if (snapshot.songs && Array.isArray(snapshot.songs)) {
      onRestoreSongs(snapshot.songs);
    }
    if (snapshot.recommended) {
      onRestoreRecommended(snapshot.recommended);
    }
    onShowToast(`↺ [${snapshot.dateFormatted}] 백업 상태로 데이터가 복구되었습니다! ✨`);
  };

  // Restore from GitHub cloud backup
  const handleRestoreGithubBackup = async (item) => {
    const ok = window.confirm(`GitHub 클라우드 백업 [${item.name}] 파일로부터 데이터를 복구하시겠습니까?`);
    if (!ok) return;

    try {
      const data = await fetchGithubBackupContent(token, item.path);
      if (data.songs && Array.isArray(data.songs)) {
        onRestoreSongs(data.songs);
      }
      if (data.recommended) {
        onRestoreRecommended(data.recommended);
      }
      onShowToast(`↺ GitHub 클라우드 백업(${item.name})으로 복구되었습니다! ✨`);
    } catch (err) {
      alert(`복구 실패: ${err.message}`);
    }
  };

  // Delete local snapshot
  const handleDeleteLocalSnapshot = (id, dateStr) => {
    if (window.confirm(`[${dateStr}] 백업 스냅샷을 삭제하시겠습니까?`)) {
      const updated = deleteLocalBackupSnapshot(id);
      setLocalSnapshots(updated);
      onShowToast('백업 스냅샷이 삭제되었습니다.');
    }
  };

  // Export all current data to JSON file
  const handleDownloadFullBackup = () => {
    const backupObj = {
      backupDate: new Date().toISOString(),
      generator: 'Sming Maker Master Backup',
      songsCount: songs.length,
      songs,
      recommended: recommendedData
    };
    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sming_full_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('📥 전체 백업 JSON 파일이 다운로드되었습니다.');
  };

  // Import JSON file to restore
  const handleUploadBackupFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.songs && Array.isArray(parsed.songs)) {
          onRestoreSongs(parsed.songs);
          if (parsed.recommended) {
            onRestoreRecommended(parsed.recommended);
          }
          onShowToast(`📤 백업 파일(${parsed.songs.length}곡)이 성공적으로 복원되었습니다! ✨`);
        } else if (Array.isArray(parsed)) {
          // If it's pure songs.json
          onRestoreSongs(parsed);
          onShowToast(`📤 음원 목록(${parsed.length}곡)이 성공적으로 복원되었습니다! ✨`);
        } else {
          alert('올바른 백업 JSON 파일 형식이 아닙니다.');
        }
      } catch (err) {
        alert('JSON 파싱 오류: 올바른 백업 파일이 아닙니다.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 flex-shrink-0">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>백업 보관함 & 복구 센터</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {localSnapshots.length}개 보관 중
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              배포 및 수정 시점마다 자동 백업되며, 원하는 시점으로 언제든 1초 만에 복구할 수 있습니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsCreatingSnapshot(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer shadow-md transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>즉시 스냅샷 생성</span>
          </button>

          <button
            onClick={handleDownloadFullBackup}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 cursor-pointer transition-colors"
            title="전체 통합 JSON 백업 다운로드"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>JSON 다운로드</span>
          </button>

          <label className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-teal-400" />
            <span>JSON 파일 복원</span>
            <input
              type="file"
              accept=".json"
              onChange={handleUploadBackupFile}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Manual Snapshot Input Drawer */}
      {isCreatingSnapshot && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/40 space-y-3 animate-fade-in">
          <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>현재 상태 스냅샷 수동 저장</span>
          </h4>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={manualMemo}
              onChange={(e) => setManualMemo(e.target.value)}
              placeholder="스냅샷 메모를 입력하세요 (예: 신곡 발표 직전 상태 백업)"
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleCreateManualSnapshot}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer shadow-md transition-all"
            >
              저장
            </button>
            <button
              onClick={() => setIsCreatingSnapshot(false)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Section 1: Local Backup Snapshots */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>로컬 스냅샷 히스토리 (최근 20개 자동 보관)</span>
          </h4>
        </div>

        {localSnapshots.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs space-y-2">
            <Archive className="w-8 h-8 mx-auto text-slate-600 opacity-50" />
            <p>보관된 로컬 스냅샷이 없습니다.</p>
            <p className="text-[11px] text-slate-600">
              GitHub 배포 시 또는 [즉시 스냅샷 생성] 클릭 시 자동으로 스냅샷이 저장됩니다.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {localSnapshots.map((snap) => (
              <div
                key={snap.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-2.5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div 
                    onClick={() => handleOpenLocalDiff(snap)}
                    className="cursor-pointer group flex-1"
                    title="클릭하여 현재 버전과 변경점(Diff) 비교"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{snap.dateFormatted}</span>
                      <span className="text-[10px] text-indigo-400 font-normal opacity-0 group-hover:opacity-100 transition-opacity">
                        (Diff 보기)
                      </span>
                    </div>
                    <p className="text-xs text-emerald-300/90 font-medium mt-0.5">
                      {snap.description || '자동 백업'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenLocalDiff(snap)}
                    className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 border border-slate-700 font-mono cursor-pointer transition-colors"
                    title="현재 데이터와 변경점 비교"
                  >
                    {snap.songCount}곡 (Diff)
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-500" />
                    <span>{snap.author || '음총팀'}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenLocalDiff(snap)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-bold border border-indigo-500/40 cursor-pointer transition-colors"
                      title="현재 적용된 버전과 변경점 비교"
                    >
                      <GitCompare className="w-3 h-3" />
                      <span>Diff 비교</span>
                    </button>

                    <button
                      onClick={() => handleRestoreLocalSnapshot(snap)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/40 cursor-pointer transition-colors"
                      title="이 백업 시점으로 복원"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>복구</span>
                    </button>

                    <button
                      onClick={() => handleDeleteLocalSnapshot(snap.id, snap.dateFormatted)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 cursor-pointer"
                      title="스냅샷 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: GitHub Cloud Backups (src/data/backups/) */}
      {token && (
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <GitBranch className="w-4 h-4 text-violet-400" />
              <span>GitHub 원격 클라우드 백업 목록 (src/data/backups)</span>
            </h4>
            <button
              onClick={handleFetchGithubBackups}
              disabled={isLoadingGithub}
              className="text-xs text-violet-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              {isLoadingGithub ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
              <span>새로고침</span>
            </button>
          </div>

          {githubBackups.length === 0 ? (
            <div className="p-6 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500 text-xs">
              {isLoadingGithub ? 'GitHub 백업 목록을 불러오는 중...' : '원격 저장소에 등록된 클라우드 백업 파일이 없습니다.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {githubBackups.map((item) => (
                <div
                  key={item.sha}
                  className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-violet-500/40 transition-all flex items-center justify-between gap-3 shadow-sm"
                >
                  <div 
                    onClick={() => handleOpenGithubDiff(item)}
                    className="min-w-0 cursor-pointer group flex-1"
                    title="클릭하여 변경점(Diff) 비교"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 group-hover:text-violet-300 transition-colors truncate">
                      <FileJson className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      GitHub Cloud Storage (클릭 시 Diff 비교)
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleOpenGithubDiff(item)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-bold border border-indigo-500/40 cursor-pointer transition-colors whitespace-nowrap"
                      title="현재 데이터와 변경점 비교"
                    >
                      <GitCompare className="w-3 h-3" />
                      <span>Diff</span>
                    </button>

                    <button
                      onClick={() => handleRestoreGithubBackup(item)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 text-xs font-bold border border-violet-500/40 cursor-pointer transition-colors whitespace-nowrap"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>복원</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Diff Modal */}
      <BackupDiffModal
        isOpen={diffModalState.isOpen}
        onClose={() => setDiffModalState(prev => ({ ...prev, isOpen: false }))}
        snapshotName={diffModalState.name}
        snapshotDate={diffModalState.date}
        backupData={diffModalState.data}
        currentSongs={songs}
        currentRecommended={recommendedData}
        onRestore={handleRestoreFromDiff}
        onShowToast={onShowToast}
      />
    </div>
  );
}
