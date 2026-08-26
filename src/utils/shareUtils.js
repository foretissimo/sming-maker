/**
 * Share & Playlist Serialization Utilities
 * Supports encoding/decoding playlists into compact, URL-safe base64 strings
 * for instant 1-click sharing without needing external databases.
 */

/**
 * Pure UTF-8 safe Base64URL encoder for browser & node
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
 * Encode a playlist package into an ultra-compact URL-safe sharing token (v2)
 *
 * @param {Object} data
 * @param {string} data.title - Playlist title
 * @param {string} data.creator - Creator name / fanbase team
 * @param {string} data.desc - Description / instructions
 * @param {string} data.youtubeUrl - YouTube link
 * @param {Array} data.playlist - Array of song objects
 */
export function encodeShareablePlaylist({ title = '', creator = '', desc = '', youtubeUrl = '', playlist = [] }) {
  // Ultra-compact song representation
  const compactSongs = playlist.map(s => {
    // Standard library songs only need their ID string
    if (s.id && !s.id.startsWith('custom-')) {
      return s.id;
    }
    // Custom non-library songs
    return {
      t: s.title,
      a: s.artist,
      d: s.duration,
      m: s.platformIds?.melon || '',
      g: s.platformIds?.genie || '',
      b: s.platformIds?.bugs || '',
      isTitle: s.isTitle ? 1 : 0
    };
  });

  const now = new Date();
  const createdStr = now.toISOString().split('T')[0];

  const payload = {
    v: 2, // ultra-compact v2 format
    t: title || '포레스텔라 1시간 스밍리스트',
    c: creator || '숲별',
    d: desc || '',
    y: youtubeUrl || '',
    s: compactSongs,
    created: createdStr
  };

  return utf8ToBase64Url(JSON.stringify(payload));
}

/**
 * Decode a sharing token from URL into playlist and metadata with expiration check
 * - Recommended retention: 6 months (180 days)
 * - Maximum hard retention: 1 year (365 days)
 *
 * @param {string} token - Base64URL encoded string
 * @param {Array} allKnownSongs - Master song catalog to supplement metadata
 */
export function decodeShareablePlaylist(token, allKnownSongs = []) {
  try {
    const jsonStr = base64UrlToUtf8(token);
    const payload = JSON.parse(jsonStr);

    let restoredPlaylist = [];

    if (Array.isArray(payload.s)) {
      restoredPlaylist = payload.s.map((item, idx) => {
        // v2 string ID representation
        if (typeof item === 'string') {
          const master = allKnownSongs.find(s => s.id === item);
          if (master) {
            return {
              ...master,
              uniqueKey: `${master.id}-${idx}-${Math.random().toString(36).substr(2, 6)}`
            };
          }
          return {
            id: item,
            title: '포레스텔라 곡',
            artist: '포레스텔라',
            artistType: 'group',
            album: '',
            duration: 225,
            releaseDate: '',
            isTitle: false,
            platformIds: { melon: '', genie: '', bugs: '' },
            uniqueKey: `${item}-${idx}-${Math.random().toString(36).substr(2, 6)}`
          };
        }

        // v2 custom object representation: { t, a, d, m, g, b, isTitle }
        if (item.t) {
          return {
            id: `custom-${idx}`,
            title: item.t,
            artist: item.a || '포레스텔라',
            artistType: 'group',
            album: '',
            duration: item.d || 225,
            releaseDate: '',
            isTitle: !!item.isTitle,
            platformIds: {
              melon: item.m || '',
              genie: item.g || '',
              bugs: item.b || ''
            },
            uniqueKey: `custom-${idx}-${Math.random().toString(36).substr(2, 6)}`
          };
        }

        // v1 legacy compact object representation
        const master = allKnownSongs.find(s => s.id === item.id);
        return {
          id: item.id || `custom-${idx}`,
          title: item.title || master?.title || '무제',
          artist: item.artist || master?.artist || '포레스텔라',
          artistType: item.artistType || master?.artistType || 'group',
          album: item.album || master?.album || '',
          duration: item.duration || master?.duration || 225,
          releaseDate: item.releaseDate || master?.releaseDate || '',
          isTitle: item.isTitle || master?.isTitle || false,
          platformIds: item.platformIds || master?.platformIds || { melon: '', genie: '', bugs: '' },
          tags: item.tags || master?.tags || [],
          uniqueKey: `${item.id || 'song'}-${idx}-${Math.random().toString(36).substr(2, 6)}`
        };
      });
    }

    // Expiration calculations
    const createdDate = payload.created ? new Date(payload.created) : new Date();
    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();
    const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    const isExpired = diffDays > 365; // Hard cutoff: 1 year (365 days)
    const isOld = diffDays > 180 && !isExpired; // Recommendation warning: 6 months (180 days)

    return {
      title: payload.t || '공유된 스밍리스트',
      creator: payload.c || '숲별',
      desc: payload.d || '',
      youtubeUrl: payload.y || '',
      created: payload.created || '',
      daysElapsed: diffDays,
      isExpired,
      isOld,
      playlist: restoredPlaylist
    };
  } catch (err) {
    console.error('Failed to decode shared playlist:', err);
    return null;
  }
}

/**
 * Generate full compact share URL
 */
export function generateShareUrl({ title, creator, desc, youtubeUrl = '', playlist }) {
  const token = encodeShareablePlaylist({ title, creator, desc, youtubeUrl, playlist });
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  return `${origin}${pathname}?s=${token}`;
}

/**
 * Shorten URL via public TinyURL API with timeout
 */
export async function createShortUrl(longUrl) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const apiUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`;
    const res = await fetch(apiUrl, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const shortUrl = await res.text();
      if (shortUrl && shortUrl.startsWith('http')) {
        return shortUrl.trim();
      }
    }
  } catch (err) {
    console.warn('TinyURL shortener failed or timed out, fallback to native compact URL:', err);
  }
  return longUrl;
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
