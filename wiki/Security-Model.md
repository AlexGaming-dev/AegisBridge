# Security Model

## Prinzipien

- Least Privilege
- Context Isolation
- Keine direkte Node-Integration im Renderer
- Explizite IPC-Schnittstellen

## Electron-Sicherheitsrelevante Defaults

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`

## Betriebssicherheit

- Signierte Releases empfohlen
- Sensible Dateien (z. B. Zertifikate) nie committen
- Regelmaessige Dependency-Updates

## SAC / SmartScreen Hinweis

Ohne Code Signing (OV/EV) ist mit Warnungen oder Blockierungen durch Smart App Control/SmartScreen zu rechnen.

## Vulnerability Reporting

Siehe `SECURITY.md` im Hauptrepository.
