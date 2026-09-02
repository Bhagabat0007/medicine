import { useNavigate } from 'react-router-dom';
import { Globe } from 'lucide-react';
import KioskLayout from '../components/layout/KioskLayout';
import { useStore } from '../store/useStore';
import type { Language } from '../types';

const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
];

export default function LanguagePage() {
  const navigate = useNavigate();
  const setLanguage = useStore((s) => s.setLanguage);

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    navigate('/identify');
  };

  return (
    <KioskLayout>
      <div className="flex flex-col items-center text-center max-w-lg mx-auto gap-8">
        <div className="bg-primary-100 p-4 rounded-2xl">
          <Globe className="w-10 h-10 text-primary-600" />
        </div>

        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-2">
            Choose your language
          </h2>
          <p className="text-xl text-navy-500">
            अपनी भाषा चुनें
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className="w-full bg-white border-2 border-navy-200 hover:border-primary-500 hover:bg-primary-50 text-navy-800 text-xl font-semibold py-5 px-8 rounded-2xl transition-all min-h-[72px] shadow-sm"
            >
              <span className="block text-xl">{lang.native}</span>
              <span className="block text-base text-navy-500 mt-1">{lang.label}</span>
            </button>
          ))}
        </div>
      </div>
    </KioskLayout>
  );
}
