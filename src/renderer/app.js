const metricEndpoints = document.getElementById('metric-endpoints');
const metricLatency = document.getElementById('metric-latency');
const metricReadiness = document.getElementById('metric-readiness');
const metricPolicies = document.getElementById('metric-policies');
const metricMemory = document.getElementById('metric-memory');
const metricTpm = document.getElementById('metric-tpm');
const metricSecureBoot = document.getElementById('metric-secure-boot');
const diagnosticsButton = document.getElementById('btn-diagnostics');
const diagnosticsStatus = document.getElementById('diagnostics-status');

const previousValues = {
  endpoints: '',
  latencyMs: '',
  readinessPercent: '',
  policies: '',
  memory: '',
  tpm: '',
  secureBoot: '',
};

function patchText(element, value) {
  if (!element) {
    return;
  }

  if (element.textContent !== value) {
    element.textContent = value;
  }
}

function normalizeSecurityLabel(value) {
  if (!value) {
    return '--';
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return '--';
  }

  if (normalized.toLowerCase() === 'unknown') {
    return 'Unavailable';
  }

  return normalized;
}

function applyMetrics(metrics) {
  if (!metrics) {
    return;
  }

  const nextLatency =
    typeof metrics.latencyMs === 'number' && Number.isFinite(metrics.latencyMs)
      ? `${metrics.latencyMs} ms`
      : '--';
  const nextReadiness =
    typeof metrics.readinessPercent === 'number' && Number.isFinite(metrics.readinessPercent)
      ? `${metrics.readinessPercent}%`
      : '--';
  const nextPolicies =
    metrics.policies !== undefined && metrics.policies !== null ? String(metrics.policies) : '--';
  const nextEndpoints =
    metrics.endpoints !== undefined && metrics.endpoints !== null ? String(metrics.endpoints) : '--';
  const hasMemory =
    metrics.memory &&
    typeof metrics.memory.usedPercent === 'number' &&
    typeof metrics.memory.usedGb === 'number' &&
    typeof metrics.memory.totalGb === 'number';
  const nextMemory = hasMemory
    ? `${metrics.memory.usedPercent}% (${metrics.memory.usedGb}/${metrics.memory.totalGb} GB)`
    : '--';
  const nextTpm = normalizeSecurityLabel(metrics.security?.tpm);
  const nextSecureBoot = normalizeSecurityLabel(metrics.security?.secureBoot);

  if (previousValues.endpoints !== nextEndpoints) {
    patchText(metricEndpoints, nextEndpoints);
    previousValues.endpoints = nextEndpoints;
  }

  if (previousValues.latencyMs !== nextLatency) {
    patchText(metricLatency, nextLatency);
    previousValues.latencyMs = nextLatency;
  }

  if (previousValues.readinessPercent !== nextReadiness) {
    patchText(metricReadiness, nextReadiness);
    previousValues.readinessPercent = nextReadiness;
  }

  if (previousValues.policies !== nextPolicies) {
    patchText(metricPolicies, nextPolicies);
    previousValues.policies = nextPolicies;
  }

  if (previousValues.memory !== nextMemory) {
    patchText(metricMemory, nextMemory);
    previousValues.memory = nextMemory;
  }

  if (previousValues.tpm !== nextTpm) {
    patchText(metricTpm, nextTpm);
    previousValues.tpm = nextTpm;
  }

  if (previousValues.secureBoot !== nextSecureBoot) {
    patchText(metricSecureBoot, nextSecureBoot);
    previousValues.secureBoot = nextSecureBoot;
  }
}

async function startMetrics() {
  if (!window.aegisbridge) {
    return;
  }

  diagnosticsButton?.addEventListener('click', async () => {
    diagnosticsButton.disabled = true;
    patchText(diagnosticsStatus, 'Running diagnostics...');

    try {
      const result = await window.aegisbridge.runDiagnostics();
      if (result?.success) {
        const parts = ['Diagnostics completed'];
        if (result.iso?.path) {
          parts.push(`ISO: ${result.iso.path}`);
        }
        if (result.mountProbe?.driveLetter) {
          parts.push(`Drive: ${result.mountProbe.driveLetter}:`);
        }
        patchText(diagnosticsStatus, parts.join(' | '));
      } else {
        patchText(diagnosticsStatus, result?.message || 'Diagnostics failed.');
      }
    } catch {
      patchText(diagnosticsStatus, 'Diagnostics failed.');
    } finally {
      diagnosticsButton.disabled = false;
    }
  });

  const snapshot = await window.aegisbridge.getMetricsSnapshot();
  applyMetrics(snapshot);

  const unsubscribe = window.aegisbridge.subscribeMetrics((payload) => {
    applyMetrics(payload);
  });

  window.addEventListener('beforeunload', () => {
    unsubscribe();
  });
}

startMetrics().catch((error) => {
  console.error('Failed to start metric stream:', error);
});
