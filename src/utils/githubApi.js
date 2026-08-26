/**
 * GitHub REST API Client & Snapshot Backup System for Sming Maker
 * Enables direct commits to main branch and automated multi-layer backups.
 */

const REPO_OWNER = 'foretissimo';
const REPO_NAME = 'sming-maker';
const DEFAULT_BRANCH = 'main';

// Safe UTF-8 Base64 encoding/decoding for browser
export function unicodeToBase64(str) {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    return btoa(str);
  }
}

export function base64ToUnicode(b64) {
  try {
    return decodeURIComponent(escape(atob(b64)));
  } catch (e) {
    return atob(b64);
  }
}

/**
 * Get file SHA from GitHub repository
 */
export async function getRepoFileSha(token, filePath, branch = DEFAULT_BRANCH) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}?ref=${branch}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `token ${token.trim()}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (res.status === 404) {
    return { exists: false, sha: null };
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`GitHub 파일 정보 조회 실패 (${res.status}): ${err.message || res.statusText}`);
  }

  const data = await res.json();
  return {
    exists: true,
    sha: data.sha,
    content: data.content ? base64ToUnicode(data.content.replace(/\s/g, '')) : null
  };
}

/**
 * Commit a file to GitHub repository (Create or Update)
 */
export async function commitRepoFile(token, filePath, contentString, commitMessage, branch = DEFAULT_BRANCH) {
  const { sha, exists } = await getRepoFileSha(token, filePath, branch);

  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;
  const body = {
    message: commitMessage,
    content: unicodeToBase64(contentString),
    branch: branch
  };

  if (exists && sha) {
    body.sha = sha;
  }

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token.trim()}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`GitHub 커밋 실패 (${res.status}): ${err.message || res.statusText}`);
  }

  return await res.json();
}

/**
 * Save snapshot to Local Storage Vault (max 20 snapshots)
 */
export function saveLocalBackupSnapshot({ songs, recommended, author = '음총팀', description = '자동 백업' }) {
  try {
    const now = new Date();
    const snapshot = {
      id: `snap_${Date.now()}`,
      timestamp: now.toISOString(),
      dateFormatted: now.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      author,
      description,
      songCount: Array.isArray(songs) ? songs.length : 0,
      recommendedCount: Array.isArray(recommended?.songs) ? recommended.songs.length : 0,
      songs,
      recommended
    };

    const existingStr = localStorage.getItem('sming_backup_vault');
    let vault = existingStr ? JSON.parse(existingStr) : [];
    if (!Array.isArray(vault)) vault = [];

    // Prepend latest snapshot and keep max 20
    vault = [snapshot, ...vault].slice(0, 20);
    localStorage.setItem('sming_backup_vault', JSON.stringify(vault));
    return snapshot;
  } catch (e) {
    console.error('Failed to save local snapshot:', e);
    return null;
  }
}

/**
 * Get all local backup snapshots
 */
export function getLocalBackupSnapshots() {
  try {
    const existingStr = localStorage.getItem('sming_backup_vault');
    if (!existingStr) return [];
    const parsed = JSON.parse(existingStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/**
 * Delete a specific local backup snapshot
 */
export function deleteLocalBackupSnapshot(snapshotId) {
  try {
    const vault = getLocalBackupSnapshots().filter(s => s.id !== snapshotId);
    localStorage.setItem('sming_backup_vault', JSON.stringify(vault));
    return vault;
  } catch (e) {
    return [];
  }
}

/**
 * Deploy datasets to GitHub with automatic multi-layer backup:
 * 1. Local Vault Snapshot
 * 2. GitHub Cloud Backup File (`src/data/backups/backup_YYYYMMDD_HHmmss.json`)
 * 3. Update `src/data/songs.json`
 * 4. Update `src/data/recommendedPlaylist.json`
 */
export async function deployToGithubWithBackup({
  token,
  songs,
  recommended,
  authorName = '포레스텔라 음총팀',
  commitMessage = 'data: update songs and recommended playlist'
}) {
  if (!token) {
    throw new Error('GitHub Personal Access Token(PAT)이 필요합니다.');
  }

  // 1. Save local snapshot
  const localSnapshot = saveLocalBackupSnapshot({
    songs,
    recommended,
    author: authorName,
    description: commitMessage
  });

  const now = new Date();
  const timeStampStr = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const backupFileName = `src/data/backups/backup_${timeStampStr}.json`;

  const backupData = {
    version: '1.0',
    backupTime: now.toISOString(),
    author: authorName,
    description: commitMessage,
    songsCount: songs?.length || 0,
    recommendedCount: recommended?.songs?.length || 0,
    songs,
    recommended
  };

  // 2. Commit backup file to GitHub
  await commitRepoFile(
    token,
    backupFileName,
    JSON.stringify(backupData, null, 2),
    `backup: snapshot at ${now.toISOString()} by ${authorName}`
  );

  // 3. Commit songs.json to GitHub
  await commitRepoFile(
    token,
    'src/data/songs.json',
    JSON.stringify(songs, null, 2),
    `${commitMessage} (songs.json)`
  );

  // 4. Commit recommendedPlaylist.json to GitHub
  if (recommended) {
    await commitRepoFile(
      token,
      'src/data/recommendedPlaylist.json',
      JSON.stringify(recommended, null, 2),
      `${commitMessage} (recommendedPlaylist.json)`
    );
  }

  return {
    success: true,
    backupFileName,
    localSnapshotId: localSnapshot?.id,
    timestamp: now.toISOString()
  };
}

/**
 * List backups stored on GitHub in `src/data/backups`
 */
export async function listGithubBackups(token) {
  if (!token) return [];
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/src/data/backups?ref=${DEFAULT_BRANCH}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `token ${token.trim()}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!res.ok) {
    return [];
  }

  const items = await res.json();
  if (!Array.isArray(items)) return [];

  // Sort descending by filename timestamp
  return items
    .filter(item => item.name.endsWith('.json'))
    .sort((a, b) => b.name.localeCompare(a.name));
}

/**
 * Fetch backup content from GitHub
 */
export async function fetchGithubBackupContent(token, path) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${DEFAULT_BRANCH}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `token ${token.trim()}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!res.ok) {
    throw new Error(`백업 파일 로드 실패 (${res.status})`);
  }

  const data = await res.json();
  if (!data.content) throw new Error('백업 파일 내용이 비어있습니다.');
  const jsonStr = base64ToUnicode(data.content.replace(/\s/g, ''));
  return JSON.parse(jsonStr);
}
