import React, { useState } from 'react';
import { 
  Rocket, 
  GitBranch, 
  X, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Database, 
  Clock, 
  FileText,
  HelpCircle
} from 'lucide-react';
import { getStoredGithubToken, setStoredGithubToken } from '../utils/auth';
import { deployToGithubWithBackup } from '../utils/githubApi';

export default function DeployModal({
  isOpen,
  onClose,
  songs,
  recommendedData,
  onShowToast
}) {
  const [token, setToken] = useState(() => getStoredGithubToken());
  const [authorName, setAuthorName] = useState('포레스텔라 음총팀');
  const [commitMessage, setCommitMessage] = useState('data: update songs and recommended playlist');
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState(null);
  const [deploySuccess, setDeploySuccess] = useState(null);
  const [showTokenHelp, setShowTokenHelp] = useState(false);

  if (!isOpen) return null;

  const handleDeploy = async (e) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('GitHub Personal Access Token(PAT)을 입력해주세요.');
      return;
    }

    setError(null);
    setIsDeploying(true);

    try {
      // Save token for next time
      setStoredGithubToken(token.trim());

      const result = await deployToGithubWithBackup({
        token: token.trim(),
        songs,
        recommended: recommendedData,
        authorName: authorName.trim() || '포레스텔라 음총팀',
        commitMessage: commitMessage.trim() || 'data: update songs dataset'
      });

      setDeploySuccess(result);
      onShowToast?.('🚀 GitHub에 성공적으로 배포 및 백업되었습니다! 약 1분 후 웹사이트에 반영됩니다. ✨');
    } catch (err) {
      setError(`배포 실패: ${err.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl shadow-emerald-950/60 relative space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 pb-3 border-b border-slate-800">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-violet-950/60 flex-shrink-0">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
              <span>GitHub 원클릭 즉시 배포</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold">
                LIVE DEPLOY
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              수정한 음원 데이터와 추천 리스트를 GitHub에 실시간 커밋 & 자동 백업합니다.
            </p>
          </div>
        </div>

        {/* Success Banner */}
        {deploySuccess ? (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>배포 및 백업 완료! 🎉</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              GitHub <strong className="text-emerald-300">main</strong> 브랜치에 성공적으로 커밋되었습니다. GitHub Actions 빌드가 실행되어 <strong>약 1분 후</strong> 전 세계 사이트에 자동 반영됩니다.
            </p>
            <div className="text-[11px] font-mono text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 space-y-1">
              <div>📦 백업 파일: <span className="text-emerald-400">{deploySuccess.backupFileName}</span></div>
              <div>🕒 타임스탬프: {new Date(deploySuccess.timestamp).toLocaleString()}</div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-black cursor-pointer shadow-md"
              >
                닫기
              </button>
            </div>
          </div>
        ) : (
          /* Deploy Form */
          <form onSubmit={handleDeploy} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>전체 음원 데이터</span>
                </div>
                <div className="text-sm font-bold text-slate-100">
                  {songs.length}곡 <span className="text-[11px] font-normal text-slate-400">(songs.json)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span className="text-xs">🌲</span>
                  <span>음총팀 추천 리스트</span>
                </div>
                <div className="text-sm font-bold text-slate-100">
                  {recommendedData?.songs?.length || 0}곡 <span className="text-[11px] font-normal text-slate-400">(1시간)</span>
                </div>
              </div>
            </div>

            {/* Author / Committer Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                작성자 / 음총팀원 이름
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="포레스텔라 음총팀"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Commit Message */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                배포 메모 (Commit Message)
              </label>
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="예: 신곡 정보 업데이트 및 1시간 추천리스트 갱신"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* GitHub Token */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                  <span>GitHub Personal Access Token (PAT)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowTokenHelp(!showTokenHelp)}
                  className="text-[11px] text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>토큰 안내</span>
                </button>
              </div>

              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_... (저장소 쓰기 권한이 있는 GitHub 토큰)"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-mono transition-colors"
              />
              <p className="text-[10px] text-slate-500">
                * 한번 입력한 토큰은 브라우저에 안전하게 기억됩니다.
              </p>

              {showTokenHelp && (
                <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-700 text-[11px] text-slate-300 space-y-1 leading-relaxed">
                  <p className="font-semibold text-emerald-300">💡 GitHub Token 발급 안내:</p>
                  <p className="text-slate-400">
                    GitHub Settings &rarr; Developer Settings &rarr; Personal Access Tokens &rarr; Tokens (classic) 에서 <strong className="text-slate-200">repo (또는 contents:write)</strong> 권한으로 발급하여 입력하시면 됩니다.
                  </p>
                </div>
              )}
            </div>

            {/* Auto Backup Notice */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>배포 시 <strong>로컬 보관함</strong> 및 <strong>GitHub src/data/backups/</strong>에 백업 스냅샷이 자동 생성되어 언제든 복구할 수 있습니다.</span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isDeploying}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white font-black text-xs cursor-pointer shadow-lg shadow-violet-950/60 disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>GitHub 배포 및 백업 중...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 text-white" />
                    <span>GitHub에 즉시 배포 & 백업</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
