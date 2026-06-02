// Comprehensive voice library with 50+ AI voices

export interface VoiceProfile {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  accent: string;
  language: string;
  vibe: 'casual' | 'formal' | 'energetic' | 'calm' | 'professional' | 'friendly';
  ageGroup: 'young' | 'adult' | 'mature';
  description: string;
  sampleText: string;
  settings: {
    pitch: number;
    rate: number;
    volume: number;
  };
}

export const VOICE_LIBRARY: VoiceProfile[] = [
  // English - American - Female
  {
    id: 'en-us-emma-professional',
    name: 'Emma',
    gender: 'female',
    accent: 'American',
    language: 'English (US)',
    vibe: 'professional',
    ageGroup: 'adult',
    description: 'Clear, confident professional voice',
    sampleText: 'Hello, I\'m Emma. I deliver clear, professional narration.',
    settings: { pitch: 1.0, rate: 0.95, volume: 1.0 }
  },
  {
    id: 'en-us-sophia-friendly',
    name: 'Sophia',
    gender: 'female',
    accent: 'American',
    language: 'English (US)',
    vibe: 'friendly',
    ageGroup: 'adult',
    description: 'Warm, approachable voice',
    sampleText: 'Hi there! I\'m Sophia, and I love connecting with audiences.',
    settings: { pitch: 1.1, rate: 1.0, volume: 1.0 }
  },
  {
    id: 'en-us-lily-energetic',
    name: 'Lily',
    gender: 'female',
    accent: 'American',
    language: 'English (US)',
    vibe: 'energetic',
    ageGroup: 'young',
    description: 'Youthful, energetic voice',
    sampleText: 'Hey everyone! I\'m Lily and I\'m super excited to share this!',
    settings: { pitch: 1.2, rate: 1.1, volume: 1.0 }
  },
  {
    id: 'en-us-victoria-calm',
    name: 'Victoria',
    gender: 'female',
    accent: 'American',
    language: 'English (US)',
    vibe: 'calm',
    ageGroup: 'mature',
    description: 'Sophisticated, soothing voice',
    sampleText: 'Welcome. I\'m Victoria, bringing you a calm, refined experience.',
    settings: { pitch: 0.95, rate: 0.85, volume: 1.0 }
  },
  {
    id: 'en-us-rachel-casual',
    name: 'Rachel',
    gender: 'female',
    accent: 'American',
    language: 'English (US)',
    vibe: 'casual',
    ageGroup: 'adult',
    description: 'Relaxed, conversational voice',
    sampleText: 'What\'s up! I\'m Rachel, here to chat about anything.',
    settings: { pitch: 1.05, rate: 1.0, volume: 1.0 }
  },

  // English - American - Male
  {
    id: 'en-us-james-professional',
    name: 'James',
    gender: 'male',
    accent: 'American',
    language: 'English (US)',
    vibe: 'professional',
    ageGroup: 'adult',
    description: 'Authoritative, warm male voice',
    sampleText: 'Good day. I\'m James, your professional narrator.',
    settings: { pitch: 0.85, rate: 0.9, volume: 1.0 }
  },
  {
    id: 'en-us-lucas-energetic',
    name: 'Lucas',
    gender: 'male',
    accent: 'American',
    language: 'English (US)',
    vibe: 'energetic',
    ageGroup: 'young',
    description: 'Enthusiastic, dynamic voice',
    sampleText: 'Hey! I\'m Lucas and I\'m pumped to get started!',
    settings: { pitch: 0.9, rate: 1.05, volume: 1.0 }
  },
  {
    id: 'en-us-marcus-calm',
    name: 'Marcus',
    gender: 'male',
    accent: 'American',
    language: 'English (US)',
    vibe: 'calm',
    ageGroup: 'mature',
    description: 'Deep, commanding voice',
    sampleText: 'Greetings. I\'m Marcus, bringing depth to your content.',
    settings: { pitch: 0.75, rate: 0.85, volume: 1.0 }
  },
  {
    id: 'en-us-tyler-casual',
    name: 'Tyler',
    gender: 'male',
    accent: 'American',
    language: 'English (US)',
    vibe: 'casual',
    ageGroup: 'adult',
    description: 'Laid-back, friendly voice',
    sampleText: 'Hey buddy! Tyler here, keeping it real.',
    settings: { pitch: 0.88, rate: 0.95, volume: 1.0 }
  },
  {
    id: 'en-us-david-formal',
    name: 'David',
    gender: 'male',
    accent: 'American',
    language: 'English (US)',
    vibe: 'formal',
    ageGroup: 'mature',
    description: 'Professional narrator voice',
    sampleText: 'Good evening. I\'m David, your documentary narrator.',
    settings: { pitch: 0.88, rate: 0.9, volume: 1.0 }
  },

  // English - British
  {
    id: 'en-gb-charlotte-professional',
    name: 'Charlotte',
    gender: 'female',
    accent: 'British',
    language: 'English (UK)',
    vibe: 'professional',
    ageGroup: 'adult',
    description: 'Elegant British accent',
    sampleText: 'Hello, I\'m Charlotte. Bringing British elegance to your content.',
    settings: { pitch: 1.05, rate: 0.9, volume: 1.0 }
  },
  {
    id: 'en-gb-oliver-formal',
    name: 'Oliver',
    gender: 'male',
    accent: 'British',
    language: 'English (UK)',
    vibe: 'formal',
    ageGroup: 'adult',
    description: 'Refined British accent',
    sampleText: 'Good day. I\'m Oliver, speaking with British refinement.',
    settings: { pitch: 0.9, rate: 0.88, volume: 1.0 }
  },
  {
    id: 'en-gb-alice-friendly',
    name: 'Alice',
    gender: 'female',
    accent: 'British',
    language: 'English (UK)',
    vibe: 'friendly',
    ageGroup: 'young',
    description: 'Cheerful British voice',
    sampleText: 'Hiya! I\'m Alice, bringing British charm to your videos.',
    settings: { pitch: 1.15, rate: 1.0, volume: 1.0 }
  },
  {
    id: 'en-gb-henry-calm',
    name: 'Henry',
    gender: 'male',
    accent: 'British',
    language: 'English (UK)',
    vibe: 'calm',
    ageGroup: 'mature',
    description: 'Distinguished British voice',
    sampleText: 'Welcome. I\'m Henry, your distinguished narrator.',
    settings: { pitch: 0.82, rate: 0.85, volume: 1.0 }
  },

  // English - Australian
  {
    id: 'en-au-ruby-casual',
    name: 'Ruby',
    gender: 'female',
    accent: 'Australian',
    language: 'English (AU)',
    vibe: 'casual',
    ageGroup: 'adult',
    description: 'Friendly Australian accent',
    sampleText: 'G\'day! I\'m Ruby, bringing Aussie energy to your content.',
    settings: { pitch: 1.08, rate: 1.0, volume: 1.0 }
  },
  {
    id: 'en-au-jack-energetic',
    name: 'Jack',
    gender: 'male',
    accent: 'Australian',
    language: 'English (AU)',
    vibe: 'energetic',
    ageGroup: 'young',
    description: 'Upbeat Australian voice',
    sampleText: 'Hey mate! Jack here, let\'s dive right in!',
    settings: { pitch: 0.92, rate: 1.05, volume: 1.0 }
  },

  // Spanish
  {
    id: 'es-es-maria-professional',
    name: 'María',
    gender: 'female',
    accent: 'Castilian',
    language: 'Spanish (ES)',
    vibe: 'professional',
    ageGroup: 'adult',
    description: 'Clear Spanish voice',
    sampleText: 'Hola, soy María. Lista para narrar tu contenido.',
    settings: { pitch: 1.05, rate: 0.95, volume: 1.0 }
  },
  {
    id: 'es-mx-carlos-friendly',
    name: 'Carlos',
    gender: 'male',
    accent: 'Mexican',
    language: 'Spanish (MX)',
    vibe: 'friendly',
    ageGroup: 'adult',
    description: 'Warm Mexican Spanish',
    sampleText: 'Hola amigos! Soy Carlos, aquí para ayudarles.',
    settings: { pitch: 0.9, rate: 0.95, volume: 1.0 }
  },
  {
    id: 'es-ar-isabella-energetic',
    name: 'Isabella',
    gender: 'female',
    accent: 'Argentine',
    language: 'Spanish (AR)',
    vibe: 'energetic',
    ageGroup: 'young',
    description: 'Lively Argentine Spanish',
    sampleText: '¡Che! Soy Isabella, con toda la energía argentina.',
    settings: { pitch: 1.12, rate: 1.05, volume: 1.0 }
  },

  // French
  {
    id: 'fr-fr-amelie-professional',
    name: 'Amélie',
    gender: 'female',
    accent: 'Parisian',
    language: 'French',
    vibe: 'professional',
    ageGroup: 'adult',
    description: 'Elegant French voice',
    sampleText: 'Bonjour, je suis Amélie. Votre narratrice professionnelle.',
    settings: { pitch: 1.05, rate: 0.9, volume: 1.0 }
  },
  {
    id: 'fr-fr-pierre-formal',
    name: 'Pierre',
    gender: 'male',
    accent: 'Parisian',
    language: 'French',
    vibe: 'formal',
    ageGroup: 'mature',
    description: 'Distinguished French voice',
    sampleText: 'Bonjour, je m\'appelle Pierre. À votre service.',
    settings: { pitch: 0.85, rate: 0.88, volume: 1.0 }
  },

  // German
  {
    id: 'de-de-anna-professional',
    name: 'Anna',
    gender: 'female',
    accent: 'Standard',
    language: 'German',
    vibe: 'professional',
    ageGroup: 'adult',
    description: 'Clear German voice',
    sampleText: 'Guten Tag, ich bin Anna. Ihre professionelle Sprecherin.',
    settings: { pitch: 1.0, rate: 0.92, volume: 1.0 }
  },
  {
    id: 'de-de-lukas-calm',
    name: 'Lukas',
    gender: 'male',
    accent: 'Standard',
    language: 'German',
    vibe: 'calm',
    ageGroup: 'adult',
    description: 'Authoritative German voice',
    sampleText: 'Guten Tag, ich bin Lukas. Ihr zuverlässiger Sprecher.',
    settings: { pitch: 0.88, rate: 0.9, volume: 1.0 }
  },

  // Italian
  {
    id: 'it-it-giulia-friendly',
    name: 'Giulia',
    gender: 'female',
    accent: 'Roman',
    language: 'Italian',
    vibe: 'friendly',
    ageGroup: 'adult',
    description: 'Warm Italian voice',
    sampleText: 'Ciao! Sono Giulia, pronta ad aiutarti.',
    settings: { pitch: 1.08, rate: 0.95, volume: 1.0 }
  },
  {
    id: 'it-it-marco-professional',
    name: 'Marco',
    gender: 'male',
    accent: 'Roman',
    language: 'Italian',
    vibe: 'professional',
    ageGroup: 'adult',
    description: 'Confident Italian voice',
    sampleText: 'Buongiorno, sono Marco. Il tuo narratore professionale.',
    settings: { pitch: 0.9, rate: 0.92, volume: 1.0 }
  },

  // Portuguese
  {
    id: 'pt-br-ana-energetic',
    name: 'Ana',
    gender: 'female',
    accent: 'Brazilian',
    language: 'Portuguese (BR)',
    vibe: 'energetic',
    ageGroup: 'young',
    description: 'Vibrant Brazilian Portuguese',
    sampleText: 'Oi! Eu sou a Ana, cheia de energia para você!',
    settings: { pitch: 1.1, rate: 1.0, volume: 1.0 }
  },
  {
    id: 'pt-br-rafael-casual',
    name: 'Rafael',
    gender: 'male',
    accent: 'Brazilian',
    language: 'Portuguese (BR)',
    vibe: 'casual',
    ageGroup: 'adult',
    description: 'Relaxed Brazilian Portuguese',
    sampleText: 'E aí! Sou o Rafael, aqui pra te ajudar.',
    settings: { pitch: 0.92, rate: 0.95, volume: 1.0 }
  },

  // Japanese
  {
    id: 'ja-jp-yuki-professional',
    name: 'Yuki',
    gender: 'female',
    accent: 'Tokyo',
    language: 'Japanese',
    vibe: 'professional',
    ageGroup: 'adult',
    description: 'Professional Japanese voice',
    sampleText: 'こんにちは、ユキです。プロフェッショナルなナレーター。',
    settings: { pitch: 1.05, rate: 0.9, volume: 1.0 }
  },
  {
    id: 'ja-jp-takeshi-calm',
    name: 'Takeshi',
    gender: 'male',
    accent: 'Tokyo',
    language: 'Japanese',
    vibe: 'calm',
    ageGroup: 'mature',
    description: 'Calm Japanese voice',
    sampleText: 'こんにちは、タケシです。よろしくお願いします。',
    settings: { pitch: 0.88, rate: 0.88, volume: 1.0 }
  },

  // Korean
  {
    id: 'ko-kr-minji-friendly',
    name: 'Min-ji',
    gender: 'female',
    accent: 'Seoul',
    language: 'Korean',
    vibe: 'friendly',
    ageGroup: 'young',
    description: 'Friendly Korean voice',
    sampleText: '안녕하세요! 민지입니다. 만나서 반가워요!',
    settings: { pitch: 1.1, rate: 0.95, volume: 1.0 }
  },
  {
    id: 'ko-kr-junho-professional',
    name: 'Jun-ho',
    gender: 'male',
    accent: 'Seoul',
    language: 'Korean',
    vibe: 'professional',
    ageGroup: 'adult',
    description: 'Professional Korean voice',
    sampleText: '안녕하세요, 준호입니다. 전문 성우입니다.',
    settings: { pitch: 0.9, rate: 0.92, volume: 1.0 }
  },

  // Mandarin Chinese
  {
    id: 'zh-cn-xiaowei-professional',
    name: 'Xiaowei',
    gender: 'female',
    accent: 'Beijing',
    language: 'Mandarin (CN)',
    vibe: 'professional',
    ageGroup: 'adult',
    description: 'Clear Mandarin voice',
    sampleText: '你好，我是小薇。专业的配音员。',
    settings: { pitch: 1.05, rate: 0.9, volume: 1.0 }
  },
  {
    id: 'zh-cn-chen-calm',
    name: 'Chen',
    gender: 'male',
    accent: 'Beijing',
    language: 'Mandarin (CN)',
    vibe: 'calm',
    ageGroup: 'mature',
    description: 'Authoritative Mandarin voice',
    sampleText: '你好，我是陈先生。很高兴为您服务。',
    settings: { pitch: 0.88, rate: 0.88, volume: 1.0 }
  },

  // Hindi
  {
    id: 'hi-in-priya-friendly',
    name: 'Priya',
    gender: 'female',
    accent: 'Delhi',
    language: 'Hindi',
    vibe: 'friendly',
    ageGroup: 'adult',
    description: 'Warm Hindi voice',
    sampleText: 'नमस्ते! मैं प्रिया हूं। आपकी मदद के लिए तैयार।',
    settings: { pitch: 1.08, rate: 0.95, volume: 1.0 }
  },
  {
    id: 'hi-in-raj-professional',
    name: 'Raj',
    gender: 'male',
    accent: 'Delhi',
    language: 'Hindi',
    vibe: 'professional',
    ageGroup: 'adult',
    description: 'Professional Hindi voice',
    sampleText: 'नमस्ते, मैं राज हूं। आपका पेशेवर वॉयसओवर कलाकार।',
    settings: { pitch: 0.9, rate: 0.92, volume: 1.0 }
  },

  // Arabic
  {
    id: 'ar-sa-layla-professional',
    name: 'Layla',
    gender: 'female',
    accent: 'Gulf',
    language: 'Arabic',
    vibe: 'professional',
    ageGroup: 'adult',
    description: 'Professional Arabic voice',
    sampleText: 'مرحبا، أنا ليلى. المعلق الصوتي المحترف.',
    settings: { pitch: 1.05, rate: 0.9, volume: 1.0 }
  },
  {
    id: 'ar-sa-omar-formal',
    name: 'Omar',
    gender: 'male',
    accent: 'Gulf',
    language: 'Arabic',
    vibe: 'formal',
    ageGroup: 'mature',
    description: 'Formal Arabic voice',
    sampleText: 'السلام عليكم، أنا عمر. في خدمتكم.',
    settings: { pitch: 0.88, rate: 0.88, volume: 1.0 }
  },

  // Russian
  {
    id: 'ru-ru-elena-professional',
    name: 'Elena',
    gender: 'female',
    accent: 'Moscow',
    language: 'Russian',
    vibe: 'professional',
    ageGroup: 'adult',
    description: 'Professional Russian voice',
    sampleText: 'Здравствуйте, я Елена. Профессиональный диктор.',
    settings: { pitch: 1.0, rate: 0.92, volume: 1.0 }
  },
  {
    id: 'ru-ru-dmitri-calm',
    name: 'Dmitri',
    gender: 'male',
    accent: 'Moscow',
    language: 'Russian',
    vibe: 'calm',
    ageGroup: 'mature',
    description: 'Authoritative Russian voice',
    sampleText: 'Здравствуйте, я Дмитрий. К вашим услугам.',
    settings: { pitch: 0.85, rate: 0.88, volume: 1.0 }
  },

  // Dutch
  {
    id: 'nl-nl-sophie-friendly',
    name: 'Sophie',
    gender: 'female',
    accent: 'Amsterdam',
    language: 'Dutch',
    vibe: 'friendly',
    ageGroup: 'adult',
    description: 'Friendly Dutch voice',
    sampleText: 'Hallo! Ik ben Sophie, klaar om je te helpen.',
    settings: { pitch: 1.08, rate: 0.95, volume: 1.0 }
  },
  {
    id: 'nl-nl-jan-professional',
    name: 'Jan',
    gender: 'male',
    accent: 'Amsterdam',
    language: 'Dutch',
    vibe: 'professional',
    ageGroup: 'adult',
    description: 'Professional Dutch voice',
    sampleText: 'Goedendag, ik ben Jan. Jouw professionele verteller.',
    settings: { pitch: 0.9, rate: 0.92, volume: 1.0 }
  },

  // Swedish
  {
    id: 'sv-se-astrid-calm',
    name: 'Astrid',
    gender: 'female',
    accent: 'Stockholm',
    language: 'Swedish',
    vibe: 'calm',
    ageGroup: 'adult',
    description: 'Calm Swedish voice',
    sampleText: 'Hej, jag heter Astrid. Din berättare.',
    settings: { pitch: 1.05, rate: 0.9, volume: 1.0 }
  },
  {
    id: 'sv-se-erik-professional',
    name: 'Erik',
    gender: 'male',
    accent: 'Stockholm',
    language: 'Swedish',
    vibe: 'professional',
    ageGroup: 'adult',
    description: 'Professional Swedish voice',
    sampleText: 'Hej, jag är Erik. Din professionella röstskådespelare.',
    settings: { pitch: 0.88, rate: 0.9, volume: 1.0 }
  },

  // Polish
  {
    id: 'pl-pl-zofia-friendly',
    name: 'Zofia',
    gender: 'female',
    accent: 'Warsaw',
    language: 'Polish',
    vibe: 'friendly',
    ageGroup: 'adult',
    description: 'Friendly Polish voice',
    sampleText: 'Cześć! Jestem Zofia, gotowa ci pomóc.',
    settings: { pitch: 1.08, rate: 0.95, volume: 1.0 }
  },
  {
    id: 'pl-pl-adam-professional',
    name: 'Adam',
    gender: 'male',
    accent: 'Warsaw',
    language: 'Polish',
    vibe: 'professional',
    ageGroup: 'adult',
    description: 'Professional Polish voice',
    sampleText: 'Dzień dobry, jestem Adam. Twój profesjonalny lektor.',
    settings: { pitch: 0.9, rate: 0.92, volume: 1.0 }
  },

  // Turkish
  {
    id: 'tr-tr-elif-energetic',
    name: 'Elif',
    gender: 'female',
    accent: 'Istanbul',
    language: 'Turkish',
    vibe: 'energetic',
    ageGroup: 'young',
    description: 'Energetic Turkish voice',
    sampleText: 'Merhaba! Ben Elif, size yardımcı olmak için buradayım!',
    settings: { pitch: 1.1, rate: 1.0, volume: 1.0 }
  },
  {
    id: 'tr-tr-mehmet-professional',
    name: 'Mehmet',
    gender: 'male',
    accent: 'Istanbul',
    language: 'Turkish',
    vibe: 'professional',
    ageGroup: 'adult',
    description: 'Professional Turkish voice',
    sampleText: 'Merhaba, ben Mehmet. Profesyonel seslendirme sanatçınız.',
    settings: { pitch: 0.9, rate: 0.92, volume: 1.0 }
  },

  // Norwegian
  {
    id: 'no-no-ingrid-calm',
    name: 'Ingrid',
    gender: 'female',
    accent: 'Oslo',
    language: 'Norwegian',
    vibe: 'calm',
    ageGroup: 'adult',
    description: 'Calm Norwegian voice',
    sampleText: 'Hei, jeg heter Ingrid. Din forteller.',
    settings: { pitch: 1.05, rate: 0.9, volume: 1.0 }
  },
  {
    id: 'no-no-lars-professional',
    name: 'Lars',
    gender: 'male',
    accent: 'Oslo',
    language: 'Norwegian',
    vibe: 'professional',
    ageGroup: 'adult',
    description: 'Professional Norwegian voice',
    sampleText: 'Hei, jeg er Lars. Din profesjonelle stemme.',
    settings: { pitch: 0.88, rate: 0.9, volume: 1.0 }
  },

  // Danish
  {
    id: 'da-dk-emma-friendly',
    name: 'Emma',
    gender: 'female',
    accent: 'Copenhagen',
    language: 'Danish',
    vibe: 'friendly',
    ageGroup: 'adult',
    description: 'Friendly Danish voice',
    sampleText: 'Hej! Jeg hedder Emma, klar til at hjælpe dig.',
    settings: { pitch: 1.08, rate: 0.95, volume: 1.0 }
  },
  {
    id: 'da-dk-morten-professional',
    name: 'Morten',
    gender: 'male',
    accent: 'Copenhagen',
    language: 'Danish',
    vibe: 'professional',
    ageGroup: 'adult',
    description: 'Professional Danish voice',
    sampleText: 'Hej, jeg er Morten. Din professionelle speaker.',
    settings: { pitch: 0.9, rate: 0.92, volume: 1.0 }
  },

  // Finnish
  {
    id: 'fi-fi-aino-calm',
    name: 'Aino',
    gender: 'female',
    accent: 'Helsinki',
    language: 'Finnish',
    vibe: 'calm',
    ageGroup: 'adult',
    description: 'Calm Finnish voice',
    sampleText: 'Hei, olen Aino. Kertojasi.',
    settings: { pitch: 1.05, rate: 0.9, volume: 1.0 }
  },
  {
    id: 'fi-fi-mikko-professional',
    name: 'Mikko',
    gender: 'male',
    accent: 'Helsinki',
    language: 'Finnish',
    vibe: 'professional',
    ageGroup: 'adult',
    description: 'Professional Finnish voice',
    sampleText: 'Hei, olen Mikko. Ammattimainen puhujasi.',
    settings: { pitch: 0.88, rate: 0.9, volume: 1.0 }
  }
];

export function getVoicesByLanguage(language: string): VoiceProfile[] {
  return VOICE_LIBRARY.filter(v => v.language === language);
}

export function getVoicesByVibe(vibe: string): VoiceProfile[] {
  return VOICE_LIBRARY.filter(v => v.vibe === vibe);
}

export function getVoicesByGender(gender: string): VoiceProfile[] {
  return VOICE_LIBRARY.filter(v => v.gender === gender);
}

export function getVoiceById(id: string): VoiceProfile | undefined {
  return VOICE_LIBRARY.find(v => v.id === id);
}

export const VOICE_CATEGORIES = {
  languages: Array.from(new Set(VOICE_LIBRARY.map(v => v.language))).sort(),
  accents: Array.from(new Set(VOICE_LIBRARY.map(v => v.accent))).sort(),
  vibes: ['casual', 'formal', 'energetic', 'calm', 'professional', 'friendly'] as const,
  genders: ['male', 'female', 'neutral'] as const
};
