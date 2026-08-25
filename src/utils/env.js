/**
 * Environment & Feature Flag Utilities
 */

/**
 * Check if Song Data Editor is enabled in current environment
 * - Local Dev (localhost / 127.0.0.1 / Vite dev): ENABLED
 * - GitHub Pages (github.io) & Public Production: HIDDEN by default
 * - Can be explicitly unlocked via query param ?editor=true or ?admin=true
 */
export function isEditorEnabled() {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  if (params.get('editor') === 'true' || params.get('admin') === 'true') {
    return true;
  }

  if (localStorage.getItem('sming_enable_editor') === 'true') {
    return true;
  }

  // Local development mode
  const hostname = window.location.hostname;
  if (
    import.meta.env.DEV ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0'
  ) {
    return true;
  }

  // Hidden on GitHub Pages (github.io) and public production
  return false;
}
