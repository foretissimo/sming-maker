/**
 * Smart 1-Hour Streaming List Generator
 */

/**
 * Filter songs by selected artist types
 */
export function filterSongsByArtists(allSongs, selectedArtistTypes) {
  if (!selectedArtistTypes || selectedArtistTypes.length === 0) {
    return allSongs;
  }
  return allSongs.filter(song => selectedArtistTypes.includes(song.artistType));
}

/**
 * Generate 1-hour streaming list
 * @param {Array} allSongs - dataset of songs
 * @param {Object} options - configuration options
 * @returns {Array} generated playlist
 */
export function generateStreamingList(allSongs, options = {}) {
  const {
    targetSeconds = 3600, // 60 minutes default
    mode = 'title_focus', // 'title_focus' | 'recent_first' | 'balanced' | 'random'
    selectedArtistTypes = ['group', 'jomingyu', 'baedoohun', 'kanghyungho', 'gowoorim'],
    focusSongId = null, // specific song to repeat
    repeatFocusCount = 3, // number of times to repeat focus title song
    pinnedSongs = [] // user pinned songs to always include
  } = options;

  // 1. Filter songs by artist
  let candidatePool = filterSongsByArtists(allSongs, selectedArtistTypes);
  if (candidatePool.length === 0) candidatePool = [...allSongs];

  // 2. Sort candidate pool based on mode
  if (mode === 'recent_first' || mode === 'title_focus') {
    candidatePool.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
  } else if (mode === 'random') {
    candidatePool = [...candidatePool].sort(() => Math.random() - 0.5);
  }

  // 3. Find focus song (if title_focus mode)
  let focusSong = null;
  if (focusSongId) {
    focusSong = allSongs.find(s => s.id === focusSongId);
  }
  if (!focusSong && (mode === 'title_focus' || mode === 'recent_first')) {
    // Find latest title track from candidate pool or group
    focusSong = candidatePool.find(s => s.isTitle && s.artistType === 'group') || candidatePool.find(s => s.isTitle) || candidatePool[0];
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

  if (mode === 'title_focus' && focusSong) {
    // Strategy: Structure cycle [Focus, SongA, SongB, SongC, Focus, SongD, SongE, ...]
    const otherCandidates = candidatePool.filter(s => s.id !== focusSong.id);
    let otherIdx = 0;
    let focusPlaced = 0;

    // Place first focus song if not already pinned
    if (!result.some(s => s.id === focusSong.id)) {
      result.push({ ...focusSong, uniqueKey: `${focusSong.id}-${Math.random().toString(36).substr(2, 9)}` });
      currentDuration += focusSong.duration;
      focusPlaced++;
    }

    let interval = 3; // place focus every 3-4 other songs
    let sinceLastFocus = 0;

    while (currentDuration < targetSeconds - 120 && otherCandidates.length > 0) {
      if (sinceLastFocus >= interval && focusPlaced < repeatFocusCount && currentDuration + focusSong.duration <= targetSeconds + 120) {
        result.push({ ...focusSong, uniqueKey: `${focusSong.id}-${Math.random().toString(36).substr(2, 9)}` });
        currentDuration += focusSong.duration;
        focusPlaced++;
        sinceLastFocus = 0;
      } else {
        const nextSong = otherCandidates[otherIdx % otherCandidates.length];
        otherIdx++;

        // Avoid exceeding target by too much
        if (currentDuration + nextSong.duration > targetSeconds + 180 && currentDuration >= targetSeconds - 180) {
          break;
        }

        result.push({ ...nextSong, uniqueKey: `${nextSong.id}-${Math.random().toString(36).substr(2, 9)}` });
        currentDuration += nextSong.duration;
        sinceLastFocus++;
      }

      if (otherIdx > otherCandidates.length * 3 && currentDuration >= targetSeconds - 240) {
        break;
      }
    }
  } else {
    // Standard sequence or balanced fill
    let poolIndex = 0;
    const shuffledOrSorted = [...candidatePool];

    while (currentDuration < targetSeconds - 120 && shuffledOrSorted.length > 0) {
      const nextSong = shuffledOrSorted[poolIndex % shuffledOrSorted.length];
      poolIndex++;

      if (currentDuration + nextSong.duration > targetSeconds + 180 && currentDuration >= targetSeconds - 180) {
        break;
      }

      result.push({ ...nextSong, uniqueKey: `${nextSong.id}-${Math.random().toString(36).substr(2, 9)}` });
      currentDuration += nextSong.duration;

      if (poolIndex > shuffledOrSorted.length * 3 && currentDuration >= targetSeconds - 240) {
        break;
      }
    }
  }

  // Fine tuning: if slightly under target (e.g. 55 mins and target is 60), find a fitting track
  if (currentDuration < targetSeconds - 180) {
    const diff = targetSeconds - currentDuration;
    const fittingSong = candidatePool.find(s => Math.abs(s.duration - diff) < 60) || candidatePool[0];
    if (fittingSong) {
      result.push({ ...fittingSong, uniqueKey: `${fittingSong.id}-${Math.random().toString(36).substr(2, 9)}` });
    }
  }

  return result;
}
