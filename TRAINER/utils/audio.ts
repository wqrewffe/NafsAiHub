let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // User must interact with the page for this to not be suspended
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    return audioContext;
  } catch (e) {
    console.error("Web Audio API is not supported in this browser.");
    return null;
  }
};

type SoundType = 'start' | 'hit' | 'miss' | 'end' | 'correct' | 'incorrect' | 'tick' | 'change';

export const playSound = (type: SoundType) => {
  const context = getAudioContext();
  if (!context) return;

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  gainNode.gain.setValueAtTime(0.2, context.currentTime);

  switch (type) {
    case 'start':
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(200, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, context.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.2);
      break;
    case 'hit':
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.1);
      break;
    case 'correct':
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(600, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, context.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.15);
      break;
    case 'miss':
    case 'incorrect':
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(200, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(100, context.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.2);
      break;
    case 'end':
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(220, context.currentTime + 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.4);
      break;
    case 'tick':
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(1000, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.05);
      break;
    case 'change':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, context.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.2);
        break;
  }

  oscillator.start(context.currentTime);
  oscillator.stop(context.currentTime + 0.5);
};
