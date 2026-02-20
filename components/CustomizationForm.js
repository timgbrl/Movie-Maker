const ACTOR_OPTIONS = ['Custom', 'Pedro Pascal', 'Zendaya', 'Anya Taylor-Joy', 'Idris Elba', 'Unknown'];

export default function CustomizationForm({ value, onChange, onContinue }) {
  function updateCharacter(index, key, nextValue) {
    const nextCharacters = [...value.characters];
    nextCharacters[index] = { ...nextCharacters[index], [key]: nextValue };
    onChange({ ...value, characters: nextCharacters });
  }

  function updateLocation(index, nextValue) {
    const nextLocations = [...value.locations];
    nextLocations[index] = nextValue;
    onChange({ ...value, locations: nextLocations });
  }

  return (
    <div className="space-y-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div>
        <h2 className="text-lg font-semibold">Customize your movie</h2>
        <p className="text-sm text-slate-400">Edit defaults from your selected concept.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          Genre
          <input value={value.genre} onChange={(e) => onChange({ ...value, genre: e.target.value })} />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Runtime (seconds)
          <input
            type="number"
            min={30}
            max={300}
            value={value.runtimeSeconds}
            onChange={(e) => onChange({ ...value, runtimeSeconds: Number(e.target.value) })}
          />
        </label>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-300">Characters (max 5)</h3>
        {value.characters.map((character, index) => (
          <div key={`${character.name}-${index}`} className="grid gap-3 md:grid-cols-2">
            <input
              value={character.name}
              onChange={(e) => updateCharacter(index, 'name', e.target.value)}
              placeholder="Character"
            />
            <div className="grid grid-cols-2 gap-2">
              <select value={character.actor} onChange={(e) => updateCharacter(index, 'actor', e.target.value)}>
                {ACTOR_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <input
                placeholder="Custom actor"
                value={character.actor === 'Custom' ? character.customActor || '' : ''}
                onChange={(e) => updateCharacter(index, 'actor', e.target.value || 'Custom')}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-300">Locations (max 3)</h3>
        {value.locations.map((location, index) => (
          <input key={`${location}-${index}`} value={location} onChange={(e) => updateLocation(index, e.target.value)} />
        ))}
      </div>

      <label className="flex flex-col gap-2 text-sm">
        Overrides (optional)
        <textarea
          rows={4}
          placeholder="Any specific changes to script, tone, camera, or style"
          value={value.overrides}
          onChange={(e) => onChange({ ...value, overrides: e.target.value })}
        />
      </label>

      <button
        type="button"
        className="rounded-md bg-sky-500 px-4 py-2 font-medium text-white hover:bg-sky-400"
        onClick={onContinue}
      >
        Continue
      </button>
    </div>
  );
}
