export interface TrainerModeMeta {
  slug: string;
  title: string;
  description: string;
  science?: string;
}

export const TRAINER_MODES: Record<string, TrainerModeMeta> = {
  'auditory-reaction': { slug: 'auditory-reaction', title: 'Auditory Reaction', description: 'Test your reaction time to a sound cue.' , science: 'Trains: Auditory Processing, Simple Reaction Time'},
  'cognitive-shift': { slug: 'cognitive-shift', title: 'Cognitive Shift', description: 'Adapt to rapidly changing rules.' , science: 'Trains: Cognitive Flexibility, Executive Function'},
  'color-match': { slug: 'color-match', title: 'Color Match', description: 'Match the color of the word, not the word itself.' , science: 'Trains: Inhibitory Control, Cognitive Flexibility'},
  'digit-span': { slug: 'digit-span', title: 'Digit Span', description: 'Recall an ever-increasing sequence of numbers.' , science: 'Trains: Short-Term Memory, Working Memory Capacity'},
  'dodge-and-click': { slug: 'dodge-and-click', title: 'Dodge & Click', description: 'Hit the correct targets while avoiding the wrong ones.' , science: 'Trains: Discriminative Reaction, Response Inhibition'},
  'grid-reflex': { slug: 'grid-reflex', title: 'Grid Reflex', description: 'Hit lit-up targets on a grid as fast as you can.' , science: 'Trains: Selective Attention, Visuospatial Processing'},
  'lights-out': { slug: 'lights-out', title: 'Lights Out', description: 'Classic F1 start light reaction test.' , science: 'Trains: Simple Reaction Time, Attentional Focus'},
  'peripheral-vision': { slug: 'peripheral-vision', title: 'Peripheral Vision', description: 'Detect targets appearing at the edge of your sight.' , science: 'Trains: Peripheral Awareness, Visual Search Speed'},
  'precision-point': { slug: 'precision-point', title: 'Precision Point', description: 'Hit targets that shrink and move with each click.' , science: 'Trains: Fine Motor Control, Visuomotor Accuracy'},
  'sequence': { slug: 'sequence', title: 'Sequence Memory', description: 'Remember and repeat an ever-growing pattern.' , science: 'Trains: Working Memory, Pattern Recognition'},
  'target-tracking': { slug: 'target-tracking', title: 'Target Tracking', description: 'Follow a moving target with your cursor.' , science: 'Trains: Sustained Attention, Visuomotor Control'},
  'visual-search': { slug: 'visual-search', title: 'Visual Search', description: 'Find a target symbol among distractors.' , science: 'Trains: Visual Processing Speed, Selective Attention'},
};

export const getTrainerMeta = (slug: string) => TRAINER_MODES[slug] || null;
