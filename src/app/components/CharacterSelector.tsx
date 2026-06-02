import { Character } from '../App';

const CHARACTERS: Character[] = [
  {
    id: '1',
    name: 'Sarah',
    avatar: 'https://images.unsplash.com/photo-1623594675959-02360202d4d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc2NDkyNjkyNHww&ixlib=rb-4.1.0&q=80&w=1080',
    voiceType: 'Professional Female (Higher pitch, clear)'
  },
  {
    id: '2',
    name: 'Marcus',
    avatar: 'https://images.unsplash.com/photo-1672685667592-0392f458f46f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYW4lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjQ4NTk2NzR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    voiceType: 'Deep Male Voice (Low pitch, authoritative)'
  },
  {
    id: '3',
    name: 'Alex',
    avatar: 'https://images.unsplash.com/photo-1724941407869-f8fb46a3cc38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHByb2Zlc3Npb25hbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc2NDg2NTY4OHww&ixlib=rb-4.1.0&q=80&w=1080',
    voiceType: 'Energetic Young Voice (Fast pace, upbeat)'
  },
  {
    id: '4',
    name: 'Jordan',
    avatar: 'https://images.unsplash.com/photo-1530281834572-02d15fa61f64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHBlcnNvbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc2NDk1NzU1MHww&ixlib=rb-4.1.0&q=80&w=1080',
    voiceType: 'Warm Narrator (Neutral pitch, steady pace)'
  }
];

interface CharacterSelectorProps {
  selectedCharacter: Character | null;
  onSelectCharacter: (character: Character) => void;
}

export function CharacterSelector({ selectedCharacter, onSelectCharacter }: CharacterSelectorProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-900">Choose Your AI Character</h2>
        <div className="flex items-center gap-2 bg-gradient-to-r from-red-50 to-pink-50 text-red-700 px-3 py-1 rounded-lg text-xs border border-red-200">
          <span>🎬</span>
          <span className="font-semibold">Video Ready</span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CHARACTERS.map(character => (
          <button
            key={character.id}
            onClick={() => onSelectCharacter(character)}
            className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
              selectedCharacter?.id === character.id
                ? 'border-purple-500 bg-purple-50 shadow-lg'
                : 'border-gray-200 hover:border-purple-300'
            }`}
          >
            <div className="aspect-square rounded-lg overflow-hidden mb-3">
              <img 
                src={character.avatar} 
                alt={character.name}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-gray-900 mb-1">{character.name}</p>
            <p className="text-gray-500 text-sm">{character.voiceType}</p>
          </button>
        ))}
      </div>
    </div>
  );
}