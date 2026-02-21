'use client';

import { useMemo, useState } from 'react';

function getProgress(sceneStatuses = []) {
  if (!sceneStatuses.length) return 0;
  const finished = sceneStatuses.filter((scene) =>
    ['succeeded', 'success', 'completed', 'done'].includes(String(scene.status).toLowerCase())
  ).length;
  return Math.round((finished / sceneStatuses.length) * 100);
}

export default function HomePage() {
  const [prompt, setPrompt] = useState('A gritty cyberpunk chase through neon streets that ends with a sunrise rooftop reunion.');
  const [movieId, setMovieId] = useState('');
  const [status, setStatus] = useState('idle');
  const [sceneStatuses, setSceneStatuses] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const progress = useMemo(() => getProgress(sceneStatuses), [sceneStatuses]);

  async function generateMovie() {
    try {
      setLoading(true);
      setError('');
      setResult(null);
      setSceneStatuses([]);
      setStatus('starting');

      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to start generation');

      setMovieId(json.movieId);
      setSceneStatuses(json.tasks || []);
      setStatus(json.status || 'processing');
    } catch (e) {
      setError(e.message);
      setStatus('failed');
    } finally {
      setLoading(false);
    }
  }

  async function pollStatus() {
    if (!movieId) return;

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/generate-video?movieId=${encodeURIComponent(movieId)}`);
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to poll status');

      setStatus(json.status || 'processing');
      setSceneStatuses(json.sceneStatuses || []);

      if (json.status === 'complete') {
        setResult(json);
      }
    } catch (e) {
      setError(e.message);
      setStatus('failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-sky-400">Movie Maker</p>
        <h1 className="text-3xl font-bold">Single Prompt → Cinematic Movie (Higgsfield)</h1>
      </header>

      {error && <p className="rounded-md border border-rose-700 bg-rose-900/40 px-3 py-2 text-sm">{error}</p>}

      <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <textarea rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <div className="flex gap-3">
          <button
            type="button"
            className="rounded-md bg-emerald-500 px-4 py-2 font-medium text-white hover:bg-emerald-400 disabled:opacity-40"
            disabled={loading}
            onClick={generateMovie}
          >
            {loading && status === 'starting' ? 'Starting...' : 'Generate Cinematic Movie'}
          </button>

          <button
            type="button"
            className="rounded-md bg-sky-500 px-4 py-2 font-medium text-white hover:bg-sky-400 disabled:opacity-40"
            disabled={loading || !movieId || status === 'complete'}
            onClick={pollStatus}
          >
            {loading && status !== 'starting' ? 'Polling...' : 'Check Progress'}
          </button>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-lg font-semibold">Progress</h2>
        <p className="text-sm text-slate-300">Status: {status}</p>
        <div className="h-3 w-full overflow-hidden rounded bg-slate-800">
          <div className="h-full bg-sky-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-slate-400">{progress}% complete</p>

        {!!sceneStatuses.length && (
          <ul className="space-y-2 text-sm">
            {sceneStatuses.map((scene) => (
              <li key={scene.taskId} className="rounded border border-slate-700 p-2">
                <p className="font-medium">Scene {scene.sceneIndex + 1}</p>
                <p className="text-slate-300">{scene.sceneDescription}</p>
                <p className="text-xs text-slate-400">Task: {scene.taskId}</p>
                <p className="text-xs text-slate-400">Status: {scene.status}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {result && (
        <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold">Final Movie</h2>
          <p className="text-xs text-slate-400">Saved on server at: {result.savedTo}</p>
          <video controls className="w-full rounded-md border border-slate-700" src={result.previewUrl} />
          <a className="inline-block rounded-md bg-sky-500 px-4 py-2 font-medium text-white hover:bg-sky-400" href={result.downloadUrl}>
            Download final movie
          </a>
        </section>
      )}
    </main>
  );
}
