# Diagnostics Workflow

## Ziel

Sichere Auswertung von ISO-bezogenen Informationen, ohne Setup-Befehle auszufuehren.

## Ablauf

1. Benutzer startet "Run Diagnostics".
2. ISO-Datei wird ueber Datei-Dialog ausgewaehlt.
3. App validiert Dateiexistenz und liest Metadaten.
4. Optionaler Mount-Probe liest nur Verzeichnisstruktur.
5. Ergebnis wird als Status im UI angezeigt.

## Sicherheitsaspekte

- Keine automatische Installation
- Keine Persistenz sensibler Pfaddaten in externen Logs
- Fehlerbehandlung mit sicheren Defaults
