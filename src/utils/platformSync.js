/**
 * Utility to fetch and synchronize artist tracks from Melon, Genie, and Bugs.
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
 * Fetch tracks from Melon for an artist
 */
export async function fetchMelonTracks(melonArtistId) {
  if (!melonArtistId) return [];
  const url = `https://www.melon.com/artist/songPaging.htm?artistId=${melonArtistId}&act=artistSong&startIndex=1&pageSize=50`;
  try {
    const html = await fetchHtml(url, '/proxy/melon');
    const tracks = [];
    
    // Match goSongDetail and title
    const matches = [...html.matchAll(/href="javascript:melon\.link\.goSongDetail\(\x27(\d+)\x27\);"[^>]*title="([^"]+)"/g)];
    const albumMatches = [...html.matchAll(/href="javascript:melon\.link\.goAlbumDetail\([^\)]*\)"[^>]*title="([^"]+)"/g)];
    
    matches.forEach((m, idx) => {
      const id = m[1];
      let title = m[2].replace(/곡정보\s*-\s*페이지\s*이동/i, '').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/\u00a0/g, ' ').trim();
      const album = albumMatches[idx] ? albumMatches[idx][1].replace(/앨범정보\s*-\s*페이지\s*이동/i, '').replace(/&#x27;/g, "'").trim() : '';
      
      if (title && id) {
        tracks.push({
          platform: 'melon',
          id,
          title,
          album
        });
      }
    });

    return tracks;
  } catch (err) {
    console.warn(`[Melon Sync] Failed to fetch artist ${melonArtistId}:`, err);
    return [];
  }
}

/**
 * Fetch tracks from Genie for an artist
 */
export async function fetchGenieTracks(genieArtistId) {
  if (!genieArtistId) return [];
  const url = `https://www.genie.co.kr/detail/artistSong?xxnm=${genieArtistId}&pg=1`;
  try {
    const html = await fetchHtml(url, '/proxy/genie');
    const tracks = [];
    
    const trMatches = [...html.matchAll(/<tr class="list"[\s\S]*?songid="(\d+)"[\s\S]*?<\/tr>/g)];
    trMatches.forEach(m => {
      const songId = m[1];
      const tr = m[0];
      const titleMatch = tr.match(/class="title ellipsis"[^>]*>([\s\S]*?)<\/a>/);
      const albumMatch = tr.match(/class="albumtitle ellipsis"[^>]*>([\s\S]*?)<\/a>/);
      
      let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').replace(/^TITLE/i, '').trim() : '';
      let album = albumMatch ? albumMatch[1].replace(/<[^>]+>/g, '').trim() : '';
      
      if (songId && title) {
        tracks.push({
          platform: 'genie',
          id: songId,
          title,
          album
        });
      }
    });

    return tracks;
  } catch (err) {
    console.warn(`[Genie Sync] Failed to fetch artist ${genieArtistId}:`, err);
    return [];
  }
}

/**
 * Fetch tracks from Bugs for an artist
 */
export async function fetchBugsTracks(bugsArtistId) {
  if (!bugsArtistId) return [];
  const url = `https://music.bugs.co.kr/artist/${bugsArtistId}/tracks?type=TRACK&sort=P`;
  try {
    const html = await fetchHtml(url, '/proxy/bugs');
    const tracks = [];
    
    const trackMatches = [...html.matchAll(/href="https:\/\/music\.bugs\.co\.kr\/track\/(\d+)"[^>]*title="([^"]+)"/g)];
    trackMatches.forEach(m => {
      const trackId = m[1];
      const rawTitle = m[2].replace(/&#x27;/g, "'").replace(/&amp;/g, '&').trim();
      if (trackId && rawTitle) {
        tracks.push({
          platform: 'bugs',
          id: trackId,
          title: rawTitle,
          album: ''
        });
      }
    });

    return tracks;
  } catch (err) {
    console.warn(`[Bugs Sync] Failed to fetch artist ${bugsArtistId}:`, err);
    return [];
  }
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
 * Synchronize tracks for a single artist
 */
export async function syncArtistTracks(artist, currentSongs) {
  const melonId = artist.platformArtistIds?.melon;
  const genieId = artist.platformArtistIds?.genie;
  const bugsId = artist.platformArtistIds?.bugs;

  const [melonTracks, genieTracks, bugsTracks] = await Promise.all([
    fetchMelonTracks(melonId),
    fetchGenieTracks(genieId),
    fetchBugsTracks(bugsId)
  ]);

  let updatedCount = 0;
  let addedCount = 0;
  const updatedSongs = [...currentSongs];

  // 1. Update existing songs matching this artist
  melonTracks.forEach(mt => {
    const norm = normalizeTitle(mt.title);
    const existing = updatedSongs.find(s => s.artistType === artist.id && (normalizeTitle(s.title) === norm || s.title.includes(mt.title) || mt.title.includes(s.title)));
    if (existing) {
      if (!existing.platformIds) existing.platformIds = {};
      if (existing.platformIds.melon !== mt.id) {
        existing.platformIds.melon = mt.id;
        updatedCount++;
      }
    } else {
      // Add new track
      const newSong = {
        id: `auto-${artist.id}-${mt.id}`,
        title: mt.title,
        artist: artist.name,
        artistType: artist.id,
        album: mt.album || `${artist.name} 싱글/앨범`,
        releaseDate: new Date().toISOString().split('T')[0],
        duration: 225, // default 3:45
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

  // 2. Link Genie tracks
  genieTracks.forEach(gt => {
    const norm = normalizeTitle(gt.title);
    const existing = updatedSongs.find(s => s.artistType === artist.id && (normalizeTitle(s.title) === norm || s.title.includes(gt.title) || gt.title.includes(s.title)));
    if (existing) {
      if (!existing.platformIds) existing.platformIds = {};
      if (existing.platformIds.genie !== gt.id) {
        existing.platformIds.genie = gt.id;
        updatedCount++;
      }
    }
  });

  // 3. Link Bugs tracks
  bugsTracks.forEach(bt => {
    const norm = normalizeTitle(bt.title);
    const existing = updatedSongs.find(s => s.artistType === artist.id && (normalizeTitle(s.title) === norm || s.title.includes(bt.title) || bt.title.includes(s.title)));
    if (existing) {
      if (!existing.platformIds) existing.platformIds = {};
      if (existing.platformIds.bugs !== bt.id) {
        existing.platformIds.bugs = bt.id;
        updatedCount++;
      }
    }
  });

  return {
    updatedSongs,
    stats: {
      artistName: artist.name,
      melonTracksCount: melonTracks.length,
      genieTracksCount: genieTracks.length,
      bugsTracksCount: bugsTracks.length,
      updatedCount,
      addedCount
    }
  };
}
