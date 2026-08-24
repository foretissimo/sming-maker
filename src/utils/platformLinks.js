/**
 * Platform URL generator for 1-click streaming across PC & Mobile.
 *
 * Supported Platform URLs:
 * - Bugs PC/Web:  https://music.bugs.co.kr/newPlayer?trackId={id1},{id2},...
 * - Genie PC/Web: https://www.genie.co.kr/player/shareProcessV2?xgnm={id1};{id2};...
 * - Melon PC/App: melonapp://play?cType=1&cList={id1},{id2},...
 *   (Plus sequential chunking for playlists containing duplicate tracks)
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
 * Split playlist into non-duplicate sequential parts for Melon
 * Melon player de-duplicates songs within a single cList parameter.
 * By segmenting into parts without duplicates, users can click Part 1 -> Part 2 -> Part 3
 * and have all duplicate tracks added with correct counts and sequence.
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
      // Encountered duplicate in current part -> finish current part and start next
      if (currentPart.length > 0) {
        const ids = currentPart.map(s => s.platformIds.melon);
        parts.push({
          partIndex: parts.length + 1,
          songs: [...currentPart],
          ids,
          count: ids.length,
          url: `melonapp://play?cType=1&cList=${ids.join(',')}`
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
    parts.push({
      partIndex: parts.length + 1,
      songs: [...currentPart],
      ids,
      count: ids.length,
      url: `melonapp://play?cType=1&cList=${ids.join(',')}`
    });
  }

  return parts;
}

/**
 * Generate platform-specific deep links & fallback links
 */
export function generatePlatformLinks(songs) {
  if (!songs || songs.length === 0) {
    return {
      melon: { full: '', parts: [], count: 0, ids: [] },
      genie: { pc: '', app: '', count: 0, ids: [] },
      bugs: { pc: '', app: '', count: 0, ids: [] },
      vibe: { app: '', web: '', count: 0, ids: [] },
      flo: { app: '', web: '', count: 0, ids: [] }
    };
  }

  // Extract platform-specific IDs in playlist order
  const melonIds = songs.map(s => s.platformIds?.melon).filter(Boolean);
  const genieIds = songs.map(s => s.platformIds?.genie).filter(Boolean);
  const bugsIds = songs.map(s => s.platformIds?.bugs).filter(Boolean);
  const vibeIds = songs.map(s => s.platformIds?.vibe).filter(Boolean);
  const floIds = songs.map(s => s.platformIds?.flo).filter(Boolean);

  const melonParts = splitMelonPlaylistIntoParts(songs);

  return {
    melon: {
      // Direct Melon App / PC Player URI scheme
      full: melonIds.length > 0 ? `melonapp://play?cType=1&cList=${melonIds.join(',')}` : '',
      parts: melonParts,
      hasDuplicates: melonParts.length > 1,
      ids: melonIds,
      count: melonIds.length
    },
    genie: {
      // Official Genie PC/Web Player Share URL with xgnm
      pc: genieIds.length > 0 ? `https://www.genie.co.kr/player/shareProcessV2?xgnm=${genieIds.join(';')}` : '',
      app: genieIds.length > 0 ? `cromegenie://scan/?landing_type=31&landing_target=${genieIds.join(';')}` : '',
      ids: genieIds,
      count: genieIds.length
    },
    bugs: {
      // Official Bugs PC/Web Player URL with trackId
      pc: bugsIds.length > 0 ? `https://music.bugs.co.kr/newPlayer?trackId=${bugsIds.join(',')}` : '',
      app: bugsIds.length > 0 ? `bugs3://app/tracks/lists?title=포레스텔라_스밍&miniplay=Y&track_ids=${bugsIds.join('|')}` : '',
      ids: bugsIds,
      count: bugsIds.length
    },
    vibe: {
      app: vibeIds.length > 0 ? `vibe://listen?version=3&trackIds=${vibeIds.join(',')}` : '',
      web: `https://vibe.naver.com`,
      ids: vibeIds,
      count: vibeIds.length
    },
    flo: {
      app: floIds.length > 0 ? `flomobile://play?trackId=${floIds.join(',')}` : '',
      web: `https://www.music-flo.com`,
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
