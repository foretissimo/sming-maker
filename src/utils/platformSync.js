/**
 * Utility to fetch and synchronize ALL artist tracks across ALL pages from Melon, Genie, and Bugs.
 *
 * Data Source Priority:
 *   - Release Date (발매일): Melon 1st → Genie 2nd
 *   - Duration (곡 길이):    Genie 1st → Bugs 2nd
 *   - Song ID 매칭:          normalized title fuzzy match
 */

// Helper to get HTML content with fallback proxy support
async function fetchHtml(targetUrl, proxyPrefix) {
  // 1. Try local dev proxy if available
  try {
    const urlObj = new URL(targetUrl);
    const localProxyUrl = `${proxyPrefix}${urlObj.pathname}${urlObj.search}`;
    const res = await fetch(localProxyUrl);
    if (res.ok) {
      return await res.text();
    }
  } catch (e) {
    // Ignore and try fallback
  }

  // 2. Try AllOrigins CORS Proxy
  try {
    const corsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(corsUrl);
    if (res.ok) {
      return await res.text();
    }
  } catch (e) {
    // Ignore and try direct
  }

  // 3. Try direct fetch
  const directRes = await fetch(targetUrl);
  if (!directRes.ok) throw new Error(`HTTP Error: ${directRes.status}`);
  return await directRes.text();
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
 * Fetch ALL tracks from Melon for an artist across all pagination pages with exact release dates
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
        const albumId = tr.match(/goAlbumDetail\(\x27(\d+)\x27\)/)?.[1];
        const albumTitle = tr.match(/goAlbumDetail\(\x27\d+\x27\);"[^>]*title="([^"]+)"/);

        if (songId && titleMatch) {
          const title = titleMatch[1]
            .replace(/곡정보\s*-\s*페이지\s*이동/i, '')
            .replace(/&#x27;/g, "'")
            .replace(/&amp;/g, '&')
            .replace(/\u00a0/g, ' ')
            .trim();
          const album = albumTitle
            ? albumTitle[1]
                .replace(/앨범정보\s*-\s*페이지\s*이동/i, '')
                .replace(/&#x27;/g, "'")
                .replace(/&amp;/g, '&')
                .replace(/\u00a0/g, ' ')
                .trim()
            : '';

          const releaseDate = albumMap[albumId] || '';

          if (title && !tracks.some(t => t.id === songId)) {
            tracks.push({
              platform: 'melon',
              id: songId,
              title,
              album,
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
 * Fetch ALL tracks from Genie for an artist across all pagination pages
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
        const albumMatch = tr.match(/class="albumtitle ellipsis"[^>]*>([\s\S]*?)<\/a>/);

        let title = titleMatch
          ? titleMatch[1].replace(/<[^>]+>/g, '').replace(/^TITLE/i, '').trim()
          : '';
        let album = albumMatch
          ? albumMatch[1].replace(/<[^>]+>/g, '').trim()
          : '';

        if (songId && title && !tracks.some(t => t.id === songId)) {
          tracks.push({
            platform: 'genie',
            id: songId,
            title,
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
 * Pattern: alt="재생시간" ... <span class="value">05:35</span>
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
 * Returns a Map<genieSongId, durationSeconds>
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
 * Fetch ALL tracks from Bugs for an artist across all pagination pages
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
        const trackIdMatch = tr.match(/track\/(\d+)/) || tr.match(/openTrackInfoMenu\([^\)]*?(\d+)/);
        const titleMatch = tr.match(/<p class="title"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/);
        const albumMatch = tr.match(/<a class="album"[^>]*>([^<]+)<\/a>/);

        if (trackIdMatch && titleMatch) {
          const trackId = trackIdMatch[1];
          const rawTitle = titleMatch[1].replace(/&#x27;/g, "'").replace(/&amp;/g, '&').trim();
          const album = albumMatch ? albumMatch[1].replace(/&#x27;/g, "'").trim() : '';

          if (trackId && rawTitle && !tracks.some(t => t.id === trackId)) {
            tracks.push({
              platform: 'bugs',
              id: trackId,
              title: rawTitle,
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

// Normalize song titles for fuzzy comparison
function normalizeTitle(t) {
  return (t || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[\(\)\[\]\-_,\.]/g, '')
    .replace(/inst\.?/g, '')
    .replace(/instrumental/g, '');
}

/**
 * Synchronize all tracks for a single artist
 *
 * Data Source Priority:
 *   - Release Date: Melon (albumPaging → songPaging cross-map) → empty ''
 *   - Duration:     Genie (songInfo detail page, batch fetch) → existing → default 225s
 *   - Song IDs:     Melon, Genie, Bugs (normalized title matching)
 */
export async function syncArtistTracks(artist, currentSongs, progressCallback) {
  const melonId = artist.platformArtistIds?.melon;
  const genieId = artist.platformArtistIds?.genie;
  const bugsId = artist.platformArtistIds?.bugs;

  if (progressCallback) progressCallback(`[${artist.name}] 멜론/지니/벅스 곡 목록 조회 중...`);

  const [melonTracks, genieTracks, bugsTracks] = await Promise.all([
    fetchMelonTracks(melonId),
    fetchGenieTracks(genieId),
    fetchBugsTracks(bugsId)
  ]);

  let updatedCount = 0;
  let addedCount = 0;
  const updatedSongs = [...currentSongs];

  // 1. Update or Add Melon tracks (Melon Release Date is 1st Priority)
  melonTracks.forEach(mt => {
    const norm = normalizeTitle(mt.title);
    const existing = updatedSongs.find(
      s => s.artistType === artist.id && (normalizeTitle(s.title) === norm || s.title.includes(mt.title) || mt.title.includes(s.title))
    );

    if (existing) {
      if (!existing.platformIds) existing.platformIds = {};
      if (existing.platformIds.melon !== mt.id) {
        existing.platformIds.melon = mt.id;
        updatedCount++;
      }
      // Update release date from Melon
      if (mt.releaseDate && existing.releaseDate !== mt.releaseDate) {
        existing.releaseDate = mt.releaseDate;
        updatedCount++;
      }
      // Update album title from Melon if missing
      if (mt.album && (!existing.album || existing.album === `${artist.name} 앨범`)) {
        existing.album = mt.album;
      }
    } else {
      // Add newly discovered track from Melon
      const newSong = {
        id: `auto-${artist.id}-${mt.id}`,
        title: mt.title,
        artist: artist.name,
        artistType: artist.id,
        album: mt.album || `${artist.name} 앨범`,
        releaseDate: mt.releaseDate || '',
        duration: 0, // will be filled by Genie duration fetch
        isTitle: false,
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

  // 2. Link Genie tracks (match by title)
  genieTracks.forEach(gt => {
    const norm = normalizeTitle(gt.title);
    const existing = updatedSongs.find(
      s => s.artistType === artist.id && (normalizeTitle(s.title) === norm || s.title.includes(gt.title) || gt.title.includes(s.title))
    );
    if (existing) {
      if (!existing.platformIds) existing.platformIds = {};
      if (existing.platformIds.genie !== gt.id) {
        existing.platformIds.genie = gt.id;
        updatedCount++;
      }
    }
  });

  // 3. Link Bugs tracks (match by title)
  bugsTracks.forEach(bt => {
    const norm = normalizeTitle(bt.title);
    const existing = updatedSongs.find(
      s => s.artistType === artist.id && (normalizeTitle(s.title) === norm || s.title.includes(bt.title) || bt.title.includes(s.title))
    );
    if (existing) {
      if (!existing.platformIds) existing.platformIds = {};
      if (existing.platformIds.bugs !== bt.id) {
        existing.platformIds.bugs = bt.id;
        updatedCount++;
      }
    }
  });

  // 4. Batch-fetch durations from Genie for songs that need it
  //    Target: songs belonging to this artist that have a genie songId AND
  //            either have no duration, default duration (225), or duration=0
  const songsNeedingDuration = updatedSongs.filter(
    s => s.artistType === artist.id &&
         s.platformIds?.genie &&
         (!s.duration || s.duration === 0 || s.duration === 225)
  );

  if (songsNeedingDuration.length > 0) {
    if (progressCallback) progressCallback(`[${artist.name}] 지니에서 ${songsNeedingDuration.length}곡 재생시간 조회 중...`);

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

  // 5. For any remaining songs with duration=0 that still have no duration, set a sensible default
  updatedSongs.forEach(s => {
    if (s.artistType === artist.id && (!s.duration || s.duration === 0)) {
      s.duration = 225; // fallback default: 3:45
    }
  });

  return {
    updatedSongs,
    stats: {
      artistName: artist.name,
      melonTracksCount: melonTracks.length,
      genieTracksCount: genieTracks.length,
      bugsTracksCount: bugsTracks.length,
      durationsFetched: Object.keys(
        songsNeedingDuration.reduce((acc, s) => {
          if (s.duration && s.duration !== 225) acc[s.platformIds?.genie] = true;
          return acc;
        }, {})
      ).length,
      updatedCount,
      addedCount
    }
  };
}
