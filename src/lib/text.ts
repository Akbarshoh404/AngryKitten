const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Turns "Small studio. **Sharp claws.**" into HTML with the key word highlighted.
 * Everything else is escaped, so copy from content files is safe to render.
 */
export function highlight(text: string): string {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<em class="ak-hl">$1</em>');
}

/** Removes the **markers** (for <title>, aria-labels, etc.). */
export function plain(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '$1');
}
