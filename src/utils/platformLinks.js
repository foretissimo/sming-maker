/**
 * Platform URL generator for 1-click streaming
 */

export function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isIOS() {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isAndroid() {
  if (typeof window === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

/**
 * Generate platform-specific deep links & fallback links
 */
export function generatePlatformLinks(songs) {
  if (!songs || songs.length === 0) {
    return {
      melon: { android: '', ios: '', pc: '', web: '', count: 0 },
      genie: { app: '', web: '', count: 0 },
      bugs: { app: '', web: '', count: 0 },
      vibe: { app: '', web: '', count: 0 },
      flo: { app: '', web: '', count: 0 },
    };
  }

  // Extract platform-specific IDs
  const melonIds = songs.map(s => s.platformIds?.melon).filter(Boolean);
  const genieIds = songs.map(s => s.platformIds?.genie).filter(Boolean);
  const bugsIds = songs.map(s => s.platformIds?.bugs).filter(Boolean);
  const vibeIds = songs.map(s => s.platformIds?.vibe).filter(Boolean);
  const floIds = songs.map(s => s.platformIds?.flo).filter(Boolean);

  return {
    melon: {
      android: melonIds.length > 0 ? `melonapp://play?ctype=1&menuid=0&cid=${melonIds.join(',')}` : '',
      ios: melonIds.length > 0 ? `meloniphone://play/?ctype=1&menuid=0&cid=${melonIds.join(',')}` : '',
      pc: melonIds.length > 0 ? `melonplayer://play?menuid=0&cflag=1&cid=${melonIds.join(',')}` : '',
      web: melonIds.length > 0 ? `https://www.melon.com/mymusic/playlist/mymusicplaylistinsert_insert.htm` : '',
      ids: melonIds,
      count: melonIds.length
    },
    genie: {
      app: genieIds.length > 0 ? `cromegenie://scan/?landing_type=31&landing_target=${genieIds.join(';')}` : '',
      direct: genieIds.length > 0 ? `geniemusic://open?action=play_song&song_id=${genieIds.join(';')}` : '',
      web: genieIds.length > 0 ? `https://www.genie.co.kr/player/shareProcessV2?songids=${genieIds.join(';')}` : '',
      ids: genieIds,
      count: genieIds.length
    },
    bugs: {
      app: bugsIds.length > 0 ? `bugs3://app/tracks/lists?title=포레스텔라_스밍&miniplay=Y&track_ids=${bugsIds.join('|')}` : '',
      web: bugsIds.length > 0 ? `https://music.bugs.co.kr/play/tracks?track_ids=${bugsIds.join(',')}` : '',
      ids: bugsIds,
      count: bugsIds.length
    },
    vibe: {
      app: vibeIds.length > 0 ? `vibe://listen?version=3&trackIds=${vibeIds.join(',')}` : '',
      web: vibeIds.length > 0 ? `https://vibe.naver.com` : '',
      ids: vibeIds,
      count: vibeIds.length
    },
    flo: {
      app: floIds.length > 0 ? `flomobile://play?trackId=${floIds.join(',')}` : '',
      web: floIds.length > 0 ? `https://www.music-flo.com` : '',
      ids: floIds,
      count: floIds.length
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
