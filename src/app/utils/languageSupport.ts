// Multi-language support for AI-generated content

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  rtl: boolean;
  flag: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  // European Languages (50+)
  { code: 'en', name: 'English', nativeName: 'English', rtl: false, flag: '🇺🇸', region: 'Europe' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', rtl: false, flag: '🇪🇸', region: 'Europe' },
  { code: 'fr', name: 'French', nativeName: 'Français', rtl: false, flag: '🇫🇷', region: 'Europe' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', rtl: false, flag: '🇩🇪', region: 'Europe' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', rtl: false, flag: '🇮🇹', region: 'Europe' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', rtl: false, flag: '🇵🇹', region: 'Europe' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', rtl: false, flag: '🇷🇺', region: 'Europe' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', rtl: false, flag: '🇵🇱', region: 'Europe' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', rtl: false, flag: '🇳🇱', region: 'Europe' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', rtl: false, flag: '🇸🇪', region: 'Europe' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', rtl: false, flag: '🇬🇷', region: 'Europe' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', rtl: false, flag: '🇨🇿', region: 'Europe' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', rtl: false, flag: '🇷🇴', region: 'Europe' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', rtl: false, flag: '🇭🇺', region: 'Europe' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', rtl: false, flag: '🇩🇰', region: 'Europe' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', rtl: false, flag: '🇫🇮', region: 'Europe' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', rtl: false, flag: '🇳🇴', region: 'Europe' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', rtl: false, flag: '🇺🇦', region: 'Europe' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', rtl: false, flag: '🇧🇬', region: 'Europe' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', rtl: false, flag: '🇷🇸', region: 'Europe' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', rtl: false, flag: '🇭🇷', region: 'Europe' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', rtl: false, flag: '🇸🇰', region: 'Europe' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', rtl: false, flag: '🇸🇮', region: 'Europe' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', rtl: false, flag: '🇱🇹', region: 'Europe' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', rtl: false, flag: '🇱🇻', region: 'Europe' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', rtl: false, flag: '🇪🇪', region: 'Europe' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska', rtl: false, flag: '🇮🇸', region: 'Europe' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', rtl: false, flag: '🇮🇪', region: 'Europe' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', rtl: false, flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', region: 'Europe' },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip', rtl: false, flag: '🇦🇱', region: 'Europe' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', rtl: false, flag: '🇲🇰', region: 'Europe' },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', rtl: false, flag: '🇧🇦', region: 'Europe' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti', rtl: false, flag: '🇲🇹', region: 'Europe' },
  { code: 'lb', name: 'Luxembourgish', nativeName: 'Lëtzebuergesch', rtl: false, flag: '🇱🇺', region: 'Europe' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català', rtl: false, flag: '🇪🇸', region: 'Europe' },
  { code: 'eu', name: 'Basque', nativeName: 'Euskara', rtl: false, flag: '🇪🇸', region: 'Europe' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego', rtl: false, flag: '🇪🇸', region: 'Europe' },
  { code: 'be', name: 'Belarusian', nativeName: 'Беларуская', rtl: false, flag: '🇧🇾', region: 'Europe' },
  
  // Asian Languages (40+)
  { code: 'ja', name: 'Japanese', nativeName: '日本語', rtl: false, flag: '🇯🇵', region: 'Asia' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', rtl: false, flag: '🇰🇷', region: 'Asia' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文', rtl: false, flag: '🇨🇳', region: 'Asia' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', rtl: false, flag: '🇹🇼', region: 'Asia' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', rtl: false, flag: '🇮🇳', region: 'Asia' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', rtl: false, flag: '🇧🇩', region: 'Asia' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', rtl: false, flag: '🇮🇳', region: 'Asia' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', rtl: false, flag: '🇮🇩', region: 'Asia' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', rtl: false, flag: '🇻🇳', region: 'Asia' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', rtl: false, flag: '🇹🇭', region: 'Asia' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', rtl: false, flag: '🇲🇾', region: 'Asia' },
  { code: 'tl', name: 'Tagalog', nativeName: 'Tagalog', rtl: false, flag: '🇵🇭', region: 'Asia' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', rtl: false, flag: '🇮🇳', region: 'Asia' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', rtl: false, flag: '🇮🇳', region: 'Asia' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', rtl: false, flag: '🇮🇳', region: 'Asia' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', rtl: false, flag: '🇮🇳', region: 'Asia' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', rtl: false, flag: '🇮🇳', region: 'Asia' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', rtl: false, flag: '🇮🇳', region: 'Asia' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', rtl: false, flag: '🇱🇰', region: 'Asia' },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာ', rtl: false, flag: '🇲🇲', region: 'Asia' },
  { code: 'km', name: 'Khmer', nativeName: 'ភាសាខ្មែរ', rtl: false, flag: '🇰🇭', region: 'Asia' },
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ', rtl: false, flag: '🇱🇦', region: 'Asia' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', rtl: false, flag: '🇳🇵', region: 'Asia' },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол', rtl: false, flag: '🇲🇳', region: 'Asia' },
  { code: 'ug', name: 'Uyghur', nativeName: 'ئۇيغۇرچە', rtl: true, flag: '🇨🇳', region: 'Asia' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული', rtl: false, flag: '🇬🇪', region: 'Asia' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն', rtl: false, flag: '🇦🇲', region: 'Asia' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan', rtl: false, flag: '🇦🇿', region: 'Asia' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақ', rtl: false, flag: '🇰🇿', region: 'Asia' },
  { code: 'uz', name: 'Uzbek', nativeName: 'O\'zbek', rtl: false, flag: '🇺🇿', region: 'Asia' },
  { code: 'tk', name: 'Turkmen', nativeName: 'Türkmen', rtl: false, flag: '🇹🇲', region: 'Asia' },
  { code: 'tg', name: 'Tajik', nativeName: 'Тоҷикӣ', rtl: false, flag: '🇹🇯', region: 'Asia' },
  { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргызча', rtl: false, flag: '🇰🇬', region: 'Asia' },
  
  // Middle Eastern Languages (15+)
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true, flag: '🇸🇦', region: 'Middle East' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', rtl: true, flag: '🇮🇱', region: 'Middle East' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', rtl: true, flag: '🇮🇷', region: 'Middle East' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', rtl: true, flag: '🇵🇰', region: 'Middle East' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', rtl: false, flag: '🇹🇷', region: 'Middle East' },
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو', rtl: true, flag: '🇦🇫', region: 'Middle East' },
  { code: 'ku', name: 'Kurdish', nativeName: 'کوردی', rtl: true, flag: '🇮🇶', region: 'Middle East' },
  
  // African Languages (20+)
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', rtl: false, flag: '🇰🇪', region: 'Africa' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', rtl: false, flag: '🇪🇹', region: 'Africa' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', rtl: false, flag: '🇳🇬', region: 'Africa' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', rtl: false, flag: '🇳🇬', region: 'Africa' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo', rtl: false, flag: '🇳🇬', region: 'Africa' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', rtl: false, flag: '🇿🇦', region: 'Africa' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', rtl: false, flag: '🇿🇦', region: 'Africa' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', rtl: false, flag: '🇿🇦', region: 'Africa' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali', rtl: false, flag: '🇸🇴', region: 'Africa' },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', rtl: false, flag: '🇷🇼', region: 'Africa' },
  { code: 'mg', name: 'Malagasy', nativeName: 'Malagasy', rtl: false, flag: '🇲🇬', region: 'Africa' },
  { code: 'sn', name: 'Shona', nativeName: 'chiShona', rtl: false, flag: '🇿🇼', region: 'Africa' },
  { code: 'ny', name: 'Chichewa', nativeName: 'Chichewa', rtl: false, flag: '🇲🇼', region: 'Africa' },
  
  // Americas Languages (10+)
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', rtl: false, flag: '🇧🇷', region: 'Americas' },
  { code: 'es-MX', name: 'Spanish (Mexico)', nativeName: 'Español (México)', rtl: false, flag: '🇲🇽', region: 'Americas' },
  { code: 'es-AR', name: 'Spanish (Argentina)', nativeName: 'Español (Argentina)', rtl: false, flag: '🇦🇷', region: 'Americas' },
  { code: 'qu', name: 'Quechua', nativeName: 'Runa Simi', rtl: false, flag: '🇵🇪', region: 'Americas' },
  { code: 'gn', name: 'Guarani', nativeName: 'Guarani', rtl: false, flag: '🇵🇾', region: 'Americas' },
  { code: 'ht', name: 'Haitian Creole', nativeName: 'Kreyòl', rtl: false, flag: '🇭🇹', region: 'Americas' },
  
  // Pacific Languages (5+)
  { code: 'mi', name: 'Maori', nativeName: 'Te Reo Māori', rtl: false, flag: '🇳🇿', region: 'Pacific' },
  { code: 'sm', name: 'Samoan', nativeName: 'Gagana Samoa', rtl: false, flag: '🇼🇸', region: 'Pacific' },
  { code: 'to', name: 'Tongan', nativeName: 'Lea Faka-Tonga', rtl: false, flag: '🇹🇴', region: 'Pacific' },
  { code: 'fj', name: 'Fijian', nativeName: 'Vosa Vakaviti', rtl: false, flag: '🇫🇯', region: 'Pacific' },
  { code: 'haw', name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi', rtl: false, flag: '🇺🇸', region: 'Pacific' },
];

// Translation templates for common ad phrases
const TRANSLATIONS: Record<string, Record<string, string>> = {
  'Shop Now': {
    es: 'Comprar Ahora',
    fr: 'Acheter Maintenant',
    de: 'Jetzt Kaufen',
    it: 'Acquista Ora',
    pt: 'Compre Agora',
    ja: '今すぐ購入',
    zh: '立即购买',
    ar: 'تسوق الآن',
    ru: 'Купить Сейчас'
  },
  'Learn More': {
    es: 'Más Información',
    fr: 'En Savoir Plus',
    de: 'Mehr Erfahren',
    it: 'Scopri di Più',
    pt: 'Saiba Mais',
    ja: '詳細を見る',
    zh: '了解更多',
    ar: 'اعرف المزيد',
    ru: 'Узнать Больше'
  },
  'Get Started': {
    es: 'Empezar',
    fr: 'Commencer',
    de: 'Jetzt Starten',
    it: 'Inizia Ora',
    pt: 'Começar',
    ja: '始める',
    zh: '开始使用',
    ar: 'ابدأ الآن',
    ru: 'Начать'
  },
  'Limited Time': {
    es: 'Tiempo Limitado',
    fr: 'Offre Limitée',
    de: 'Zeitlich Begrenzt',
    it: 'Tempo Limitato',
    pt: 'Tempo Limitado',
    ja: '期間限定',
    zh: '限时优惠',
    ar: 'وقت محدود',
    ru: 'Ограниченное Предложение'
  },
  'Free Shipping': {
    es: 'Envío Gratis',
    fr: 'Livraison Gratuite',
    de: 'Kostenloser Versand',
    it: 'Spedizione Gratuita',
    pt: 'Frete Grátis',
    ja: '送料無料',
    zh: '免费送货',
    ar: 'شحن مجاني',
    ru: 'Бесплатная Доставка'
  }
};

export function translateText(text: string, targetLang: string): string {
  // Check if we have a direct translation
  if (TRANSLATIONS[text] && TRANSLATIONS[text][targetLang]) {
    return TRANSLATIONS[text][targetLang];
  }
  
  // For demo purposes, return original text
  // In production, this would call a translation API
  return text;
}

export function getLanguageByCode(code: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

export function getPopularLanguages(): Language[] {
  const popularCodes = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'ar', 'ru', 'hi', 'ko'];
  return SUPPORTED_LANGUAGES.filter(lang => popularCodes.includes(lang.code));
}

export function groupLanguagesByRegion(): Record<string, Language[]> {
  return {
    'Europe': SUPPORTED_LANGUAGES.filter(lang => 
      ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'pl', 'nl', 'sv', 'el', 'cs', 'ro', 'hu', 'da', 'fi', 'no', 'uk'].includes(lang.code)
    ),
    'Asia': SUPPORTED_LANGUAGES.filter(lang => 
      ['ja', 'ko', 'zh', 'hi', 'bn', 'pa', 'id', 'vi', 'th', 'ms', 'tl'].includes(lang.code)
    ),
    'Middle East': SUPPORTED_LANGUAGES.filter(lang => 
      ['ar', 'he', 'fa', 'ur', 'tr'].includes(lang.code)
    ),
    'Africa': SUPPORTED_LANGUAGES.filter(lang => 
      ['sw', 'ar'].includes(lang.code)
    )
  };
}

// Get appropriate voice settings for different languages
export function getVoiceForLanguage(langCode: string): any {
  const voiceSettings: Record<string, any> = {
    'en': { pitch: 1.0, rate: 1.0 },
    'es': { pitch: 1.1, rate: 0.95 },
    'fr': { pitch: 1.05, rate: 0.9 },
    'de': { pitch: 0.95, rate: 0.9 },
    'it': { pitch: 1.1, rate: 1.0 },
    'pt': { pitch: 1.05, rate: 0.95 },
    'ru': { pitch: 0.9, rate: 0.85 },
    'ja': { pitch: 1.2, rate: 1.0 },
    'ko': { pitch: 1.15, rate: 1.0 },
    'zh': { pitch: 1.1, rate: 0.95 },
    'ar': { pitch: 1.0, rate: 0.9 },
    'hi': { pitch: 1.1, rate: 0.9 }
  };
  
  return voiceSettings[langCode] || { pitch: 1.0, rate: 1.0 };
}