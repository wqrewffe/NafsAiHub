import React, { useState, useEffect } from 'react';
import LightsOutGame from './components/LightsOutGame';
import GridReflexGame from './components/GridReflexGame';
import GameModeSelector from './components/GameModeSelector';
import Footer from './components/Footer';
import SequenceGame from './components/SequenceGame';
import ColorMatchGame from './components/ColorMatchGame';
import PeripheralVisionGame from './components/PeripheralVisionGame';
import DodgeAndClickGame from './components/DodgeAndClickGame';
import PrecisionPointGame from './components/PrecisionPointGame';
import AuditoryReactionGame from './components/AuditoryReactionGame';
import CognitiveShiftGame from './components/CognitiveShiftGame';
import TargetTrackingGame from './components/TargetTrackingGame';
import DigitSpanGame from './components/DigitSpanGame';
import VisualSearchGame from './components/VisualSearchGame';

export type AppMode = 'select' | 'lightsOut' | 'gridReflex' | 'precisionPoint' | 'sequence' | 'colorMatch' | 'peripheralVision' | 'dodgeAndClick' | 'auditoryReaction' | 'cognitiveShift' | 'targetTracking' | 'digitSpan' | 'visualSearch';

// A type guard to check if a string is a valid AppMode
const VALID_MODES: AppMode[] = [
    'select', 'lightsOut', 'gridReflex', 'precisionPoint', 'sequence', 
    'colorMatch', 'peripheralVision', 'dodgeAndClick', 'auditoryReaction', 
    'cognitiveShift', 'targetTracking', 'digitSpan', 'visualSearch'
];
const isAppMode = (mode: string): mode is AppMode => {
    return (VALID_MODES as string[]).includes(mode);
};


interface TrainerAppProps {
  initialMode?: string | null;
}

const App: React.FC<TrainerAppProps> = ({ initialMode }) => {
  // Trainer uses internal state only (do not modify window.location.hash)
  const initial = initialMode && isAppMode(initialMode) ? initialMode : 'select';
  const [appMode, setAppMode] = useState<AppMode>(initial as AppMode);

  const handleBackToSelect = () => setAppMode('select');

  const renderContent = () => {
    switch (appMode) {
      case 'lightsOut':
        return <LightsOutGame onBack={handleBackToSelect} />;
      case 'gridReflex':
        return <GridReflexGame onBack={handleBackToSelect} />;
      case 'precisionPoint':
        return <PrecisionPointGame onBack={handleBackToSelect} />;
      case 'sequence':
        return <SequenceGame onBack={handleBackToSelect} />;
      case 'colorMatch':
        return <ColorMatchGame onBack={handleBackToSelect} />;
      case 'peripheralVision':
        return <PeripheralVisionGame onBack={handleBackToSelect} />;
      case 'dodgeAndClick':
        return <DodgeAndClickGame onBack={handleBackToSelect} />;
      case 'auditoryReaction':
        return <AuditoryReactionGame onBack={handleBackToSelect} />;
      case 'cognitiveShift':
        return <CognitiveShiftGame onBack={handleBackToSelect} />;
      case 'targetTracking':
        return <TargetTrackingGame onBack={handleBackToSelect} />;
      case 'digitSpan':
        return <DigitSpanGame onBack={handleBackToSelect} />;
      case 'visualSearch':
        return <VisualSearchGame onBack={handleBackToSelect} />;
      case 'select':
      default:
        return (
          <GameModeSelector
            onSelectLightsOut={() => setAppMode('lightsOut')}
            onSelectGridReflex={() => setAppMode('gridReflex')}
            onSelectPrecisionPoint={() => setAppMode('precisionPoint')}
            onSelectSequence={() => setAppMode('sequence')}
            onSelectColorMatch={() => setAppMode('colorMatch')}
            onSelectPeripheralVision={() => setAppMode('peripheralVision')}
            onSelectDodgeAndClick={() => setAppMode('dodgeAndClick')}
            onSelectAuditoryReaction={() => setAppMode('auditoryReaction')}
            onSelectCognitiveShift={() => setAppMode('cognitiveShift')}
            onSelectTargetTracking={() => setAppMode('targetTracking')}
            onSelectDigitSpan={() => setAppMode('digitSpan')}
            onSelectVisualSearch={() => setAppMode('visualSearch')}
          />
        );
    }
  };

  // map internal AppMode to kebab-case slug used in the main app route
  const modeToSlugMap: Record<AppMode, string> = {
    select: 'select',
    lightsOut: 'lights-out',
    gridReflex: 'grid-reflex',
    precisionPoint: 'precision-point',
    sequence: 'sequence',
    colorMatch: 'color-match',
    peripheralVision: 'peripheral-vision',
    dodgeAndClick: 'dodge-and-click',
    auditoryReaction: 'auditory-reaction',
    cognitiveShift: 'cognitive-shift',
    targetTracking: 'target-tracking',
    digitSpan: 'digit-span',
    visualSearch: 'visual-search'
  };
  
  // Keep the URL in sync with the selected trainer mode but only within the /trainer prefix.
  // This avoids interfering with the main app's router while still exposing per-tool URLs.
  useEffect(() => {
    try {
      const slug = modeToSlugMap[appMode] ?? 'select';
      const desiredHash = `#/trainer/${slug}`;
      // Only change hash if different to avoid unnecessary history entries
      if (window.location.hash !== desiredHash) {
        // Setting location.hash will not reload the page and is compatible with HashRouter
        window.location.hash = desiredHash;
      }
    } catch (err) {
      // In case window is not available or other issues, ignore
      // eslint-disable-next-line no-console
      console.warn('Could not synchronize trainer mode to URL hash', err);
    }
  }, [appMode]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 font-roboto select-none">
      <main className="flex flex-col w-full flex-grow p-4">
        {/* This inner wrapper is key. 'my-auto' provides vertical centering for short content,
            while allowing the container to grow and the page to scroll for long content. */}
        <div className="my-auto w-full flex flex-col items-center">
          {renderContent()}
        </div>
      </main>
      <Footer />
    </div>
    
  );
};
export default App;