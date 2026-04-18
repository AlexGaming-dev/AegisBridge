# Troubleshooting

## Electron-Icon statt App-Icon

- Alte Taskleisten-Verknuepfung entfernen
- Neueste Setup-Version installieren
- App starten und neu anheften
- Bei Bedarf Icon-Cache erneuern

## SAC/SmartScreen blockiert Installer

- Unsignierte Builds werden haeufig blockiert
- Fuer breite Verteilung signierte Builds nutzen

## Build-Fehler bei electron-builder

- `npm install` erneut ausfuehren
- Node-Version pruefen (>=20)
- Build-Output in `dist/` und Workflow-Logs pruefen

## Lint-Fehler

```powershell
npm run lint
npm run lint:fix
```
