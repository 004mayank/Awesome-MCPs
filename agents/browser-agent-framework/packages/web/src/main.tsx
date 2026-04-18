import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  const [serverUrl, setServerUrl] = React.useState('http://localhost:8788');
  const [taskPath, setTaskPath] = React.useState('');
  const [runs, setRuns] = React.useState<any[]>([]);
  const [events, setEvents] = React.useState<string[]>([]);

  React.useEffect(() => {
    fetch(`${serverUrl}/api/runs`).then(r => r.json()).then(d => setRuns(d.runs || [])).catch(() => {});

    const ws = new WebSocket(serverUrl.replace('http', 'ws') + '/ws');
    ws.onmessage = (m) => {
      setEvents((prev) => {
        const next = prev.concat(String(m.data));
        return next.length > 200 ? next.slice(next.length - 200) : next;
      });
    };
    return () => ws.close();
  }, [serverUrl]);

  async function startRun() {
    const res = await fetch(`${serverUrl}/api/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskPath }),
    });
    const d = await res.json();
    setEvents((e) => e.concat(`started run ${d.id}`));
    const latest = await fetch(`${serverUrl}/api/runs`).then(r => r.json());
    setRuns(latest.runs || []);
  }

  return (
    <div style={{ fontFamily: 'system-ui', padding: 16, maxWidth: 1000 }}>
      <h1>Browser Agent Framework</h1>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <label>
          Server URL:{' '}
          <input value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} style={{ width: 280 }} />
        </label>
        <label>
          Task path:{' '}
          <input value={taskPath} onChange={(e) => setTaskPath(e.target.value)} style={{ width: 420 }} placeholder="./task.json" />
        </label>
        <button onClick={startRun} disabled={!taskPath}>Start run</button>
      </div>

      <h2 style={{ marginTop: 16 }}>Runs</h2>
      <pre style={{ background: '#111', color: '#0f0', padding: 12, borderRadius: 8, overflow: 'auto' }}>
        {JSON.stringify(runs, null, 2)}
      </pre>

      <h2>Live events</h2>
      <pre style={{ background: '#111', color: '#ddd', padding: 12, borderRadius: 8, overflow: 'auto', height: 320 }}>
        {events.join('\n')}
      </pre>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
