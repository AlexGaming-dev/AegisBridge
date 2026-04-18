const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const nodeCrypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const execFileAsync = promisify(execFile);

const METRIC_INTERVAL_MS = 3000;

function firstExistingPath(candidates) {
  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  return null;
}

function resolveAppIcon() {
  const packagedIcon = firstExistingPath([
    path.join(process.resourcesPath, 'assets', 'icon.ico'),
    path.join(process.resourcesPath, 'icon.ico'),
  ]);

  if (app.isPackaged && packagedIcon) {
    return packagedIcon;
  }

  const devIcon = firstExistingPath([
    path.join(__dirname, '..', '..', 'assets', 'icon.ico'),
    path.join(process.cwd(), 'assets', 'icon.ico'),
  ]);

  if (devIcon) {
    return devIcon;
  }

  return undefined;
}

async function runPowerShell(script) {
  const { stdout } = await execFileAsync('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    script,
  ]);

  return stdout.trim();
}

async function getTpmStatus() {
  if (process.platform !== 'win32') {
    return 'N/A';
  }

  const script = [
    "$ErrorActionPreference = 'SilentlyContinue'",
    "$spec = $null",
    'try {',
    '  $tpm = Get-Tpm -ErrorAction Stop',
    '  if ($tpm.TpmPresent -eq $true) {',
    '    $spec = [string]$tpm.SpecVersion',
    '  } else {',
    "    Write-Output 'Not Detected'; return",
    '  }',
    '} catch {}',
    'if (-not $spec) {',
    '  try {',
    '    $cim = Get-CimInstance -Namespace root\\cimv2\\security\\microsofttpm -ClassName Win32_Tpm -ErrorAction Stop | Select-Object -First 1',
    '    if ($null -ne $cim) {',
    '      $spec = [string]$cim.SpecVersion',
    '    }',
    '  } catch {}',
    '}',
    'if (-not $spec) {',
    "  Write-Output 'Unavailable'; return",
    '}',
    "if ($spec -match '2.0') {",
    "  Write-Output '2.0 Detected'",
    '} else {',
    "  Write-Output ('Present (' + $spec + ')')",
    '}',
  ].join('; ');

  try {
    const output = await runPowerShell(script);
    return output || 'Unavailable';
  } catch {
    return 'Unavailable';
  }
}

async function getSecureBootStatus() {
  if (process.platform !== 'win32') {
    return 'N/A';
  }

  const script = [
    "$ErrorActionPreference = 'SilentlyContinue'",
    'try {',
    '  $enabled = Confirm-SecureBootUEFI -ErrorAction Stop',
    "  if ($enabled -eq $true) { Write-Output 'Enabled' } else { Write-Output 'Disabled' }",
    '} catch {',
    '  $msg = $_.Exception.Message',
    "  if ($msg -match 'not supported|Cmdlet not supported|Unable to set proper privileges') {",
    "    Write-Output 'Unsupported'",
    '  } else {',
    "    Write-Output 'Unavailable'",
    '  }',
    '}',
  ].join('; ');

  try {
    const output = await runPowerShell(script);
    return output || 'Unavailable';
  } catch {
    return 'Unavailable';
  }
}

async function getTpmAndSecureBootStatus() {
  const [tpm, secureBoot] = await Promise.all([getTpmStatus(), getSecureBootStatus()]);

  return {
    tpm,
    secureBoot,
  };
}

async function getActiveProcessCount() {
  if (process.platform !== 'win32') {
    return null;
  }

  try {
    const output = await runPowerShell('(Get-Process | Measure-Object).Count');
    const count = Number.parseInt(output, 10);
    return Number.isFinite(count) ? count : null;
  } catch {
    return null;
  }
}

async function getLatencyMs(host) {
  if (process.platform !== 'win32') {
    return null;
  }

  try {
    const output = await runPowerShell(
      `try { (Test-Connection -ComputerName '${host}' -Count 1 -ErrorAction Stop | Select-Object -ExpandProperty ResponseTime) } catch { '' }`
    );
    const latency = Number.parseFloat(output);
    return Number.isFinite(latency) ? Number(latency.toFixed(1)) : null;
  } catch {
    return null;
  }
}

async function buildMetricsPayload() {
  const [security, processCount, latencyMs] = await Promise.all([
    getTpmAndSecureBootStatus(),
    getActiveProcessCount(),
    getLatencyMs('8.8.8.8'),
  ]);

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memoryUsedPercent = Math.round((usedMem / totalMem) * 100);

  return {
    endpoints: processCount,
    latencyMs,
    readinessPercent: security.tpm === '2.0 Detected' && security.secureBoot === 'Enabled' ? 100 : 80,
    policies: 42,
    security,
    memory: {
      usedPercent: memoryUsedPercent,
      usedGb: Number((usedMem / 1024 / 1024 / 1024).toFixed(1)),
      totalGb: Number((totalMem / 1024 / 1024 / 1024).toFixed(1)),
    },
    timestamp: Date.now(),
  };
}

async function hashFileSha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = nodeCrypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function probeIsoDriveLetter(isoPath) {
  const escapedIsoPath = isoPath.replace(/'/g, "''");
  const script = [
    "$ErrorActionPreference = 'Stop'",
    `$isoPath = '${escapedIsoPath}'`,
    "$mounted = $null",
    'try {',
    '  $mounted = Mount-DiskImage -ImagePath $isoPath -PassThru',
    '  $driveLetter = ($mounted | Get-Volume | Select-Object -ExpandProperty DriveLetter | Select-Object -First 1)',
    '  if ($null -eq $driveLetter -or [string]::IsNullOrWhiteSpace([string]$driveLetter)) {',
    '    throw "No drive letter detected"',
    '  }',
    '  $rootPath = "$($driveLetter):\\"',
    '  $entryCount = (Get-ChildItem -Path $rootPath -Force | Measure-Object).Count',
    '  [PSCustomObject]@{ driveLetter = [string]$driveLetter; entryCount = [int]$entryCount } | ConvertTo-Json -Compress',
    '} finally {',
    '  if ($null -ne $mounted) {',
    '    Dismount-DiskImage -ImagePath $isoPath -ErrorAction SilentlyContinue',
    '  }',
    '}',
  ].join('; ');

  const raw = await runPowerShell(script);
  return JSON.parse(raw || '{}');
}

function registerMetricsIpc() {
  ipcMain.handle('metrics:getSnapshot', async () => {
    return buildMetricsPayload();
  });

  ipcMain.on('metrics:subscribe', (event) => {
    let isPublishing = false;
    const timer = setInterval(async () => {
      if (isPublishing || event.sender.isDestroyed()) {
        return;
      }

      isPublishing = true;
      try {
        const payload = await buildMetricsPayload();
        if (!event.sender.isDestroyed()) {
          event.sender.send('metrics:update', payload);
        }
      } finally {
        isPublishing = false;
      }
    }, METRIC_INTERVAL_MS);

    event.sender.once('destroyed', () => {
      clearInterval(timer);
    });
  });
}

function registerDiagnosticsIpc() {
  ipcMain.handle('os:runDiagnostics', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Select Windows ISO for diagnostics',
      filters: [{ name: 'ISO Images', extensions: ['iso'] }],
      properties: ['openFile'],
    });

    if (canceled || filePaths.length === 0) {
      return {
        success: false,
        message: 'Diagnostics canceled by user.',
      };
    }

    const isoPath = filePaths[0];
    if (!fs.existsSync(isoPath)) {
      return {
        success: false,
        message: 'Selected ISO file was not found.',
      };
    }

    const fileStat = fs.statSync(isoPath);
    const payload = await buildMetricsPayload();
    let probe = null;
    let sha256 = '';

    try {
      [probe, sha256] = await Promise.all([probeIsoDriveLetter(isoPath), hashFileSha256(isoPath)]);
    } catch {
      probe = null;
    }

    return {
      success: true,
      message: 'Diagnostics completed. No setup command was executed.',
      checkedAt: payload.timestamp,
      iso: {
        path: isoPath,
        sizeBytes: fileStat.size,
        sha256,
      },
      mountProbe: {
        driveLetter: probe?.driveLetter || null,
        rootEntryCount: typeof probe?.entryCount === 'number' ? probe.entryCount : null,
      },
      summary: {
        tpm: payload.security.tpm,
        secureBoot: payload.security.secureBoot,
        memoryUsedPercent: payload.memory.usedPercent,
        processCount: payload.endpoints,
        latencyMs: payload.latencyMs,
      },
    };
  });
}

function createWindow() {
  const appIcon = resolveAppIcon();
  const mainWindow = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 1024,
    minHeight: 720,
    title: 'AegisBridge OS Guard',
    autoHideMenuBar: true,
    icon: appIcon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'app.html'));
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.aegisbridge.osguard');
  }

  registerMetricsIpc();
  registerDiagnosticsIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
