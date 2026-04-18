import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  const [serverUrl, setServerUrl] = React.useState('http://localhost:8788');
  const [taskPath, setTaskPath] = React.useState('');
  const [runs, setRuns] = React.useState<any[]>([]);
  const [events, setEvents] = React.useState<string[]>([]);
  const [latestShotByRun, setLatestShotByRun] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    fetch(`${serverUrl}/api/runs`).then(r => r.json()).then(d => setRuns(d.runs || [])).catch(() => {});

    const ws = new WebSocket(serverUrl.replace('http', 'ws') + '/ws');
    ws.onmessage = (m) => {
      const raw = String(m.data);

      // Try to detect screenshot events and map local artifact path -> served URL.
      try {
        const msg = JSON.parse(raw);
        if (msg?.type === 'run_event' && typeof msg?.id === 'string') {
          try {
            const ev = JSON.parse(msg.line);
            if (ev?.type === 'step_result' && ev?.result?.path) {
              const p = String(ev.result.path);
              const idx = p.indexOf('/artifacts/');
              // For our default layout, path contains .../.baf/artifacts/<runId>/...
              const a = p.split('/artifacts/')[1];
              if (a) {
                setLatestShotByRun((prev) => ({ ...prev, [msg.id]: `${serverUrl}/artifacts/${a}` }));
              }
            }
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }

      setEvents((prev) => {
        const next = prev.concat(raw);
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

  function renderRun(r: any) {
    const shot = latestShotByRun[r.id];
    return (
      <div key={r.id} style={{ border: '1px solid #333', borderRadius: 8, padding: 12, marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div><b>{r.id}</b></div>
            <div style={{ opacity: 0.8 }}>{r.taskPath}</div>
            <div>Status: <b>{r.status}</b></div>
          </div>
          {shot ? (
            <div>
              <a href={shot} target="_blank" rel="noreferrer">open screenshot</a>
              <div style={{ marginTop: 6 }}>
                <img src={shot} style={{ maxWidth: 320, borderRadius: 6, border: '1px solid #222' }} />
              </div>
            </div>
          ) : (
            <div style={{ opacity: 0.7 }}>no screenshot yet</div>
          )}
        </div>
      </div>
    );
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
      <div>
        {runs.map(renderRun)}
      </div>

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
