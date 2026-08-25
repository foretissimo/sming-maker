/**
 * Share & Playlist Serialization Utilities
 * Supports encoding/decoding playlists into compact, URL-safe base64 strings
 * for instant 1-click sharing without needing external databases.
 */

/**
 * Pure UTF-8 safe Base64URL encoder for browser & node
 */
export function utf8ToBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Pure UTF-8 safe Base64URL decoder for browser & node
 */
export function base64UrlToUtf8(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Encode a full playlist package into a URL-safe sharing token
 *
 * @param {Object} data
 * @param {string} data.title - Playlist title
 * @param {string} data.creator - Creator name / fanbase team
 * @param {string} data.desc - Description / instructions
 * @param {Array} data.playlist - Array of song objects
 */
export function encodeShareablePlaylist({ title = '', creator = '', desc = '', playlist = [] }) {
  // If songs already have IDs, store compact representation
  const compactSongs = playlist.map(s => {
    // If it is a standard library song with an ID, we only need basic fields
    return {
      id: s.id,
      title: s.title,
      artist: s.artist,
      artistType: s.artistType,
      album: s.album,
      duration: s.duration,
      releaseDate: s.releaseDate,
      isTitle: s.isTitle,
      platformIds: s.platformIds
    };
  });

  const payload = {
    v: 1, // version
    t: title || '포레스텔라 1시간 스밍리스트',
    c: creator || '숲별',
    d: desc || '',
    s: compactSongs,
    created: new Date().toISOString().split('T')[0]
  };

  return utf8ToBase64Url(JSON.stringify(payload));
}

/**
 * Decode a sharing token from URL into playlist and metadata
 *
 * @param {string} token - Base64URL encoded string
 * @param {Array} allKnownSongs - Optional master song catalog to supplement metadata
 */
export function decodeShareablePlaylist(token, allKnownSongs = []) {
  try {
    const jsonStr = base64UrlToUtf8(token);
    const payload = JSON.parse(jsonStr);

    let restoredPlaylist = [];

    if (Array.isArray(payload.s)) {
      restoredPlaylist = payload.s.map((compact, idx) => {
        // Find matching master song if exists to enrich missing fields
        const master = allKnownSongs.find(s => s.id === compact.id);
        return {
          id: compact.id || `custom-${idx}`,
          title: compact.title || master?.title || '무제',
          artist: compact.artist || master?.artist || '포레스텔라',
          artistType: compact.artistType || master?.artistType || 'group',
          album: compact.album || master?.album || '',
          duration: compact.duration || master?.duration || 225,
          releaseDate: compact.releaseDate || master?.releaseDate || '',
          isTitle: compact.isTitle || master?.isTitle || false,
          platformIds: compact.platformIds || master?.platformIds || { melon: '', genie: '', bugs: '' },
          tags: compact.tags || master?.tags || [],
          uniqueKey: `${compact.id || 'song'}-${idx}-${Math.random().toString(36).substr(2, 6)}`
        };
      });
    }

    return {
      title: payload.t || '공유된 스밍리스트',
      creator: payload.c || '숲별',
      desc: payload.d || '',
      created: payload.created || '',
      playlist: restoredPlaylist
    };
  } catch (err) {
    console.error('Failed to decode shared playlist:', err);
    return null;
  }
}

/**
 * Generate full share URL
 */
export function generateShareUrl({ title, creator, desc, playlist }) {
  const token = encodeShareablePlaylist({ title, creator, desc, playlist });
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  return `${origin}${pathname}?share=${token}`;
}

/**
 * Official & Fanbase Curated Preset Playlists
 */
export const PRESET_PLAYLISTS = [
  {
    id: 'preset-the-legacy-all',
    title: '🌲 2026 THE LEGACY 1시간 최적 올스밍',
    creator: '숲별 총공팀',
    desc: 'THE LEGACY 앨범 전곡(12곡) + 타이틀곡(Armageddon)을 3회 반복 배치하여 정확히 60분 00초로 맞춘 정규 1시간 리스트입니다.',
    tags: ['THE LEGACY', '완전체', '60분정규'],
    songIds: [
      'auto-group-601812679', // Armageddon (타이틀)
      'auto-group-601812669', // In un'altra vita
      'auto-group-601812670', // Still Here
      'auto-group-601812671', // Nella Notte
      'auto-group-601812679', // Armageddon (타이틀)
      'auto-group-601812672', // Etude
      'auto-group-601812673', // 그리고 봄
      'auto-group-601812674', // 꽃병
      'auto-group-601812675', // Parla piu piano
      'auto-group-601812679', // Armageddon (타이틀)
      'auto-group-601812676', // Scarborough Fair
      'auto-group-601812677', // Now We Are Free
      'auto-group-601812678'  // Snow Globe
    ]
  },
  {
    id: 'preset-solos-highlight',
    title: '⭐ 4인 4색 멤버 솔로곡 하이라이트 1시간',
    creator: '포레스텔라 스트림',
    desc: '조민규, 배두훈, 강형호(PITTA), 고우림 4인 멤버의 대표 솔로곡 및 최신 앨범 트랙을 균형있게 조합한 1시간 리스트입니다.',
    tags: ['솔로4인', '멤버추천', '균형배치'],
    songIds: [
      'auto-jomingyu-32381282',  // 라야
      'auto-baedoohun-35200375', // 가슴이 뛴다
      'auto-kanghyungho-34289870', // Universe
      'auto-gowoorim-36528825',  // 진주
      'auto-group-601812679',   // Armageddon
      'auto-jomingyu-34444583',  // 바람
      'auto-baedoohun-36069904', // 첫사랑
      'auto-kanghyungho-36856711', // Be The One
      'auto-gowoorim-36892291',  // 별 헤는 밤
      'auto-group-601812678'    // Snow Globe
    ]
  }
];
