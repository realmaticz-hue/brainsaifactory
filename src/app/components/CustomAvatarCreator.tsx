import { useState, useRef } from 'react';
import { X, Upload, Wand2, Save, User, Settings, Trash2 } from 'lucide-react';
import {
  AvatarPrompt,
  CustomAvatar,
  REALISTIC_VOICES,
  FREE_AI_AVATARS,
  generateAvatarFromPrompt,
  createAvatarFromPhoto,
  saveAvatar,
  getSavedAvatars,
  deleteAvatar,
  updateAvatar
} from '../utils/avatarGenerator';

interface CustomAvatarCreatorProps {
  isopen: boolean;
  onClose: () => void;
  onAvatarCreated: (avatar: CustomAvatar) => void;
}

export function CustomAvatarCreator({ isopen, onClose, onAvatarCreated }: CustomAvatarCreatorProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'photo' | 'library' | 'saved'>('create');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<'realistic' | 'artistic' | 'cartoon' | 'professional' | 'casual'>('realistic');
  const [gender, setGender] = useState<'male' | 'female' | 'neutral'>('neutral');
  const [selectedVoice, setSelectedVoice] = useState(REALISTIC_VOICES[0].id);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [savedAvatars, setSavedAvatars] = useState<CustomAvatar[]>(getSavedAvatars());
  const [editingAvatar, setEditingAvatar] = useState<CustomAvatar | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateFromPrompt = () => {
    const avatarPrompt: AvatarPrompt = {
      description: prompt,
      style,
      gender
    };

    const avatar = generateAvatarFromPrompt(avatarPrompt);
    avatar.voiceId = selectedVoice;

    saveAvatar(avatar);
    setSavedAvatars(getSavedAvatars());
    onAvatarCreated(avatar);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const avatar = await createAvatarFromPhoto(file);
      avatar.voiceId = selectedVoice;

      setPhotoPreview(avatar.imageUrl);
      saveAvatar(avatar);
      setSavedAvatars(getSavedAvatars());
      onAvatarCreated(avatar);
    } catch (error) {
      console.error('Error creating avatar from photo:', error);
    }
  };

  const handleSelectFreeAvatar = (freeAvatar: any) => {
    const avatar: CustomAvatar = {
      id: freeAvatar.id,
      name: freeAvatar.name,
      type: 'preset',
      imageUrl: freeAvatar.imageUrl,
      thumbnailUrl: freeAvatar.imageUrl,
      voiceId: selectedVoice,
      voiceSettings: {
        ...REALISTIC_VOICES[0].settings,
        language: 'en-US'
      },
      motionSettings: {
        blinkRate: 3,
        expressiveness: 0.7,
        headMovement: 0.5,
        eyeContact: 0.8
      },
      createdAt: new Date(),
      lastModified: new Date(),
      metadata: {
        gender: freeAvatar.gender,
        style: freeAvatar.style
      }
    };

    saveAvatar(avatar);
    setSavedAvatars(getSavedAvatars());
    onAvatarCreated(avatar);
  };

  const handleDeleteAvatar = (avatarId: string) => {
    deleteAvatar(avatarId);
    setSavedAvatars(getSavedAvatars());
  };

  const handleEditAvatar = (avatar: CustomAvatar) => {
    setEditingAvatar(avatar);
    setSelectedVoice(avatar.voiceId);
  };

  const handleSaveEdit = () => {
    if (!editingAvatar) return;

    updateAvatar(editingAvatar.id, {
      voiceId: selectedVoice,
      voiceSettings: REALISTIC_VOICES.find(v => v.id === selectedVoice)?.settings
    });

    setSavedAvatars(getSavedAvatars());
    setEditingAvatar(null);
  };

  if (!isopen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between text-white">
            <div>
              <h2 className="text-2xl font-bold">Custom Avatar Creator</h2>
              <p className="text-sm opacity-90">Create realistic AI avatars with custom voices</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${activeTab === 'create'
                  ? 'bg-white border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <Wand2 className="w-5 h-5 inline mr-2" />
              Generate from Text
            </button>
            <button
              onClick={() => setActiveTab('photo')}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${activeTab === 'photo'
                  ? 'bg-white border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <Upload className="w-5 h-5 inline mr-2" />
              Photo to Avatar
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${activeTab === 'library'
                  ? 'bg-white border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <User className="w-5 h-5 inline mr-2" />
              Free AI Avatars
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${activeTab === 'saved'
                  ? 'bg-white border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <Save className="w-5 h-5 inline mr-2" />
              My Avatars ({savedAvatars.length})
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Generate from Text Tab */}
            {activeTab === 'create' && (
              <div className="max-w-3xl mx-auto space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Describe Your Avatar</label>
                  <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="E.g., A professional businesswoman in her 30s with short dark hair, wearing a blazer, friendly smile..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Style</label>
                    <select
                      value={style}
                      onChange={e => setStyle(e.target.value as any)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    >
                      <option value="realistic">Realistic</option>
                      <option value="professional">Professional</option>
                      <option value="artistic">Artistic</option>
                      <option value="cartoon">Cartoon</option>
                      <option value="casual">Casual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Gender</label>
                    <select
                      value={gender}
                      onChange={e => setGender(e.target.value as any)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    >
                      <option value="neutral">Any</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Voice Profile</label>
                  <div className="grid grid-cols-2 gap-3">
                    {REALISTIC_VOICES.map(voice => (
                      <button
                        key={voice.id}
                        onClick={() => setSelectedVoice(voice.id)}
                        className={`p-3 border-2 rounded-lg text-left transition-all ${selectedVoice === voice.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                          }`}
                      >
                        <p className="font-semibold text-sm">{voice.name}</p>
                        <p className="text-xs text-gray-600">{voice.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerateFromPrompt}
                  disabled={!prompt.trim()}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Wand2 className="w-5 h-5" />
                  Generate Avatar
                </button>
              </div>
            )}

            {/* Photo to Avatar Tab */}
            {activeTab === 'photo' && (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="text-center">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-4 border-dashed border-gray-300 rounded-2xl p-12 hover:border-purple-500 transition-all cursor-pointer"
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="max-w-xs mx-auto rounded-lg" />
                    ) : (
                      <div>
                        <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 font-semibold">Click to upload a photo</p>
                        <p className="text-sm text-gray-500 mt-2">JPEG, PNG up to 10MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">💡 Photo Tips</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>✓ Use a clear, well-lit photo</li>
                    <li>✓ Face should be visible and centered</li>
                    <li>✓ Avoid sunglasses or face coverings</li>
                    <li>✓ Neutral background works best</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Select Voice</label>
                  <div className="grid grid-cols-2 gap-3">
                    {REALISTIC_VOICES.slice(0, 4).map(voice => (
                      <button
                        key={voice.id}
                        onClick={() => setSelectedVoice(voice.id)}
                        className={`p-3 border-2 rounded-lg text-left transition-all ${selectedVoice === voice.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                          }`}
                      >
                        <p className="font-semibold text-sm">{voice.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Free AI Avatars Tab */}
            {activeTab === 'library' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-2">Free AI Avatars Collection</h3>
                  <p className="text-gray-600">Professional avatars ready to use</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {FREE_AI_AVATARS.map(avatar => (
                    <div key={avatar.id} className="group relative">
                      <div className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 group-hover:border-purple-500 transition-all">
                        <img
                          src={avatar.imageUrl}
                          alt={avatar.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="mt-2">
                        <p className="font-semibold text-sm">{avatar.name}</p>
                        <p className="text-xs text-gray-500">{avatar.style}</p>
                      </div>
                      <button
                        onClick={() => handleSelectFreeAvatar(avatar)}
                        className="mt-2 w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold"
                      >
                        Use Avatar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Saved Avatars Tab */}
            {activeTab === 'saved' && (
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">My Custom Avatars</h3>
                    <p className="text-gray-600">Manage and edit your created avatars</p>
                  </div>
                </div>

                {savedAvatars.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-xl">
                    <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No saved avatars yet</p>
                    <p className="text-sm text-gray-500 mt-2">Create your first avatar to get started</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {savedAvatars.map(avatar => (
                      <div key={avatar.id} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-purple-500 transition-all">
                        <div className="aspect-square rounded-lg overflow-hidden mb-3">
                          <img
                            src={avatar.imageUrl}
                            alt={avatar.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="mb-3">
                          <p className="font-semibold text-sm">{avatar.name}</p>
                          <p className="text-xs text-gray-500">
                            {avatar.type} • {new Date(avatar.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => onAvatarCreated(avatar)}
                            className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold"
                          >
                            Use
                          </button>
                          <button
                            onClick={() => handleEditAvatar(avatar)}
                            className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAvatar(avatar.id)}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Edit Modal */}
          {editingAvatar && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-bold mb-4">Edit Avatar Settings</h3>

                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Voice Profile</label>
                  <select
                    value={selectedVoice}
                    onChange={e => setSelectedVoice(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  >
                    {REALISTIC_VOICES.map(voice => (
                      <option key={voice.id} value={voice.id}>{voice.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingAvatar(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
