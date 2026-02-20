export default function ScenePreview({ moviePlan }) {
  if (!moviePlan) return null;

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div>
        <h2 className="text-lg font-semibold">Scene and Kling prompt plan</h2>
        <p className="text-sm text-slate-400">Review before rendering.</p>
      </div>
      {moviePlan.scenes.map((scene) => (
        <article key={scene.sceneNumber} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
          <h3 className="font-semibold">
            Scene {scene.sceneNumber}: {scene.sceneTitle}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            {scene.durationSeconds}s · {scene.location} · {scene.mood}
          </p>
          <p className="mt-2 text-sm text-slate-300">{scene.action}</p>
          <p className="mt-3 rounded bg-slate-900 p-2 text-xs text-slate-400">{scene.klingPrompt}</p>
        </article>
      ))}
    </div>
  );
}
