import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  Lock, 
  LogOut, 
  Plus, 
  Share2, 
  Check, 
  Trash2, 
  Download, 
  Upload, 
  Sparkles, 
  Clock, 
  Music, 
  FolderPlus, 
  CheckCircle2, 
  Layers, 
  ExternalLink,
  ShieldCheck,
  Send
} from 'lucide-react';
import { 
  loginCreator, 
  getCurrentCreator, 
  logoutCreator, 
  getCreatorPlaylists, 
  saveCreatorPlaylist, 
  deleteCreatorPlaylist, 
  exportCreatorPlaylistsJson 
} from '../utils/creatorStorage';
import { PRESET_PLAYLISTS, generateShareUrl } from '../utils/shareUtils';
import { formatTotalDuration } from '../utils/formatters';

export default function CreatorStudioModal({
  isOpen,
  onClose,
  currentPlaylist = [],
  allSongs = [],
  onLoadPlaylist,
  onShowToast
}) {
  const [creatorSession, setCreatorSession] = useState(() => getCurrentCreator());
  const [activeTab, setActiveTab] = useState('publish'); // 'publish' | 'my_lists' | 'presets'

  // Login Form State
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginError, setLoginError] = useState(null);

  // Publish Form State
  const [publishTitle, setPublishTitle] = useState('');
  const [publishDesc, setPublishDesc] = useState('');
  const [publishYoutubeUrl, setPublishYoutubeUrl] = useState('');
  const [publishedUrl, setPublishedUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Creator Playlists
  const [creatorPlaylists, setCreatorPlaylists] = useState([]);

  // Refresh creator lists
  const reloadCreatorPlaylists = (cId) => {
    if (!cId) return;
    const lists = getCreatorPlaylists(cId);
    setCreatorPlaylists(lists);
  };

  useEffect(() => {
    const session = getCurrentCreator();
    setCreatorSession(session);
    if (session) {
      reloadCreatorPlaylists(session.id);
      if (!publishTitle) {
        setPublishTitle(`🌲 포레스텔라 1시간 최적 스밍리스트 (${new Date().toLocaleDateString('ko-KR')})`);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const session = loginCreator(loginId, loginPw, loginName || loginId);
      setCreatorSession(session);
      reloadCreatorPlaylists(session.id);
      setPublishTitle(`🌲 포레스텔라 1시간 최적 스밍리스트 (${new Date().toLocaleDateString('ko-KR')})`);
      if (onShowToast) onShowToast(`[${session.name}] 크리에이터로 로그인되었습니다! 👑`);
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleLogout = () => {
    logoutCreator();
    setCreatorSession(null);
    setCreatorPlaylists([]);
    if (onShowToast) onShowToast('로그아웃되었습니다.');
  };

  const handlePublish = (e) => {
    e.preventDefault();
    if (!creatorSession) return;
    if (currentPlaylist.length === 0) {
      if (onShowToast) onShowToast('발행할 스밍리스트 곡이 없습니다. 먼저 곡을 생성해주세요.');
      return;
    }

    const savedEntry = saveCreatorPlaylist(creatorSession.id, {
      title: publishTitle.trim() || '포레스텔라 스밍리스트',
      creator: creatorSession.name,
      desc: publishDesc.trim(),
      youtubeUrl: publishYoutubeUrl.trim(),
      playlist: currentPlaylist
    });

    setPublishedUrl(savedEntry.shareUrl);
    reloadCreatorPlaylists(creatorSession.id);
    if (onShowToast) onShowToast('✨ 스밍리스트가 보관함에 저장되고 공유 링크가 생성되었습니다!');
  };

  const handleCopyLink = (url) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    if (onShowToast) onShowToast('공유 링크가 클립보드에 복사되었습니다! 🔗');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDelete = (id) => {
    if (!window.confirm('이 스밍리스트를 보관함에서 삭제하시겠습니까?')) return;
    deleteCreatorPlaylist(creatorSession.id, id);
    reloadCreatorPlaylists(creatorSession.id);
    if (onShowToast) onShowToast('스밍리스트가 삭제되었습니다.');
  };

  const handleLoadPreset = (preset) => {
    const loadedSongs = [];
    (preset.songIds || []).forEach(id => {
      const found = allSongs.find(s => s.id === id);
      if (found) {
        loadedSongs.push({ ...found, uniqueKey: `${found.id}-${Math.random().toString(36).substr(2, 6)}` });
      }
    });
    if (loadedSongs.length > 0) {
      onLoadPlaylist(loadedSongs);
      onClose();
      if (onShowToast) onShowToast(`[${preset.title}] 리스트(${loadedSongs.length}곡)를 불러왔습니다! 🎵`);
    }
  };

  const currentTotalSeconds = currentPlaylist.reduce((sum, s) => sum + (s.duration || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 shadow-md">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                크리에이터 스튜디오 & 스밍리스트 발행소
                {creatorSession && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {creatorSession.badge}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                {creatorSession
                  ? `[${creatorSession.name}] 크리에이터님만의 전용 저장소 & 공유 링크 관리`
                  : 'ID/PW 인증을 통해 나만의 스밍리스트 보관함 및 공유 링크 발행'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {!creatorSession ? (
          /* 1. LOGIN / REGISTER VIEW */
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
              <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                크리에이터 전용 저장소란?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                총공팀, 팬카페 스텝, 팬 크리에이터가 본인만의 ID/PW를 설정하면, 작성한 스밍리스트를 <strong>전용 보관함에 영구 저장하고, 팬들에게 배포할 수 있는 Read-Only 전용 1클릭 링크를 즉시 발행</strong>할 수 있습니다.
              </p>
              <div className="text-[11px] text-emerald-400/80 pt-1">
                💡 처음 입력하시는 ID/PW는 자동으로 새 크리에이터 계정으로 등록됩니다.
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 max-w-md mx-auto">
              {loginError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-medium">
                  ⚠️ {loginError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">크리에이터 ID</label>
                <input
                  type="text"
                  placeholder="예: soopbyeol_team, foret_stream"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">비밀번호 / PIN</label>
                <input
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={loginPw}
                  onChange={(e) => setLoginPw(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">작성자명 (선택)</label>
                <input
                  type="text"
                  placeholder="예: 숲별 총공팀, 포레스텔라 스트림"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/50 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>크리에이터 스튜디오 입장하기</span>
              </button>
            </form>
          </div>
        ) : (
          /* 2. CREATOR DASHBOARD VIEW */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs & User Header */}
            <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab('publish')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                    activeTab === 'publish'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  ✨ 현재 리스트 발행하기
                </button>
                <button
                  onClick={() => setActiveTab('my_lists')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                    activeTab === 'my_lists'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>내 보관함</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-emerald-400 text-[10px]">
                    {creatorPlaylists.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('presets')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                    activeTab === 'presets'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  ⭐ 추천 프리셋
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 hidden sm:inline">
                  작성자: <strong className="text-slate-200">{creatorSession.name}</strong>
                </span>
                <button
                  onClick={handleLogout}
                  className="p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 cursor-pointer"
                  title="로그아웃"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {activeTab === 'publish' && (
                /* TAB 1: PUBLISH CURRENT PLAYLIST */
                <div className="space-y-4 max-w-xl mx-auto">
                  {/* Current Playlist Summary Card */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">발행 대상 곡수: </span>
                      <strong className="text-emerald-300 font-bold">{currentPlaylist.length}곡</strong>
                      <span className="text-slate-600 mx-2">|</span>
                      <span className="text-slate-400">총 재생시간: </span>
                      <strong className="text-emerald-300 font-mono font-bold">
                        {formatTotalDuration(currentTotalSeconds)}
                      </strong>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      현재 생성기 리스트
                    </span>
                  </div>

                  <form onSubmit={handlePublish} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">스밍리스트 제목</label>
                      <input
                        type="text"
                        value={publishTitle}
                        onChange={(e) => setPublishTitle(e.target.value)}
                        placeholder="예: 🌲 2026 THE LEGACY 1시간 최적 올스밍"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">공지 / 가이드 설명 (선택)</label>
                      <textarea
                        value={publishDesc}
                        onChange={(e) => setPublishDesc(e.target.value)}
                        placeholder="예: 매시 정각 재생 시작 권장 / 전곡 완곡 재생 부탁드립니다 💚"
                        rows={3}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>유튜브 (YouTube / YouTube Music) 링크 (선택)</span>
                        <span className="text-[10px] text-emerald-400 font-normal">입력 시 원클릭 버튼 생성</span>
                      </label>
                      <input
                        type="url"
                        value={publishYoutubeUrl}
                        onChange={(e) => setPublishYoutubeUrl(e.target.value)}
                        placeholder="예: https://youtu.be/... 또는 유튜브 뮤직 플레이리스트 링크"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={currentPlaylist.length === 0}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>보관함 저장 & 공유 링크 생성하기</span>
                    </button>
                  </form>

                  {/* Published URL Result Card */}
                  {publishedUrl && (
                    <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-2.5 animate-fade-in">
                      <div className="flex items-center justify-between text-xs text-emerald-300 font-bold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          발행 완료! Read-Only 팬 공유 링크:
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={publishedUrl}
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 truncate"
                        />
                        <button
                          onClick={() => handleCopyLink(publishedUrl)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer hover:bg-emerald-400"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                          <span>{isCopied ? '복사됨' : '복사'}</span>
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-400">
                        🔗 이 링크로 접속한 팬들에게는 <strong>편집 메뉴 없이 깔끔한 스밍 목록과 멜론/지니/벅스 원클릭 담기 버튼</strong>만 제공됩니다.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'my_lists' && (
                /* TAB 2: MY SAVED LISTS REPOSITORY */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      총 <strong className="text-emerald-400">{creatorPlaylists.length}개</strong>의 발행 스밍리스트 보관 중
                    </span>

                    <button
                      onClick={() => exportCreatorPlaylistsJson(creatorSession.id)}
                      disabled={creatorPlaylists.length === 0}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer border border-slate-700 disabled:opacity-40"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>JSON 파일로 내보내기</span>
                    </button>
                  </div>

                  {creatorPlaylists.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      아직 보관함에 저장된 스밍리스트가 없습니다.
                      <br />
                      상단의 [✨ 현재 리스트 발행하기] 탭에서 첫 스밍리스트를 저장해 보세요!
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {creatorPlaylists.map(list => (
                        <div
                          key={list.id}
                          className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                        >
                          <div className="space-y-1 min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-200 truncate">
                              {list.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                              <span className="text-emerald-400 font-mono font-bold">
                                {formatTotalDuration(list.totalSeconds)}
                              </span>
                              <span>•</span>
                              <span>{list.songCount}곡</span>
                              <span>•</span>
                              <span className="text-slate-500">{list.updatedAt}</span>
                            </div>
                            {list.desc && (
                              <p className="text-[11px] text-slate-500 truncate max-w-md">
                                {list.desc}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => handleCopyLink(list.shareUrl)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              title="공유 링크 복사"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>공유</span>
                            </button>
                            <button
                              onClick={() => {
                                onLoadPlaylist(list.playlist);
                                onClose();
                                if (onShowToast) onShowToast(`[${list.title}] 리스트를 생성기로 불러왔습니다! 🎵`);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              title="생성기로 불러오기"
                            >
                              <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
                              <span>불러오기</span>
                            </button>
                            <button
                              onClick={() => handleDelete(list.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 cursor-pointer"
                              title="삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'presets' && (
                /* TAB 3: COMMUNITY / OFFICIAL PRESETS */
                <div className="space-y-3">
                  <div className="text-xs text-slate-400">
                    공식 인증 및 커뮤니티 추천 1시간 최적 스밍리스트 프리셋 목록입니다.
                  </div>

                  <div className="space-y-3">
                    {PRESET_PLAYLISTS.map(preset => (
                      <div
                        key={preset.id}
                        className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-100">
                              {preset.title}
                            </h4>
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              ✍️ {preset.creator}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {preset.desc}
                          </p>
                          <div className="flex items-center gap-1.5 pt-0.5">
                            {preset.tags.map(t => (
                              <span key={t} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-500 border border-slate-800">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleLoadPreset(preset)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>1클릭 불러오기</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
