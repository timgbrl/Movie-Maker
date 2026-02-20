export const mockIdeas = {
  ideas: [
    {
      id: 'idea-1',
      title: 'Ashes of the Iron Throne',
      synopsis: 'After King’s Landing falls, rival heirs negotiate peace while a hidden threat rises beyond the Wall.',
      tone: 'Epic political drama with bittersweet hope',
      roughScenes: [
        { scene: 1, summary: 'Ruined throne room confrontation' },
        { scene: 2, summary: 'Council of uneasy allies' },
        { scene: 3, summary: 'March north against new threat' },
        { scene: 4, summary: 'Final sacrifice and dawn' }
      ],
      suggestedCharacters: ['Arya Stark', 'Jon Snow', 'Tyrion Lannister', 'Sansa Stark'],
      suggestedLocations: ['King’s Landing Ruins', 'Winterfell Great Hall', 'The Wall']
    },
    {
      id: 'idea-2',
      title: 'The Dragonless Pact',
      synopsis: 'A fragile republic is formed when old houses accept shared rule, until revenge almost destroys it.',
      tone: 'Suspenseful, dialogue-heavy, tense',
      roughScenes: [
        { scene: 1, summary: 'Public trial in the capital' },
        { scene: 2, summary: 'Secret assassination plot' },
        { scene: 3, summary: 'Midnight confession' }
      ],
      suggestedCharacters: ['Bran Stark', 'Davos Seaworth', 'Brienne of Tarth'],
      suggestedLocations: ['Dragonpit', 'Narrow city alleys']
    },
    {
      id: 'idea-3',
      title: 'Wolves at Sunrise',
      synopsis: 'The Stark siblings reunite to end a supernatural winter curse tied to their bloodline.',
      tone: 'Dark fantasy adventure',
      roughScenes: [
        { scene: 1, summary: 'Raven warning reaches Winterfell' },
        { scene: 2, summary: 'Journey to frozen crypts' },
        { scene: 3, summary: 'Curse-breaking ritual battle' }
      ],
      suggestedCharacters: ['Sansa Stark', 'Arya Stark', 'Bran Stark', 'Jon Snow'],
      suggestedLocations: ['Winterfell', 'Frozen Crypts', 'Godswood']
    }
  ]
};

export const mockScenePlan = {
  title: 'Ashes of the Iron Throne',
  genre: 'Adventure Drama',
  runtimeSeconds: 120,
  scriptSummary: 'Survivors of war forge peace, then unite for one final stand in the North.',
  scenes: [
    {
      sceneNumber: 1,
      sceneTitle: 'Shattered Throne Room',
      durationSeconds: 30,
      characters: ['Jon Snow', 'Tyrion Lannister'],
      location: 'King’s Landing Ruins',
      camera: 'Slow dolly-in and close reaction shots',
      action: 'Jon and Tyrion debate guilt and responsibility amid ash and rubble',
      wardrobe: 'Battle-worn dark cloaks and scorched armor',
      mood: 'Somber and tense',
      multishot: true,
      klingPrompt:
        '30-second multishot cinematic scene, slow dolly and close-ups, Jon Snow and Tyrion in scorched armor arguing in ruined throne room, ash drifting, dramatic gray lighting, somber mood, realistic high-detail fantasy'
    },
    {
      sceneNumber: 2,
      sceneTitle: 'The Northern Council',
      durationSeconds: 45,
      characters: ['Sansa Stark', 'Arya Stark', 'Davos Seaworth'],
      location: 'Winterfell Great Hall',
      camera: 'Wide master then alternating medium shots',
      action: 'Leaders negotiate alliance as messengers report a rising danger at the Wall',
      wardrobe: 'Northern furs, leather armor, Stark sigils',
      mood: 'Measured, strategic, cautious hope',
      multishot: true,
      klingPrompt:
        '45-second multishot medieval council scene, wide-to-medium camera coverage, Sansa Arya Davos in winter furs and leather armor, Winterfell great hall with torchlight, strategic debate and urgent messenger entry, tense hopeful mood, cinematic realism'
    },
    {
      sceneNumber: 3,
      sceneTitle: 'Dawn Beyond the Wall',
      durationSeconds: 45,
      characters: ['Jon Snow', 'Arya Stark'],
      location: 'The Wall, frozen battlefield',
      camera: 'Handheld action with crane pullback finale',
      action: 'Heroes fight spectral foes, then hold the line until sunrise breaks the storm',
      wardrobe: 'Heavy winter cloaks, steel blades, frost-covered armor',
      mood: 'Desperate then triumphant',
      multishot: true,
      klingPrompt:
        '45-second multishot battle sequence, dynamic handheld then crane pullback, Jon Snow and Arya fighting spectral enemies on frozen battlefield near the Wall, heavy winter armor and cloaks, storm clearing into sunrise, desperate to triumphant mood, epic cinematic fantasy'
    }
  ]
};
