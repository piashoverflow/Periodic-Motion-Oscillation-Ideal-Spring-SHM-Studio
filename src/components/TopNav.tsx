import React from 'react';
import { RotateCcw, Languages } from 'lucide-react';
import { Language, ModuleId } from '../types/physics';
import { Translations } from '../i18n/translations';

interface TopNavProps {
  activeModule: ModuleId;
  onSelectModule: (mod: ModuleId) => void;
  language: Language;
  onToggleLanguage: () => void;
  onResetAll: () => void;
  t: Translations;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeModule,
  onSelectModule,
  language,
  onToggleLanguage,
  onResetAll,
  t,
}) => {
  const tabs: { id: ModuleId; label: string; shortLabel: string }[] = [
    { id: 'module1', label: t.tabs.module1, shortLabel: t.tabs.module1Short },
    { id: 'module2', label: t.tabs.module2, shortLabel: t.tabs.module2Short },
    { id: 'module3', label: t.tabs.module3, shortLabel: t.tabs.module3Short },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-sky-200 px-4 lg:px-6 py-2.5 shadow-xs">
      <div className="max-w-[1600px] mx-auto flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 lg:gap-6">
        {/* Left: Studio Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 font-mono text-sm font-bold shadow-xs">
            ω
          </div>
          <h1 className="text-base lg:text-lg font-bold text-slate-950 tracking-tight truncate">
            {t.appTitle}
          </h1>
        </div>

        {/* Center: 3 Interactive Lab Mode Tabs (Pill Navigation) */}
        <nav
          aria-label="Simulation Modules"
          className="order-3 lg:order-2 w-full lg:w-auto flex items-center gap-1 p-1 bg-sky-50 border border-sky-200 rounded-full overflow-x-auto"
        >
          {tabs.map((tab) => {
            const isActive = activeModule === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectModule(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs lg:text-sm font-semibold transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-sky-100/80'
                }`}
              >
                <span className="hidden xl:inline">{tab.label}</span>
                <span className="xl:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Language Switcher, Reset Button, and Bold Red Institution Badge */}
        <div className="order-2 lg:order-3 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleLanguage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-200 bg-white hover:bg-sky-50 text-slate-900 text-xs lg:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600"
            title={language === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
          >
            <Languages className="w-4 h-4 text-sky-600" />
            <span>{t.langToggle}</span>
          </button>

          <button
            type="button"
            onClick={onResetAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-200 bg-white hover:bg-sky-50 text-slate-900 text-xs lg:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-700" />
            <span>{t.resetAll}</span>
          </button>

          <span className="bg-rose-50 border border-rose-300 text-rose-600 font-extrabold px-3 py-1 rounded-full text-sm whitespace-nowrap shrink-0">
            {t.institutionBadge}
          </span>
        </div>
      </div>
    </header>
  );
};
