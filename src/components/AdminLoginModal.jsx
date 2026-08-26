import React, { useState } from 'react';
import { 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  GitBranch, 
  Eye, 
  EyeOff,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { 
  verifyAdminCredentials, 
  saveAdminSession, 
  getStoredGithubToken, 
  setStoredGithubToken 
} from '../utils/auth';

export default function AdminLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  onShowToast
}) {
  const [adminId, setAdminId] = useState('fore_admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [githubToken, setGithubToken] = useState(() => getStoredGithubToken());
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await verifyAdminCredentials(adminId, password);
      if (!result.success) {
        setError(result.message);
        setIsLoading(false);
        return;
      }

      // Save admin session
      saveAdminSession(result.user);

      // Save GitHub Token if provided
      if (githubToken.trim()) {
        setStoredGithubToken(githubToken.trim());
      }

      onShowToast?.('👑 음총팀 관리자 모드로 로그인되었습니다!');
      onLoginSuccess?.(result.user);
      onClose();
    } catch (err) {
      setError(`로그인 처리 중 오류 발생: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl shadow-emerald-950/60 relative space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 pb-3 border-b border-slate-800">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-950/60 flex-shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-100 flex items-center gap-1.5">
              <span>음총팀 관리자 로그인</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                TEAM ONLY
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              음원 데이터 & 공식 추천 리스트 편집 권한 인증
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Admin ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              음총팀 아이디 (ID)
            </label>
            <input
              type="text"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              placeholder="fore_admin"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Admin Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              비밀번호 (Password)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="음총팀 공용 비밀번호 입력"
                required
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* GitHub Token for Direct Commit (Optional / Saved) */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-slate-400" />
              <span>GitHub Personal Access Token</span>
            </label>

            <input
              type="password"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder="ghp_..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-mono transition-colors"
            />
            <p className="text-[10px] text-slate-500">
              * 웹 편집기에서 [GitHub에 즉시 배포] 시 사용되는 토큰입니다.
            </p>
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg shadow-emerald-950/60 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-slate-950" />
              <span>{isLoading ? '인증 중...' : '음총팀 인증 및 로그인'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
