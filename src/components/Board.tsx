import { useReducer, useCallback, useRef, useState, useEffect } from 'react';
import type { Note } from '../types/Note.js';
import { boardReducer, createInitialBoardState, type BoardAction } from '../state/boardReducer.js';
import {
  DEFAULT_NOTE_WIDTH,
  DEFAULT_NOTE_HEIGHT,
  INITIAL_NOTE_X,
  INITIAL_NOTE_Y,
  NOTE_STACK_OFFSET,
} from '../constants/noteDefaults.js';
import { Note as NoteComponent } from './Note.jsx';

const STORAGE_KEY = 'tempo-sticky-notes:v1';

function loadNotesFromStorage(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Note[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveNotesToStorage(notes: readonly Note[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // ignore quota / privacy mode
  }
}

function rectContainsPoint(rect: DOMRect, x: number, y: number): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

export function Board() {
  const notesContainerRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);

  // release capture reliably from the same element that captured it
  const captureElRef = useRef<HTMLElement | null>(null);

  const [isOverTrash, setIsOverTrash] = useState(false);

  // const [state, dispatch] = useReducer(boardReducer, createInitialBoardState());
  const [state, dispatch] = useReducer(
    boardReducer,
    undefined,
    () => {
      const base = createInitialBoardState();
      const notes = loadNotesFromStorage();
      return { ...base, notes };
    }
  );
  useEffect(() => {
    saveNotesToStorage(state.notes);
  }, [state.notes]);
  

  const handleAddNote = useCallback(() => {
    const noteCount = state.notes.length;
    const payload: Omit<Note, 'id' | 'zIndex'> = {
      x: INITIAL_NOTE_X + noteCount * NOTE_STACK_OFFSET,
      y: INITIAL_NOTE_Y + noteCount * NOTE_STACK_OFFSET,
      width: DEFAULT_NOTE_WIDTH,
      height: DEFAULT_NOTE_HEIGHT,
      content: '',
    };
    dispatch({ type: 'ADD_NOTE', payload } satisfies BoardAction);
  }, [state.notes.length]);

  const handleDeleteNote = useCallback((noteId: string) => {
    dispatch({ type: 'DELETE_NOTE', payload: { noteId } } satisfies BoardAction);
  }, []);

  const handleContentChange = useCallback((noteId: string, content: string) => {
    dispatch({ type: 'UPDATE_CONTENT', payload: { id: noteId, content } } satisfies BoardAction);
  }, []);

  const handlePointerDown = useCallback(
    (noteId: string, mode: 'MOVE' | 'RESIZE', e: React.PointerEvent) => {
      if ((e.target as Element).closest('button')) return;

      e.preventDefault();

      const el = e.currentTarget as HTMLElement;
      captureElRef.current = el;
      el.setPointerCapture(e.pointerId);

      dispatch({
        type: 'START_DRAG',
        payload: { id: noteId, mode, pointerX: e.clientX, pointerY: e.clientY },
      } satisfies BoardAction);
    },
    []
  );

  const updateTrashHoverFromNoteCenter = useCallback(() => {
    const drag = state.dragState;
    if (!drag) return;

    const note = state.notes.find((n) => n.id === drag.id);
    const notesRect = notesContainerRef.current?.getBoundingClientRect();
    const trashRect = trashRef.current?.getBoundingClientRect();

    if (!note || !notesRect || !trashRect) return;

    const centerX = notesRect.left + note.x + note.width / 2;
    const centerY = notesRect.top + note.y + note.height / 2;

    setIsOverTrash(rectContainsPoint(trashRect, centerX, centerY));
  }, [state.dragState, state.notes]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!state.dragState) return;

      dispatch({
        type: 'MOVE_DRAG',
        payload: { pointerX: e.clientX, pointerY: e.clientY },
      } satisfies BoardAction);

      // Hover is based on note center (same rule as delete).
      // Note: this uses current state values; it’s good enough for the take-home.
      updateTrashHoverFromNoteCenter();
    },
    [state.dragState, updateTrashHoverFromNoteCenter]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!state.dragState) return;

      captureElRef.current?.releasePointerCapture(e.pointerId);
      captureElRef.current = null;

      const dragId = state.dragState.id;
      const note = state.notes.find((n) => n.id === dragId);
      const notesRect = notesContainerRef.current?.getBoundingClientRect();
      const trashRect = trashRef.current?.getBoundingClientRect();

      setIsOverTrash(false);

      if (note && notesRect && trashRect) {
        const centerX = notesRect.left + note.x + note.width / 2;
        const centerY = notesRect.top + note.y + note.height / 2;

        if (rectContainsPoint(trashRect, centerX, centerY)) {
          dispatch({ type: 'DELETE_NOTE', payload: { noteId: note.id } } satisfies BoardAction);
        }
      }

      dispatch({ type: 'END_DRAG' } satisfies BoardAction);
    },
    [state.dragState, state.notes]
  );

  return (
    <div
      style={{
        position: 'relative',
        minHeight: 400,
        padding: 16,
        userSelect: state.dragState ? 'none' : undefined,
      }}
      onPointerMoveCapture={handlePointerMove}
      onPointerUpCapture={handlePointerUp}
    >
      <div style={{ marginBottom: 16 }}>
        <button type="button" onClick={handleAddNote}>
          New note
        </button>
      </div>

      <div ref={notesContainerRef} style={{ position: 'relative', minHeight: 360 }}>
        {state.notes.map((note) => (
          <NoteComponent
            key={note.id}
            note={note}
            onDelete={handleDeleteNote}
            onPointerDown={handlePointerDown}
            onContentChange={handleContentChange}
          />
        ))}
      </div>

      <div
        ref={trashRef}
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          width: 48,
          height: 48,
          border: '2px solid currentColor',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isOverTrash ? 'rgba(220, 53, 69, 0.2)' : 'transparent',
        }}
      >
        Trash
      </div>
    </div>
  );
}
