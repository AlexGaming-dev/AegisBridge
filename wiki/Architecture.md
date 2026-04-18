# Product Overview

## Main Components

1. Main Process (`src/main/main.js`)
2. Preload Bridge (`src/main/preload.js`)
3. Renderer UI (`src/renderer/app.html`, `src/renderer/app.js`)

## What This Means for Users

- The app has a clear separation between UI and system operations.
- Diagnostics actions are routed through controlled interfaces.
- Direct system-level execution from the UI is restricted.

## Why This Design Is Safer

- The renderer runs with limited privileges.
- The preload bridge exposes only a minimal API.
- Isolation reduces the attack surface in desktop runtime contexts.

## Data Flow

1. The UI requests data through `window.aegisbridge`.
2. The preload bridge forwards the request via IPC.
3. The main process gathers data and responds.
4. The UI updates status and diagnostics output.
