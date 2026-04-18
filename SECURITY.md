# Security Policy

## Supported Versions

| Version | Supported |
| --- | --- |
| 1.x | Yes |
| < 1.0.0 | No |

## Reporting a Vulnerability

Please report vulnerabilities privately and do not open public issues for exploitable findings.

1. Send a report with reproduction steps, impact, and affected version.
2. Include logs or screenshots only if they do not contain sensitive information.
3. Provide mitigation suggestions where possible.

Response target:

- Initial triage: within 5 business days
- Status update cadence: at least weekly until resolution

## Security Hardening Notes

- Keep Electron and dependencies updated regularly.
- Prefer signed releases for distribution on Windows.
- Do not commit certificates, private keys, or secrets.
- Run linting and release builds in CI before publishing.
