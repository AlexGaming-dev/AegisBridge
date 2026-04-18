const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aegisbridge', {
  channel: 'desktop',
  getMetricsSnapshot: () => ipcRenderer.invoke('metrics:getSnapshot'),
  runDiagnostics: () => ipcRenderer.invoke('os:runDiagnostics'),

  subscribeMetrics: (onData) => {
    if (typeof onData !== 'function') {
      return () => {};
    }

    const wrapped = (_event, payload) => onData(payload);
    ipcRenderer.on('metrics:update', wrapped);
    ipcRenderer.send('metrics:subscribe');

    return () => {
      ipcRenderer.removeListener('metrics:update', wrapped);
    };
  },
});
