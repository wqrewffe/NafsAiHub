import { Tool } from '../types';
import EssayOutliner, { renderEssayOutlinerOutput } from './EssayOutliner';
import McqGenerator, { renderMcqOutput } from './McqGenerator';
import CodeExplainer, { renderCodeExplainerOutput } from './CodeExplainer';
import MedicalTermDefiner, { renderMedicalTermDefinerOutput } from './MedicalTermDefiner';
import ThesisStatementGenerator, { renderThesisStatementGeneratorOutput } from './ThesisStatementGenerator';
import MathProblemSolver, { renderMathProblemSolverOutput } from './MathProblemSolver';
import StudyBuddyChat, { renderStudyBuddyChatOutput } from './StudyBuddyChat';
import DecisionHelper, { renderDecisionHelperOutput } from './DecisionHelper';
import CreativeStoryGenerator, { renderCreativeStoryGeneratorOutput } from './CreativeStoryGenerator';
import WorkoutPlanner, { renderWorkoutPlannerOutput } from './WorkoutPlanner';
import RecipeCreator, { renderRecipeCreatorOutput } from './RecipeCreator';
import DreamInterpreter, { renderDreamInterpreterOutput } from './DreamInterpreter';
import GiftIdeaGenerator, { renderGiftIdeaGeneratorOutput } from './GiftIdeaGenerator';
import TravelItineraryPlanner, { TravelItineraryOutputView } from './TravelItineraryPlanner';
import TextSummarizer, { renderTextSummarizerOutput } from './TextSummarizer';
import AnalogiesGenerator, { renderAnalogiesGeneratorOutput } from './AnalogiesGenerator';
import BookRecommender, { renderBookRecommenderOutput } from './BookRecommender';
import HistoricalFigureDebater, { renderHistoricalFigureDebaterOutput } from './HistoricalFigureDebater';
import LiteraryDeviceSpotter, { renderLiteraryDeviceSpotterOutput } from './LiteraryDeviceSpotter';
import ScienceLabSimulator, { renderScienceLabSimulatorOutput } from './ScienceLabSimulator';
import SocraticMethodTutor, { renderSocraticMethodTutorOutput } from './SocraticMethodTutor';
import CollegeAppEssayBrainstormer, { renderCollegeAppEssayBrainstormerOutput } from './CollegeAppEssayBrainstormer';
import EthicalDilemmaExplorer, { renderEthicalDilemmaExplorerOutput } from './EthicalDilemmaExplorer';
import PoetryMoodVisualizer, { renderPoetryMoodVisualizerOutput } from './PoetryMoodVisualizer';
import VocabularyContextualizer, { renderVocabularyContextualizerOutput } from './VocabularyContextualizer';
import AlternateHistoryGenerator, { renderAlternateHistoryGeneratorOutput } from './AlternateHistoryGenerator';
import MathProofAssistant, { renderMathProofAssistantOutput } from './MathProofAssistant';
import DifferentialDiagnosisGenerator, { renderDifferentialDiagnosisGeneratorOutput } from './DifferentialDiagnosisGenerator';
import ClinicalCaseSimulator, { renderClinicalCaseSimulatorOutput } from './ClinicalCaseSimulator';
import MedicalMnemonicCreator, { renderMedicalMnemonicCreatorOutput } from './MedicalMnemonicCreator';
import PharmacologyFlashcardGenerator, { renderPharmacologyFlashcardGeneratorOutput } from './PharmacologyFlashcardGenerator';
import RadiologyReportExplainer, { renderRadiologyReportExplainerOutput } from './RadiologyReportExplainer';
import SurgicalProcedureOutliner, { renderSurgicalProcedureOutlinerOutput } from './SurgicalProcedureOutliner';
import SoapNoteAssistant, { renderSoapNoteAssistantOutput } from './SoapNoteAssistant';
import MedicalEthicsConsultant, { renderMedicalEthicsConsultantOutput } from './MedicalEthicsConsultant';
import BiochemistryPathwayVisualizer, { renderBiochemistryPathwayVisualizerOutput } from './BiochemistryPathwayVisualizer';
import MedicalAbbreviationExpander, { renderMedicalAbbreviationExpanderOutput } from './MedicalAbbreviationExpander';
import ConceptWeaver, { renderConceptWeaverOutput } from './ConceptWeaver';
import LearningPathGenerator from './LearningPathGenerator';

import MetaphorMixer, { renderMetaphorMixerOutput } from './MetaphorMixer';
import ArgumentWeaknessSpotter, { renderArgumentWeaknessSpotterOutput } from './ArgumentWeaknessSpotter';
import HistoricalFlyOnTheWall, { renderHistoricalFlyOnTheWallOutput } from './HistoricalFlyOnTheWall';
import FiveYearOldExplainer, { renderFiveYearOldExplainerOutput } from './FiveYearOldExplainer';
import FutureHeadlineGenerator, { renderFutureHeadlineGeneratorOutput } from './FutureHeadlineGenerator';
import EmojiStoryTranslator, { renderEmojiStoryTranslatorOutput } from './EmojiStoryTranslator';
import PersonalizedProverbCreator, { renderPersonalizedProverbCreatorOutput } from './PersonalizedProverbCreator';
import DebateTopicGenerator, { renderDebateTopicGeneratorOutput } from './DebateTopicGenerator';
import MythDebunker, { renderMythDebunkerOutput } from './MythDebunker';
import PunGenerator, { renderPunGeneratorOutput } from './PunGenerator';
import FictionalCharacterAnalyst, { renderFictionalCharacterAnalystOutput } from './FictionalCharacterAnalyst';
import SlangTranslator, { renderSlangTranslatorOutput } from './SlangTranslator';
import HistoricalPenPal, { renderHistoricalPenPalOutput } from './HistoricalPenPal';
import WhatIfScienceExplainer, { renderWhatIfScienceExplainerOutput } from './WhatIfScienceExplainer';
import RecipeFusionChef, { renderRecipeFusionChefOutput } from './RecipeFusionChef';
import ChemicalReactionSimulator, { renderChemicalReactionSimulatorOutput } from './games/ChemicalReactionSimulator';
import CosmicExplorer, { renderCosmicExplorerOutput } from './games/CosmicExplorer';
import CodeBreaker, { renderCodeBreakerOutput } from './games/CodeBreaker';
import GameIdeaGenerator, { renderGameIdeaGeneratorOutput } from './gamedev/GameIdeaGenerator';
import CharacterBackstoryGenerator, { renderCharacterBackstoryGeneratorOutput } from './gamedev/CharacterBackstoryGenerator';
import QuestGenerator, { renderQuestGeneratorOutput } from './gamedev/QuestGenerator';
import MemeIdeaGenerator, { renderMemeIdeaGeneratorOutput } from './entertainment/MemeIdeaGenerator';
import PersonalizedPepTalkGenerator, { renderPersonalizedPepTalkGeneratorOutput } from './entertainment/PersonalizedPepTalkGenerator';
import MySuperpowerGenerator, { renderMySuperpowerGeneratorOutput } from './entertainment/MySuperpowerGenerator';
import FictionalFoodCritic, { renderFictionalFoodCriticOutput } from './entertainment/FictionalFoodCritic';
import AlienEncounterSimulator, { renderAlienEncounterSimulatorOutput } from './entertainment/AlienEncounterSimulator';
import FlashcardGenerator, { renderFlashcardGeneratorOutput } from './FlashcardGenerator';
import ArrangeQuizCompetition from '../components/ArrangeQuizCompetition';
import ParticipateQuizCompetition from '../components/ParticipateQuizCompetition';
import CollaborativeStudyRoom from '../components/CollaborativeStudyRoom';
import PasswordGenerator from './PasswordGenerator';
import PhotoResizer from './PhotoResizer';
import FileConverter from './FileConverter';
import FileCompressor from './FileCompressor';
import QRCodeGenerator from './QRCodeGenerator';

import AIEthicsAdvisor, { renderAIEthicsAdvisorOutput } from './robotics/AIEthicsAdvisor';
import RobotSpecGenerator, { renderRobotSpecGeneratorOutput } from './robotics/RobotSpecGenerator';
import AlgorithmExplainer, { renderAlgorithmExplainerOutput } from './robotics/AlgorithmExplainer';
import NeuralNetworkArchitect, { renderNeuralNetworkArchitectOutput } from './robotics/NeuralNetworkArchitect';
import RosNodeScripter, { renderRosNodeScripterOutput } from './robotics/RosNodeScripter';
import SciFiRobotInspirator, { renderSciFiRobotInspiratorOutput } from './robotics/SciFiRobotInspirator';
import AIProjectIdeaGenerator, { renderAIProjectIdeaGeneratorOutput } from './robotics/AIProjectIdeaGenerator';
import MLModelSelector, { renderMLModelSelectorOutput } from './robotics/MLModelSelector';
import RoboticsSensorSuggester, { renderRoboticsSensorSuggesterOutput } from './robotics/RoboticsSensorSuggester';
import PseudocodeGenerator, { renderPseudocodeGeneratorOutput } from './robotics/PseudocodeGenerator';

import { 
    BookOpenIcon, BeakerIcon, CodeBracketIcon, ChatBubbleLeftRightIcon, AcademicCapIcon, 
    CalculatorIcon, DocumentTextIcon, ScaleIcon, PencilSquareIcon, ClipboardDocumentCheckIcon, 
    FireIcon, MoonIcon, GiftIcon, MapPinIcon, DocumentMagnifyingGlassIcon, 
    ArrowsRightLeftIcon, BookmarkSquareIcon, UsersIcon, SparklesIcon, VariableIcon, 
    QuestionMarkCircleIcon, NewspaperIcon, ShieldCheckIcon, PaintBrushIcon, 
    ChatBubbleBottomCenterTextIcon, ClockIcon, CheckBadgeIcon, StethoscopeIcon,
    ClipboardDocumentListIcon, PuzzlePieceIcon, PillIcon, EyeIcon, ScissorsIcon,
    DocumentDuplicateIcon, ChatBubbleLeftEllipsisIcon, MoleculeIcon, Bars3BottomLeftIcon,
    ShareIcon, MapIcon, FunnelIcon, ExclamationTriangleIcon, PencilIcon, FaceSmileIcon,
    GlobeAltIcon, LanguageIcon, TrophyIcon, MegaphoneIcon, MagnifyingGlassCircleIcon,
    ChatBubbleOvalLeftEllipsisIcon, UserCircleIcon, ArrowPathIcon, EnvelopeIcon,
    CubeTransparentIcon, BoltIcon, RocketLaunchIcon, KeyIcon, LightBulbIcon, CpuChipIcon, Cog6ToothIcon
} from './Icons';

export const tools: Tool[] = [
  // Productivity
  {
    id: 'todo-list',
    name: 'Todo List',
    description: 'Organize your tasks with a simple and effective todo list manager.',
    category: 'Productivity',
    icon: ClipboardDocumentCheckIcon,
    path: '/todo'
  },
  {
    id: 'note-taking',
    name: 'Note Taking',
    description: 'Jot down your thoughts and ideas with a markdown-enabled notes app.',
    category: 'Productivity',
    icon: PencilIcon,
    path: '/notes'
  },
  // Robotics & AI
  {
    id: 'ai-ethics-advisor',
    name: 'AI Ethics Advisor',
    description: 'Analyzes a proposed AI application for ethical pitfalls like bias, privacy, and transparency.',
    category: 'Robotics & AI',
    icon: ShieldCheckIcon,
    component: AIEthicsAdvisor,
    promptSuggestion: 'An AI that scans social media to predict potential criminals.',
    renderOutput: renderAIEthicsAdvisorOutput
  },
  {
    id: 'robot-spec-generator',
    name: 'Robot Design Spec Generator',
    description: 'Creates a technical specification sheet for a robot based on a high-level description.',
    category: 'Robotics & AI',
    icon: Cog6ToothIcon,
    component: RobotSpecGenerator,
    promptSuggestion: 'A small, wheeled robot for exploring and mapping household environments.',
    renderOutput: renderRobotSpecGeneratorOutput
  },
  {
    id: 'algorithm-explainer',
    name: 'Algorithm Explainer',
    description: 'Explains complex AI/ML algorithms in simple terms with analogies.',
    category: 'Robotics & AI',
    icon: AcademicCapIcon,
    component: AlgorithmExplainer,
    promptSuggestion: 'Explain the K-Means Clustering algorithm.',
    renderOutput: renderAlgorithmExplainerOutput
  },
  {
    id: 'neural-network-architect',
    name: 'Neural Network Architect',
    description: 'Suggests a neural network architecture for a given problem type.',
    category: 'Robotics & AI',
    icon: ShareIcon,
    component: NeuralNetworkArchitect,
    promptSuggestion: 'A network to classify images of cats and dogs.',
    renderOutput: renderNeuralNetworkArchitectOutput
  },
  {
    id: 'ros-node-scripter',
    name: 'ROS Node Scripter',
    description: 'Generates boilerplate Python code for a ROS (Robot Operating System) node.',
    category: 'Robotics & AI',
    icon: CodeBracketIcon,
    component: RosNodeScripter,
    promptSuggestion: 'A simple ROS publisher node for a string message.',
    renderOutput: renderRosNodeScripterOutput
  },
  {
    id: 'sci-fi-robot-inspirator',
    name: 'Sci-Fi Robot Inspirator',
    description: 'Creates a concept for a fictional robot, including its purpose, design, and a unique quirk.',
    category: 'Robotics & AI',
    icon: RocketLaunchIcon,
    component: SciFiRobotInspirator,
    promptSuggestion: 'A robot inspired by deep-sea creatures.',
    renderOutput: renderSciFiRobotInspiratorOutput
  },
  {
    id: 'ai-project-idea-generator',
    name: 'AI Project Idea Generator',
    description: 'Brainstorms novel AI/ML project ideas with a problem, dataset suggestion, and success metric.',
    category: 'Robotics & AI',
    icon: LightBulbIcon,
    component: AIProjectIdeaGenerator,
    promptSuggestion: 'A project related to environmental conservation.',
    renderOutput: renderAIProjectIdeaGeneratorOutput
  },
  {
    id: 'ml-model-selector',
    name: 'ML Model Selector',
    description: 'Recommends the best type of ML model for a specific task and dataset.',
    category: 'Robotics & AI',
    icon: FunnelIcon,
    component: MLModelSelector,
    promptSuggestion: 'I want to predict house prices based on features like square footage and number of bedrooms.',
    renderOutput: renderMLModelSelectorOutput
  },
  {
    id: 'robotics-sensor-suggester',
    name: 'Robotics Sensor Suggester',
    description: 'Suggests appropriate sensors for a robot based on its intended tasks.',
    category: 'Robotics & AI',
    icon: EyeIcon,
    component: RoboticsSensorSuggester,
    promptSuggestion: 'Sensors for an autonomous drone that needs to avoid obstacles indoors.',
    renderOutput: renderRoboticsSensorSuggesterOutput
  },
  {
    id: 'pseudocode-generator',
    name: 'Pseudocode Generator',
    description: 'Converts a plain English description of a process into structured pseudocode.',
    category: 'Robotics & AI',
    icon: DocumentTextIcon,
    component: PseudocodeGenerator,
    promptSuggestion: 'A process that sorts a list of numbers from smallest to largest.',
    renderOutput: renderPseudocodeGeneratorOutput
  },
  // Games & Entertainment
  {
    id: 'meme-idea-generator',
    name: 'Meme Idea Generator',
    description: 'Stuck for a caption? Describe a situation and get the perfect top and bottom text for a popular meme format.',
    category: 'Games & Entertainment',
    icon: FaceSmileIcon,
    component: MemeIdeaGenerator,
    promptSuggestion: 'Trying to explain a simple concept to your parents.',
    renderOutput: renderMemeIdeaGeneratorOutput
  },
  {
    id: 'personalized-pep-talk',
    name: 'Personalized Pep Talk',
    description: 'Feeling down? Tell the AI why, and get an uplifting, funny, or motivational message to lift your spirits.',
    category: 'Games & Entertainment',
    icon: SparklesIcon,
    component: PersonalizedPepTalkGenerator,
    promptSuggestion: 'I feel overwhelmed with my workload.',
    renderOutput: renderPersonalizedPepTalkGeneratorOutput
  },
  {
    id: 'my-superpower-generator',
    name: 'My Superpower Generator',
    description: 'Describe your personality, and the AI will invent a unique superpower just for you, complete with a funny weakness.',
    category: 'Games & Entertainment',
    icon: ShieldCheckIcon,
    component: MySuperpowerGenerator,
    promptSuggestion: 'I am very organized, a bit of a perfectionist, and I love cats.',
    renderOutput: renderMySuperpowerGeneratorOutput
  },
  {
    id: 'fictional-food-critic',
    name: 'Fictional Food Critic',
    description: 'Get a hilarious, over-the-top food critic review for any dish from movies, books, or games.',
    category: 'Games & Entertainment',
    icon: PencilSquareIcon,
    component: FictionalFoodCritic,
    promptSuggestion: 'Lembas Bread from Lord of the Rings',
    renderOutput: renderFictionalFoodCriticOutput
  },
  {
    id: 'alien-encounter-simulator',
    name: 'Alien Encounter Simulator',
    description: 'Describe an everyday Earth object to get a scientific report from a baffled alien who has just discovered it.',
    category: 'Games & Entertainment',
    icon: QuestionMarkCircleIcon,
    component: AlienEncounterSimulator,
    promptSuggestion: 'A Slinky',
    renderOutput: renderAlienEncounterSimulatorOutput
  },
  {
    id: 'chemical-reaction-simulator',
    name: 'Chemical Reaction Simulator',
    description: 'Mix chemical elements in a virtual cauldron to see what reactions occur. Learn about compounds and chemical properties in a fun, safe way.',
    category: 'Games & Entertainment',
    icon: BeakerIcon,
    component: ChemicalReactionSimulator,
    renderOutput: renderChemicalReactionSimulatorOutput
  },
  {
    id: 'cosmic-explorer',
    name: 'Cosmic Explorer',
    description: 'Travel to any planet or major moon in our solar system and pull up a data card with fascinating facts and key information.',
    category: 'Games & Entertainment',
    icon: RocketLaunchIcon,
    component: CosmicExplorer,
    renderOutput: renderCosmicExplorerOutput
  },
  {
    id: 'code-breaker',
    name: 'Code Breaker',
    description: 'Challenge the AI in a game of logic. Can you guess the secret code in a limited number of tries? A fun way to train your problem-solving skills.',
    category: 'Games & Entertainment',
    icon: KeyIcon,
    component: CodeBreaker,
    renderOutput: renderCodeBreakerOutput
  },
  {
    id: 'myth-debunker',
    name: 'Myth Debunker',
    description: 'Get the real facts behind common myths and misconceptions. Busted, plausible, or confirmed?',
    category: 'Games & Entertainment',
    icon: MagnifyingGlassCircleIcon,
    component: MythDebunker,
    promptSuggestion: 'The belief that you only use 10% of your brain.',
    renderOutput: renderMythDebunkerOutput
  },
  {
    id: 'pun-generator',
    name: 'Pun Generator',
    description: 'Need a laugh? Enter a topic and get a list of clever (and sometimes groan-worthy) puns.',
    category: 'Games & Entertainment',
    icon: ChatBubbleOvalLeftEllipsisIcon,
    component: PunGenerator,
    promptSuggestion: 'Computer Science',
    renderOutput: renderPunGeneratorOutput
  },
  {
    id: 'fictional-character-analyst',
    name: 'Fictional Character Analyst',
    description: 'Get a psychological profile of your favorite fictional characters, with evidence-based analysis.',
    category: 'Games & Entertainment',
    icon: UserCircleIcon,
    component: FictionalCharacterAnalyst,
    promptSuggestion: 'Sherlock Holmes',
    renderOutput: renderFictionalCharacterAnalystOutput
  },
  {
    id: 'slang-translator',
    name: 'Slang Translator',
    description: 'Translate modern slang into formal English and learn its origin and how it\'s used.',
    category: 'Games & Entertainment',
    icon: ArrowPathIcon,
    component: SlangTranslator,
    promptSuggestion: 'What does "spill the tea" mean?',
    renderOutput: renderSlangTranslatorOutput
  },
  {
    id: 'historical-pen-pal',
    name: 'Historical Pen Pal',
    description: 'Receive a letter from a historical figure reacting to a modern concept or invention.',
    category: 'Games & Entertainment',
    icon: EnvelopeIcon,
    component: HistoricalPenPal,
    promptSuggestion: 'A letter from Albert Einstein about smartphones.',
    renderOutput: renderHistoricalPenPalOutput
  },
  {
    id: 'what-if-science-explainer',
    name: 'What If? Science Explainer',
    description: 'Explore wild hypothetical scenarios and get a scientific breakdown of what would actually happen.',
    category: 'Games & Entertainment',
    icon: CubeTransparentIcon,
    component: WhatIfScienceExplainer,
    promptSuggestion: 'What if the moon disappeared?',
    renderOutput: renderWhatIfScienceExplainerOutput
  },
  {
    id: 'recipe-fusion-chef',
    name: 'Recipe Fusion Chef',
    description: 'Combine two different cuisines to create a unique and delicious new dish.',
    category: 'Games & Entertainment',
    icon: BoltIcon,
    component: RecipeFusionChef,
    promptSuggestion: 'Combine Italian and Korean cuisines.',
    renderOutput: renderRecipeFusionChefOutput
  },
  // High School
  {
    id: 'essay-outliner',
    name: 'Essay Outliner',
    description: 'Generate a structured outline for any essay topic to kickstart your writing process.',
    category: 'High School',
    icon: DocumentTextIcon,
    component: EssayOutliner,
    promptSuggestion: 'The impact of social media on teenage mental health.',
    renderOutput: renderEssayOutlinerOutput
  },
  {
    id: 'thesis-statement-generator',
    name: 'Thesis Statement Generator',
    description: 'Create a strong, arguable thesis statement for your research paper or essay.',
    category: 'High School',
    icon: AcademicCapIcon,
    component: ThesisStatementGenerator,
    promptSuggestion: 'Topic: Renewable Energy. Stance: Governments should invest more in solar and wind power.',
    renderOutput: renderThesisStatementGeneratorOutput
  },
  {
    id: 'math-problem-solver',
    name: 'Math Problem Solver',
    description: 'Get step-by-step solutions to complex math problems, from algebra to calculus.',
    category: 'High School',
    icon: CalculatorIcon,
    component: MathProblemSolver,
    promptSuggestion: 'Solve for x: 2x^2 - 5x + 3 = 0',
    renderOutput: renderMathProblemSolverOutput
  },
  {
    id: 'historical-figure-debater',
    name: 'Historical Figure Debater',
    description: 'Debate a historical figure on a key topic. The AI responds from their perspective.',
    category: 'High School',
    icon: UsersIcon,
    component: HistoricalFigureDebater,
    promptSuggestion: 'Debate Marie Curie on the topic of scientific ethics and the dangers of discovery.',
    renderOutput: renderHistoricalFigureDebaterOutput
  },
  {
    id: 'literary-device-spotter',
    name: 'Literary Device Spotter',
    description: 'Analyzes a piece of text to find, quote, and explain the effect of literary devices.',
    category: 'High School',
    icon: SparklesIcon,
    component: LiteraryDeviceSpotter,
    promptSuggestion: 'Paste the first chapter of "The Great Gatsby" here.',
    renderOutput: renderLiteraryDeviceSpotterOutput
  },
  {
    id: 'science-lab-simulator',
    name: 'Science Lab Simulator',
    description: 'Describe an experiment to generate a full lab report with hypothesis, results, and conclusion.',
    category: 'High School',
    icon: VariableIcon,
    component: ScienceLabSimulator,
    promptSuggestion: 'A classic volcano experiment using baking soda and vinegar.',
    renderOutput: renderScienceLabSimulatorOutput
  },
  {
    id: 'socratic-method-tutor',
    name: 'Socratic Method Tutor',
    description: 'Instead of answers, get guiding questions from an AI tutor to help you solve problems yourself.',
    category: 'High School',
    icon: QuestionMarkCircleIcon,
    component: SocraticMethodTutor,
    promptSuggestion: 'I need to understand the theme of justice in Shakespeare\'s "The Merchant of Venice".',
    renderOutput: renderSocraticMethodTutorOutput
  },
  {
    id: 'college-app-essay-brainstormer',
    name: 'College App Essay Brainstormer',
    description: 'Generates unique themes and starting points for your college application essay.',
    category: 'High School',
    icon: NewspaperIcon,
    component: CollegeAppEssayBrainstormer,
    promptSuggestion: 'My main extracurricular is debate club and I have a passion for environmental science.',
    renderOutput: renderCollegeAppEssayBrainstormerOutput
  },
  {
    id: 'ethical-dilemma-explorer',
    name: 'Ethical Dilemma Explorer',
    description: 'Analyzes a moral problem from different philosophical viewpoints (e.g., Utilitarian).',
    category: 'High School',
    icon: ShieldCheckIcon,
    component: EthicalDilemmaExplorer,
    promptSuggestion: 'The ethical implications of using CRISPR gene-editing technology on humans.',
    renderOutput: renderEthicalDilemmaExplorerOutput
  },
  {
    id: 'poetry-mood-visualizer',
    name: 'Poetry Mood Visualizer',
    description: 'Analyzes a poem for its mood and themes, then generates a representative color palette.',
    category: 'High School',
    icon: PaintBrushIcon,
    component: PoetryMoodVisualizer,
    promptSuggestion: 'Analyze the poem "The Raven" by Edgar Allan Poe.',
    renderOutput: renderPoetryMoodVisualizerOutput
  },
  {
    id: 'vocabulary-contextualizer',
    name: 'Vocabulary Contextualizer',
    description: 'Learn tough SAT/ACT words with example sentences in multiple real-world contexts.',
    category: 'High School',
    icon: ChatBubbleBottomCenterTextIcon,
    component: VocabularyContextualizer,
    promptSuggestion: 'The word "ubiquitous".',
    renderOutput: renderVocabularyContextualizerOutput
  },
  {
    id: 'alternate-history-generator',
    name: 'Alternate History Generator',
    description: 'Propose a "What If?" scenario and get a plausible alternate historical timeline of events.',
    category: 'High School',
    icon: ClockIcon,
    component: AlternateHistoryGenerator,
    promptSuggestion: 'What if the Library of Alexandria never burned down?',
    renderOutput: renderAlternateHistoryGeneratorOutput
  },
  {
    id: 'math-proof-assistant',
    name: 'Math Proof Assistant',
    description: 'Get feedback on your mathematical proofs, with step-by-step logical validation.',
    category: 'High School',
    icon: CheckBadgeIcon,
    component: MathProofAssistant,
    promptSuggestion: 'My attempt to prove the Pythagorean theorem using similar triangles.',
    renderOutput: renderMathProofAssistantOutput
  },
  // Medical
  {
    id: 'medical-term-definer',
    name: 'Medical Term Definer',
    description: 'Get simple, easy-to-understand definitions for complex medical terminology.',
    category: 'Medical',
    icon: BeakerIcon,
    component: MedicalTermDefiner,
    promptSuggestion: 'Myocardial Infarction',
    renderOutput: renderMedicalTermDefinerOutput
  },
  {
    id: 'differential-diagnosis-generator',
    name: 'DDx Generator',
    description: 'Enter symptoms to get a ranked list of possible diagnoses and their key features.',
    category: 'Medical',
    icon: StethoscopeIcon,
    component: DifferentialDiagnosisGenerator,
    promptSuggestion: '45-year-old male with chest pain, shortness of breath, and diaphoresis.',
    renderOutput: renderDifferentialDiagnosisGeneratorOutput
  },
  {
    id: 'clinical-case-simulator',
    name: 'Clinical Case Simulator',
    description: 'Practice your clinical reasoning with a realistic, AI-generated patient case and management plan.',
    category: 'Medical',
    icon: ClipboardDocumentListIcon,
    component: ClinicalCaseSimulator,
    promptSuggestion: 'A case of a 60-year-old female with new-onset atrial fibrillation.',
    renderOutput: renderClinicalCaseSimulatorOutput
  },
  {
    id: 'medical-mnemonic-creator',
    name: 'Mnemonic Creator',
    description: 'Generate a memorable mnemonic for any complex medical topic you need to memorize.',
    category: 'Medical',
    icon: PuzzlePieceIcon,
    component: MedicalMnemonicCreator,
    promptSuggestion: 'The 12 cranial nerves and their functions.',
    renderOutput: renderMedicalMnemonicCreatorOutput
  },
  {
    id: 'pharmacology-flashcard-generator',
    name: 'Pharmacology Flashcard',
    description: 'Instantly create a detailed flashcard for any drug, including MOA, side effects, and more.',
    category: 'Medical',
    icon: PillIcon,
    component: PharmacologyFlashcardGenerator,
    promptSuggestion: 'Lisinopril',
    renderOutput: renderPharmacologyFlashcardGeneratorOutput
  },
  {
    id: 'radiology-report-explainer',
    name: 'Radiology Report Explainer',
    description: 'Translate dense radiology report jargon into plain English and get a summary of key findings.',
    category: 'Medical',
    icon: EyeIcon,
    component: RadiologyReportExplainer,
    promptSuggestion: 'Paste a chest X-ray report here.',
    renderOutput: renderRadiologyReportExplainerOutput
  },
  {
    id: 'surgical-procedure-outliner',
    name: 'Surgical Procedure Outliner',
    description: 'Get a high-level, step-by-step outline of any surgical procedure, from prep to closure.',
    category: 'Medical',
    icon: ScissorsIcon,
    component: SurgicalProcedureOutliner,
    promptSuggestion: 'Laparoscopic Cholecystectomy',
    renderOutput: renderSurgicalProcedureOutlinerOutput
  },
  {
    id: 'soap-note-assistant',
    name: 'SOAP Note Assistant',
    description: 'Structure your patient encounter findings into a professional SOAP note format.',
    category: 'Medical',
    icon: DocumentDuplicateIcon,
    component: SoapNoteAssistant,
    promptSuggestion: 'Patient is a 34yo female presenting with a 3-day history of cough and fever. Vitals are stable.',
    renderOutput: renderSoapNoteAssistantOutput
  },
  {
    id: 'medical-ethics-consultant',
    name: 'Medical Ethics Consultant',
    description: 'Analyze a complex clinical scenario using the four pillars of medical ethics.',
    category: 'Medical',
    icon: ChatBubbleLeftEllipsisIcon,
    component: MedicalEthicsConsultant,
    promptSuggestion: 'A patient with a terminal illness is refusing life-sustaining treatment, but the family disagrees.',
    renderOutput: renderMedicalEthicsConsultantOutput
  },
  {
    id: 'biochemistry-pathway-visualizer',
    name: 'Biochemistry Pathway Visualizer',
    description: 'Generate a text-based flowchart of a metabolic pathway showing substrates, enzymes, and products.',
    category: 'Medical',
    icon: MoleculeIcon,
    component: BiochemistryPathwayVisualizer,
    promptSuggestion: 'The process of Glycolysis',
    renderOutput: renderBiochemistryPathwayVisualizerOutput
  },
  {
    id: 'medical-abbreviation-expander',
    name: 'Abbreviation Expander',
    description: 'Quickly find the full name and context for a list of confusing medical abbreviations.',
    category: 'Medical',
    icon: Bars3BottomLeftIcon,
    component: MedicalAbbreviationExpander,
    promptSuggestion: 'What do SOB, PRN, and NPO mean?',
    renderOutput: renderMedicalAbbreviationExpanderOutput
  },
  // Programming
  {
    id: 'code-explainer',
    name: 'Code Explainer',
    description: 'Understand any code snippet with a clear, line-by-line explanation of its functionality.',
    category: 'Programming',
    icon: CodeBracketIcon,
    component: CodeExplainer,
    promptSuggestion: `function factorial(n) {
  return n > 1 ? n * factorial(n - 1) : 1;
}`,
    renderOutput: renderCodeExplainerOutput
  },
  // General
  {
    id: 'flashcard-generator',
    name: 'Flashcard Generator',
    description: 'Instantly create flashcards for any topic to supercharge your study sessions.',
    category: 'General',
    icon: DocumentDuplicateIcon,
    component: FlashcardGenerator,
    promptSuggestion: 'The main components of a cell.',
    renderOutput: renderFlashcardGeneratorOutput
  },
{
  id: 'mcq-generator',
  name: 'MCQ Generator',
  description: 'Paste a block of text and generate multiple-choice questions to test your knowledge.',
  category: 'General',
  icon: BookOpenIcon,
  component: McqGenerator,
  promptSuggestion: 'Photosynthesis is a process used by plants, algae, and certain bacteria to convert light energy into chemical energy.',
  renderOutput: (output) => renderMcqOutput(output, () => {}, () => {}),
},
  {
    id: 'study-buddy-chat',
    name: 'Study Buddy Chat',
    description: 'Chat with an AI tutor about any subject to deepen your understanding and get questions answered.',
    category: 'General',
    icon: ChatBubbleLeftRightIcon,
    component: StudyBuddyChat,
    promptSuggestion: 'Can you explain the difference between mitosis and meiosis?',
    renderOutput: renderStudyBuddyChatOutput
  },
  {
    id: 'decision-helper',
    name: 'Decision Helper',
    description: 'Analyzes a decision by listing pros and cons to help you make a balanced choice.',
    category: 'General',
    icon: ScaleIcon,
    component: DecisionHelper,
    promptSuggestion: 'Should I learn Python or JavaScript as my first programming language?',
    renderOutput: renderDecisionHelperOutput
  },
  {
    id: 'creative-story-generator',
    name: 'Creative Story Generator',
    description: 'Generates a unique short story based on your genre, characters, and plot ideas.',
    category: 'General',
    icon: PencilSquareIcon,
    component: CreativeStoryGenerator,
    promptSuggestion: 'Genre: Sci-Fi, Character: A curious robot, Plot: It discovers an ancient, forgotten garden on a spaceship.',
    renderOutput: renderCreativeStoryGeneratorOutput
  },
  {
    id: 'workout-planner',
    name: 'Workout Planner',
    description: 'Creates a personalized 7-day workout plan based on your fitness goals and level.',
    category: 'General',
    icon: ClipboardDocumentCheckIcon,
    component: WorkoutPlanner,
    promptSuggestion: 'Goal: Build muscle, Days per week: 4, Fitness level: Intermediate',
    renderOutput: renderWorkoutPlannerOutput
  },
  {
    id: 'recipe-creator',
    name: 'Recipe Creator',
    description: 'Generates a creative recipe from a list of ingredients you have on hand.',
    category: 'General',
    icon: FireIcon,
    component: RecipeCreator,
    promptSuggestion: 'Ingredients: chicken breast, rice, broccoli, soy sauce, garlic',
    renderOutput: renderRecipeCreatorOutput
  },
  {
    id: 'dream-interpreter',
    name: 'Dream Interpreter',
    description: 'Provides possible interpretations for the themes and symbols in your dreams.',
    category: 'General',
    icon: MoonIcon,
    component: DreamInterpreter,
    promptSuggestion: 'I dreamed I was flying over a city made of glass.',
    renderOutput: renderDreamInterpreterOutput
  },
  {
    id: 'gift-idea-generator',
    name: 'Gift Idea Generator',
    description: 'Suggests thoughtful gift ideas based on the recipient\'s interests, age, and your budget.',
    category: 'General',
    icon: GiftIcon,
    component: GiftIdeaGenerator,
    promptSuggestion: 'Recipient: My dad, Age: 55, Interests: Gardening, history books, Budget: $50',
    renderOutput: renderGiftIdeaGeneratorOutput
  },
  {
  id: 'travel-itinerary-planner',
  name: 'Travel Itinerary Planner',
  description: 'Creates a day-by-day travel plan for any destination and trip duration.',
  category: 'General',
  icon: MapPinIcon,
  component: TravelItineraryPlanner,
  promptSuggestion: 'Location: Kyoto, Japan, Duration: 5 days, Interests: Temples, food, nature',
  renderOutput: (output) => <TravelItineraryOutputView output={output} />
},
  {
    id: 'text-summarizer',
    name: 'Text Summarizer',
    description: 'Condenses long articles, documents, or text into key bullet points for quick understanding.',
    category: 'General',
    icon: DocumentMagnifyingGlassIcon,
    component: TextSummarizer,
    promptSuggestion: 'Paste a long article here to get a quick summary...',
    renderOutput: renderTextSummarizerOutput
  },
  {
    id: 'analogies-generator',
    name: 'Analogies Generator',
    description: 'Explains a complex topic or concept using simple, easy-to-understand analogies.',
    category: 'General',
    icon: ArrowsRightLeftIcon,
    component: AnalogiesGenerator,
    promptSuggestion: 'Explain how a blockchain works.',
    renderOutput: renderAnalogiesGeneratorOutput
  },
  {
    id: 'book-recommender',
    name: 'Book Recommender',
    description: 'Get personalized book recommendations based on your favorite genres and authors.',
    category: 'General',
    icon: BookmarkSquareIcon,
    component: BookRecommender,
    promptSuggestion: 'Genres: Fantasy, Mystery. Favorite Authors: J.R.R. Tolkien, Agatha Christie',
    renderOutput: renderBookRecommenderOutput
  },
  {
    id: 'concept-weaver',
    name: 'Concept Weaver',
    description: 'Connects two unrelated concepts with a creative, step-by-step logical chain.',
    category: 'General',
    icon: ShareIcon,
    component: ConceptWeaver,
    promptSuggestion: 'Connect "Beekeeping" and "Cryptocurrency".',
    renderOutput: renderConceptWeaverOutput
  },
  {
  id: 'learning-path-generator',
  name: 'Learning Path Generator',
  description: 'Generates a structured, week-by-week syllabus for learning any new skill.',
  category: 'General',
  icon: MapIcon,
  component: LearningPathGenerator,
  promptSuggestion: 'I want to learn oil painting, starting as a complete beginner.',
  renderOutput: (output) => <LearningPathGenerator output={output} />
},

  {
    id: 'metaphor-mixer',
    name: 'Metaphor Mixer',
    description: 'Explains one complex topic using several different metaphors from various domains.',
    category: 'General',
    icon: FunnelIcon,
    component: MetaphorMixer,
    promptSuggestion: 'Explain the concept of "inflation" in economics.',
    renderOutput: renderMetaphorMixerOutput
  },
  {
    id: 'argument-weakness-spotter',
    name: 'Argument Weakness Spotter',
    description: 'Analyzes your argument to find logical fallacies, weak points, and potential counter-arguments.',
    category: 'General',
    icon: ExclamationTriangleIcon,
    component: ArgumentWeaknessSpotter,
    promptSuggestion: 'Paste an argumentative essay here to find its flaws.',
    renderOutput: renderArgumentWeaknessSpotterOutput
  },
  {
    id: 'historical-fly-on-the-wall',
    name: 'Historical "Fly on the Wall"',
    description: 'Generates a first-person, present-tense narrative of a historical event from a common person\'s view.',
    category: 'General',
    icon: PencilIcon,
    component: HistoricalFlyOnTheWall,
    promptSuggestion: 'The mood in the crowd during the "I Have a Dream" speech.',
    renderOutput: renderHistoricalFlyOnTheWallOutput
  },
  {
    id: 'five-year-old-explainer',
    name: 'Five-Year-Old Explainer',
    description: 'Simplifies a complex topic using only words and concepts a five-year-old would understand.',
    category: 'General',
    icon: FaceSmileIcon,
    component: FiveYearOldExplainer,
    promptSuggestion: 'Explain how a car engine works.',
    renderOutput: renderFiveYearOldExplainerOutput
  },
  {
    id: 'future-headline-generator',
    name: 'Future Headline Generator',
    description: 'Generates plausible news headlines from the future based on a current trend or technology.',
    category: 'General',
    icon: GlobeAltIcon,
    component: FutureHeadlineGenerator,
    promptSuggestion: 'Current trend: The rise of remote work.',
    renderOutput: renderFutureHeadlineGeneratorOutput
  },
  {
    id: 'emoji-story-translator',
    name: 'Emoji Story Translator',
    description: 'Translates a block of text into a narrative told with emojis, or vice-versa.',
    category: 'General',
    icon: LanguageIcon,
    component: EmojiStoryTranslator,
    promptSuggestion: 'The story of the three little pigs.',
    renderOutput: renderEmojiStoryTranslatorOutput
  },
  {
    id: 'personalized-proverb-creator',
    name: 'Personalized Proverb Creator',
    description: 'Turns a personal experience or lesson learned into a unique, wise-sounding proverb.',
    category: 'General',
    icon: TrophyIcon,
    component: PersonalizedProverbCreator,
    promptSuggestion: 'I learned that taking a short break often helps me solve a problem faster than staring at it for hours.',
    renderOutput: renderPersonalizedProverbCreatorOutput
  },
  {
    id: 'debate-topic-generator',
    name: 'Debate Topic Generator',
    description: 'Creates nuanced, well-structured debate resolutions with starting points for both sides.',
    category: 'General',
    icon: MegaphoneIcon,
    component: DebateTopicGenerator,
    promptSuggestion: 'Generate a debate topic about the ethics of artificial intelligence in art.',
    renderOutput: renderDebateTopicGeneratorOutput
  },
  // GameDev
  {
    id: 'game-idea-generator',
    name: 'Game Idea Generator',
    description: 'Brainstorm unique game ideas with genres, core mechanics, and pitches.',
    category: 'GameDev',
    icon: LightBulbIcon,
    component: GameIdeaGenerator,
    promptSuggestion: 'A puzzle game where you manipulate gravity to solve challenges.',
    renderOutput: renderGameIdeaGeneratorOutput
  },
  {
    id: 'character-backstory-generator',
    name: 'Character Backstory Generator',
    description: 'Create rich, detailed backstories for your game characters with motivations and backgrounds.',
    category: 'GameDev',
    icon: UserCircleIcon,
    component: CharacterBackstoryGenerator,
    promptSuggestion: 'A grizzled space pirate who secretly loves gardening.',
    renderOutput: renderCharacterBackstoryGeneratorOutput
  },
  {
    id: 'quest-generator',
    name: 'Quest Generator',
    description: 'Generate creative quests for your RPG, complete with NPC dialogue, objectives, and rewards.',
    category: 'GameDev',
    icon: MapIcon,
    component: QuestGenerator,
    promptSuggestion: 'The local blacksmith has lost his prized hammer in a goblin-infested mine.',
    renderOutput: renderQuestGeneratorOutput
  },
  // Online category - arranged quizzes & participation
  {
    id: 'arrange-quiz-competition',
    name: 'Arrange Quiz Competition',
    description: 'Create and schedule an online quiz competition with multiple choice questions.',
    category: 'Online',
    icon: TrophyIcon,
    component: ArrangeQuizCompetition,
    promptSuggestion: 'Create a 10-question general knowledge quiz for a 15-minute competition.'
  ,
  renderOutput: (output: any) => <pre className="whitespace-pre-wrap">{typeof output === 'string' ? output : JSON.stringify(output, null, 2)}</pre>
  },
  {
    id: 'participate-quiz-competition',
    name: 'Participate in Quiz Competition',
    description: 'Join and take part in active online quiz competitions.',
    category: 'Online',
    icon: GlobeAltIcon,
    component: ParticipateQuizCompetition,
    promptSuggestion: 'Join the latest scheduled quiz and start answering questions.'
  ,
  renderOutput: (output: any) => <pre className="whitespace-pre-wrap">{typeof output === 'string' ? output : JSON.stringify(output, null, 2)}</pre>
  },

  {
    id: 'collaborative-study-room',
    name: 'Collaborative Study Room',
    description: 'Create a shared room where multiple students can take notes together and chat in real time using Firestore.',
    category: 'Online',
    icon: UsersIcon,
    component: CollaborativeStudyRoom,
    promptSuggestion: 'Create a room for my calculus study group.'
  ,
  renderOutput: (output: any) => <pre className="whitespace-pre-wrap">{typeof output === 'string' ? output : JSON.stringify(output, null, 2)}</pre>
  },

  // Utility (non-AI) - Python-backed tools
  {
    id: 'password-generator',
    name: 'Password Generator',
    description: 'Generate strong, random passwords with configurable options.',
    category: 'Utility',
    icon: KeyIcon,
    component: PasswordGenerator,
    promptSuggestion: 'Leave prompt empty. Configure options to generate a password.'
    ,
    renderOutput: (output: any) => {
      if (!output) return <p className="text-slate-400">No output</p>;
      if (typeof output === 'string') return <pre className="whitespace-pre-wrap">{output}</pre>;
      if (output.password) return <div className="text-center"><p className="text-2xl font-mono text-light">{output.password}</p></div>;
      return <pre className="whitespace-pre-wrap">{JSON.stringify(output, null, 2)}</pre>;
    }
  },
  {
    id: 'photo-resizer',
    name: 'Photo Resizer',
    description: 'Resize images (provide base64 image as prompt).',
    category: 'Utility',
    icon: ArrowsRightLeftIcon,
    component: PhotoResizer,
    promptSuggestion: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==.',
    renderOutput: (output: any) => {
      if (!output) return <p className="text-slate-400">No output</p>;
      if (typeof output === 'string') return <pre className="whitespace-pre-wrap">{output}</pre>;
      if (output.image_base64) return <div className="text-center"><img src={output.image_base64} alt="resized" className="mx-auto" /></div>;
      return <pre className="whitespace-pre-wrap">{JSON.stringify(output, null, 2)}</pre>;
    }
  },
  {
    id: 'file-converter',
    name: 'File Converter',
    description: 'Convert plain text into a downloadable PDF.',
    category: 'Utility',
    icon: DocumentDuplicateIcon,
    component: FileConverter,
    promptSuggestion: 'Paste the text you want converted to PDF.'
    ,
    renderOutput: (output: any) => {
      if (!output) return <p className="text-slate-400">No output</p>;
      if (typeof output === 'string') return <pre className="whitespace-pre-wrap">{output}</pre>;
      if (output.pdf_base64) return <a className="text-accent font-semibold" href={output.pdf_base64} target="_blank" rel="noreferrer">Download PDF</a>;
      return <pre className="whitespace-pre-wrap">{JSON.stringify(output, null, 2)}</pre>;
    }
  },
  {
    id: 'file-compressor',
    name: 'File Compressor',
    description: 'Compress multiple files into a ZIP archive. Prompt must be a JSON array of {name, data_base64}.',
    category: 'Utility',
    icon: CubeTransparentIcon,
    component: FileCompressor,
    promptSuggestion: '[{"name":"file.txt","data_base64":"data:text/plain;base64,SGVsbG8="}]'
    ,
    renderOutput: (output: any) => {
      if (!output) return <p className="text-slate-400">No output</p>;
      if (typeof output === 'string') return <pre className="whitespace-pre-wrap">{output}</pre>;
      if (output.zip_base64) return <a className="text-accent font-semibold" href={output.zip_base64} target="_blank" rel="noreferrer">Download ZIP</a>;
      return <pre className="whitespace-pre-wrap">{JSON.stringify(output, null, 2)}</pre>;
    }
  },
  {
    id: 'qrcode-generator',
    name: 'QR Code Generator',
    description: 'Generate a QR code image from text.',
    category: 'Utility',
    icon: CubeTransparentIcon,
    component: QRCodeGenerator,
    promptSuggestion: 'Text or URL to encode into a QR code.'
    ,
    renderOutput: (output: any) => {
      if (!output) return <p className="text-slate-400">No output</p>;
      if (typeof output === 'string') return <pre className="whitespace-pre-wrap">{output}</pre>;
      if (output.qrcode_base64) return <div className="text-center"><img src={output.qrcode_base64} alt="qrcode" className="mx-auto" /></div>;
      return <pre className="whitespace-pre-wrap">{JSON.stringify(output, null, 2)}</pre>;
    }
  },

];
