import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage, LANGUAGES, LanguageCode } from '../contexts/LanguageContext';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find(l => l.code === language) ?? LANGUAGES[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const select = (code: LanguageCode) => {
    setLanguage(code);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{current.nativeName}</span>
        <span className="sm:hidden text-base leading-none">{current.flag}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-48 bg-white shadow-xl rounded-xl border border-slate-100 py-2 z-50">
          <p className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase">Select Language</p>
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => select(lang.code)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50 transition ${
                language === lang.code ? 'bg-amber-50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base leading-none">{lang.flag}</span>
                <div>
                  <p className={`text-sm font-medium ${language === lang.code ? 'text-amber-900' : 'text-slate-700'}`}>
                    {lang.nativeName}
                  </p>
                  <p className="text-xs text-slate-400">{lang.name}</p>
                </div>
              </div>
              {language === lang.code && <Check className="w-4 h-4 text-amber-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
