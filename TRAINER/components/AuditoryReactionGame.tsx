import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GameState } from '../types';
import ResultDisplay from './ResultDisplay';
import { playSound as playEffectSound } from '../utils/audio';
import Tutorial from './Tutorial';

interface AuditoryReactionGameProps {
  onBack: () => void;
}

const tutorialSteps = [
    {
        title: 'The Goal',
        content: <p>This game measures your reaction time to a sound. Your goal is to click as fast as possible after you hear the "Go" signal.</p>
    },
    {
        title: 'How to Play',
        content: <p>After you press start, there will be a random delay. When you hear the signal sound, click anywhere on the screen. Your headphones are recommended for the best experience.</p>
    },
    {
        title: 'Go/No-Go Mode',
        content: <p>For an extra challenge, try "Go/No-Go" mode. You will hear two different sounds: a high-pitched "Go" and a low-pitched "No-Go". You must <strong>only</strong> click on the "Go" signal.</p>
    },
    {
        title: 'Impulse Control',
        content: <p>Clicking on a "No-Go" signal or clicking before any sound is played will count as an error. This mode trains your impulse control.</p>
    }
];

const AuditoryReactionGame: React.FC<AuditoryReactionGameProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<GameState>(GameState.Setup);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  // Settings
  const [mode, setMode] = useState<'simple' | 'goNoGo'>('simple');
  const [difficulty, setDifficulty] = useState<'normal' | 'hard' | 'elite'>('normal');
  const [goFrequency, setGoFrequency] = useState(880);
  const [noGoFrequency, setNoGoFrequency] = useState(440);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const backgroundNoiseRef = useRef<OscillatorNode | null>(null);
  const currentStimulusType = useRef<'go' | 'noGo'>('go');

  const playSound = (freq: number, duration: number, volume: number) => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioContext = audioContextRef.current;
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
    
    oscillator.start(audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + duration);
    oscillator.stop(audioContext.currentTime + duration);
  };

  const manageBackgroundNoise = useCallback((action: 'start' | 'stop') => {
      if (action === 'start' && difficulty === 'elite') {
          if (!audioContextRef.current) return;
          if (backgroundNoiseRef.current) return; // Already playing
          const audioContext = audioContextRef.current;
          const bufferSize = 2 * audioContext.sampleRate;
          const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
              output[i] = Math.random() * 2 - 1;
          }

          const whiteNoise = audioContext.createBufferSource();
          whiteNoise.buffer = noiseBuffer;
          whiteNoise.loop = true;
          
          const gainNode = audioContext.createGain();
          gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
          whiteNoise.connect(gainNode).connect(audioContext.destination);
          whiteNoise.start();
          backgroundNoiseRef.current = whiteNoise as any; // Simplified
      } else if (action === 'stop' && backgroundNoiseRef.current) {
          backgroundNoiseRef.current.stop();
          backgroundNoiseRef.current = null;
      }
  }, [difficulty]);


  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  
  const startGame = () => {
    playEffectSound('start');
    setReactionTime(null);
    setGameState(GameState.Waiting);
    manageBackgroundNoise('start');

    const { minDelay, maxDelay } = {
        normal: { minDelay: 1000, maxDelay: 4000 },
        hard: { minDelay: 800, maxDelay: 2500 },
        elite: { minDelay: 500, maxDelay: 2000 },
    }[difficulty];

    const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay;
    
    timerRef.current = window.setTimeout(() => {
      let soundType: 'go' | 'noGo' = 'go';
      if (mode === 'goNoGo' && Math.random() > 0.5) {
          soundType = 'noGo';
      }
      currentStimulusType.current = soundType;

      const volume = difficulty === 'elite' ? 0.3 : 0.5;
      const freq = soundType === 'go' ? goFrequency : noGoFrequency;
      
      playSound(freq, 0.2, volume);
      startTimeRef.current = performance.now();
      setGameState(GameState.React);
    }, randomDelay);
  };
  
   useEffect(() => {
    return () => { // Cleanup on unmount
      manageBackgroundNoise('stop');
      clearTimers();
    };
  }, [manageBackgroundNoise, clearTimers]);


  const handleGameClick = () => {
    switch (gameState) {
      case GameState.Waiting:
        clearTimers();
        playEffectSound('miss');
        setGameState(GameState.TooSoon);
        manageBackgroundNoise('stop');
        break;
      
      case GameState.React:
        if (startTimeRef.current) {
           if (mode === 'goNoGo' && currentStimulusType.current === 'noGo') {
               playEffectSound('incorrect');
               setGameState(GameState.TooSoon);
               setReactionTime(null);
           } else {
               playEffectSound('hit');
               const endTime = performance.now();
               setReactionTime(endTime - startTimeRef.current);
               setGameState(GameState.Result);
           }
           manageBackgroundNoise('stop');
           startTimeRef.current = null;
        }
        break;
    }
  };

  const getMessage = () => {
    switch (gameState) {
        case GameState.Setup:
            return { title: "Ready?", subtitle: "Configure your session and press Start." };
        case GameState.Waiting:
            return { title: "Listen...", subtitle: "Click only on the 'Go' signal." };
        case GameState.React:
            return { title: "CLICK!", subtitle: "As fast as you can!" };
        case GameState.TooSoon:
             return { title: (mode === 'goNoGo' && reactionTime === null) ? "Wrong Signal!" : "Too Soon!", subtitle: "You clicked at the wrong time." };
        default:
            return { title: "", subtitle: "" };
    }
  };
  
  const message = getMessage();
  
  return (
    <div className="w-full max-w-4xl flex flex-col items-center animate-fade-in p-2 sm:p-4">
      {showTutorial && <Tutorial steps={tutorialSteps} onClose={() => setShowTutorial(false)} />}
      <div className="w-full flex flex-col sm:grid sm:grid-cols-[1fr_auto_1fr] items-center gap-4 mb-4">
        <div className="w-full sm:w-auto sm:justify-self-start">
            <button onClick={onBack} className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 text-base">
              &larr; Change Mode
            </button>
        </div>
        <div className="text-center order-first sm:order-none">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-orbitron text-red-500">Auditory Reaction</h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">Measure your reaction to sound.</p>
        </div>
        <div />
      </div>
      
      {gameState === GameState.Setup && (
        <div className="text-center w-full max-w-lg animate-fade-in mt-4">
            <div className="bg-gray-800 p-4 sm:p-6 rounded-lg space-y-5">
                <div className="text-center pb-4 border-b border-gray-700">
                    <h2 className="text-xl sm:text-2xl font-orbitron text-white">Cognitive Target: Auditory Processing</h2>
                    <p className="text-gray-400 mt-2 text-sm sm:text-base">This test measures the speed at which your brain can process a sound and trigger a motor response.</p>
                </div>
                <div>
                    <label className="text-lg font-bold text-white block mb-2">Mode</label>
                    <div className="flex justify-center gap-2 sm:gap-4">
                        <button onClick={() => setMode('simple')} className={`px-4 py-2 rounded-lg font-semibold text-base transition-colors ${mode === 'simple' ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Simple</button>
                        <button onClick={() => setMode('goNoGo')} className={`px-4 py-2 rounded-lg font-semibold text-base transition-colors ${mode === 'goNoGo' ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Go/No-Go</button>
                    </div>
                </div>
                 {mode === 'goNoGo' && (
                    <div className="grid grid-cols-2 gap-4 text-white animate-fade-in">
                        <div className="flex flex-col items-center">
                            <label className="text-sm font-bold block mb-2">"Go" Sound (High)</label>
                            <button onClick={() => playSound(goFrequency, 0.2, 0.5)} className="bg-green-600 hover:bg-green-500 p-2 rounded-full leading-none">&#9658;</button>
                        </div>
                        <div className="flex flex-col items-center">
                            <label className="text-sm font-bold block mb-2">"No-Go" Sound (Low)</label>
                            <button onClick={() => playSound(noGoFrequency, 0.2, 0.5)} className="bg-red-600 hover:bg-red-500 p-2 rounded-full leading-none">&#9658;</button>
                        </div>
                    </div>
                )}
                 <div>
                    <label className="text-lg font-bold text-white block mb-2">Difficulty</label>
                    <div className="flex justify-center gap-2 sm:gap-4">
                        {(['normal', 'hard', 'elite'] as const).map(d => (
                             <button key={d} onClick={() => setDifficulty(d)} className={`px-4 py-2 rounded-lg font-semibold text-base transition-colors capitalize ${difficulty === d ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{d}</button>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button onClick={() => setShowTutorial(true)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-lg font-orbitron transition-transform transform hover:scale-105">
                        How to Play
                    </button>
                    <button onClick={startGame} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg text-lg font-orbitron transition-transform transform hover:scale-105">
                        Start
                    </button>
                </div>
            </div>
        </div>
      )}

      {gameState !== GameState.Setup && (
        <div 
          className="w-full min-h-[24rem] sm:h-96 bg-gray-800 rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer"
          onClick={handleGameClick}
          role="button"
          tabIndex={0}
          aria-label="Reaction test area"
        >
          {reactionTime !== null && gameState === GameState.Result ? (
            <ResultDisplay time={reactionTime} />
          ) : (
             <div className="text-center">
                <p className={`text-5xl sm:text-6xl font-bold font-orbitron ${gameState === GameState.TooSoon || (mode === 'goNoGo' && reactionTime === null) ? 'text-red-500' : 'text-yellow-400'}`}>{message.title}</p>
                <p className="text-lg sm:text-xl text-gray-400 mt-2">{message.subtitle}</p>
             </div>
          )}

          {(gameState === GameState.Result || gameState === GameState.TooSoon) && (
              <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-md">
                  <button onClick={startGame} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors">Play Again</button>
                  <button onClick={() => setGameState(GameState.Setup)} className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors">Change Settings</button>
              </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditoryReactionGame;