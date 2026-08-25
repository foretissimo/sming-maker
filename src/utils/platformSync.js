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
      const res = await fetch(localProxyUrl);
      if (res.ok) {
        return await res.text();
      }
    } catch (e) {
      // Ignore and try CORS proxy
    }

    // 2. Try AllOrigins CORS Proxy in browser
    try {
      const corsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(corsUrl);
      if (res.ok) {
        return await res.text();
      }
    } catch (e) {
      // Ignore and try direct
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

  const targetAlbumNorm = normalize(targetSong.album || '');
  const candAlbumNorm = normalize(candidateTrack.album || '');

  // Exact Title Match
  if (targetTitleNorm === candTitleNorm) {
    if (targetAlbumNorm && candAlbumNorm && targetAlbumNorm === candAlbumNorm) {
      return 100; // Perfect Title + Album Match
    }
    if (targetAlbumNorm && candAlbumNorm && (targetAlbumNorm.includes(candAlbumNorm) || candAlbumNorm.includes(targetAlbumNorm))) {
      return 92; // High-Confidence Title + Sub-Album Match
    }
    return 80; // Exact Title Match (Album differing or unknown)
  }

  // Core Title Match (ignoring OST sub-labels or special version tags)
  const targetCore = normalize(targetSong.title, true);
  const candCore = normalize(candidateTrack.title, true);

  if (targetCore && candCore && targetCore === candCore) {
    if (targetAlbumNorm && candAlbumNorm && targetAlbumNorm === candAlbumNorm) {
      return 78;
    }
    return 65;
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

        if (songId && title && !tracks.some(t => t.id === songId)) {
          tracks.push({
            platform: 'genie',
            id: songId,
            title,
            artist,
            album
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
      existing = updatedSongs.find(
        s => s.artistType === artist.id &&
             !s.platformIds?.melon &&
             isInstMatch(s.title, mt.title) &&
             normalize(s.title, false) === normTitle &&
             (normalize(s.album || '', false) === normAlbum || !s.album || s.album === `${artist.name} 앨범`)
      );
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
      artistVerifiedCount++;
    } else if (!isSmart && song.platformIds?.genie) {
      // In overwrite mode, if no valid artist-verified track found on Genie, clear wrong link
      const existingMatch = genieTracks.find(gt => gt.id === song.platformIds.genie);
      if (existingMatch && !isArtistMatch(artist, existingMatch.artist)) {
        song.platformIds.genie = '';
        updatedCount++;
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
    } else if (!isSmart && song.platformIds?.bugs) {
      const existingMatch = bugsTracks.find(bt => bt.id === song.platformIds.bugs);
      if (existingMatch && !isArtistMatch(artist, existingMatch.artist)) {
        song.platformIds.bugs = '';
        updatedCount++;
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
