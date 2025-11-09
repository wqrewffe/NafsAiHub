import React, { useState, useEffect, useCallback } from 'react';

const SequenceGame = ({ onBack }) => {
  const [gameState, setGameState] = useState('setup');
  const [sequence, setSequence] = useState([]);
  const [playerSequence, setPlayerSequence] = useState([]);
  const [level, setLevel] = useState(0);
  const [highlightedCell, setHighlightedCell] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [gridSize, setGridSize] = useState(3);
  const [speed, setSpeed] = useState('normal');

  const SPEEDS = { slow: 1000, normal: 700, fast: 400 };

  // Fixed sequence display with proper cleanup
  useEffect(() => {
    if (gameState === 'watching' && sequence.length > 0) {
      let currentIndex = 0;
      let intervalId = null;
      
      const showNextCell = () => {
        if (currentIndex >= sequence.length) {
          clearInterval(intervalId);
          setTimeout(() => {
            setGameState('repeating');
          }, SPEEDS[speed]);
          return;
        }
        
        setHighlightedCell(sequence[currentIndex]);
        setTimeout(() => {
          setHighlightedCell(null);
          currentIndex++;
        }, SPEEDS[speed] - 200);
      };
      
      // Initial call
      showNextCell();
      
      // Set up interval for subsequent cells
      intervalId = setInterval(showNextCell, SPEEDS[speed]);
      
      // Cleanup function
      return () => {
        clearInterval(intervalId);
        setHighlightedCell(null);
      };
    }
  }, [gameState, sequence, speed]);

  const nextLevel = useCallback(() => {
    setPlayerSequence([]);
    const nextInSequence = Math.floor(Math.random() * (gridSize * gridSize));
    setSequence(prev => [...prev, nextInSequence]);
    setLevel(prev => prev + 1);
    setGameState('watching');
  }, [gridSize]);

  const handleCellClick = (index) => {
    if (gameState !== 'repeating' || feedback) return;
    
    const newPlayerSequence = [...playerSequence, index];
    setPlayerSequence(newPlayerSequence);
    
    if (newPlayerSequence[newPlayerSequence.length - 1] !== sequence[newPlayerSequence.length - 1]) {
      setFeedback({ index, type: 'incorrect' });
      setTimeout(() => {
        setFeedback(null);
        setGameState('finished');
      }, 500);
      return;
    }

    setFeedback({ index, type: 'correct' });
    setTimeout(() => setFeedback(null), 300);
    
    if (newPlayerSequence.length === sequence.length) {
      setTimeout(() => nextLevel(), 500);
    }
  };
  
  const startGame = () => {
    setSequence([]);
    setPlayerSequence([]);
    setLevel(0);
    setFeedback(null);
    setTimeout(() => nextLevel(), 100);
  };

  const getCellClass = (i) => {
    if (feedback?.index === i) {
      return feedback.type === 'correct' 
        ? 'bg-green-500 scale-105' 
        : 'bg-red-500';
    }

    if (highlightedCell === i) {
      return 'bg-green-500 scale-105';
    }

    let baseClass = 'bg-gray-800';
    if (gameState === 'repeating') {
      baseClass += ' cursor-pointer hover:bg-gray-700';
    }

    return baseClass;
  };

  // Calculate container width based on grid size (fixed cell size of 80px)
  const containerWidth = gridSize * 80 + (gridSize - 1) * 8 + 32; // cell size + gaps + padding

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col items-center">
      <div className="w-full max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={onBack}
            className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            &larr; Back
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-red-500">Sequence Memory</h1>
          <div className="w-24">
            {(gameState === 'watching' || gameState === 'repeating') && (
              <button
                onClick={startGame}
                className="bg-yellow-600 hover:bg-yellow-500 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {gameState === 'setup' && (
          <div className="bg-gray-800 p-6 rounded-lg space-y-6 max-w-md mx-auto">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">Cognitive Target: Working Memory</h2>
              <p className="text-gray-400 text-sm">
                This exercise challenges your visuospatial working memory and pattern recall.
              </p>
            </div>
            
            <div>
              <label className="block text-lg font-bold mb-2">Grid Size</label>
              <div className="flex flex-wrap gap-2">
                {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(size => (
                  <button 
                    key={size} 
                    onClick={() => setGridSize(size)} 
                    className={`px-3 py-2 rounded ${gridSize === size ? 'bg-red-500' : 'bg-gray-700'}`}
                  >
                    {size}x{size}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-lg font-bold mb-2">Speed</label>
              <div className="flex gap-2">
                {['slow', 'normal', 'fast'].map(s => (
                  <button 
                    key={s} 
                    onClick={() => setSpeed(s)} 
                    className={`px-3 py-2 rounded capitalize ${speed === s ? 'bg-red-500' : 'bg-gray-700'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setShowTutorial(true)} 
                className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded"
              >
                How to Play
              </button>
              <button 
                onClick={startGame} 
                className="flex-1 bg-green-600 hover:bg-green-500 py-2 rounded"
              >
                Start Game
              </button>
            </div>
          </div>
        )}
        
        {(gameState === 'watching' || gameState === 'repeating') && (
          <div className="flex flex-col items-center">
            <p className="text-xl mb-4">Level: <span className="text-yellow-400">{level}</span></p>
            
            <div className="w-full flex justify-center">
              <div 
                className="grid gap-2 p-4 bg-gray-900 rounded-lg" 
                style={{ 
                  gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                  width: `${containerWidth}px`
                }}
              >
                {Array.from({ length: gridSize * gridSize }).map((_, i) => (
                  <div
                    key={i}
                    onClick={() => handleCellClick(i)}
                    className="w-20 h-20 rounded transition-all duration-200 flex items-center justify-center"
                    style={{ 
                      backgroundColor: highlightedCell === i ? '#10B981' : 
                                      feedback?.index === i ? 
                                        (feedback.type === 'correct' ? '#10B981' : '#EF4444') : 
                                        '#1F2937',
                      transform: (highlightedCell === i || (feedback?.index === i && feedback.type === 'correct')) ? 
                                'scale(1.05)' : 'scale(1)',
                      cursor: gameState === 'repeating' ? 'pointer' : 'default'
                    }}
                  >
                    {/* Optional: Show numbers for very large grids */}
                    {gridSize > 6 && (
                      <span className="text-xs text-gray-400">{i+1}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <p className="mt-4 text-green-400 font-semibold">
              {gameState === 'watching' ? 'Watch the sequence...' : 'Your turn...'}
            </p>
          </div>
        )}
        
        {gameState === 'finished' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Game Over</h2>
            <div className="bg-gray-800 p-6 rounded-lg max-w-md mx-auto">
              <p className="text-gray-400">Your working memory capacity reached</p>
              <p className="font-bold text-4xl text-yellow-400 my-2">Level {level}</p>
            </div>
            <div className="mt-6 flex gap-4 justify-center">
              <button onClick={startGame} className="bg-green-600 hover:bg-green-500 py-2 px-6 rounded">
                Play Again
              </button>
              <button onClick={() => setGameState('setup')} className="bg-gray-600 hover:bg-gray-500 py-2 px-4 rounded">
                Change Settings
              </button>
            </div>
          </div>
        )}
      </div>

      {showTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md">
            <h2 className="text-xl font-bold mb-4">How to Play</h2>
            <p className="mb-4">
              Watch the sequence of flashing squares and then repeat it in the same order.
              Each level adds one more step to the sequence.
            </p>
            <button 
              onClick={() => setShowTutorial(false)} 
              className="bg-red-500 hover:bg-red-600 py-2 px-4 rounded w-full"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SequenceGame;