/**
 * Runs before WebView document loads. Sets globals read by inline course HTML.
 * Keep JSON-serializable only (no functions, no circular refs).
 */
export function buildWebViewBootstrapScript(userName: string): string {
  const safe = JSON.stringify(userName || 'Learner');
  return `(function(){window.__LMS_USER_NAME=${safe};true;})();`;
}
