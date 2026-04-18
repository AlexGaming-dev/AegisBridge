# Getting Started

## Voraussetzungen

- Windows 10/11
- Node.js 20+
- npm 10+

## Installation

```powershell
npm install
```

## Entwicklung starten

```powershell
npm start
```

## Linting

```powershell
npm run lint
```

## Windows-Installer bauen

```powershell
npm run build:win
```

## Signierter Build (optional)

```powershell
$env:CSC_LINK="C:\certs\signing.pfx"
$env:CSC_KEY_PASSWORD="your-password"
npm run build:win:signed
```

## Projektstruktur

- `src/main`: Electron Main Process und Preload
- `src/renderer`: Desktop-UI
- `assets`: Icons und statische Medien
- `build`: Packaging Hooks
- `.github`: CI und Community-Konfiguration
