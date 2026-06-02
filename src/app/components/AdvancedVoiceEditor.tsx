import { useState, useRef } from 'react';
import { Play, Pause, Volume2, Settings, Upload, Mic, User as UserIcon } from 'lucide-react';
import { VOICE_LIBRARY, VoiceProfile, VOICE_CATEGORIES } from '../utils/voiceLibrary';

interface AdvancedVoiceEditorProps {
  script: string;
  onVoiceSelect: (voice: VoiceProfile) => void;
  onScriptUpdate: (script: string) => void;
  selectedVoice?: VoiceProfile;
}

export function AdvancedVoiceEditor({
  script,
  onVoiceSelect,
  onScriptUpdate,
  selectedVoice
}: AdvancedVoiceEditorProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [filterLanguage, setFilterLanguage] = useState<string>('all');
  const [filterVibe, setFilterVibe] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [pitch, setPitch] = useState(selectedVoice?.settings.pitch || 1.0);
  const [rate, setRate] = useState(selectedVoice?.settings.rate || 1.0);
  const [volume, setVolume] = useState(selectedVoice?.settings.volume || 1.0);
  const [pauseMs, setPauseMs] = useState(500);
  const [showPhoneticOverride, setShowPhoneticOverride] = useState(false);
  const [phoneticWord, setPhoneticWord] = useState('');
  const [phoneticSpelling, setPhoneticSpelling] = useState('');
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const filteredVoices = VOICE_LIBRARY.filter(voice => {
    if (filterLanguage !== 'all' && voice.language !== filterLanguage) return false;
    if (filterVibe !== 'all' && voice.vibe !== filterVibe) return false;
    if (filterGender !== 'all' && voice.gender !== filterGender) return false;
    return true;
  });

  const handlePreview = (voice: VoiceProfile = selectedVoice!) => {
    if (!voice) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(voice.sampleText || script.substring(0, 100));
    utteranceRef.current = utterance;

    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.volume = volume;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const insertPause = () => {
    const textarea = document.getElementById('script-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = script;
    const before = text.substring(0, start);
    const after = text.substring(end);
    
    const pauseMarker = `[PAUSE:${pauseMs}ms]`;
    const newText = before + pauseMarker + after;
    
    onScriptUpdate(newText);
  };

  const addPhoneticOverride = () => {
    if (!phoneticWord || !phoneticSpelling) return;

    const override = `{${phoneticWord}=${phoneticSpelling}}`;
    const newScript = script + ' ' + override;
    onScriptUpdate(newScript);
    
    setPhoneticWord('');
    setPhoneticSpelling('');
    setShowPhoneticOverride(false);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In production, upload audio file for voice cloning
    console.log('Audio file uploaded for voice cloning:', file.name);
    alert('Voice cloning feature: Audio uploaded successfully! (Demo mode)');
  };

  return (
    <div className="space-y-6">
      {/* Voice Library */}
      <div>
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-purple-600" />
          Voice Library (50+ Voices)
        </h3>

        {/* Filters */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Language</label>
            <select
              value={filterLanguage}
              onChange={e => setFilterLanguage(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
            >
              <option value="all">All Languages</option>
              {VOICE_CATEGORIES.languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Vibe</label>
            <select
              value={filterVibe}
              onChange={e => setFilterVibe(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
            >
              <option value="all">All Vibes</option>
              {VOICE_CATEGORIES.vibes.map(vibe => (
                <option key={vibe} value={vibe}>{vibe.charAt(0).toUpperCase() + vibe.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Gender</label>
            <select
              value={filterGender}
              onChange={e => setFilterGender(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
            >
              <option value="all">All</option>
              {VOICE_CATEGORIES.genders.map(gender => (
                <option key={gender} value={gender}>{gender.charAt(0).toUpperCase() + gender.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Voice Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 bg-gray-50 rounded-lg">
          {filteredVoices.map(voice => (
            <button
              key={voice.id}
              onClick={() => {
                onVoiceSelect(voice);
                setPitch(voice.settings.pitch);
                setRate(voice.settings.rate);
                setVolume(voice.settings.volume);
              }}
              className={`p-3 border-2 rounded-lg text-left transition-all ${
                selectedVoice?.id === voice.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-sm">{voice.name}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(voice);
                  }}
                  className="p-1 hover:bg-purple-200 rounded"
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </button>
              </div>
              <p className="text-xs text-gray-600">{voice.accent} • {voice.vibe}</p>
              <div className="flex gap-1 mt-1">
                <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{voice.gender}</span>
                <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{voice.ageGroup}</span>
              </div>
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Showing {filteredVoices.length} of {VOICE_LIBRARY.length} voices
        </p>
      </div>

      {/* Voice Settings */}
      {selectedVoice && (
        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
          <h4 className="font-bold mb-3 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Voice Settings: {selectedVoice.name}
          </h4>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <label className="font-semibold">Pitch</label>
                <span className="text-gray-600">{pitch.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.05"
                value={pitch}
                onChange={e => setPitch(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <label className="font-semibold">Speed/Rate</label>
                <span className="text-gray-600">{rate.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.05"
                value={rate}
                onChange={e => setRate(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <label className="font-semibold">Volume</label>
                <span className="text-gray-600">{volume.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <button
              onClick={() => handlePreview()}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              Preview Voice
            </button>
          </div>
        </div>
      )}

      {/* Script Editor */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="font-bold">Script Editor</label>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPhoneticOverride(!showPhoneticOverride)}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-semibold"
            >
              Phonetic Override
            </button>
            <button
              onClick={insertPause}
              className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-semibold"
            >
              Insert Pause ({pauseMs}ms)
            </button>
          </div>
        </div>

        <textarea
          id="script-editor"
          value={script}
          onChange={e => onScriptUpdate(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none resize-none font-mono text-sm"
          rows={8}
          placeholder="Enter your script here..."
        />

        <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
          <span>{script.length} characters • {script.split(' ').length} words</span>
          <div className="flex items-center gap-2">
            <label>Pause Duration:</label>
            <input
              type="number"
              value={pauseMs}
              onChange={e => setPauseMs(parseInt(e.target.value))}
              className="w-20 px-2 py-1 border border-gray-300 rounded"
              min="100"
              max="5000"
              step="100"
            />
            <span>ms</span>
          </div>
        </div>
      </div>

      {/* Phonetic Override */}
      {showPhoneticOverride && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <h4 className="font-bold mb-3">Phonetic Override</h4>
          <p className="text-sm text-gray-700 mb-3">
            Spell out complex words phonetically to guide pronunciation
          </p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              value={phoneticWord}
              onChange={e => setPhoneticWord(e.target.value)}
              placeholder="Word (e.g., SQL)"
              className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
            <input
              type="text"
              value={phoneticSpelling}
              onChange={e => setPhoneticSpelling(e.target.value)}
              placeholder="Phonetic (e.g., S-Q-L)"
              className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={addPhoneticOverride}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Add Override
          </button>
        </div>
      )}

      {/* Alternative Input Methods */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4">
        <h4 className="font-bold mb-3">Alternative Input Methods</h4>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => audioInputRef.current?.click()}
            className="px-4 py-3 bg-white border-2 border-orange-300 rounded-lg hover:bg-orange-50 transition-all flex items-center justify-center gap-2 font-semibold"
          >
            <Upload className="w-5 h-5" />
            Upload Audio (.mp3)
          </button>
          <button
            onClick={() => alert('Voice recording feature (Demo mode)')}
            className="px-4 py-3 bg-white border-2 border-orange-300 rounded-lg hover:bg-orange-50 transition-all flex items-center justify-center gap-2 font-semibold"
          >
            <Mic className="w-5 h-5" />
            Record Voice
          </button>
        </div>
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/mp3,audio/wav"
          onChange={handleAudioUpload}
          className="hidden"
        />
      </div>

      {/* Voice Cloning */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
        <h4 className="font-bold mb-2 flex items-center gap-2">
          <UserIcon className="w-5 h-5" />
          Voice Cloning (Premium Feature)
        </h4>
        <p className="text-sm text-gray-700 mb-3">
          Clone your own voice for personalized AI narration
        </p>
        <button
          onClick={() => alert('Voice Cloning requires consent verification. Feature available in production.')}
          className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold"
        >
          Start Voice Cloning
        </button>
        <p className="text-xs text-gray-600 mt-2">
          ✓ Secure consent verification • ✓ High-quality samples • ✓ Professional results
        </p>
      </div>
    </div>
  );
}
