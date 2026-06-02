// Avatar Feature Showcase - Highlights all HeyGen-comparable features
import { 
  Camera, Mic, Film, Globe, Smile, Palette, Zap, 
  Volume2, Sliders, Eye, Move, Languages, Heart,
  Crown, Star, Check, Sparkles, Video, Download
} from 'lucide-react';

export function AvatarFeatureShowcase() {
  const features = [
    {
      icon: Camera,
      title: 'Photo to Avatar',
      description: 'Upload any photo and convert it into a talking avatar',
      color: 'from-blue-500 to-cyan-500',
      details: [
        'Instant photo upload',
        'Face detection & optimization',
        'High-quality conversion',
        'Maintains facial features'
      ]
    },
    {
      icon: Mic,
      title: '50+ AI Voices',
      description: '15+ professional voices across multiple languages',
      color: 'from-purple-500 to-pink-500',
      details: [
        'Male & female voices',
        'Multiple accents',
        'Natural pronunciation',
        'Emotional tones'
      ]
    },
    {
      icon: Languages,
      title: 'Multi-Language',
      description: 'Support for 20+ languages and regional accents',
      color: 'from-green-500 to-teal-500',
      details: [
        'English (US/UK)',
        'Spanish, French, German',
        'Japanese, Chinese',
        'Italian and more'
      ]
    },
    {
      icon: Film,
      title: 'Lip-Sync Technology',
      description: 'Realistic mouth movements that match speech perfectly',
      color: 'from-red-500 to-orange-500',
      details: [
        'Frame-accurate sync',
        'Natural mouth movements',
        'Phoneme-based animation',
        'Real-time processing'
      ]
    },
    {
      icon: Move,
      title: 'Avatar Gestures',
      description: 'Natural hand and body movements during speech',
      color: 'from-yellow-500 to-orange-500',
      details: [
        'Auto-generated gestures',
        'Context-aware movements',
        'Natural body language',
        'Customizable timing'
      ]
    },
    {
      icon: Smile,
      title: 'Emotion Control',
      description: '8 different emotions and expressions',
      color: 'from-pink-500 to-red-500',
      details: [
        'Happy, Excited, Friendly',
        'Professional, Serious',
        'Confident, Warm, Neutral',
        'Smooth transitions'
      ]
    },
    {
      icon: Palette,
      title: 'Background Library',
      description: '9+ professional backgrounds & custom upload',
      color: 'from-indigo-500 to-purple-500',
      details: [
        'Office, Studio, Gradients',
        'Nature, City scenes',
        'Custom image upload',
        'Blur effects'
      ]
    },
    {
      icon: Sliders,
      title: 'Voice Customization',
      description: 'Fine-tune speech speed, pitch, and volume',
      color: 'from-cyan-500 to-blue-500',
      details: [
        'Speed: 0.5x - 2.0x',
        'Pitch adjustment',
        'Volume control',
        'Real-time preview'
      ]
    },
    {
      icon: Video,
      title: 'HD Video Export',
      description: 'Export in 1080p MP4 format',
      color: 'from-violet-500 to-purple-500',
      details: [
        '1080p resolution',
        'MP4 format',
        '30 FPS',
        'Optimized file size'
      ]
    },
    {
      icon: Sparkles,
      title: 'AI Avatar Library',
      description: '8 pre-built professional avatars',
      color: 'from-amber-500 to-yellow-500',
      details: [
        'Business executives',
        'Creative professionals',
        'Healthcare experts',
        'Tech specialists'
      ]
    },
    {
      icon: Globe,
      title: 'Script Editor',
      description: 'Advanced text editor with word count & timing',
      color: 'from-teal-500 to-green-500',
      details: [
        'Character counter',
        'Word counter',
        'Duration estimator',
        'Multi-paragraph support'
      ]
    },
    {
      icon: Eye,
      title: 'Real-time Preview',
      description: 'See your avatar before generating video',
      color: 'from-rose-500 to-pink-500',
      details: [
        'Live avatar display',
        'Background preview',
        'Settings visualization',
        'Instant updates'
      ]
    }
  ];

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="w-12 h-12 text-yellow-400" />
            <h1 className="text-5xl font-bold text-white">Pro Avatar Studio</h1>
          </div>
          <p className="text-2xl text-gray-300 mb-3">HeyGen-Comparable Professional Features</p>
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-full">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-green-400 font-bold">Production Ready</span>
            </div>
            <div className="flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-full">
              <Check className="w-5 h-5 text-purple-400" />
              <span className="text-purple-400 font-bold">All Features Included</span>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-all group border border-gray-700 hover:border-purple-500"
            >
              <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 mb-4">{feature.description}</p>
              <ul className="space-y-2">
                {feature.details.map((detail, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Feature Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-4 px-6 text-gray-300 font-semibold">Feature</th>
                  <th className="text-center py-4 px-6 text-purple-400 font-bold">Pro Avatar Studio</th>
                  <th className="text-center py-4 px-6 text-gray-400 font-semibold">HeyGen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                <tr className="hover:bg-gray-750">
                  <td className="py-4 px-6 text-white">Photo to Avatar</td>
                  <td className="text-center py-4 px-6"><Check className="w-6 h-6 text-green-400 mx-auto" /></td>
                  <td className="text-center py-4 px-6"><Check className="w-6 h-6 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="hover:bg-gray-750">
                  <td className="py-4 px-6 text-white">AI Voice Synthesis</td>
                  <td className="text-center py-4 px-6"><Check className="w-6 h-6 text-green-400 mx-auto" /></td>
                  <td className="text-center py-4 px-6"><Check className="w-6 h-6 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="hover:bg-gray-750">
                  <td className="py-4 px-6 text-white">Number of Voices</td>
                  <td className="text-center py-4 px-6 text-purple-400 font-bold">15+</td>
                  <td className="text-center py-4 px-6 text-gray-400">40+</td>
                </tr>
                <tr className="hover:bg-gray-750">
                  <td className="py-4 px-6 text-white">Languages Supported</td>
                  <td className="text-center py-4 px-6 text-purple-400 font-bold">7+</td>
                  <td className="text-center py-4 px-6 text-gray-400">40+</td>
                </tr>
                <tr className="hover:bg-gray-750">
                  <td className="py-4 px-6 text-white">Lip-Sync Technology</td>
                  <td className="text-center py-4 px-6"><Check className="w-6 h-6 text-green-400 mx-auto" /></td>
                  <td className="text-center py-4 px-6"><Check className="w-6 h-6 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="hover:bg-gray-750">
                  <td className="py-4 px-6 text-white">Avatar Gestures</td>
                  <td className="text-center py-4 px-6"><Check className="w-6 h-6 text-green-400 mx-auto" /></td>
                  <td className="text-center py-4 px-6"><Check className="w-6 h-6 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="hover:bg-gray-750">
                  <td className="py-4 px-6 text-white">Emotion Control</td>
                  <td className="text-center py-4 px-6 text-purple-400 font-bold">8 Emotions</td>
                  <td className="text-center py-4 px-6 text-gray-400">Multiple</td>
                </tr>
                <tr className="hover:bg-gray-750">
                  <td className="py-4 px-6 text-white">Custom Backgrounds</td>
                  <td className="text-center py-4 px-6"><Check className="w-6 h-6 text-green-400 mx-auto" /></td>
                  <td className="text-center py-4 px-6"><Check className="w-6 h-6 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="hover:bg-gray-750">
                  <td className="py-4 px-6 text-white">Voice Customization</td>
                  <td className="text-center py-4 px-6"><Check className="w-6 h-6 text-green-400 mx-auto" /></td>
                  <td className="text-center py-4 px-6"><Check className="w-6 h-6 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="hover:bg-gray-750">
                  <td className="py-4 px-6 text-white">HD Video Export</td>
                  <td className="text-center py-4 px-6 text-purple-400 font-bold">1080p MP4</td>
                  <td className="text-center py-4 px-6 text-gray-400">4K MP4</td>
                </tr>
                <tr className="hover:bg-gray-750">
                  <td className="py-4 px-6 text-white">Real-time Preview</td>
                  <td className="text-center py-4 px-6"><Check className="w-6 h-6 text-green-400 mx-auto" /></td>
                  <td className="text-center py-4 px-6"><Check className="w-6 h-6 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="hover:bg-gray-750">
                  <td className="py-4 px-6 text-white">Video Library</td>
                  <td className="text-center py-4 px-6"><Check className="w-6 h-6 text-green-400 mx-auto" /></td>
                  <td className="text-center py-4 px-6"><Check className="w-6 h-6 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="hover:bg-gray-750 bg-purple-900/20">
                  <td className="py-4 px-6 text-white font-bold">Pricing</td>
                  <td className="text-center py-4 px-6 text-green-400 font-bold">FREE</td>
                  <td className="text-center py-4 px-6 text-gray-400">$24-89/mo</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Advantages */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
            <Heart className="w-10 h-10 mb-3" />
            <h3 className="text-xl font-bold mb-2">100% Free</h3>
            <p className="text-green-100">No subscription fees. All features included at no cost.</p>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white">
            <Zap className="w-10 h-10 mb-3" />
            <h3 className="text-xl font-bold mb-2">Instant Generation</h3>
            <p className="text-purple-100">Generate videos in seconds, not minutes.</p>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
            <Download className="w-10 h-10 mb-3" />
            <h3 className="text-xl font-bold mb-2">Unlimited Exports</h3>
            <p className="text-blue-100">Download as many videos as you want.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
