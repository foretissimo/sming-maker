/**
 * Format seconds into mm:ss (e.g. 245 -> "04:05")
 */
export function formatSecondsToTime(seconds) {
  if (!seconds || isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format total playlist duration (e.g. 3645 -> "1시간 0분 45초")
 */
export function formatTotalDuration(seconds) {
  if (!seconds || isNaN(seconds)) return "0분 0초";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}시간 ${mins}분 ${secs > 0 ? `${secs}초` : ''}`.trim();
  }
  return `${mins}분 ${secs}초`;
}

/**
 * Format release date YYYY-MM-DD to YYYY.MM.DD
 */
export function formatDate(dateString) {
  if (!dateString) return "";
  return dateString.replace(/-/g, '.');
}
