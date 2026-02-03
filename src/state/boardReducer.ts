// import type { Note } from '../types/Note.js';
import { MIN_NOTE_WIDTH, MIN_NOTE_HEIGHT } from '../constants/noteDefaults.js';
import type { Note } from '../types/Note.js';


export type DragMode = 'MOVE' | 'RESIZE';

export interface DragState {
  id: string;
  mode: DragMode;
  pointerStart: { x: number; y: number };
  noteStart: { x: number; y: number; width: number; height: number };
  // For MOVE: remembers where inside the note the pointer started (prevents "jumping")
  offset?: { x: number; y: number };
}

export interface BoardState {
  notes: Note[];
  dragState: DragState | null;
}

export type BoardAction =
  | { type: 'ADD_NOTE'; payload: Omit<Note, 'id' | 'zIndex'> }
  | { type: 'START_DRAG'; payload: { id: string; mode: DragMode; pointerX: number; pointerY: number } }
  | { type: 'MOVE_DRAG'; payload: { pointerX: number; pointerY: number } }
  | { type: 'END_DRAG' }
  | { type: 'DELETE_NOTE'; payload: { noteId: string } }
  | { type: 'UPDATE_CONTENT'; payload: { id: string; content: string } };

const initialState: BoardState = {
  notes: [],
  dragState: null,
};

function getMaxZIndex(notes: Note[]): number {
  return notes.length ? Math.max(...notes.map((n) => n.zIndex)) : 0;
}

export function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'ADD_NOTE': {
      const note: Note = {
        ...action.payload,
        id: crypto.randomUUID(),
        zIndex: getMaxZIndex(state.notes) + 1,
      };
      return { ...state, notes: [...state.notes, note] };
    }

    case 'START_DRAG': {
      const note = state.notes.find((n) => n.id === action.payload.id);
      if (!note) return state;

      const nextZ = getMaxZIndex(state.notes) + 1;

      const notes = state.notes.map((n) =>
        n.id === note.id ? { ...n, zIndex: nextZ } : n
      );

      const pointerStart = { x: action.payload.pointerX, y: action.payload.pointerY };
      const noteStart = { x: note.x, y: note.y, width: note.width, height: note.height };

      const offset =
        action.payload.mode === 'MOVE'
          ? { x: action.payload.pointerX - note.x, y: action.payload.pointerY - note.y }
          : undefined;

      return {
        ...state,
        notes,
        dragState: { id: note.id, mode: action.payload.mode, pointerStart, noteStart, offset },
      };
    }

    case 'MOVE_DRAG': {
      const drag = state.dragState;
      if (!drag) return state;

      if (drag.mode === 'MOVE') {
        if (!drag.offset) return state;

        const x = action.payload.pointerX - drag.offset.x;
        const y = action.payload.pointerY - drag.offset.y;

        const notes = state.notes.map((n) => (n.id === drag.id ? { ...n, x, y } : n));
        return { ...state, notes };
      }

      // RESIZE: keep x/y fixed, resize from bottom-right
      if (drag.mode === 'RESIZE') {
        const deltaX = action.payload.pointerX - drag.pointerStart.x;
        const deltaY = action.payload.pointerY - drag.pointerStart.y;

        const width = Math.max(MIN_NOTE_WIDTH, drag.noteStart.width + deltaX);
        const height = Math.max(MIN_NOTE_HEIGHT, drag.noteStart.height + deltaY);

        const notes = state.notes.map((n) =>
          n.id === drag.id ? { ...n, width, height } : n
        );
        return { ...state, notes };
      }

      return state;
    }

    case 'END_DRAG': {
      return { ...state, dragState: null };
    }

    case 'DELETE_NOTE': {
      const notes = state.notes.filter((n) => n.id !== action.payload.noteId);
      const dragState = state.dragState?.id === action.payload.noteId ? null : state.dragState;
      return { ...state, notes, dragState };
    }

    case 'UPDATE_CONTENT': {
      const notes = state.notes.map((n) =>
        n.id === action.payload.id ? { ...n, content: action.payload.content } : n
      );
      return { ...state, notes };
    }

    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

export function createInitialBoardState(): BoardState {
  // returning a function keeps the reducer initializer stable
  return initialState;
}
