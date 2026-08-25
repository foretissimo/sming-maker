/**
 * Creator Authentication & Storage Manager
 * Allows creators (fanbase team, playlist organizers) to log in with ID/PW,
 * manage their personal repository of streaming lists, and publish 1-click shareable links.
 */

import { encodeShareablePlaylist, generateShareUrl } from './shareUtils';

const CREATOR_SESSION_KEY = 'sming_current_creator_session';
const CREATOR_USERS_KEY = 'sming_registered_creators';

/**
 * Built-in default verified creator profiles
 */
const DEFAULT_CREATORS = [
  {
    id: 'soopbyeol_team',
    name: '숲별 총공팀',
    badge: '👑 공식 인증 총공팀',
    passwordHash: 'soopbyeol2026' // simple passkey
  },
  {
    id: 'forestellastream',
    name: '포레스텔라 스트림',
    badge: '⭐ 스밍 서포터즈',
    passwordHash: 'foret2026'
  }
];

/**
 * Get all registered creators from LocalStorage
 */
function getRegisteredCreators() {
  try {
    const saved = localStorage.getItem(CREATOR_USERS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_CREATORS;
  } catch (e) {
    return DEFAULT_CREATORS;
  }
}

/**
 * Log in as a creator with ID and Password
 * If creator ID does not exist, automatically registers new creator profile!
 */
export function loginCreator(id, password, creatorName) {
  if (!id || !password) {
    throw new Error('아이디와 비밀번호를 모두 입력해주세요.');
  }

  const cleanId = id.trim().toLowerCase();
  const creators = getRegisteredCreators();
  const existing = creators.find(c => c.id === cleanId);

  if (existing) {
    if (existing.passwordHash !== password.trim()) {
      throw new Error('비밀번호가 일치하지 않습니다.');
    }
    const session = {
      id: existing.id,
      name: existing.name,
      badge: existing.badge || '✨ 크리에이터',
      loginAt: Date.now()
    };
    localStorage.setItem(CREATOR_SESSION_KEY, JSON.stringify(session));
    return session;
  } else {
    // Register new creator profile
    const newCreator = {
      id: cleanId,
      name: creatorName?.trim() || cleanId,
      badge: '✨ 크리에이터',
      passwordHash: password.trim()
    };
    creators.push(newCreator);
    localStorage.setItem(CREATOR_USERS_KEY, JSON.stringify(creators));

    const session = {
      id: newCreator.id,
      name: newCreator.name,
      badge: newCreator.badge,
      loginAt: Date.now()
    };
    localStorage.setItem(CREATOR_SESSION_KEY, JSON.stringify(session));
    return session;
  }
}

/**
 * Get currently logged-in creator session
 */
export function getCurrentCreator() {
  try {
    const saved = localStorage.getItem(CREATOR_SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Log out creator
 */
export function logoutCreator() {
  try {
    localStorage.removeItem(CREATOR_SESSION_KEY);
  } catch (e) {}
}

/**
 * Get storage key for a creator's playlists
 */
function getPlaylistsKey(creatorId) {
  return `sming_creator_playlists_${creatorId.toLowerCase()}`;
}

/**
 * Get all playlists published/saved by a creator
 */
export function getCreatorPlaylists(creatorId) {
  if (!creatorId) return [];
  try {
    const saved = localStorage.getItem(getPlaylistsKey(creatorId));
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Save or update a playlist in creator's repository
 */
export function saveCreatorPlaylist(creatorId, playlistData) {
  if (!creatorId) throw new Error('로그인이 필요합니다.');
  const playlists = getCreatorPlaylists(creatorId);

  const playlistId = playlistData.id || `list-${Date.now()}`;
  const totalSeconds = (playlistData.playlist || []).reduce((sum, s) => sum + (s.duration || 0), 0);

  const newEntry = {
    id: playlistId,
    title: playlistData.title || '새 스밍리스트',
    creator: playlistData.creator || creatorId,
    desc: playlistData.desc || '',
    playlist: playlistData.playlist || [],
    songCount: (playlistData.playlist || []).length,
    totalSeconds,
    updatedAt: new Date().toISOString().split('T')[0],
    shareUrl: generateShareUrl({
      title: playlistData.title,
      creator: playlistData.creator,
      desc: playlistData.desc,
      playlist: playlistData.playlist
    })
  };

  const existingIndex = playlists.findIndex(p => p.id === playlistId);
  if (existingIndex >= 0) {
    playlists[existingIndex] = newEntry;
  } else {
    playlists.unshift(newEntry);
  }

  localStorage.setItem(getPlaylistsKey(creatorId), JSON.stringify(playlists));
  return newEntry;
}

/**
 * Delete a playlist from creator's repository
 */
export function deleteCreatorPlaylist(creatorId, playlistId) {
  if (!creatorId) return;
  const playlists = getCreatorPlaylists(creatorId).filter(p => p.id !== playlistId);
  localStorage.setItem(getPlaylistsKey(creatorId), JSON.stringify(playlists));
}

/**
 * Export all playlists for a creator as downloadable JSON file
 */
export function exportCreatorPlaylistsJson(creatorId) {
  const playlists = getCreatorPlaylists(creatorId);
  const jsonStr = JSON.stringify(playlists, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `playlists_${creatorId}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
