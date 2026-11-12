/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Language, ModuleId } from './types/physics';
import { TRANSLATIONS } from './i18n/translations';
import { TopNav } from './components/TopNav';
import { Module1Periodicity } from './modules/Module1Periodicity';
import { Module2SpringMass } from './modules/Module2SpringMass';
import { Module3DiffEq } from './modules/Module3DiffEq';

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>('module1');
  const [language, setLanguage] = useState<Language>('bn');
  const [resetSignal, setResetSignal] = useState<number>(0);

  const t = TRANSLATIONS[language];

  const handleToggleLanguage = () => {
    setLanguage((prev) => {
      const next = prev === 'bn' ? 'en' : 'bn';
      document.documentElement.lang = next;
      return next;
    });
  };

  const handleResetAll = () => {
    setResetSignal((n) => n + 1);
  };

  return (
    <div className="min-h-screen bg-sky-50 text-slate-950 flex flex-col">
      <TopNav
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        onResetAll={handleResetAll}
        t={t}
      />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 lg:px-6 py-4">
        {activeModule === 'module1' && (
          <Module1Periodicity t={t} resetSignal={resetSignal} />
        )}
        {activeModule === 'module2' && (
          <Module2SpringMass t={t} resetSignal={resetSignal} />
        )}
        {activeModule === 'module3' && (
          <Module3DiffEq t={t} resetSignal={resetSignal} />
        )}
      </main>
    </div>
  );
}
