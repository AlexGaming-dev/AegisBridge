# Release Process

## Lokale Vorbereitung

```powershell
npm install
npm run lint
npm run build:win
```

## GitHub Release

1. Tag erstellen und pushen.
2. GitHub Release publizieren.
3. Workflow `.github/workflows/build.yml` baut den Installer.
4. Build-Artefakte in Actions pruefen.

## Empfehlung fuer Production

- Signierte Builds veroeffentlichen
- SHA-256 Checksums bereitstellen
- Changelog und Upgrade-Hinweise pflegen
