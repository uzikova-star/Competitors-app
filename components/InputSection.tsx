
import React, { useState } from 'react';
import { Search, Globe, ArrowRight, Loader2, Briefcase, ChevronDown } from 'lucide-react';

interface InputSectionProps {
  onAnalyze: (url: string, country: string, industry: string) => void;
  isLoading: boolean;
}

const COUNTRY_OPTIONS = [
  { value: 'Slovakia', label: 'Slovensko 🇸🇰' },
  { value: 'Czech Republic', label: 'Česká republika 🇨🇿' },
  { value: 'Austria', label: 'Rakúsko 🇦🇹' },
  { value: 'Poland', label: 'Poľsko 🇵🇱' },
  { value: 'Hungary', label: 'Maďarsko 🇭🇺' },
  { value: 'Germany', label: 'Nemecko 🇩🇪' },
  { value: 'France', label: 'Francúzsko 🇫🇷' },
  { value: 'Italy', label: 'Taliansko 🇮🇹' },
  { value: 'Spain', label: 'Španielsko 🇪🇸' },
  { value: 'Netherlands', label: 'Holandsko 🇳🇱' },
  { value: 'Belgium', label: 'Belgicko 🇧🇪' },
  { value: 'Sweden', label: 'Švédsko 🇸🇪' },
  { value: 'Norway', label: 'Nórsko 🇳🇴' },
  { value: 'Denmark', label: 'Dánsko 🇩🇰' },
  { value: 'Finland', label: 'Fínsko 🇫🇮' },
  { value: 'Switzerland', label: 'Švajčiarsko 🇨🇭' },
  { value: 'Portugal', label: 'Portugalsko 🇵🇹' },
  { value: 'Romania', label: 'Rumunsko 🇷🇴' },
  { value: 'Croatia', label: 'Chorvátsko 🇭🇷' },
  { value: 'Serbia', label: 'Srbsko 🇷🇸' },
  { value: 'Bulgaria', label: 'Bulharsko 🇧🇬' },
  { value: 'Greece', label: 'Grécko 🇬🇷' },
  { value: 'Ukraine', label: 'Ukrajina 🇺🇦' },
  { value: 'UK', label: 'Spojené kráľovstvo 🇬🇧' },
  { value: 'USA', label: 'USA 🇺🇸' },
];

const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isLoading }) => {
  const [url, setUrl] = useState('');
  const [country, setCountry] = useState('Slovakia');
  const [industry, setIndustry] = useState('');
  const [errors, setErrors] = useState({ url: false, country: false });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Protocol normalization
    let normalizedUrl = url.trim();
    if (normalizedUrl) {
      if (!/^https?:\/\//i.test(normalizedUrl)) {
        normalizedUrl = `https://${normalizedUrl}`;
      }
    }

    // Validate fields
    const newErrors = {
      url: !normalizedUrl,
      country: !country.trim()
    };

    setErrors(newErrors);

    if (!newErrors.url && !newErrors.country) {
      onAnalyze(normalizedUrl, country, industry.trim());
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-[#141313] border border-[#333] rounded-2xl p-8 shadow-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#f7f7f7] mb-2">
          Prieskum Konkurencie & <span className="text-[#63c1cf]">Ad Spy</span>
        </h1>
        <p className="text-[#c5c5c5]">
          Zadajte údaje klienta na identifikáciu lídrov trhu, priamej konkurencie a odhalenie ich reklamných stratégií.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Website URL */}
        <div>
          <label className="block text-sm font-medium text-[#c5c5c5] mb-2">
            Webstránka Klienta
          </label>
          {errors.url && (
            <p className="text-xs text-[#ff6b6b] mb-1">Prosím vyplňte toto pole</p>
          )}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Globe className="h-5 w-5 text-[#a0a0a0]" />
            </div>
            <input
              type="text"
              placeholder="napr. www.webstranka.sk"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (errors.url && e.target.value.trim()) {
                  setErrors(prev => ({ ...prev, url: false }));
                }
              }}
              className={`block w-full pl-10 pr-3 py-3 border rounded-lg leading-5 bg-[#1f1f1f] text-[#f7f7f7] placeholder-[#888] focus:outline-none focus:ring-2 focus:ring-[#63c1cf] transition duration-150 ease-in-out sm:text-sm ${errors.url ? 'border-[#ff6b6b] focus:border-[#ff6b6b]' : 'border-[#444] focus:border-[#63c1cf]'}`}
            />
          </div>
        </div>

        {/* Country Dropdown */}
        <div>
          <label className="block text-sm font-medium text-[#c5c5c5] mb-2">
            Cieľová krajina pre konkurenciu
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-[#a0a0a0]" />
            </div>
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                if (errors.country) setErrors(prev => ({ ...prev, country: false }));
              }}
              className={`block w-full pl-10 pr-10 py-3 border rounded-lg leading-5 bg-[#1f1f1f] text-[#f7f7f7] focus:outline-none focus:ring-2 focus:ring-[#63c1cf] transition duration-150 ease-in-out sm:text-sm appearance-none cursor-pointer ${errors.country ? 'border-[#ff6b6b] focus:border-[#ff6b6b]' : 'border-[#444] focus:border-[#63c1cf]'}`}
            >
              {COUNTRY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#1f1f1f] text-[#f7f7f7]">
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown className="h-4 w-4 text-[#a0a0a0]" />
            </div>
          </div>
        </div>

        {/* Industry Input */}
        <div>
          <label className="block text-sm font-medium text-[#c5c5c5] mb-2">
            Odvetvie <span className="text-[#666] font-normal">(voliteľné – automaticky sa deteguje)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Briefcase className="h-5 w-5 text-[#a0a0a0]" />
            </div>
            <input
              type="text"
              placeholder="napr. Predaj bicyklov, SaaS softvér, Stavebníctvo..."
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-[#444] rounded-lg leading-5 bg-[#1f1f1f] text-[#f7f7f7] placeholder-[#888] focus:outline-none focus:ring-2 focus:ring-[#63c1cf] focus:border-[#63c1cf] transition duration-150 ease-in-out sm:text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex items-center justify-center py-4 px-4 mt-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-[#141313] bg-[#63c1cf] hover:bg-[#4ab5c4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#63c1cf] transition-all ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#141313]" />
              Prebieha hĺbková analýza...
            </>
          ) : (
            <>
              Spustiť Inteligentný Sken
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default InputSection;
