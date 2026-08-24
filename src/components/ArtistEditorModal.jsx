import React, { useState, useEffect } from 'react';
import { X, Save, Users, ExternalLink } from 'lucide-react';

export default function ArtistEditorModal({
  isOpen,
  onClose,
  onSave,
  artistToEdit
}) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category: 'solo',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    platformArtistIds: {
      melon: '',
      genie: '',
      bugs: ''
    }
  });

  const COLOR_OPTIONS = [
    { label: '에메랄드 (포레스트)', value: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    { label: '로즈 (코랄)', value: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
    { label: '앰버 (골드)', value: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    { label: '인디고 (보라)', value: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
    { label: '스카이 (블루)', value: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
    { label: '퍼플 (바이올렛)', value: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    { label: '틸 (청록)', value: 'bg-teal-500/20 text-teal-300 border-teal-500/30' }
  ];

  useEffect(() => {
    if (artistToEdit) {
      setFormData({
        id: artistToEdit.id,
        name: artistToEdit.name,
        category: artistToEdit.category || 'solo',
        badgeColor: artistToEdit.badgeColor || COLOR_OPTIONS[0].value,
        platformArtistIds: {
          melon: artistToEdit.platformArtistIds?.melon || '',
          genie: artistToEdit.platformArtistIds?.genie || '',
          bugs: artistToEdit.platformArtistIds?.bugs || ''
        }
      });
    } else {
      setFormData({
        id: `artist-${Date.now()}`,
        name: '',
        category: 'solo',
        badgeColor: COLOR_OPTIONS[1].value,
        platformArtistIds: { melon: '', genie: '', bugs: '' }
      });
    }
  }, [artistToEdit, isOpen]);

  if (!isOpen) return null;

  const handleIdChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      platformArtistIds: {
        ...prev.platformArtistIds,
        [platform]: value.trim()
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('아티스트 이름을 입력해주세요.');
      return;
    }

    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-slate-100">
              {artistToEdit ? '아티스트 정보 수정' : '새 아티스트 등록'}
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              아티스트 이름 <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="예: 포레스텔라, 조민규, 아이유 등"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                분류
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="group">그룹 (완전체)</option>
                <option value="solo">솔로 (개인곡)</option>
                <option value="unit">유닛/기타</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                대표 뱃지 색상
              </label>
              <select
                value={formData.badgeColor}
                onChange={(e) => setFormData(prev => ({ ...prev, badgeColor: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {COLOR_OPTIONS.map((c, idx) => (
                  <option key={idx} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Platform Artist IDs */}
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            <span className="text-xs font-bold text-slate-200 block">
              음원 사이트별 아티스트 ID (교차검증용)
            </span>

            <div>
              <label className="text-[11px] font-semibold text-emerald-400 flex items-center justify-between mb-1">
                <span>멜론 ArtistID</span>
                {formData.platformArtistIds.melon && (
                  <a
                    href={`https://www.melon.com/artist/timeline.htm?artistId=${formData.platformArtistIds.melon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:underline flex items-center gap-0.5"
                  >
                    곡 목록 확인 <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </label>
              <input
                type="text"
                value={formData.platformArtistIds.melon}
                onChange={(e) => handleIdChange('melon', e.target.value)}
                placeholder="예: 2241604"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-sky-400 flex items-center justify-between mb-1">
                <span>지니 ArtistID</span>
                {formData.platformArtistIds.genie && (
                  <a
                    href={`https://www.genie.co.kr/detail/artistInfo?xxnm=${formData.platformArtistIds.genie}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:underline flex items-center gap-0.5"
                  >
                    곡 목록 확인 <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </label>
              <input
                type="text"
                value={formData.platformArtistIds.genie}
                onChange={(e) => handleIdChange('genie', e.target.value)}
                placeholder="예: 80629471"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-rose-400 flex items-center justify-between mb-1">
                <span>벅스 ArtistID</span>
                {formData.platformArtistIds.bugs && (
                  <a
                    href={`https://music.bugs.co.kr/artist/${formData.platformArtistIds.bugs}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rose-400 hover:underline flex items-center gap-0.5"
                  >
                    곡 목록 확인 <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </label>
              <input
                type="text"
                value={formData.platformArtistIds.bugs}
                onChange={(e) => handleIdChange('bugs', e.target.value)}
                placeholder="예: 80312948"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-xs text-slate-100 focus:outline-none focus:border-rose-500"
              />
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
