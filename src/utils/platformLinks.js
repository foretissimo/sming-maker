/**
 * Modular Platform URL Generator for 1-Click Streaming across PC, iOS, and Android.
 *
 * Designed to easily extend with additional music platforms (Melon, Genie, Bugs, YouTube, FLO, VIBE, Spotify, Apple Music, etc.)
 */

export function isIOS() {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isAndroid() {
  if (typeof window === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

export function getDefaultDeviceCategory() {
  if (isIOS()) return 'ios';
  if (isAndroid()) return 'android';
  return 'pc';
}

/**
 * Split playlist into non-duplicate sequential parts for Melon
 * Melon player de-duplicates songs within a single cList parameter.
 */
export function splitMelonPlaylistIntoParts(songs) {
  if (!songs || songs.length === 0) return [];

  const parts = [];
  let currentPart = [];
  let seenIds = new Set();

  songs.forEach((song) => {
    const melonId = song.platformIds?.melon;
    if (!melonId) return;

    if (seenIds.has(melonId)) {
      if (currentPart.length > 0) {
        const ids = currentPart.map(s => s.platformIds.melon);
        const joined = ids.join(',');
        parts.push({
          partIndex: parts.length + 1,
          songs: [...currentPart],
          ids,
          count: ids.length,
          pc: `melonapp://play?cType=1&cList=${joined}`,
          ios: `melonapp://play?cType=1&cList=${joined}`,
          ipad: `melonipad://play/?ctype=1&menuid=0&cid=${joined}`,
          android: `melonapp://play?menuid=0&ctype=1&cid=${joined}`,
          url: `melonapp://play?cType=1&cList=${joined}`
        });
      }
      currentPart = [song];
      seenIds = new Set([melonId]);
    } else {
      currentPart.push(song);
      seenIds.add(melonId);
    }
  });

  if (currentPart.length > 0) {
    const ids = currentPart.map(s => s.platformIds.melon);
    const joined = ids.join(',');
    parts.push({
      partIndex: parts.length + 1,
      songs: [...currentPart],
      ids,
      count: ids.length,
      pc: `melonapp://play?cType=1&cList=${joined}`,
      ios: `melonapp://play?cType=1&cList=${joined}`,
      ipad: `melonipad://play/?ctype=1&menuid=0&cid=${joined}`,
      android: `melonapp://play?menuid=0&ctype=1&cid=${joined}`,
      url: `melonapp://play?cType=1&cList=${joined}`
    });
  }

  return parts;
}

/**
 * Generate platform-specific deep links & fallback links
 */
export function generatePlatformLinks(songs, options = {}) {
  const youtubeUrl = options.youtubeUrl || '';

  if (!songs || songs.length === 0) {
    return {
      melon: { count: 0, parts: [], hasDuplicates: false, pc: '', ios: '', ipad: '', android: '', full: '' },
      genie: { count: 0, pc: '', ios: '', android: '', app: '' },
      bugs: { count: 0, pc: '', ios: '', android: '', app: '' },
      youtube: { count: youtubeUrl ? 1 : 0, url: youtubeUrl, pc: youtubeUrl, ios: youtubeUrl, android: youtubeUrl },
      flo: { count: 0, pc: '', ios: '', android: '' },
      vibe: { count: 0, pc: '', ios: '', android: '' }
    };
  }

  const melonIds = songs.map(s => s.platformIds?.melon).filter(Boolean);
  const genieIds = songs.map(s => s.platformIds?.genie).filter(Boolean);
  const bugsIds = songs.map(s => s.platformIds?.bugs).filter(Boolean);
  const floIds = songs.map(s => s.platformIds?.flo).filter(Boolean);
  const vibeIds = songs.map(s => s.platformIds?.vibe).filter(Boolean);

  const melonParts = splitMelonPlaylistIntoParts(songs);
  const melonJoinedIds = melonIds.join(',');
  const melonPcUri = melonIds.length > 0 ? `melonapp://play?cType=1&cList=${melonJoinedIds}` : '';
  const melonIosUri = melonIds.length > 0 ? `melonapp://play?cType=1&cList=${melonJoinedIds}` : '';
  const melonIpadUri = melonIds.length > 0 ? `melonipad://play/?ctype=1&menuid=0&cid=${melonJoinedIds}` : '';
  const melonAndroidUri = melonIds.length > 0 ? `melonapp://play?menuid=0&ctype=1&cid=${melonJoinedIds}` : '';

  const genieJoined = genieIds.length > 0 ? `${genieIds.join(';')};` : '';
  const bugsJoined = bugsIds.length > 0 ? `${bugsIds.join('|')}|` : '';

  return {
    melon: {
      name: '멜론 (Melon)',
      brandColor: '#00cd3c',
      count: melonIds.length,
      parts: melonParts,
      hasDuplicates: melonParts.length > 1,
      full: melonPcUri,
      pc: melonPcUri,
      ios: melonIosUri,
      ipad: melonIpadUri,
      android: melonAndroidUri
    },
    genie: {
      name: '지니 (Genie)',
      brandColor: '#0092fa',
      count: genieIds.length,
      pc: genieIds.length > 0 ? `https://www.genie.co.kr/player/shareProcessV2?xgnm=${genieIds.join(';')}` : '',
      ios: genieIds.length > 0 ? `ktolleh00167://landing/?landing_type=31&landing_target=${genieJoined}` : '',
      ipad: genieIds.length > 0 ? `ktolleh00167://landing/?landing_type=31&landing_target=${genieJoined}` : '',
      android: genieIds.length > 0 ? `cromegenie://scan/?landing_type=31&landing_target=${genieJoined}` : '',
      app: genieIds.length > 0 ? `cromegenie://scan/?landing_type=31&landing_target=${genieJoined}` : ''
    },
    bugs: {
      name: '벅스 (Bugs)',
      brandColor: '#f9423a',
      count: bugsIds.length,
      pc: bugsIds.length > 0 ? `https://music.bugs.co.kr/newPlayer?trackId=${bugsIds.join(',')}` : '',
      ios: bugsIds.length > 0 ? `bugs3://app/tracks/lists?title=%EC%A0%84%EC%B2%B4%EB%93%A3%EA%B8%B0&miniplay=y&track_ids=${bugsJoined}` : '',
      ipad: bugsIds.length > 0 ? `bugs3://app/tracks/lists?title=%EC%A0%84%EC%B2%B4%EB%93%A3%EA%B8%B0&miniplay=y&track_ids=${bugsJoined}` : '',
      android: bugsIds.length > 0 ? `bugs3://app/tracks/lists?title=%EC%A0%84%EC%B2%B4%EB%93%A3%EA%B8%B0&miniplay=y&track_ids=${bugsJoined}` : '',
      app: bugsIds.length > 0 ? `bugs3://app/tracks/lists?title=%EC%A0%84%EC%B2%B4%EB%93%A3%EA%B8%B0&miniplay=y&track_ids=${bugsJoined}` : ''
    },
    youtube: {
      name: '유튜브 (YouTube)',
      brandColor: '#ff0000',
      count: youtubeUrl ? 1 : 0,
      url: youtubeUrl,
      pc: youtubeUrl,
      ios: youtubeUrl,
      android: youtubeUrl
    },
    flo: {
      name: '플로 (FLO)',
      brandColor: '#3c3df5',
      count: floIds.length,
      pc: 'https://www.music-flo.com',
      ios: floIds.length > 0 ? `flomobile://play?trackId=${floIds.join(',')}` : '',
      android: floIds.length > 0 ? `flomobile://play?trackId=${floIds.join(',')}` : ''
    },
    vibe: {
      name: '바이브 (VIBE)',
      brandColor: '#ff1493',
      count: vibeIds.length,
      pc: 'https://vibe.naver.com',
      ios: vibeIds.length > 0 ? `vibe://listen?version=3&trackIds=${vibeIds.join(',')}` : '',
      android: vibeIds.length > 0 ? `vibe://listen?version=3&trackIds=${vibeIds.join(',')}` : ''
    }
  };
}

/**
 * Copy formatted text list to clipboard
 */
export function generateTextPlaylist(songs, totalDurationStr) {
  const lines = [
    `🌲 [포레스텔라 스밍리스트 - 총 ${songs.length}곡 (${totalDurationStr})]`,
    `----------------------------------------`
  ];

  songs.forEach((song, idx) => {
    const mins = Math.floor(song.duration / 60);
    const secs = String(song.duration % 60).padStart(2, '0');
    const titleMark = song.isTitle ? '⭐ ' : '';
    lines.push(`${String(idx + 1).padStart(2, '0')}. ${titleMark}${song.title} - ${song.artist} (${mins}:${secs})`);
  });

  lines.push(`----------------------------------------`);
  lines.push(`생성기: https://foretissimo.github.io/sming-maker/`);

  return lines.join('\n');
}
