This is a small interactive sticky notes board built as a take-home task for Tempo.

The goal was to keep the implementation simple and easy to reason about, without using any drag-and-drop libraries, and rely only on native browser Pointer Events.

The project is built with React + TypeScript and uses a reducer to keep all state updates predictable and centralized.

How to run
Requirements

Node.js (v18 or newer recommended)

npm

Steps
npm install
npm run dev


Vite will print a local URL in the terminal (usually http://localhost:5173).
Open that URL in your browser.

What it does

Create new notes

Move notes by dragging the header

Resize notes from the bottom-right corner

Edit note text directly

Delete notes using the delete button

Delete notes by dragging them into the Trash area

Notes are automatically restored from localStorage on refresh

How it’s structured

I kept the logic separated so the flow is easy to follow:

boardReducer.ts
Holds all board state (notes, drag state, zIndex, etc.) and updates it immutably.

Board.tsx
Handles pointer events, DOM measurements, persistence, and dispatches actions to the reducer.

Note.tsx
Only renders a note and forwards user interactions upward.

Note.ts
Defines the Note data shape.

The reducer is kept pure — anything that touches the DOM (like trash hit testing or bounding rects) is handled in the Board component before dispatching actions.

Things I would improve with more time

Clamp notes to the board so they can’t be dragged off screen

Keyboard and accessibility support

Basic unit tests for the reducer and geometry helpers

Visual polish and animations

Tested in Chrome on Windows.