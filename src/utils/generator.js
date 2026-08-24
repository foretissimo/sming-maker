/**
 * Smart 1-Hour Streaming List Generator with High Precision Time Optimization
 */

/**
 * Filter songs by selected artist types
 */
export function filterSongsByArtists(allSongs, selectedArtistTypes) {
  if (!selectedArtistTypes || selectedArtistTypes.length === 0) {
    return [];
  }
  return allSongs.filter(song => selectedArtistTypes.includes(song.artistType));
}

/**
 * Generate precision 1-hour streaming list
 * @param {Array} allSongs - dataset of songs
 * @param {Object} options - configuration options
 * @returns {Array} generated playlist
 */
export function generateStreamingList(allSongs, options = {}) {
  const {
    targetSeconds = 3600, // 60 minutes default
    mode = 'title_focus', // 'title_focus' | 'recent_first' | 'balanced' | 'random'
    selectedArtistTypes = ['group', 'jomingyu', 'baedoohun', 'kanghyungho', 'gowoorim'],
    focusSongId = null, // specific song to repeat (group or solo title)
    repeatFocusCount = 3, // number of times to repeat focus title song
    pinnedSongs = [] // user pinned songs to always include
  } = options;

  // 1. Filter songs by artist
  let candidatePool = filterSongsByArtists(allSongs, selectedArtistTypes);
  
  // If no artist selected, fallback to all songs
  if (candidatePool.length === 0) {
    candidatePool = [...allSongs];
  }

  // 2. Sort candidate pool based on mode
  if (mode === 'recent_first' || mode === 'title_focus') {
    candidatePool.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
  } else if (mode === 'random') {
    candidatePool = [...candidatePool].sort(() => Math.random() - 0.5);
  }

  // 3. Find focus song (handles both group & solo titles)
  let focusSong = null;
  if (focusSongId) {
    focusSong = allSongs.find(s => s.id === focusSongId);
  }
  if (!focusSong && (mode === 'title_focus' || mode === 'recent_first')) {
    // Find latest title track among candidate pool first
    focusSong = candidatePool.find(s => s.isTitle) || candidatePool[0];
  }

  const result = [];
  let currentDuration = 0;

  // Include pinned songs first
  if (pinnedSongs && pinnedSongs.length > 0) {
    pinnedSongs.forEach(song => {
      result.push({ ...song, uniqueKey: `${song.id}-${Math.random().toString(36).substr(2, 9)}` });
      currentDuration += song.duration;
    });
  }

  // Phase 1: Build structural playlist skeleton
  if (mode === 'title_focus' && focusSong) {
    const otherCandidates = candidatePool.filter(s => s.id !== focusSong.id);
    const poolToUse = otherCandidates.length > 0 ? otherCandidates : candidatePool;
    let otherIdx = 0;
    let focusPlaced = 0;

    // Place first focus song if not pinned
    if (!result.some(s => s.id === focusSong.id)) {
      result.push({ ...focusSong, uniqueKey: `${focusSong.id}-${Math.random().toString(36).substr(2, 9)}` });
      currentDuration += focusSong.duration;
      focusPlaced++;
    }

    let interval = 3; // place focus title every 3-4 other songs
    let sinceLastFocus = 0;

    while (currentDuration < targetSeconds - 120 && poolToUse.length > 0) {
      if (sinceLastFocus >= interval && focusPlaced < repeatFocusCount && currentDuration + focusSong.duration <= targetSeconds + 90) {
        result.push({ ...focusSong, uniqueKey: `${focusSong.id}-${Math.random().toString(36).substr(2, 9)}` });
        currentDuration += focusSong.duration;
        focusPlaced++;
        sinceLastFocus = 0;
      } else {
        const nextSong = poolToUse[otherIdx % poolToUse.length];
        otherIdx++;

        if (currentDuration + nextSong.duration > targetSeconds + 90) {
          break;
        }

        result.push({ ...nextSong, uniqueKey: `${nextSong.id}-${Math.random().toString(36).substr(2, 9)}` });
        currentDuration += nextSong.duration;
        sinceLastFocus++;
      }

      if (otherIdx > poolToUse.length * 6 && currentDuration >= targetSeconds - 180) {
        break;
      }
    }
  } else {
    // Other modes (Recent first, Balanced, Random)
    let poolIndex = 0;
    const pool = [...candidatePool];

    while (currentDuration < targetSeconds - 120 && pool.length > 0) {
      const nextSong = pool[poolIndex % pool.length];
      poolIndex++;

      if (currentDuration + nextSong.duration > targetSeconds + 90) {
        break;
      }

      result.push({ ...nextSong, uniqueKey: `${nextSong.id}-${Math.random().toString(36).substr(2, 9)}` });
      currentDuration += nextSong.duration;

      if (poolIndex > pool.length * 6 && currentDuration >= targetSeconds - 180) {
        break;
      }
    }
  }

  // Phase 2: Precision Optimization (~3600s target solver)
  // Step 2-A: If remaining gap is >= 150 seconds, add the best matching song
  while (currentDuration < targetSeconds - 120 && candidatePool.length > 0) {
    const gap = targetSeconds - currentDuration;
    // Find candidate song closest to the gap without overshooting too much
    let bestCandidate = null;
    let minDelta = Infinity;

    for (const song of candidatePool) {
      const delta = Math.abs((currentDuration + song.duration) - targetSeconds);
      if (delta < minDelta) {
        minDelta = delta;
        bestCandidate = song;
      }
    }

    if (bestCandidate && (currentDuration + bestCandidate.duration <= targetSeconds + 60 || minDelta < Math.abs(currentDuration - targetSeconds))) {
      result.push({ ...bestCandidate, uniqueKey: `${bestCandidate.id}-${Math.random().toString(36).substr(2, 9)}` });
      currentDuration += bestCandidate.duration;
    } else {
      break;
    }
  }

  // Step 2-B: Swap Optimization (Fine-tune difference by swapping one track for a better duration fit)
  let bestDelta = Math.abs(currentDuration - targetSeconds);
  let improved = true;
  let iterations = 0;

  while (improved && iterations < 10) {
    improved = false;
    iterations++;

    for (let i = 0; i < result.length; i++) {
      // Don't swap pinned songs or the first focus title song
      if (i === 0 && focusSong && result[0].id === focusSong.id) continue;

      const currentSong = result[i];

      for (const candidate of candidatePool) {
        if (candidate.id === currentSong.id) continue;

        const newDuration = currentDuration - currentSong.duration + candidate.duration;
        const newDelta = Math.abs(newDuration - targetSeconds);

        if (newDelta < bestDelta) {
          bestDelta = newDelta;
          currentDuration = newDuration;
          result[i] = { ...candidate, uniqueKey: `${candidate.id}-${Math.random().toString(36).substr(2, 9)}` };
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }

  return result;
}
