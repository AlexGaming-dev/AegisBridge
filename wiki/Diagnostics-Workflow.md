# Diagnostics Workflow

## Goal

Safely inspect ISO-related information without running setup commands.

## Steps

1. Select **Run Diagnostics** in the app.
2. Choose an ISO file in the file dialog.
3. The app validates file presence and reads metadata.
4. Optional mount probing reads structure information in read-only mode.
5. The UI shows status and result details.

## Safety Properties

- No automatic software installation
- No external persistence of sensitive path details by default
- Safe-default error handling
