# Security Model

## Principles

- Least Privilege
- Context Isolation
- No direct Node integration in the renderer
- Explicit IPC interfaces

## Electron Security Defaults

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`

## Operational Safety

- Signed releases are recommended
- Sensitive files (for example certificates) must never be committed
- Dependencies should be updated regularly

## Smart App Control / SmartScreen Note

Without code signing (OV/EV), Smart App Control / SmartScreen warnings or blocks are more likely.

## Vulnerability Reporting

See `SECURITY.md` in the main repository.
