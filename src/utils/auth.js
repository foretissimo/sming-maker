/**
 * Authentication and Admin Session Management for Forestella Sound Team (음총팀)
 * Uses browser-native crypto.subtle for SHA-256 hash comparison.
 */

// Valid password SHA-256 hashes:
// - "fore2026!" => 44be07570bd71c9051c193beb0fe3cb4227147e11a969d7bb8dea0784fd4b931
// - "forestella2026!" => 159a4afb1ee9e443b3d5084e0b6609db1300f1bcd23f7e0557a05793b37f71b7
// - "sming2026!" => 925fb3786823f1676ed68f61599d033635b366916040968a875f2cabf8524d07
const VALID_PASSWORD_HASHES = new Set([
  '44be07570bd71c9051c193beb0fe3cb4227147e11a969d7bb8dea0784fd4b931', // fore2026!
  '159a4afb1ee9e443b3d5084e0b6609db1300f1bcd23f7e0557a05793b37f71b7', // forestella2026!
  '925fb3786823f1676ed68f61599d033635b366916040968a875f2cabf8524d07'  // sming2026!
]);

const VALID_ADMIN_IDS = new Set([
  'fore_admin',
  'forestella',
  'sming_admin',
  'admin'
]);

export async function sha256(message) {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return '';
  }
  const msgBuffer = new TextEncoder().encode(message.trim());
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyAdminCredentials(id, password) {
  if (!id || !password) return { success: false, message: 'ID와 비밀번호를 모두 입력해주세요.' };

  const normalizedId = id.trim().toLowerCase();
  if (!VALID_ADMIN_IDS.has(normalizedId)) {
    return { success: false, message: '등록되지 않은 음총팀 ID입니다.' };
  }

  const hash = await sha256(password);
  if (!VALID_PASSWORD_HASHES.has(hash)) {
    return { success: false, message: '비밀번호가 일치하지 않습니다.' };
  }

  return {
    success: true,
    user: {
      id: normalizedId,
      name: '포레스텔라 음총팀',
      loginAt: Date.now()
    }
  };
}

export function saveAdminSession(user) {
  try {
    sessionStorage.setItem('sming_admin_session', JSON.stringify({
      ...user,
      isLoggedIn: true
    }));
  } catch (e) {}
}

export function getAdminSession() {
  if (typeof window === 'undefined') return null;
  try {
    const sessionStr = sessionStorage.getItem('sming_admin_session');
    if (!sessionStr) return null;
    const parsed = JSON.parse(sessionStr);
    if (parsed && parsed.isLoggedIn) {
      return parsed;
    }
  } catch (e) {}
  return null;
}

export function isAdminLoggedIn() {
  return !!getAdminSession();
}

export function clearAdminSession() {
  try {
    sessionStorage.removeItem('sming_admin_session');
  } catch (e) {}
}

// GitHub Personal Access Token (PAT) Management for Direct API Commit
export function getStoredGithubToken() {
  try {
    return localStorage.getItem('sming_github_pat') || '';
  } catch (e) {
    return '';
  }
}

export function setStoredGithubToken(token) {
  try {
    if (token) {
      localStorage.setItem('sming_github_pat', token.trim());
    } else {
      localStorage.removeItem('sming_github_pat');
    }
  } catch (e) {}
}
