import React, { useState, useEffect } from 'react';
import { X, Save, ExternalLink, Music, Calendar, Clock, Disc } from 'lucide-react';
import { formatSecondsToTime } from '../utils/formatters';

export default function SongEditorModal({
  isOpen,
  onClose,
  onSave,
  songToEdit,
  artists
}) {
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    artist: '',
    artistType: 'group',
    album: '',
    releaseDate: '',
    durationMinutes: 3,
    durationSeconds: 45,
    isTitle: false,
    platformIds: {
      melon: '',
      genie: '',
      bugs: '',
      vibe: '',
      flo: ''
    },
    tags: []
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (songToEdit) {
      const mins = Math.floor((songToEdit.duration || 0) / 60);
      const secs = (songToEdit.duration || 0) % 60;
      setFormData({
        id: songToEdit.id || `song-${Date.now()}`,
        title: songToEdit.title || '',
        artist: songToEdit.artist || '',
        artistType: songToEdit.artistType || 'group',
        album: songToEdit.album || '',
        releaseDate: songToEdit.releaseDate || '',
        durationMinutes: mins,
        durationSeconds: secs,
        isTitle: !!songToEdit.isTitle,
        platformIds: {
          melon: songToEdit.platformIds?.melon || '',
          genie: songToEdit.platformIds?.genie || '',
          bugs: songToEdit.platformIds?.bugs || '',
          vibe: songToEdit.platformIds?.vibe || '',
          flo: songToEdit.platformIds?.flo || ''
        },
        tags: songToEdit.tags || []
      });
    } else {
      // New song defaults
      setFormData({
        id: `song-${Date.now()}`,
        title: '',
        artist: artists[0]?.name || '포레스텔라',
        artistType: artists[0]?.id || 'group',
        album: '',
        releaseDate: '',
        durationMinutes: 3,
        durationSeconds: 45,
        isTitle: false,
        platformIds: { melon: '', genie: '', bugs: '', vibe: '', flo: '' },
        tags: []
      });
    }
  }, [songToEdit, isOpen, artists]);

  if (!isOpen) return null;

  const handleArtistTypeChange = (typeId) => {
    const selectedArtist = artists.find(a => a.id === typeId);
    setFormData(prev => ({
      ...prev,
      artistType: typeId,
      artist: selectedArtist ? selectedArtist.name : prev.artist
    }));
  };

  const handlePlatformIdChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      platformIds: {
        ...prev.platformIds,
        [platform]: value.trim()
      }
    }));
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('곡명을 입력해주세요.');
      return;
    }

    const totalSeconds = (parseInt(formData.durationMinutes) || 0) * 60 + (parseInt(formData.durationSeconds) || 0);

    const updatedSong = {
      ...formData,
      duration: Math.max(1, totalSeconds),
      userEdited: true  // mark as manually edited by user
    };

    delete updatedSong.durationMinutes;
    delete updatedSong.durationSeconds;

    onSave(updatedSong);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-slate-100">
              {songToEdit ? '음원 데이터 수정' : '새 음원 등록'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs sm:text-sm">
          {/* Row 1: Title & IsTitle */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                곡명 <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="예: White Night (백야)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 h-[38px]">
                <input
                  type="checkbox"
                  checked={formData.isTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, isTitle: e.target.checked }))}
                  className="rounded text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-amber-300">⭐ 타이틀곡 지정</span>
              </label>
            </div>
          </div>

          {/* Row 2: Artist & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                가수(아티스트 분류) <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.artistType}
                onChange={(e) => handleArtistTypeChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {artists.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                가수 표기명
              </label>
              <input
                type="text"
                value={formData.artist}
                onChange={(e) => setFormData(prev => ({ ...prev, artist: e.target.value }))}
                placeholder="예: 포레스텔라, 강형호 (PITTA)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Row 3: Album & Release Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                앨범명
              </label>
              <input
                type="text"
                value={formData.album}
                onChange={(e) => setFormData(prev => ({ ...prev, album: e.target.value }))}
                placeholder="예: The Forestella, Unfinished"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                발매일 (YYYY-MM-DD)
              </label>
              <input
                type="date"
                value={formData.releaseDate}
                onChange={(e) => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Row 4: Exact Duration (Minutes & Seconds) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>곡 재생시간 (1시간 조합에 사용) <span className="text-rose-400">*</span></span>
              <span className="text-emerald-400 font-mono text-xs">
                총 {((parseInt(formData.durationMinutes) || 0) * 60) + (parseInt(formData.durationSeconds) || 0)}초
              </span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-transparent text-right font-mono text-slate-100 focus:outline-none"
                />
                <span className="text-slate-400 text-xs">분</span>
              </div>
              <span className="text-slate-500 font-bold">:</span>
              <div className="flex-1 flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={formData.durationSeconds}
                  onChange={(e) => setFormData(prev => ({ ...prev, durationSeconds: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-transparent text-right font-mono text-slate-100 focus:outline-none"
                />
                <span className="text-slate-400 text-xs">초</span>
              </div>
            </div>
          </div>

          {/* Row 5: Platform Track IDs (Cross Verification) */}
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">음원 플랫폼별 곡 ID (교차검증)</span>
              <span className="text-[11px] text-slate-500">ID 입력 후 🔗를 눌러 실제 곡이 맞는지 확인하세요</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Melon */}
              <div>
                <label className="text-[11px] font-semibold text-emerald-400 flex items-center justify-between mb-1">
                  <span>멜론 SongID</span>
                  {formData.platformIds.melon && (
                    <a
                      href={`https://www.melon.com/song/detail.htm?songId=${formData.platformIds.melon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:underline flex items-center gap-0.5"
                    >
                      확인 <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.platformIds.melon}
                  onChange={(e) => handlePlatformIdChange('melon', e.target.value)}
                  placeholder="예: 36567891"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Genie */}
              <div>
                <label className="text-[11px] font-semibold text-sky-400 flex items-center justify-between mb-1">
                  <span>지니 SongID</span>
                  {formData.platformIds.genie && (
                    <a
                      href={`https://www.genie.co.kr/detail/songInfo?xgnm=${formData.platformIds.genie}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline flex items-center gap-0.5"
                    >
                      확인 <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.platformIds.genie}
                  onChange={(e) => handlePlatformIdChange('genie', e.target.value)}
                  placeholder="예: 10283948"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Bugs */}
              <div>
                <label className="text-[11px] font-semibold text-rose-400 flex items-center justify-between mb-1">
                  <span>벅스 TrackID</span>
                  {formData.platformIds.bugs && (
                    <a
                      href={`https://music.bugs.co.kr/track/${formData.platformIds.bugs}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rose-400 hover:underline flex items-center gap-0.5"
                    >
                      확인 <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.platformIds.bugs}
                  onChange={(e) => handlePlatformIdChange('bugs', e.target.value)}
                  placeholder="예: 32891234"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>저장하기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
