export default function IdeaCards({ ideas, selectedId, onSelect }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {ideas.map((idea) => {
        const isSelected = selectedId === idea.id;
        return (
          <button
            key={idea.id}
            type="button"
            onClick={() => onSelect(idea)}
            className={`rounded-xl border p-4 text-left ${
              isSelected ? 'border-sky-500 bg-sky-950/30' : 'border-slate-800 bg-slate-900'
            }`}
          >
            <p className="text-xs uppercase tracking-wide text-slate-400">{idea.tone}</p>
            <h3 className="mt-1 text-lg font-semibold">{idea.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{idea.synopsis}</p>
            <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-slate-400">
              {idea.roughScenes.map((scene) => (
                <li key={`${idea.id}-${scene.scene}`}>{scene.summary}</li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>
  );
}
