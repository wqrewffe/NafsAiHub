import React from 'react';
import { TRAINER_MODES } from '../modes';
import Leaderboard from './Leaderboard';

interface GameModeSelectorProps {
  onSelectLightsOut: () => void;
  onSelectGridReflex: () => void;
  onSelectSequence: () => void;
  onSelectColorMatch: () => void;
  onSelectPeripheralVision: () => void;
  onSelectDodgeAndClick: () => void;
  onSelectPrecisionPoint: () => void;
  onSelectAuditoryReaction: () => void;
  onSelectCognitiveShift: () => void;
  onSelectTargetTracking: () => void;
  onSelectDigitSpan: () => void;
  onSelectVisualSearch: () => void;
}

const GameModeSelector: React.FC<GameModeSelectorProps> = (props) => {
  const cardClasses = "bg-gray-800 border-2 border-gray-700 rounded-lg p-6 w-full h-48 flex flex-col justify-between text-center cursor-pointer transition-all duration-300 hover:bg-gray-700 hover:border-red-500 transform hover:-translate-y-1";

  const modes = [
    { handler: props.onSelectAuditoryReaction, ...TRAINER_MODES['auditory-reaction'] },
    { handler: props.onSelectCognitiveShift, ...TRAINER_MODES['cognitive-shift'] },
    { handler: props.onSelectColorMatch, ...TRAINER_MODES['color-match'] },
    { handler: props.onSelectDigitSpan, ...TRAINER_MODES['digit-span'] },
    { handler: props.onSelectDodgeAndClick, ...TRAINER_MODES['dodge-and-click'] },
    { handler: props.onSelectGridReflex, ...TRAINER_MODES['grid-reflex'] },
    { handler: props.onSelectLightsOut, ...TRAINER_MODES['lights-out'] },
    { handler: props.onSelectPeripheralVision, ...TRAINER_MODES['peripheral-vision'] },
    { handler: props.onSelectPrecisionPoint, ...TRAINER_MODES['precision-point'] },
    { handler: props.onSelectSequence, ...TRAINER_MODES['sequence'] },
    { handler: props.onSelectTargetTracking, ...TRAINER_MODES['target-tracking'] },
    { handler: props.onSelectVisualSearch, ...TRAINER_MODES['visual-search'] },
  ];

  return (
    <div className="text-center animate-fade-in w-full max-w-6xl">
      <h1 className="text-5xl md:text-6xl font-bold font-orbitron text-red-500 mb-2">Reflex Trainer</h1>
      <p className="text-gray-400 mb-12 text-xl">Choose your training mode.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {modes.sort((a, b) => a.title.localeCompare(b.title)).map(mode => (
          <div key={mode.title} onClick={mode.handler} className={cardClasses} role="button" tabIndex={0} aria-label={`Select ${mode.title} game mode`}>
            <div>
              <h2 className="text-2xl font-orbitron font-bold text-white mb-2">{mode.title}</h2>
              <p className="text-gray-400 text-base">{mode.description}</p>
            </div>
            <p className="text-sm text-cyan-400 italic font-semibold mt-2">{mode.science}</p>
          </div>
        ))}
      </div>
  {/* Leaderboard shown below the mode selector so players can view top scores */}
  <Leaderboard />
    </div>
  );
};

export default GameModeSelector;
