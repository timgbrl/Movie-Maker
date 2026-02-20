'use client';

import { useMemo, useState } from 'react';
import IdeaCards from '@/components/IdeaCards';
import CustomizationForm from '@/components/CustomizationForm';
import ScenePreview from '@/components/ScenePreview';

function normalizeCustomization(idea, runtimeSeconds) {
  return {
    selectedIdea: {
      id: idea.id,
      title: idea.title,
      synopsis: idea.synopsis,
      tone: idea.tone
    },
    characters: idea.suggestedCharacters.slice(0, 5).map((name) => ({ name, actor: 'Unknown' })),
    locations: idea.suggestedLocations.slice(0, 3),
    genre: idea.tone,
    runtimeSeconds,
    overrides: ''
  };
}

export default function HomePage() {
  const [prompt, setPrompt] = useState('Create an alternative ending to Game of Thrones. 30 sec to 5 minutes.');
  const [runtimeSeconds, setRuntimeSeconds] = useState(120);
  const [ideas, setIdeas] = useState([]);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [customization, setCustomization] = useState(null);
  const [moviePlan, setMoviePlan] = useState(null);
  const [renderResult, setRenderResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentStep = useMemo(() => {
    if (!ideas.length) return 1;
    if (ideas.length && !moviePlan) return selectedIdea ? 2 : 1;
    if (moviePlan && !renderResult) return 4;
    return 5;
  }, [ideas.length, selectedIdea, moviePlan, renderResult]);

  async function generateIdeas() {
    try {
      setError('');
      setLoading(true);
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, runtimeSeconds })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate ideas');
      setIdeas(json.ideas || []);
      setSelectedIdea(null);
      setCustomization(null);
      setMoviePlan(null);
      setRenderResult(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function generateScenes() {
    if (!customization) return;
    try {
      setError('');
      setLoading(true);
      const res = await fetch('/api/generate-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customization)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate scene plan');
      setMoviePlan(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function renderMovie() {
    if (!moviePlan) return;
    try {
      setError('');
      setLoading(true);
      const res = await fetch('/api/render-movie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moviePlan, references: {} })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to render movie');
      setRenderResult(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-sky-400">Movie Maker</p>
        <h1 className="text-3xl font-bold">Prompt-to-movie pipeline (ChatGPT + Kling 3.0)</h1>
        <p className="text-sm text-slate-400">Current step: {currentStep} / 5</p>
      </header>

      {error && <p className="rounded-md border border-rose-700 bg-rose-900/40 px-3 py-2 text-sm">{error}</p>}

      <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-lg font-semibold">1) Idea generation</h2>
        <textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <div className="flex max-w-xs flex-col gap-2">
          <label className="text-sm">Duration (seconds, 30-300)</label>
          <input
            type="number"
            min={30}
            max={300}
            value={runtimeSeconds}
            onChange={(e) => setRuntimeSeconds(Number(e.target.value))}
          />
        </div>
        <button
          type="button"
          className="rounded-md bg-sky-500 px-4 py-2 font-medium text-white hover:bg-sky-400 disabled:opacity-40"
          disabled={loading}
          onClick={generateIdeas}
        >
          {loading ? 'Working...' : 'Generate 3 ideas'}
        </button>
      </section>

      {!!ideas.length && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">2) Pick one concept</h2>
          <IdeaCards
            ideas={ideas}
            selectedId={selectedIdea?.id}
            onSelect={(idea) => {
              setSelectedIdea(idea);
              setCustomization(normalizeCustomization(idea, runtimeSeconds));
              setMoviePlan(null);
              setRenderResult(null);
            }}
          />
        </section>
      )}

      {customization && !moviePlan && (
        <section>
          <CustomizationForm value={customization} onChange={setCustomization} onContinue={generateScenes} />
        </section>
      )}

      {moviePlan && (
        <section className="space-y-3">
          <ScenePreview moviePlan={moviePlan} />
          <button
            type="button"
            className="rounded-md bg-emerald-500 px-4 py-2 font-medium text-white hover:bg-emerald-400 disabled:opacity-40"
            disabled={loading}
            onClick={renderMovie}
          >
            {loading ? 'Rendering...' : '4) Generate videos and merge movie'}
          </button>
        </section>
      )}

      {renderResult && (
        <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold">5) Final output</h2>
          <p className="text-sm text-slate-300">
            Movie ready: <span className="font-semibold">{renderResult.title}</span>
          </p>
          <p className="text-xs text-slate-400">Saved on server at: {renderResult.savedTo}</p>
          <video controls className="w-full rounded-md border border-slate-700" src={renderResult.previewUrl} />
          <a
            className="inline-block rounded-md bg-sky-500 px-4 py-2 font-medium text-white hover:bg-sky-400"
            href={renderResult.downloadUrl}
          >
            Download final movie
          </a>
        </section>
      )}
    </main>
  );
}
