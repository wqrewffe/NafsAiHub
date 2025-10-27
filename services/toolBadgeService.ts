import { Badge } from '../types';

// Tool Usage Badge Types - Multiple categories to track different aspects of tool usage
export type ToolUsageBadgeType = 
    // Daily Usage Badges
    | 'DailyExplorer'      // Use tools 5 days in a row
    | 'WeeklyChampion'     // Use tools every day for a week
    | 'ConsistentLearner'  // Use tools every day for a month
    | 'AIDevotee'          // Use tools every day for 3 months
    
    // Category Explorer Badges
    | 'GeneralExpert'      // Used 10 General tools
    | 'MedicalPro'         // Used 10 Medical tools
    | 'CodeMaster'         // Used 10 Programming tools
    | 'EduGenius'          // Used 10 Education tools
    | 'ArtisticAI'         // Used 10 Creative tools
    
    // Tool Count Milestones
    | 'AIApprentice'       // Used 5 different tools
    | 'ToolCollector'      // Used 15 different tools
    | 'InnovationSeeker'   // Used 25 different tools
    | 'AIVirtuoso'         // Used 40 different tools
    | 'TechPioneer'        // Used 60 different tools
    | 'AIVanguard'         // Used all available tools
    
    // Achievement Badges
    | 'CategoryPioneer'    // First to use all tools in a category
    | 'ToolOptimizer'      // Use same tool 50 times
    | 'AIResearcher'       // Used tools from all categories
    | 'InnovatorElite';    // Create custom prompts that others copy

const TOOL_BADGES: Record<ToolUsageBadgeType, Omit<Badge, 'unlockedAt'>> = {
    // Daily Usage Badges
    'DailyExplorer': {
        type: 'DailyExplorer',
        name: 'Daily Explorer',
        description: 'Used AI tools for 5 consecutive days',
        imageUrl: '/badges/daily-explorer.svg'
    },
    'WeeklyChampion': {
        type: 'WeeklyChampion',
        name: 'Weekly Champion',
        description: 'Engaged with AI tools every day for a week',
        imageUrl: '/badges/weekly-champion.svg'
    },
    'ConsistentLearner': {
        type: 'ConsistentLearner',
        name: 'Consistent Learner',
        description: 'Demonstrated dedication by using tools daily for a month',
        imageUrl: '/badges/consistent-learner.svg'
    },
    'AIDevotee': {
        type: 'AIDevotee',
        name: 'AI Devotee',
        description: 'Maintained daily tool usage for 3 months straight',
        imageUrl: '/badges/ai-devotee.svg'
    },

    // Category Expert Badges
    'GeneralExpert': {
        type: 'GeneralExpert',
        name: 'General AI Expert',
        description: 'Mastered 10 general-purpose AI tools',
        imageUrl: '/badges/general-expert.svg'
    },
    'MedicalPro': {
        type: 'MedicalPro',
        name: 'Medical AI Pro',
        description: 'Utilized 10 medical AI tools',
        imageUrl: '/badges/medical-pro.svg'
    },
    'CodeMaster': {
        type: 'CodeMaster',
        name: 'Code Master',
        description: 'Expert in 10 programming AI tools',
        imageUrl: '/badges/code-master.svg'
    },
    'EduGenius': {
        type: 'EduGenius',
        name: 'Education Genius',
        description: 'Mastered 10 educational AI tools',
        imageUrl: '/badges/edu-genius.svg'
    },
    'ArtisticAI': {
        type: 'ArtisticAI',
        name: 'Artistic AI',
        description: 'Creative master of 10 artistic AI tools',
        imageUrl: '/badges/artistic-ai.svg'
    },

    // Tool Count Milestone Badges
    'AIApprentice': {
        type: 'AIApprentice',
        name: 'AI Apprentice',
        description: 'Started your AI journey with 5 different tools',
        imageUrl: '/badges/ai-apprentice.svg'
    },
    'ToolCollector': {
        type: 'ToolCollector',
        name: 'Tool Collector',
        description: 'Experimented with 15 different AI tools',
        imageUrl: '/badges/tool-collector.svg'
    },
    'InnovationSeeker': {
        type: 'InnovationSeeker',
        name: 'Innovation Seeker',
        description: 'Explored 25 different AI tools',
        imageUrl: '/badges/innovation-seeker.svg'
    },
    'AIVirtuoso': {
        type: 'AIVirtuoso',
        name: 'AI Virtuoso',
        description: 'Mastered 40 different AI tools',
        imageUrl: '/badges/ai-virtuoso.svg'
    },
    'TechPioneer': {
        type: 'TechPioneer',
        name: 'Tech Pioneer',
        description: 'Advanced user of 60 different AI tools',
        imageUrl: '/badges/tech-pioneer.svg'
    },
    'AIVanguard': {
        type: 'AIVanguard',
        name: 'AI Vanguard',
        description: 'True master who has used all available tools',
        imageUrl: '/badges/ai-vanguard.svg'
    },

    // Special Achievement Badges
    'CategoryPioneer': {
        type: 'CategoryPioneer',
        name: 'Category Pioneer',
        description: 'First to master all tools in a category',
        imageUrl: '/badges/category-pioneer.svg'
    },
    'ToolOptimizer': {
        type: 'ToolOptimizer',
        name: 'Tool Optimizer',
        description: 'Used a single tool 50 times, showing true mastery',
        imageUrl: '/badges/tool-optimizer.svg'
    },
    'AIResearcher': {
        type: 'AIResearcher',
        name: 'AI Researcher',
        description: 'Explored tools across all available categories',
        imageUrl: '/badges/ai-researcher.svg'
    },
    'InnovatorElite': {
        type: 'InnovatorElite',
        name: 'Innovator Elite',
        description: 'Created popular custom prompts others love to use',
        imageUrl: '/badges/innovator-elite.svg'
    }
};

// Progressive levels focusing on expertise and innovation
const TOOL_LEVELS = [
    { name: 'Beginner', minTools: 0, description: 'Starting your AI journey' },
    { name: 'Explorer', minTools: 15, description: 'Actively exploring AI tools' },
    { name: 'Innovator', minTools: 30, description: 'Creating innovative solutions' },
    { name: 'Specialist', minTools: 45, description: 'Specialized in multiple domains' },
    { name: 'Expert', minTools: 65, description: 'Expert across all categories' },
    { name: 'Pioneer', minTools: 80, description: 'Pioneering new possibilities' }
];

export function calculateToolLevel(toolCount: number) {
    // Find the highest level that the user qualifies for
    const currentLevel = [...TOOL_LEVELS]
        .reverse()
        .find(level => toolCount >= level.minTools);

    // Find the next level
    const currentLevelIndex = TOOL_LEVELS.findIndex(level => level.name === currentLevel?.name);
    const nextLevel = TOOL_LEVELS[currentLevelIndex + 1];

    return {
        currentLevel: currentLevel?.name || 'Novice',
        nextLevelTools: nextLevel ? nextLevel.minTools - toolCount : 0
    };
}

interface ToolUsageStats {
    totalTools: number;
    dayStreak: number;
    categoryStats: Record<string, number>;
    maxToolUses: number;
    hasCustomPrompts: boolean;
    isFirstInCategory: boolean;
    hasUsedAllCategories: boolean;
}

export function calculateToolBadges(stats: ToolUsageStats): Badge[] {
    const badges: Badge[] = [];
    const now = new Date().toISOString();

    // Daily Usage Badges - Only award if user actually has the required streak
    // These are now much more conservative
    if (stats.dayStreak >= 5) badges.push({ ...TOOL_BADGES['DailyExplorer'], unlockedAt: now });
    if (stats.dayStreak >= 7) badges.push({ ...TOOL_BADGES['WeeklyChampion'], unlockedAt: now });
    if (stats.dayStreak >= 30) badges.push({ ...TOOL_BADGES['ConsistentLearner'], unlockedAt: now });
    if (stats.dayStreak >= 90) badges.push({ ...TOOL_BADGES['AIDevotee'], unlockedAt: now });

    // Category Expert Badges - Only award if user has used enough tools in each category
    // Increased thresholds to make them more meaningful
    if (stats.categoryStats['General'] >= 15) badges.push({ ...TOOL_BADGES['GeneralExpert'], unlockedAt: now });
    if (stats.categoryStats['Medical'] >= 15) badges.push({ ...TOOL_BADGES['MedicalPro'], unlockedAt: now });
    if (stats.categoryStats['Programming'] >= 15) badges.push({ ...TOOL_BADGES['CodeMaster'], unlockedAt: now });
    if (stats.categoryStats['Education'] >= 15) badges.push({ ...TOOL_BADGES['EduGenius'], unlockedAt: now });
    if (stats.categoryStats['Creative'] >= 15) badges.push({ ...TOOL_BADGES['ArtisticAI'], unlockedAt: now });

    // Tool Count Milestone Badges - Only award if user has used enough different tools
    // These thresholds are more realistic
    if (stats.totalTools >= 8) badges.push({ ...TOOL_BADGES['AIApprentice'], unlockedAt: now });
    if (stats.totalTools >= 20) badges.push({ ...TOOL_BADGES['ToolCollector'], unlockedAt: now });
    if (stats.totalTools >= 35) badges.push({ ...TOOL_BADGES['InnovationSeeker'], unlockedAt: now });
    if (stats.totalTools >= 50) badges.push({ ...TOOL_BADGES['AIVirtuoso'], unlockedAt: now });
    if (stats.totalTools >= 70) badges.push({ ...TOOL_BADGES['TechPioneer'], unlockedAt: now });
    if (stats.totalTools >= 85) badges.push({ ...TOOL_BADGES['AIVanguard'], unlockedAt: now });

    // Special Achievement Badges - Only award if user meets specific criteria
    if (stats.isFirstInCategory) badges.push({ ...TOOL_BADGES['CategoryPioneer'], unlockedAt: now });
    if (stats.maxToolUses >= 50) badges.push({ ...TOOL_BADGES['ToolOptimizer'], unlockedAt: now });
    if (stats.hasUsedAllCategories) badges.push({ ...TOOL_BADGES['AIResearcher'], unlockedAt: now });
    if (stats.hasCustomPrompts) badges.push({ ...TOOL_BADGES['InnovatorElite'], unlockedAt: now });

    return badges;
}
