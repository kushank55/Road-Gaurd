import React from 'react';
import { useLanguage } from '@/hooks/useTranslation';
import { Button } from './button';
import { Globe, Check } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { currentLanguage, changeLanguage } = useLanguage();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  ] as const;

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center space-x-2">
        <Globe className="h-4 w-4 text-gray-600" />
        <div className="flex rounded-md shadow-sm">
          {languages.map((language) => (
            <Button
              key={language.code}
              variant={currentLanguage === language.code ? 'default' : 'outline'}
              size="sm"
              onClick={() => changeLanguage(language.code)}
              className={`flex items-center space-x-2 px-3 py-1 text-sm font-medium transition-colors ${
                currentLanguage === language.code
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              <span className="text-base">{language.flag}</span>
              <span>{language.name}</span>
              {currentLanguage === language.code && (
                <Check className="h-3 w-3" />
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
