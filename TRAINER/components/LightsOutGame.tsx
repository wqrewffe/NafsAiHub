// src/components/LightsOutGame.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GameState } from '../types';
import Light from './Light';
import ResultDisplay from './ResultDisplay';
import MessageDisplay from './MessageDisplay';
import { playSound } from '../utils/audio';
import Tutorial from './Tutorial';

interface LightsOutGameProps {
  onBack: () => void;
}

const tutorialSteps = [
  {
    title: 'The Goal',
    content: <p>This is a test of pure reaction time. Your goal is to click the screen as fast as possible <strong>AFTER</strong> the lights go out.</p>
  },
  {
    title: 'The Sequence',
    content: <p>First, the lights will turn on one by one. Do <strong>NOT</strong> click while this is happening.</p>
  },
  {
    title: 'Wait For It...',
    content: <p>After all lights are on, there will be a random delay. The lights will then suddenly turn off. This is your signal!</p>
  },
  {
    title: 'GO!',
    content: <p>As soon as the lights go out, click anywhere on the screen. Your reaction time will be measured.</p>
  },
  {
    title: "Don't Jump the Gun!",
    content: <p>If you click before the lights go out, it's a "Jump Start," and the round will reset.</p>
  }
];

const LightsOutGame: React.FC<LightsOutGameProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<GameState>(GameState.Setup);
  const [lightsOn, setLightsOn] = useState<number>(0);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  // Settings state
  const [lightCount, setLightCount] = useState(5);
  const [difficulty, setDifficulty] = useState<'normal' | 'easy' | 'hard'>('normal');

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const { minDelay, maxDelay, lightUpInterval } = useMemo(() => {
    switch (difficulty) {
      case 'easy':
        return { minDelay: 1500, maxDelay: 5000, lightUpInterval: 1000 };
      case 'hard':
        return { minDelay: 500, maxDelay: 2500, lightUpInterval: 500 };
      case 'normal':
      default:
        return { minDelay: 1000, maxDelay: 4000, lightUpInterval: 750 };
    }
  }, [difficulty]);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startGame = () => {
    playSound('start');
    setGameState(GameState.GetReady);
    setLightsOn(0);
    setReactionTime(null);
    startTimeRef.current = null;
    clearTimers();
    timerRef.current = window.setTimeout(() => {
      setLightsOn(1);
    }, lightUpInterval);
  };

  useEffect(() => {
    if (gameState === GameState.GetReady && lightsOn < lightCount) {
        timerRef.current = window.setTimeout(() => {
          setLightsOn(prev => prev + 1);
        }, lightUpInterval);
      } else if (gameState === GameState.GetReady && lightsOn === lightCount) {
        setGameState(GameState.Waiting);
      }

    if (gameState === GameState.Waiting) {
      const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay;
      timerRef.current = window.setTimeout(() => {
        setLightsOn(0);
        startTimeRef.current = performance.now();
        setGameState(GameState.React);
      }, randomDelay);
    }

    return () => {
      clearTimers();
    };
  }, [gameState, lightsOn, clearTimers, lightCount, minDelay, maxDelay, lightUpInterval]);
  
  const handleGameClick = () => {
    switch (gameState) {
      case GameState.GetReady:
      case GameState.Waiting:
        clearTimers();
        playSound('miss');
        setGameState(GameState.TooSoon);
        break;
      
      case GameState.React:
        if (startTimeRef.current) {
          playSound('hit');
          const endTime = performance.now();
          setReactionTime(endTime - startTimeRef.current);
          setGameState(GameState.Result);
          startTimeRef.current = null;
        }
        break;
    }
  };
  
  const renderContent = () => {
    if (gameState === GameState.Setup) {
      return (
        <div className="text-center w-full max-w-lg animate-fade-in">
          <div className="bg-gray-800 p-4 sm:p-6 md:p-8 rounded-lg space-y-5">
            <div className="text-center pb-4 border-b border-gray-700">
                <h2 className="text-2xl sm:text-3xl font-orbitron text-white">Cognitive Target: Simple Reaction Time</h2>
                <p className="text-gray-400 mt-2 text-sm sm:text-base">This exercise hones the speed at which your nervous system can respond to a stimulus.</p>
            </div>
            <div>
              <label className="text-lg font-bold text-white block mb-2" id="light-count-label">Number of Lights</label>
              <div role="group" aria-labelledby="light-count-label" className="flex justify-center gap-2 sm:gap-4">
                {[3, 5, 7].map(count => (
                  <button key={count} onClick={() => setLightCount(count)} className={`px-4 py-2 rounded-lg font-bold text-base sm:text-lg transition-colors w-20 ${lightCount === count ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    {count}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-lg font-bold text-white block mb-2" id="difficulty-label">Start Delay</label>
              <div role="group" aria-labelledby="difficulty-label" className="flex justify-center gap-2 sm:gap-4">
                {(['easy', 'normal', 'hard'] as const).map(level => (
                  <button key={level} onClick={() => setDifficulty(level)} className={`px-4 py-2 rounded-lg font-bold text-base sm:text-lg transition-colors capitalize flex-1 ${difficulty === level ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    {level}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
              <button onClick={() => setShowTutorial(true)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-lg sm:text-xl font-orbitron transition-transform transform hover:scale-105">
                How to Play
              </button>
              <button onClick={startGame} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg text-lg sm:text-xl font-orbitron transition-transform transform hover:scale-105">
                Start
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div 
        className="flex flex-col items-center justify-center w-full h-full flex-grow cursor-pointer"
        onClick={handleGameClick}
        role="button"
        tabIndex={0}
        aria-label="Reaction test area"
      >
        <div className="flex space-x-2 sm:space-x-3 md:space-x-4 mb-8">
          {[...Array(lightCount)].map((_, i) => (
            <Light key={i} isOn={i < lightsOn} />
          ))}
        </div>

        <div className="min-h-[12rem] flex flex-col items-center justify-center w-full max-w-md p-4">
           {reactionTime !== null && gameState === GameState.Result && (
             <ResultDisplay time={reactionTime} />
           )}
           <MessageDisplay gameState={gameState} />
           {(gameState === GameState.Result || gameState === GameState.TooSoon) && (
              <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-xs">
                <button onClick={startGame} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-base sm:text-lg w-full">
                  Play Again
                </button>
                <button onClick={() => setGameState(GameState.Setup)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-base sm:text-lg w-full">
                  Change Settings
                </button>
              </div>
            )}
        </div>
      </div>
    );
  }

  const title = gameState === GameState.Setup ? "Lights Out Setup" : "Lights Out";
  const subtitle = gameState === GameState.Setup ? "Configure your test." : "Measure your stimulus-response latency.";

  return (
    <div className="w-full max-w-4xl flex flex-col items-center animate-fade-in p-4">
       {showTutorial && <Tutorial steps={tutorialSteps} onClose={() => setShowTutorial(false)} />}
       <div className="w-full grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4 mb-6" style={{ minHeight: '4rem' }}>
        <div className="flex gap-2 justify-self-start">
            <button 
              onClick={(e) => { e.stopPropagation(); onBack(); }}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm sm:text-base"
              aria-label="Go back to mode selection"
            >
              &larr; Back
            </button>
            {gameState !== GameState.Setup && (
              <button
                onClick={startGame}
                className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm sm:text-base"
                aria-label="Reset Game"
              >
                Reset
              </button>
            )}
        </div>

        <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold font-orbitron text-red-500">{title}</h1>
            {subtitle && <p className="text-gray-400 mt-1 text-sm sm:text-base">{subtitle}</p>}
        </div>

        <div /> 
      </div>

      <div className="w-full flex flex-grow items-center justify-center">
        {renderContent()}
      </div>
    </div>
  );
};

export default LightsOutGame;