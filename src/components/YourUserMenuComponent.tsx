import { useLanguage } from '../contexts/LanguageContext'; // adjust path as needed

const { language, setLanguage } = useLanguage();

<li className="px-4 py-3 hover:bg-white/10 cursor-pointer font-bold relative group">
  Language: <span className="ml-1 text-yellow-400">{language}</span>
  <div className="absolute left-0 top-full mt-1 w-48 bg-gray-900/95 rounded-lg shadow-lg z-40 hidden group-hover:block">
    {['English', 'Español', 'Français', 'Deutsch', '中文', 'العربية', 'Português', 'Русский', '日本語', '한국어'].map(lang => (
      <div
        key={lang}
        onClick={() => setLanguage(lang)}
        className="px-4 py-2 hover:bg-yellow-500/20 cursor-pointer"
        role="menuitem"
        tabIndex={0}
        aria-label={`Switch to ${lang}`}
      >
        {lang}
      </div>
    ))}
  </div>
</li> 