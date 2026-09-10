/**
 * Utility to fetch and synchronize ALL artist tracks across ALL pages from Melon, Genie, and Bugs.
 *
 * Robust Multi-Tier Matching Engine with Strict Artist & Instrumental Re-Verification:
 *   - Artist Re-Verification: Verifies that candidate tracks on Genie/Bugs actually belong to the target artist/group
 *   - Inst/Vocal Isolation: Prevents (Inst.) tracks from mistakenly linking to vocal tracks or vice versa
 *   - Album Disambiguation: Correctly separates duplicate song titles across different album releases (e.g. THE LEGACY vs Original)
 *
 * Data Source Priority:
 *   - Release Date (발매일): Melon 1st → Genie 2nd
 *   - Duration (곡 길이):    Genie 1st → Bugs 2nd
 *   - Uniqueness:            Platform Song ID (Melon ID) + Album disambiguation
 *
 * Sync Modes:
 *   - 'smart' (기본): 사용자가 직접 수정한 곡(userEdited: true)의 곡명, 재생시간, 발매일, 앨범 등 핵심 정보를 보호하고 건너뜀
 *   - 'overwrite' (전체 덮어쓰기): 사용자의 수정 여부와 무관하게 음원 사이트 최신 원본 데이터로 전체 갱신
 */

// Helper to get HTML content with fallback proxy support
async function fetchHtml(targetUrl, proxyPrefix) {
  const isBrowser = typeof window !== 'undefined';

  // 1. If in browser and dev proxy prefix provided, try local dev proxy first
  if (isBrowser && proxyPrefix) {
    try {
      const urlObj = new URL(targetUrl);
      const localProxyUrl = `${proxyPrefix}${urlObj.pathname}${urlObj.search}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(localProxyUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 200) return text;
      }
    } catch (e) {
      // Ignore and try CORS proxy
    }
  }

  // 2. In browser (or if local proxy failed), try CORS proxies with cache-buster
  if (isBrowser) {
    const cb = `_cb=${Date.now()}`;
    const targetWithCb = targetUrl.includes('?') ? `${targetUrl}&${cb}` : `${targetUrl}?${cb}`;

    const proxyUrls = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(targetWithCb)}`,
      `https://corsproxy.io/?${encodeURIComponent(targetWithCb)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetWithCb)}`
    ];

    for (const pUrl of proxyUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);
        const res = await fetch(pUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const text = await res.text();
          if (text && text.length > 200) {
            return text;
          }
        }
      } catch (e) {
        // Try next proxy
      }
    }
  }

  // 3. Direct fetch (fast in Node or unrestricted environments)
  const directRes = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  });
  if (!directRes.ok) throw new Error(`HTTP Error: ${directRes.status}`);
  return await directRes.text();
}

/**
 * Clean text strings from Melon/Genie/Bugs HTML
 */
export function cleanText(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]+>/g, '')
    .replace(/곡정보\s*-\s*페이지\s*이동/gi, '')
    .replace(/앨범정보\s*-\s*페이지\s*이동/gi, '')
    .replace(/아티스트정보\s*-\s*페이지\s*이동/gi, '')
    .replace(/-\s*페이지\s*이동/gi, '')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\u00a0/g, ' ')
    .replace(/^TITLE/i, '')
    .trim();
}

/**
 * Detect whether a track title is an Instrumental / MR / Backing track
 */
export function isInstrumental(title) {
  if (!title) return false;
  return /[\(\[\{]?(?:inst(?:rumental)?|mr|반주)[\)\]\}]?/i.test(title);
}

/**
 * Check whether two titles have matching Instrumental status
 */
export function isInstMatch(titleA, titleB) {
  return isInstrumental(titleA) === isInstrumental(titleB);
}

/**
 * Normalize strings for comparison
 * @param {string} str - input string
 * @param {boolean} stripInst - whether to strip inst tags for core title matching
 */
export function normalize(str, stripInst = false) {
  let s = cleanText(str).toLowerCase();
  if (stripInst) {
    s = s.replace(/[\(\[\{]?(?:inst(?:rumental)?|mr|반주)[\)\]\}]?/gi, '');
  }
  return s.replace(/[\(\)\[\]\-_,\.\s\x27\"&]/g, '');
}

/**
 * Normalize album name for comparison
 */
export function normalizeAlbum(str) {
  if (!str) return '';
  return cleanText(str)
    .toLowerCase()
    .replace(/[\(\)\[\]\-_,\.\s\x27\"&]/g, '')
    .trim();
}

/**
 * Compare album compatibility between target album and candidate album
 * Returns:
 * {
 *   isMatch: boolean,      // True if exact, sub-album, or either is unknown/generic
 *   isExact: boolean,      // True if exact normalized match
 *   isSub: boolean,        // True if one includes the other (e.g. Special Edition, Repackage, OST)
 *   isUnknown: boolean,    // True if either album is empty or generic default (e.g. '포레스텔라 앨범')
 *   isConflict: boolean    // True if BOTH have specific albums and they are DIFFERENT
 * }
 */
export function compareAlbums(targetAlbum, candAlbum, artistName = '') {
  const normA = normalizeAlbum(targetAlbum);
  const normB = normalizeAlbum(candAlbum);

  const genericA = artistName ? normalizeAlbum(`${artistName} 앨범`) : '';
  const genericB = artistName ? normalizeAlbum(`${artistName}앨범`) : '';

  const isUnknownA = !normA || normA === genericA || normA === genericB || normA === 'variousartists';
  const isUnknownB = !normB || normB === genericA || normB === genericB || normB === 'variousartists';

  if (isUnknownA || isUnknownB) {
    return {
      isMatch: true,
      isExact: false,
      isSub: false,
      isUnknown: true,
      isConflict: false
    };
  }

  if (normA === normB) {
    return {
      isMatch: true,
      isExact: true,
      isSub: false,
      isUnknown: false,
      isConflict: false
    };
  }

  // Check for distinct part numbers/discs/editions (e.g. part1 vs part2, episode1 vs episode2)
  const partA = normA.match(/part\d+|episode\d+|vol\d+|\d집|ep\d+/);
  const partB = normB.match(/part\d+|episode\d+|vol\d+|\d집|ep\d+/);
  if (partA && partB && partA[0] !== partB[0]) {
    return {
      isMatch: false,
      isExact: false,
      isSub: false,
      isUnknown: false,
      isConflict: true
    };
  }

  // Sub-album containment check (e.g. "The Forestella" in "The Forestella Special Edition")
  if (normA.includes(normB) || normB.includes(normA)) {
    return {
      isMatch: true,
      isExact: false,
      isSub: true,
      isUnknown: false,
      isConflict: false
    };
  }

  // Distinct albums (e.g. "신세계 : NEW AGE" vs "신세계 : PARANA", "바람" vs "신세계 : PARANA", "THE LEGACY" vs "Unfinished")
  return {
    isMatch: false,
    isExact: false,
    isSub: false,
    isUnknown: false,
    isConflict: true
  };
}

/**
 * Verify whether a platform track's artist matches the target artist / group
 */
export function isArtistMatch(artistObjOrType, platformArtist) {
  if (!platformArtist) return true; // If platform didn't list artist, allow with title check
  const artistType = typeof artistObjOrType === 'string' ? artistObjOrType : artistObjOrType?.id;
  const p = cleanText(platformArtist).toLowerCase().replace(/[\s\-_,\.\(\)]/g, '');

  const rules = {
    group: ['포레스텔라', 'forestella', '조민규', '배두훈', '강형호', '고우림', 'pitta'],
    jomingyu: ['조민규', '포레스텔라', 'forestella', 'variousartists', '팬텀싱어', '동네앨범'],
    baedoohun: ['배두훈', '포레스텔라', 'forestella', 'variousartists', '팬텀싱어', '동네앨범', '빨래', '렌트', '뮤지컬'],
    kanghyungho: ['강형호', 'pitta', '피타', '포레스텔라', 'forestella', 'variousartists', '팬텀싱어'],
    gowoorim: ['고우림', '포레스텔라', 'forestella', 'variousartists', '팬텀싱어', '동네앨범']
  };

  const allowed = rules[artistType] || [
    artistType, 
    artistObjOrType?.name?.toLowerCase().replace(/[\s\-_,\.\(\)]/g, '')
  ].filter(Boolean);

  return allowed.some(keyword => p.includes(keyword));
}

/**
 * Compute similarity match score (0-100) between a target song and a candidate platform track
 */
export function computeTrackMatchScore(targetSong, candidateTrack, artistObj) {
  // 1. Strict Artist Compatibility Check
  if (!isArtistMatch(artistObj, candidateTrack.artist)) {
    return -1; // REJECT: Different artist
  }

  // 2. Strict Instrumental Status Check
  if (!isInstMatch(targetSong.title, candidateTrack.title)) {
    return -1; // REJECT: One is Inst and the other is Vocal
  }

  const targetTitleNorm = normalize(targetSong.title, false);
  const candTitleNorm = normalize(candidateTrack.title, false);

  const artistName = typeof artistObj === 'string' ? '' : artistObj?.name || '';
  const albumCmp = compareAlbums(targetSong.album, candidateTrack.album, artistName);

  // 3. Strict Album Conflict Check:
  // If both songs have explicit album names and they CONFLICT (different albums),
  // REJECT immediately so that tracks with identical titles in different albums are NEVER linked to the wrong album!
  if (albumCmp.isConflict) {
    return -1; // REJECT: Album mismatch
  }

  // Exact Title Match
  if (targetTitleNorm === candTitleNorm) {
    if (albumCmp.isExact) {
      return 100; // Perfect Title + Exact Album Match
    }
    if (albumCmp.isSub) {
      return 92; // High-Confidence Title + Sub-Album Match
    }
    if (albumCmp.isUnknown) {
      return 80; // Exact Title Match (Album generic or unknown)
    }
    return 0;
  }

  // Core Title Match (ignoring OST sub-labels or special version tags)
  const targetCore = normalize(targetSong.title, true);
  const candCore = normalize(candidateTrack.title, true);

  if (targetCore && candCore && targetCore === candCore) {
    if (albumCmp.isExact) {
      return 78; // Core Title + Exact Album Match
    }
    if (albumCmp.isSub) {
      return 72; // Core Title + Sub-Album Match
    }
    if (albumCmp.isUnknown) {
      return 65; // Core Title + Unknown/generic album
    }
    return 0;
  }

  return 0; // No match
}

/**
 * Fetch Album Release Dates dictionary from Melon for an artist
 */
async function fetchMelonAlbumDates(melonArtistId) {
  if (!melonArtistId) return {};
  const albumMap = {};
  const maxPages = 5; // up to 250 albums

  for (let p = 0; p < maxPages; p++) {
    const startIndex = p * 50 + 1;
    const url = `https://www.melon.com/artist/albumPaging.htm?artistId=${melonArtistId}&act=artistAlbum&startIndex=${startIndex}&pageSize=50`;
    try {
      const html = await fetchHtml(url, '/proxy/melon');
      const liMatches = [...html.matchAll(/<li[^>]*class="album11_li"[\s\S]*?<\/li>/g)];
      if (liMatches.length === 0) break;

      liMatches.forEach(m => {
        const li = m[0];
        const albumId = li.match(/goAlbumDetail\(\x27(\d+)\x27\)/)?.[1];
        const dateMatch = li.match(/<span class="cnt_view">(\d{4}\.\d{2}\.\d{2})<\/span>/);
        if (albumId && dateMatch) {
          albumMap[albumId] = dateMatch[1].replace(/\./g, '-');
        }
      });

      if (liMatches.length < 50) break;
    } catch (err) {
      console.warn(`[Melon Album Sync] Error on page ${p}:`, err);
      break;
    }
  }

  return albumMap;
}

/**
 * Fetch ALL tracks from Melon for an artist across all pagination pages with exact release dates & artist name
 */
export async function fetchMelonTracks(melonArtistId) {
  if (!melonArtistId) return [];
  const tracks = [];
  let startIndex = 1;
  const pageSize = 50;
  const maxPages = 10; // fetch up to 500 songs

  // 1. Pre-fetch album release dates
  const albumMap = await fetchMelonAlbumDates(melonArtistId);

  // 2. Fetch all song pages
  for (let page = 0; page < maxPages; page++) {
    const url = `https://www.melon.com/artist/songPaging.htm?artistId=${melonArtistId}&act=artistSong&listType=A&orderBy=ISSUE_DATE&startIndex=${startIndex}&pageSize=${pageSize}`;
    try {
      const html = await fetchHtml(url, '/proxy/melon');
      const rows = html.split(/<\/tr>/i);
      let pageRowCount = 0;

      rows.forEach(tr => {
        const songId = tr.match(/goSongDetail\(\x27(\d+)\x27\)/)?.[1];
        const titleMatch = tr.match(/goSongDetail\(\x27\d+\x27\);"[^>]*title="([^"]+)"/);
        const artistMatch = tr.match(/goArtistDetail\(\x27\d+\x27\);"[^>]*title="([^"]+)"/);
        const albumId = tr.match(/goAlbumDetail\(\x27(\d+)\x27\)/)?.[1];
        const albumTitle = tr.match(/goAlbumDetail\(\x27\d+\x27\);"[^>]*title="([^"]+)"/);

        if (songId && titleMatch) {
          const title = cleanText(titleMatch[1]);
          const artist = artistMatch ? cleanText(artistMatch[1]) : '';
          const album = albumTitle ? cleanText(albumTitle[1]) : '';
          const releaseDate = albumMap[albumId] || '';

          if (title && !tracks.some(t => t.id === songId)) {
            tracks.push({
              platform: 'melon',
              id: songId,
              title,
              artist,
              album,
              albumId,
              releaseDate
            });
            pageRowCount++;
          }
        }
      });

      if (pageRowCount === 0 || pageRowCount < pageSize) break;
      startIndex += pageSize;
    } catch (err) {
      console.warn(`[Melon Sync] Error on startIndex ${startIndex}:`, err);
      break;
    }
  }

  return tracks;
}

/**
 * Fetch ALL tracks from Genie for an artist across all pagination pages with artist name
 */
export async function fetchGenieTracks(genieArtistId) {
  if (!genieArtistId) return [];
  const tracks = [];
  let page = 1;
  const maxPages = 15; // up to 450 songs

  for (let p = 1; p <= maxPages; p++) {
    const url = `https://www.genie.co.kr/detail/artistSong?xxnm=${genieArtistId}&pg=${page}`;
    try {
      const html = await fetchHtml(url, '/proxy/genie');
      const trMatches = [...html.matchAll(/<tr class="list"[\s\S]*?songid="(\d+)"[\s\S]*?<\/tr>/g)];

      if (trMatches.length === 0) break;

      trMatches.forEach(m => {
        const songId = m[1];
        const tr = m[0];
        const titleMatch = tr.match(/class="title ellipsis"[^>]*>([\s\S]*?)<\/a>/);
        const artistMatch = tr.match(/class="artist ellipsis"[^>]*>([\s\S]*?)<\/a>/);
        const albumMatch = tr.match(/class="albumtitle ellipsis"[^>]*>([\s\S]*?)<\/a>/);

        const title = titleMatch ? cleanText(titleMatch[1]) : '';
        const artist = artistMatch ? cleanText(artistMatch[1]) : '';
        const album = albumMatch ? cleanText(albumMatch[1]) : '';
        const isTitle = tr.includes('icon-title') || tr.includes('TITLE');

        if (songId && title && !tracks.some(t => t.id === songId)) {
          tracks.push({
            platform: 'genie',
            id: songId,
            title,
            artist,
            album,
            isTitle
          });
        }
      });

      if (trMatches.length < 30) break;
      page++;
    } catch (err) {
      console.warn(`[Genie Sync] Error on page ${page}:`, err);
      break;
    }
  }

  return tracks;
}

/**
 * Fetch song duration (seconds) from Genie song detail page
 */
async function fetchGenieSongDuration(genieSongId) {
  try {
    const url = `https://www.genie.co.kr/detail/songInfo?xgnm=${genieSongId}`;
    const html = await fetchHtml(url, '/proxy/genie');
    const match = html.match(/alt="재생시간"[^>]*>\s*<\/span>\s*<span class="value">(\d{1,2}:\d{2})<\/span>/);
    if (match) {
      const [m, s] = match[1].split(':').map(Number);
      return m * 60 + s;
    }
  } catch (err) {
    // silent fail for individual song lookup
  }
  return null;
}

/**
 * Batch-fetch durations from Genie in parallel batches of BATCH_SIZE
 */
async function batchFetchGenieDurations(genieSongIds, batchSize = 5) {
  const durationMap = {};
  for (let i = 0; i < genieSongIds.length; i += batchSize) {
    const batch = genieSongIds.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(id => fetchGenieSongDuration(id).then(dur => ({ id, dur })))
    );
    results.forEach(({ id, dur }) => {
      if (dur !== null) durationMap[id] = dur;
    });
  }
  return durationMap;
}

/**
 * Fetch ALL tracks from Bugs for an artist across all pagination pages with artist name
 */
export async function fetchBugsTracks(bugsArtistId) {
  if (!bugsArtistId) return [];
  const tracks = [];
  let page = 1;
  const maxPages = 10; // up to 500 songs

  for (let p = 1; p <= maxPages; p++) {
    const url = `https://music.bugs.co.kr/artist/${bugsArtistId}/tracks?type=TRACK&sort=P&size=50&page=${page}`;
    try {
      const html = await fetchHtml(url, '/proxy/bugs');
      const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
      let pageTrackCount = 0;

      rows.forEach(r => {
        const tr = r[1];
        const trackIdMatch = tr.match(/track\/(\d+)/) || tr.match(/openTrackInfoMenu\([^\)]*?(\d+)/) || tr.match(/trackId="(\d+)"/);
        const titleMatch = tr.match(/<p class="title"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/);
        const artistMatch = tr.match(/<p class="artist"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/);
        const albumMatch = tr.match(/<a class="album"[^>]*title="([^"]+)"/) || tr.match(/<a class="album"[^>]*>([^<]+)<\/a>/);

        if (trackIdMatch && titleMatch) {
          const trackId = trackIdMatch[1];
          const rawTitle = cleanText(titleMatch[1]);
          const artist = artistMatch ? cleanText(artistMatch[1]) : '';
          const album = albumMatch ? cleanText(albumMatch[1]) : '';

          if (trackId && rawTitle && !tracks.some(t => t.id === trackId)) {
            tracks.push({
              platform: 'bugs',
              id: trackId,
              title: rawTitle,
              artist,
              album
            });
            pageTrackCount++;
          }
        }
      });

      if (pageTrackCount === 0 || pageTrackCount < 50) break;
      page++;
    } catch (err) {
      console.warn(`[Bugs Sync] Error on page ${page}:`, err);
      break;
    }
  }

  return tracks;
}

/**
 * Synchronize all tracks for a single artist with Strict Artist & Instrumental Re-Verification
 *
 * @param {Object} artist - The artist object
 * @param {Array} currentSongs - Current song list
 * @param {Function} progressCallback - Callback for progress messages
 * @param {Object} options - Sync options: { mode: 'smart' | 'overwrite' }
 */
export async function syncArtistTracks(artist, currentSongs, progressCallback, options = { mode: 'smart' }) {
  const isSmart = options?.mode !== 'overwrite';
  const melonId = artist.platformArtistIds?.melon;
  const genieId = artist.platformArtistIds?.genie;
  const bugsId = artist.platformArtistIds?.bugs;

  if (progressCallback) {
    progressCallback(`[${artist.name}] 멜론/지니/벅스 아티스트 검증 및 전체 곡 목록 조회 중... (${isSmart ? '수정 보호' : '전체 갱신'})`);
  }

  const [melonTracks, genieTracks, bugsTracks] = await Promise.all([
    fetchMelonTracks(melonId),
    fetchGenieTracks(genieId),
    fetchBugsTracks(bugsId)
  ]);

  let updatedCount = 0;
  let addedCount = 0;
  let protectedCount = 0;
  let artistVerifiedCount = 0;
  const updatedSongs = [...currentSongs];

  // 1. Process Melon Tracks (Each unique Melon track ID is a distinct song)
  melonTracks.forEach(mt => {
    // Artist Validation Check
    if (!isArtistMatch(artist, mt.artist)) {
      return; // Skip tracks not belonging to this artist
    }

    const normTitle = normalize(mt.title, false);
    const normAlbum = normalize(mt.album, false);

    // Exact Melon ID match first
    let existing = updatedSongs.find(
      s => s.artistType === artist.id && s.platformIds?.melon === mt.id
    );

    // If not matched by Melon ID, check for a song without Melon ID that matches Title AND Album
    if (!existing) {
      existing = updatedSongs.find(s => {
        if (s.artistType !== artist.id) return false;
        if (s.platformIds?.melon) return false;
        if (!isInstMatch(s.title, mt.title)) return false;
        if (normalize(s.title, false) !== normTitle) return false;
        const albumCmp = compareAlbums(s.album, mt.album, artist.name);
        return albumCmp.isMatch;
      });
    }

    if (existing) {
      if (isSmart && existing.userEdited) {
        protectedCount++;
        if (!existing.platformIds) existing.platformIds = {};
        if (!existing.platformIds.melon) existing.platformIds.melon = mt.id;
        return;
      }

      if (!isSmart) {
        existing.userEdited = false;
      }

      if (!existing.platformIds) existing.platformIds = {};
      if (existing.platformIds.melon !== mt.id) {
        existing.platformIds.melon = mt.id;
        updatedCount++;
      }
      if (mt.releaseDate && existing.releaseDate !== mt.releaseDate) {
        existing.releaseDate = mt.releaseDate;
        updatedCount++;
      }
      if (mt.album && (!existing.album || existing.album === `${artist.name} 앨범` || !isSmart)) {
        existing.album = mt.album;
      }
    } else {
      // Newly discovered track -> ADD AS DISTINCT SONG
      const newSong = {
        id: `auto-${artist.id}-${mt.id}`,
        title: mt.title,
        artist: artist.name,
        artistType: artist.id,
        album: mt.album || `${artist.name} 앨범`,
        releaseDate: mt.releaseDate || '',
        duration: 0,
        isTitle: false,
        userEdited: false,
        platformIds: {
          melon: mt.id,
          genie: '',
          bugs: ''
        },
        tags: ['auto-synced']
      };
      updatedSongs.push(newSong);
      addedCount++;
    }
  });

  // 2. Link Genie Tracks with Multi-Tier Scoring & Artist Verification
  const artistSongs = updatedSongs.filter(s => s.artistType === artist.id);

  // Track already linked Genie IDs to avoid accidental duplicates
  const usedGenieIds = new Set();
  artistSongs.forEach(s => {
    if (s.platformIds?.genie) usedGenieIds.add(s.platformIds.genie);
  });

  artistSongs.forEach(song => {
    // If smart mode & already has a valid Genie ID & user edited, keep it
    if (isSmart && song.userEdited && song.platformIds?.genie) return;

    let bestScore = -1;
    let bestGenieTrack = null;

    genieTracks.forEach(gt => {
      // Avoid stealing if already matched
      if (usedGenieIds.has(gt.id) && song.platformIds?.genie !== gt.id) return;

      const score = computeTrackMatchScore(song, gt, artist);
      if (score > bestScore && score >= 60) {
        bestScore = score;
        bestGenieTrack = gt;
      }
    });

    if (bestGenieTrack) {
      if (!song.platformIds) song.platformIds = {};
      if (song.platformIds.genie !== bestGenieTrack.id) {
        song.platformIds.genie = bestGenieTrack.id;
        usedGenieIds.add(bestGenieTrack.id);
        updatedCount++;
      }
      if (bestGenieTrack.isTitle && !song.isTitle && (!isSmart || !song.userEdited)) {
        song.isTitle = true;
        if (!song.tags) song.tags = [];
        if (!song.tags.includes('title')) song.tags.push('title');
        updatedCount++;
      }
      artistVerifiedCount++;
    } else if (song.platformIds?.genie) {
      // If current linked Genie track has a conflicting album or artist, unlink it
      const existingMatch = genieTracks.find(gt => gt.id === song.platformIds.genie);
      if (existingMatch) {
        const albumCmp = compareAlbums(song.album, existingMatch.album, artist.name);
        if (!isArtistMatch(artist, existingMatch.artist) || albumCmp.isConflict) {
          if (!isSmart || !song.userEdited) {
            song.platformIds.genie = '';
            updatedCount++;
          }
        }
      }
    }
  });

  // 3. Link Bugs Tracks with Multi-Tier Scoring & Artist Verification
  const usedBugsIds = new Set();
  artistSongs.forEach(s => {
    if (s.platformIds?.bugs) usedBugsIds.add(s.platformIds.bugs);
  });

  artistSongs.forEach(song => {
    if (isSmart && song.userEdited && song.platformIds?.bugs) return;

    let bestScore = -1;
    let bestBugsTrack = null;

    bugsTracks.forEach(bt => {
      if (usedBugsIds.has(bt.id) && song.platformIds?.bugs !== bt.id) return;

      const score = computeTrackMatchScore(song, bt, artist);
      if (score > bestScore && score >= 60) {
        bestScore = score;
        bestBugsTrack = bt;
      }
    });

    if (bestBugsTrack) {
      if (!song.platformIds) song.platformIds = {};
      if (song.platformIds.bugs !== bestBugsTrack.id) {
        song.platformIds.bugs = bestBugsTrack.id;
        usedBugsIds.add(bestBugsTrack.id);
        updatedCount++;
      }
    } else if (song.platformIds?.bugs) {
      // If current linked Bugs track has a conflicting album or artist, unlink it
      const existingMatch = bugsTracks.find(bt => bt.id === song.platformIds.bugs);
      if (existingMatch) {
        const albumCmp = compareAlbums(song.album, existingMatch.album, artist.name);
        if (!isArtistMatch(artist, existingMatch.artist) || albumCmp.isConflict) {
          if (!isSmart || !song.userEdited) {
            song.platformIds.bugs = '';
            updatedCount++;
          }
        }
      }
    }
  });

  // 4. Batch-fetch durations from Genie
  const songsNeedingDuration = updatedSongs.filter(s => {
    if (s.artistType !== artist.id || !s.platformIds?.genie) return false;
    if (isSmart && s.userEdited) return false;
    if (!isSmart) return true;
    return !s.duration || s.duration === 0 || s.duration === 225;
  });

  if (songsNeedingDuration.length > 0) {
    if (progressCallback) {
      progressCallback(`[${artist.name}] 지니에서 ${songsNeedingDuration.length}곡 재생시간 조회 중...`);
    }

    const genieIds = songsNeedingDuration.map(s => s.platformIds.genie);
    const durationMap = await batchFetchGenieDurations(genieIds, 5);

    songsNeedingDuration.forEach(s => {
      const dur = durationMap[s.platformIds.genie];
      if (dur && dur > 0) {
        s.duration = dur;
        updatedCount++;
      }
    });
  }

  // 5. Fallback duration default (3:45)
  updatedSongs.forEach(s => {
    if (s.artistType === artist.id && (!s.duration || s.duration === 0)) {
      s.duration = 225;
    }
  });

  return {
    updatedSongs,
    stats: {
      artistName: artist.name,
      mode: isSmart ? 'smart' : 'overwrite',
      melonTracksCount: melonTracks.length,
      genieTracksCount: genieTracks.length,
      bugsTracksCount: bugsTracks.length,
      durationsFetched: Object.keys(
        songsNeedingDuration.reduce((acc, s) => {
          if (s.duration && s.duration !== 225) acc[s.platformIds?.genie] = true;
          return acc;
        }, {})
      ).length,
      protectedCount,
      updatedCount,
      addedCount
    }
  };
}
