import React, { useState } from 'react';

interface TutorialStep {
  title: string;
  content: React.ReactNode;
}

interface TutorialProps {
  steps: TutorialStep[];
  onClose: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ steps, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="bg-gray-800 border-2 border-gray-700 rounded-lg p-8 w-full max-w-lg text-white shadow-lg m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-3xl font-orbitron font-bold text-red-500 mb-4">{step.title}</h2>
        <div className="text-gray-300 text-lg space-y-4 mb-8">
          {step.content}
        </div>
        <div className="flex justify-between items-center">
          <div className="text-gray-500">{currentStep + 1} / {steps.length}</div>
          <div className="flex gap-4">
            {currentStep > 0 && (
              <button onClick={handlePrev} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition-colors text-xl">
                Prev
              </button>
            )}
            <button onClick={handleNext} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg transition-colors text-xl">
              {currentStep === steps.length - 1 ? 'Got It!' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
