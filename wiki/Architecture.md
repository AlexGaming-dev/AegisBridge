# Architecture

## Komponenten

1. Main Process (`src/main/main.js`)
2. Preload Bridge (`src/main/preload.js`)
3. Renderer UI (`src/renderer/app.html`, `src/renderer/app.js`)

## Main Process Verantwortung

- Fensterinitialisierung und App-Lifecycle
- IPC-Handler fuer Metrics und Diagnostics
- Plattformnahe Operationen via PowerShell

## Preload Verantwortung

- Sichere, minimierte API fuer Renderer
- Trennung von Node- und Browser-Kontext

## Renderer Verantwortung

- Visualisierung der Metriken
- Statusanzeigen und User Actions
- Trigger fuer Diagnostics-Lauf

## Datenfluss

1. Renderer ruft API ueber `window.aegisbridge` auf.
2. Preload leitet an IPC Main weiter.
3. Main Process sammelt Daten und antwortet.
4. Renderer aktualisiert UI deterministisch.
