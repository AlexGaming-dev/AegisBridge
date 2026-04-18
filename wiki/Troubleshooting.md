# Troubleshooting

## Generic Electron Icon Instead of App Icon

- Remove old taskbar shortcuts.
- Install the latest setup version.
- Launch the app and pin it again.
- Refresh the icon cache if needed.

## Smart App Control / SmartScreen Blocks Installer

- Unsigned builds are more likely to be blocked.
- Prefer signed releases for wider rollout.

## Installer Does Not Start

- Confirm the installer came from the official releases page.
- Re-download the installer to rule out a corrupted file.
- Verify integrity metadata (for example SHA-256) when provided.

## Diagnostics Fails

- Confirm the selected ISO file exists and is accessible.
- Retry with local files (not network locations).
- Open an issue if the error persists: https://github.com/AlexGaming-Dev/AegisBridge/issues
