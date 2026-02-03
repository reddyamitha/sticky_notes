import type { Note as NoteType } from '../types/Note.js';
import type { DragMode } from '../state/boardReducer.js';

interface NoteProps {
  note: NoteType;
  onDelete: (noteId: string) => void;
  onPointerDown: (noteId: string, mode: DragMode, e: React.PointerEvent) => void;
  onContentChange: (noteId: string, content: string) => void;
}

const MOVE: DragMode = 'MOVE';
const RESIZE: DragMode = 'RESIZE';

export function Note({ note, onDelete, onPointerDown, onContentChange }: NoteProps) {
  const headerHeight = 24;

  return (
    <div
      style={{
        position: 'absolute',
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
        zIndex: note.zIndex,
        padding: 8,
        boxSizing: 'border-box',
        border: '1px solid currentColor',
      }}
    >
      <div
        style={{
          height: headerHeight,
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}
        onPointerDown={(e) => onPointerDown(note.id, MOVE, e)}
      >
        <span style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => onDelete(note.id)}
          onPointerDown={(e) => e.stopPropagation()}
          style={{ fontSize: 12 }}
          aria-label="Delete note"
        >
          Delete
        </button>
      </div>

      <textarea
        value={note.content}
        onChange={(e) => onContentChange(note.id, e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Note content"
        style={{
          width: '100%',
          height: `calc(100% - ${headerHeight + 4}px)`,
          margin: 0,
          padding: 0,
          border: 'none',
          resize: 'none',
          background: 'transparent',
          font: 'inherit',
          boxSizing: 'border-box',
          outline: 'none',
        }}
      />

      <div
        title="Resize"
        style={{
          position: 'absolute',
          bottom: 2,
          right: 2,
          width: 12,
          height: 12,
          cursor: 'nwse-resize',
          opacity: 0.6,
          borderRight: '2px solid currentColor',
          borderBottom: '2px solid currentColor',
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onPointerDown(note.id, RESIZE, e);
        }}
      />
    </div>
  );
}
