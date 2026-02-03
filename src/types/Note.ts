/**
 * Domain model for a single sticky note on the board.
 *
 * The board uses absolute positioning, so x/y/width/height
 * are stored directly in "board space" (pixels).
 *
 * zIndex controls visual stacking when notes overlap
 * (the active/dragged note is always brought to the front).
 */
export interface Note {
  id: string;        // Stable unique identifier
  x: number;         // Left position (px) in board space
  y: number;         // Top position (px) in board space
  width: number;     // Note width in px
  height: number;    // Note height in px
  content: string;  // User-entered text
  zIndex: number;   // Visual stacking order
}
