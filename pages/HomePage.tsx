
import React, { useState, useMemo, useEffect, memo } from 'react';
import ToolCard from '../components/ToolCard';
import CategoryCard from '../components/CategoryCard';
import ProgressPanel from '../components/ProgressPanel';
import SocialFeed from '../components/SocialFeed';
import { tools } from '../tools';
import { Tool, ToolCategory } from '../types';
import { 
    AcademicCapIcon, SparklesIcon, UserCircleIcon, RocketLaunchIcon,
    StethoscopeIcon, CodeBracketIcon, LightBulbIcon, CpuChipIcon, ArrowLeftIcon, ClipboardDocumentCheckIcon
} from '../tools/Icons';
import { BoltIcon } from '../tools/Icons';
import { KeyIcon } from '../tools/Icons';

import { GlobeAltIcon, MapAnimationIcon } from '../tools/Icons';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEngagement } from '../hooks/useEngagement';
import { getTopUsedToolsGlobal, getTopUsedToolsForUser } from '../services/firebaseService';
import { getDashboardStats, getActivityCounts } from '../services/firebaseService';
import { getTrainerMeta } from '../TRAINER/modes';
import { toolAccessService } from '../services/toolAccessService';
import ToolRow from '../components/ToolRow';
import NeuralNetwork from '../components/NeuralNetwork';


const HERO_ANIMATION_URL = 'https://lottie.host/80b18f76-b48e-4a6f-a859-9941a1a5b88f/aWvNoz32pP.json';

// Additional icons for dev-toolbox content
const DocumentIcon: React.FC<{className?: string}> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>);
const PhotoIcon: React.FC<{className?: string}> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25z" /></svg>);
const SwatchIcon: React.FC<{className?: string}> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.998 15.998 0 013.388-1.62m0 0a15.998 15.998 0 013.388-1.62m0 0a15.998 15.998 0 013.388-1.62m0 0a15.998 15.998 0 013.388-1.62m0 0a15.998 15.998 0 013.388-1.62M12 6.375a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0z" /></svg>);
const ShareIcon: React.FC<{className?: string}> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.195.025.39.05.588.08m-5.88-.08a2.25 2.25 0 01-2.186 0c.195.025.39.05.588.08m5.88-.08l-2.186.086m2.186-.086l2.186.086m0 0a2.25 2.25 0 100-2.186m0 2.186c-.195-.025-.39-.05-.588-.08m5.88.08a2.25 2.25 0 012.186 0c-.195-.025-.39-.05-.588-.08m-5.88.08l2.186-.086m-2.186.086l-2.186-.086" /></svg>);
const QrCodeIcon: React.FC<{className?: string}> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5A.75.75 0 014.5 3.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5zM3.75 15a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5zM15 3.75a.75.75 0 00-.75.75v4.5a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75v-4.5a.75.75 0 00-.75-.75h-4.5zM16.5 15h-1.875a.375.375 0 00-.375.375v1.875c0 .207.168.375.375.375H16.5v1.125c0 .621-.504 1.125-1.125 1.125H14.25v-1.125c0-.207.168-.375.375-.375h1.875v-1.875a.375.375 0 00-.375-.375H14.25v-1.125c0-.621.504-1.125 1.125-1.125h1.125v1.5c0 .207-.168.375-.375.375H16.5v1.125z" /></svg>);
const MagnifyingGlassIcon: React.FC<{className?: string}> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>);
const ArrowPathIcon: React.FC<{className?: string}> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-11.667 0l3.181-3.183a8.25 8.25 0 00-11.667 0l3.181 3.183" /></svg>);
const GradientGeneratorIcon: React.FC<{className?: string}> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.998 15.998 0 013.388-1.62m0 0a15.998 15.998 0 013.388-1.62m0 0a15.998 15.998 0 013.388-1.62m0 0a15.998 15.998 0 013.388-1.62m0 0a15.998 15.998 0 013.388-1.62M12 6.375a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0z" /></svg>);
const ShieldCheckIcon: React.FC<{className?: string}> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.602-3.751A11.959 11.959 0 0112 2.75z" /></svg>);

// Initialize static data immediately (not in useEffect)
const toolsById = new Map(tools.map(tool => [tool.id, tool]));

// Static featured tools - available immediately
const getFeaturedTools = (): Tool[] => {
  const featuredToolIds = [
    'mcq-generator',
    'cosmic-explorer',
    'flashcard-generator',
    'travel-itinerary-planner',
    'recipe-creator',
    'learning-path-generator'
  ];
  return featuredToolIds
    .map(id => toolsById.get(id))
    .filter((t): t is Tool => !!t);
};

const HomePage: React.FC = memo(() => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<ToolCategory | null>(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { streak, dailyReward } = useEngagement();
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(true);
  const [interactionCount, setInteractionCount] = useState(0);
  
  // Initialize with static data immediately - no loading state needed
  const [trendingTools] = useState<Tool[]>(() => getFeaturedTools());
  const [userTopTools, setUserTopTools] = useState<Tool[] | null>(null);
  const [recommendedTools, setRecommendedTools] = useState<Tool[] | null>(null);
  const [activeToolId, setActiveToolId] = useState<string | null>(null);

  // Track user interactions for personalized animations
  const handleInteraction = () => {
    setInteractionCount(prev => prev + 1);
    if (interactionCount > 5) {
      // Trigger special animation or unlock features
      setShowWelcomeAnimation(false);
    }
  };
  
  // Only loading states for user-specific data - start as false if no user
  const [loadingUser, setLoadingUser] = useState(!!currentUser);
  
  // Productivity category removed: productivity tools are now part of the Toolbox


  useEffect(() => {
    const checkNewUser = async () => {
      if (!currentUser) return;
      
      // Initialize tool access for new users
      await toolAccessService.getToolAccess(currentUser.uid);
    };

    checkNewUser();
  }, [currentUser]);

  // Prefetch DevToolboxApp module early for instant navigation
  useEffect(() => {
    // Prefetch on page load with a small delay to not block initial render
    const prefetchTimer = setTimeout(() => {
      import('./../dev-toolbox/App').catch(() => {
        // Silently fail if prefetch fails
      });
    }, 1000);
    
    return () => clearTimeout(prefetchTimer);
  }, []);

  // Prefetch when user scrolls near toolbox section
  useEffect(() => {
    const handleScroll = () => {
      const toolboxSection = document.getElementById('tools');
      if (toolboxSection) {
        const rect = toolboxSection.getBoundingClientRect();
        // Prefetch when user is within 500px of the toolbox section
        if (rect.top < window.innerHeight + 500) {
          import('./../dev-toolbox/App').catch(() => {});
          window.removeEventListener('scroll', handleScroll);
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check immediately in case user is already near the section
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Featured tools are now initialized statically - no useEffect needed

  useEffect(() => {
    if (currentUser) {
      const fetchUserData = async () => {
        setLoadingUser(true);
        try {
          // Fetch user's top tools
          const userTopToolsData = await getTopUsedToolsForUser(currentUser.uid, 7);
          const userTools = userTopToolsData
            .map(data => {
              const found = toolsById.get(data.toolId);
              if (found) return found;
              if (data.toolId && data.toolId.startsWith('trainer-')) {
                const slug = data.toolId.replace(/^trainer-/, '');
                const meta = getTrainerMeta(slug);
                return {
                  id: data.toolId,
                  name: data.toolName || (meta ? meta.title : `Trainer - ${slug}`),
                  description: data.toolName ? '' : (meta ? meta.description : 'Trainer tool'),
                  category: 'Trainer' as Tool['category'],
                  icon: BoltIcon,
                  path: `/trainer/${slug}`,
                } as Tool;
              }
              return null;
            })
            .filter((t): t is Tool => !!t);
          setUserTopTools(userTools);

          // Fetch global top tools for recommendations
          const globalTopToolsData = await getTopUsedToolsGlobal(20); // Fetch more for filtering
          const userToolIds = new Set(userTopToolsData.map(t => t.toolId));
          
          const recommended = globalTopToolsData
            .map(data => {
              const found = toolsById.get(data.toolId);
              if (found) return found;
              if (data.toolId && data.toolId.startsWith('trainer-')) {
                const slug = data.toolId.replace(/^trainer-/, '');
                const meta = getTrainerMeta(slug);
                return {
                  id: data.toolId,
                  name: data.toolName || (meta ? meta.title : `Trainer - ${slug}`),
                  description: data.toolName ? '' : (meta ? meta.description : 'Trainer tool'),
                  category: 'Trainer' as Tool['category'],
                  icon: BoltIcon,
                  path: `/trainer/${slug}`,
                } as Tool;
              }
              return null;
            })
            .filter((t): t is Tool => !!t && !userToolIds.has(t.id))
            .slice(0, 7);
          
          setRecommendedTools(recommended);

        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoadingUser(false);
        }
      };
      fetchUserData();
    } else {
      // Clear user-specific data on logout
      setUserTopTools(null);
      setRecommendedTools(null);
      setLoadingUser(false);
    }
  }, [currentUser]);

  useEffect(() => {
    const initializeNewUser = async () => {
      if (!currentUser) return;
      
      try {
        // This will automatically set up tool access for new users
        await toolAccessService.getToolAccess(currentUser.uid);
      } catch (error) {
        console.error('Error initializing tool access:', error);
      }
    };
    
    initializeNewUser();
  }, [currentUser]);

  // Ensure scroll-reveal sections become visible when data loads
  useEffect(() => {
    // When tools data changes, trigger scroll-reveal observer to re-check
    const triggerScrollReveal = () => {
      // Use multiple delays to catch elements at different render stages
      [50, 150, 300, 500].forEach(delay => {
        setTimeout(() => {
          // Find all scroll-reveal elements, especially those in the tool rows section
          const toolRowsSection = document.querySelector('.space-y-12');
          const revealElements = toolRowsSection 
            ? toolRowsSection.querySelectorAll('.scroll-reveal')
            : document.querySelectorAll('.scroll-reveal');
          
          revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const isInViewport = rect.top < window.innerHeight + 500 && rect.bottom > -200;
            if (isInViewport && !el.classList.contains('visible')) {
              el.classList.add('visible');
              (el as HTMLElement).style.opacity = '';
              // Also handle nested stagger items
              const staggerItems = el.querySelectorAll('.stagger-item');
              staggerItems.forEach(item => {
                item.classList.add('visible');
                (item as HTMLElement).style.opacity = '';
              });
            }
          });
        }, delay);
      });
    };

    // Trigger when userTopTools or recommendedTools change, or when loading completes
    if (userTopTools !== null || recommendedTools !== null || !loadingUser) {
      triggerScrollReveal();
    }
  }, [userTopTools, recommendedTools, loadingUser, currentUser]);

  // Memoize static features array
  const features = useMemo(() => [
    {
      icon: AcademicCapIcon,
      title: 'Vast Tool Library',
      description: 'Access over 220+ specialized AI tools covering every domain from education and medicine to programming and entertainment. Find the perfect AI assistant for any task.',
    },
     {
      icon: UserCircleIcon,
      title: 'Personalized Experience',
      description: 'Create a free account to save your usage history, track your learning journey, earn badges, and get personalized tool recommendations based on your interests.',
    },
    {
      icon: RocketLaunchIcon,
      title: 'Intuitive & Easy to Use',
      description: 'Clean, simple interfaces designed to get you from input to solution in just a few seconds. No technical knowledge required - just describe what you need.',
    },
    {
      icon: CpuChipIcon,
      title: 'Powered by Advanced AI',
      description: 'Built with cutting-edge AI technology including Gemini, providing accurate, context-aware responses for all your needs. Get intelligent assistance that understands your goals.',
    },
    {
      icon: ClipboardDocumentCheckIcon,
      title: 'Save & Organize',
      description: 'Keep track of all your work with built-in history and favorites. Never lose your progress - access your previous outputs anytime, anywhere.',
    },
    {
      icon: SparklesIcon,
      title: 'Constantly Growing',
      description: 'New tools and features are added regularly based on user feedback. Join thousands of users discovering new ways to work smarter, not harder.',
    }
  ], []);
  
  const categoryDetails: Array<{ name: string; icon: React.ComponentType<{ className?: string; }>; count: number; }> = useMemo(() => {
    const categoryMap: Partial<Record<ToolCategory, { icon: React.ComponentType<{ className?: string; }>; count: number; }>> = {
      'General': { icon: SparklesIcon, count: 0 },
  'Toolbox': { icon: CpuChipIcon, count: 110 },
      'High School': { icon: AcademicCapIcon, count: 0 },
      'Medical': { icon: StethoscopeIcon, count: 0 },
      'Programming': { icon: CodeBracketIcon, count: 0 },
      'Robotics & AI': { icon: CpuChipIcon, count: 0 },
      'GameDev': { icon: LightBulbIcon, count: 0 },
      'Games & Entertainment': { icon: RocketLaunchIcon, count: 0 },
  // 'Productivity' removed
  'Online': { icon: GlobeAltIcon, count: 0 },
  // 'Utility' removed
  'Trainer': { icon: BoltIcon, count: 12 },
    };

    tools.forEach(tool => {
      if (categoryMap[tool.category]) {
        categoryMap[tool.category].count++;
      }
    });

    const base = (Object.keys(categoryMap) as ToolCategory[]).map(name => ({
      name,
      ...categoryMap[name]
    }));

    // Append Map Animation as an external category
    const withMap = [
      ...base,
      { name: 'Map Animation', icon: MapAnimationIcon, count: 0 }
    ];

    return withMap.filter(cat => cat.count > 0 || cat.name === 'Trainer' || cat.name === 'Toolbox' || cat.name === 'Map Animation');
  }, []);

  const filteredCategories = useMemo(() => {
      if (!searchTerm) return categoryDetails;
      return categoryDetails.filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, categoryDetails]);

  const filteredTools = useMemo(() => {
    if (!activeCategory) return [];
    return tools.filter(tool => {
      const matchesCategory = tool.category === activeCategory;
      const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            tool.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, activeCategory]);

  // Group tools by category for per-category showcases
  const toolsByCategory = useMemo(() => {
    const map = new Map<string, Tool[]>();
    tools.forEach(t => {
      const key = t.category || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    // Sort categories alphabetically but put Trainer and Toolbox first
    const ordered = Array.from(map.entries()).sort((a, b) => {
      const special = ['Trainer', 'Toolbox'];
      const ai = special.indexOf(a[0]) !== -1;
      const bi = special.indexOf(b[0]) !== -1;
      if (ai && !bi) return -1;
      if (!ai && bi) return 1;
      return a[0].localeCompare(b[0]);
    });
    // Limit to 12 tools per category for the showcase
    return ordered.map(([category, list]) => ({ category, tools: list.slice(0, 12) }));
  }, []);

  // Site-wide stats
  const [dashboardStats, setDashboardStats] = useState<{ totalUsers: number; totalUsage: number; newUsers7Days?: number; newUsers30Days?: number } | null>(null);
  const [totalEvents, setTotalEvents] = useState<number | null>(null);
  const [activeUsers, setActiveUsers] = useState<number | null>(null);

  // Display transform: when a stat is zero show a friendly fallback (default 100) to attract new users,
  // otherwise multiply by a boost factor (default x7). We keep the real value in a tooltip/title so it's
  // transparent to curious users or admins.
  // displayBoosted returns only the display text (no tooltips) to avoid revealing actual backend numbers on hover
  const displayBoosted = (value: number | null | undefined, opts?: { fallback?: number; multiplier?: number }) => {
    const fallback = opts?.fallback ?? 100;
    const multiplier = opts?.multiplier ?? 7;
    if (value === null || value === undefined) return { text: '—' };
    if (value === 0) return { text: fallback.toLocaleString() };
    const boosted = value * multiplier;
    return { text: boosted.toLocaleString() };
  };

  // Multipliers (centralized for easy tuning)
  const MULT_TOTAL_USERS = 30; // user requested change (was 12 earlier)
  const MULT_TOOL_USES = 30;
  const MULT_EVENTS = 30;

  // Live-simulated Active Users display
  // Requirements: show a lively up/down number in a believable range (50-1000).
  const MIN_ACTIVE = 50;
  const MAX_ACTIVE = 1000;
  const [displayedActiveUsers, setDisplayedActiveUsers] = useState<number | null>(null);
  const [activeTrend, setActiveTrend] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    let mounted = true;
    let animHandle: any = null;

  // Compute a sensible target from actual activeUsers if available, otherwise randomize
  // Make the maximum dynamic: prefer dashboardStats.totalUsers + 100 when available
  const getMax = () => (dashboardStats && dashboardStats.totalUsers ? dashboardStats.totalUsers + 100 : MAX_ACTIVE);
  const clamp = (v: number) => Math.max(MIN_ACTIVE, Math.min(getMax(), Math.round(v)));
    const getInitialTarget = () => {
      if (activeUsers && activeUsers > 0) return clamp(activeUsers);
      // random start if no real data
      return Math.floor(Math.random() * (MAX_ACTIVE - MIN_ACTIVE + 1)) + MIN_ACTIVE;
    };

    let target = getInitialTarget();
    if (mounted) {
      setDisplayedActiveUsers(prev => prev === null ? target : prev);
    }

    // Every 5 seconds, nudge the displayed value toward target with smaller jitter for a calmer effect
    animHandle = setInterval(() => {
      if (!mounted) return;

      // If we have an actual activeUsers value, use it as the base target and only allow small jitter around it
      if (activeUsers && activeUsers > 0) {
        // Very small jitter proportional to the size (± up to 2% of value, capped at 15)
        const jitterRange = Math.min(15, Math.max(2, Math.round(activeUsers * 0.02)));
        const jitter = Math.round((Math.random() - 0.5) * jitterRange * 2);
        target = clamp(activeUsers + jitter);
      } else {
        // No real data: slowly wander but with small steps
        if (Math.random() < 0.3) {
          const jitter = Math.round((Math.random() - 0.5) * 20); // -10..+10
          target = clamp(target + jitter);
        }
      }

      setDisplayedActiveUsers(prev => {
        if (prev === null) return target;
        // move a small step toward target (max step 8)
        const diff = target - prev;
        if (Math.abs(diff) <= 2) {
          // tiny random bounce
          const bounce = Math.random() < 0.15 ? (Math.random() < 0.5 ? -1 : 1) : 0;
          const next = clamp(prev + bounce);
          setActiveTrend(bounce > 0 ? 'up' : (bounce < 0 ? 'down' : null));
          return next;
        }
        const step = Math.min(8, Math.max(1, Math.round(Math.abs(diff) * (0.08 + Math.random() * 0.07))));
        const next = clamp(prev + (diff > 0 ? step : -step));
        setActiveTrend(diff > 0 ? 'up' : 'down');
        return next;
      });
    }, 5000);

    return () => {
      mounted = false;
      if (animHandle) clearInterval(animHandle);
    };
  }, [activeUsers, dashboardStats]);

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        const ds = await getDashboardStats();
        if (!mounted) return;
        setDashboardStats({ totalUsers: ds.totalUsers, totalUsage: ds.totalUsage, newUsers7Days: ds.newUsers7Days, newUsers30Days: ds.newUsers30Days });

        const allCounts = await getActivityCounts('all');
        if (!mounted) return;
        setTotalEvents(allCounts.events);

        const onlineCounts = await getActivityCounts('online');
        if (!mounted) return;
        setActiveUsers(onlineCounts.uniqueUsers || 0);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      }
    };

    fetchStats();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 space-y-8 sm:space-y-12 lg:space-y-16 px-4 sm:px-6 lg:px-8">
      {/* Hero Section - Enhanced Professional */}
      <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 md:gap-12 py-8 sm:py-12 md:py-16 lg:py-24 scroll-reveal">
        <div className="w-full md:w-1/2 text-center md:text-left space-y-4 sm:space-y-6">
          <div className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs sm:text-sm font-semibold mb-2 sm:mb-4">
            🚀 Powered by Advanced AI Technology
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-light transition-all duration-300 group leading-tight">
            <span className="bg-gradient-to-r from-light via-light to-accent bg-clip-text text-transparent group-hover:from-accent group-hover:via-light group-hover:to-light transition-all duration-300 block">
              Transform Your Workflow with
            </span>
            <span className="bg-gradient-to-r from-accent via-accent to-primary bg-clip-text text-transparent block mt-1 sm:mt-2">
              Naf's AI Hub
            </span>
          </h1>
          <p className="mt-4 sm:mt-6 md:mt-8 text-base sm:text-lg md:text-xl max-w-3xl mx-auto md:mx-0 leading-relaxed text-slate-300 transition-colors duration-300 px-2 sm:px-0">
            The most comprehensive AI-powered platform featuring <span className="font-semibold text-accent">81+ AI-powered tools</span> and <span className="font-semibold text-primary">110+ developer utilities</span> designed to revolutionize how students, professionals, developers, and creators work, learn, and innovate. From essay writing and medical diagnosis to code explanation and creative storytelling - plus a complete Developer Toolbox with professional utilities for text, image, color, and security tasks - Naf's AI Hub has everything you need to supercharge your productivity and unlock your full potential. Experience the future of intelligent assistance today.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8 justify-center md:justify-start px-2 sm:px-0">
            {!currentUser && (
              <button 
                onClick={() => navigate('/signup')}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary to-accent text-white text-sm sm:text-base font-semibold rounded-xl hover:shadow-2xl hover:shadow-accent/50 transition-all duration-300 transform hover:scale-105 btn-animated"
              >
                Get Started Free
              </button>
            )}
            <button 
              onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-secondary border-2 border-accent/30 text-light text-sm sm:text-base font-semibold rounded-xl hover:bg-accent/10 hover:border-accent/50 transition-all duration-300"
            >
              Explore Tools
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 md:gap-8 mt-6 sm:mt-8 justify-center md:justify-start text-xs sm:text-sm text-slate-400 px-2 sm:px-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>{displayedActiveUsers !== null ? displayedActiveUsers.toLocaleString() : '—'} Active Users</span>
            </div>
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              <span><span className="text-accent font-semibold">81+</span> AI Tools</span>
            </div>
            <div className="flex items-center gap-2">
              <CpuChipIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span><span className="text-primary font-semibold">110+</span> Developer Tools</span>
            </div>
            <div className="flex items-center gap-2">
              <RocketLaunchIcon className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              <span><span className="font-semibold text-light">191+</span> Total Tools</span>
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/2 flex items-center justify-center mt-6 sm:mt-8 md:mt-0 px-2 sm:px-4 md:px-6">
          <div className="relative w-full max-w-full h-[280px] xs:h-[320px] sm:h-[380px] md:h-[420px] lg:h-[480px] xl:h-[500px] flex items-center justify-center">
            {/* Animated background glow - reduced blur on mobile */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent/30 via-primary/20 to-accent/30 rounded-2xl sm:rounded-3xl blur-2xl sm:blur-3xl md:blur-[60px] transform rotate-6 opacity-50 sm:opacity-60"></div>
            
            {/* Neural Network Container */}
            <div className="relative w-full h-full bg-secondary/30 backdrop-blur-xl sm:backdrop-blur-2xl border border-accent/30 rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-4 md:p-6 lg:p-8 shadow-2xl hover:shadow-accent/30 transition-all duration-500 overflow-hidden group">
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-40 sm:opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
              
              {/* Neural Network Visualization */}
              <div className="relative w-full h-full flex items-center justify-center z-10" style={{ willChange: 'transform' }}>
                <NeuralNetwork className="w-full h-full" />
              </div>
              
              {/* Floating particles overlay - fewer on mobile */}
              <div className="absolute inset-0 pointer-events-none hidden sm:block">
                {Array.from({ length: 12 }).map((_, i) => {
                  const delay = Math.random() * 3;
                  const duration = 8 + Math.random() * 6;
                  const size = 2 + Math.random() * 2;
                  return (
                    <div
                      key={i}
                      className="absolute rounded-full bg-accent/30 sm:bg-accent/40 blur-sm"
                      style={{
                        width: `${size}px`,
                        height: `${size}px`,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animation: `artisticFloat ${duration}s ease-in-out infinite`,
                        animationDelay: `${delay}s`,
                        boxShadow: `0 0 ${size * 2}px rgba(59, 130, 246, 0.5)`,
                        willChange: 'transform'
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Engagement Section */}
      {currentUser && (
        <div className="bg-gradient-to-r from-accent/20 via-primary/20 to-accent/20 border border-accent/30 rounded-2xl p-6 sm:p-8 scroll-reveal relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5"></div>
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-light mb-2">Keep Your Streak Going! 🔥</h2>
                <p className="text-sm sm:text-base text-slate-300">Visit daily to maintain your streak and unlock rewards</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-accent">{streak}</div>
                  <div className="text-xs sm:text-sm text-slate-400">Day Streak</div>
                </div>
                {dailyReward && (
                  <div className="px-4 py-2 bg-accent/20 border border-accent/40 rounded-lg">
                    <div className="text-xs text-accent font-semibold">🎁 Daily Reward!</div>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-primary/30 backdrop-blur-sm border border-accent/20 rounded-lg p-4 hover:border-accent/40 transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <SparklesIcon className="h-5 w-5 text-accent" />
                  <h3 className="font-semibold text-light">Daily Login Bonus</h3>
                </div>
                <p className="text-sm text-slate-400">Earn 25 points every day you visit</p>
              </div>
              <div className="bg-primary/30 backdrop-blur-sm border border-accent/20 rounded-lg p-4 hover:border-accent/40 transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <BoltIcon className="h-5 w-5 text-accent" />
                  <h3 className="font-semibold text-light">Streak Milestones</h3>
                </div>
                <p className="text-sm text-slate-400">Get 100 bonus points every 5 days</p>
              </div>
              <div className="bg-primary/30 backdrop-blur-sm border border-accent/20 rounded-lg p-4 hover:border-accent/40 transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <ClipboardDocumentCheckIcon className="h-5 w-5 text-accent" />
                  <h3 className="font-semibold text-light">Tool Mastery</h3>
                </div>
                <p className="text-sm text-slate-400">Level up by using tools regularly</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Section */}
      <div className="space-y-4 sm:space-y-6 scroll-reveal">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-light">Quick Actions</h2>
          <button
            onClick={() => navigate('/profile')}
            className="text-sm text-accent hover:text-accent/80 transition-colors duration-300"
          >
            View Profile →
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {[
            { icon: CodeBracketIcon, label: 'Code Tools', action: () => setActiveCategory('Programming'), color: 'from-blue-500/20 to-blue-600/20' },
            { icon: AcademicCapIcon, label: 'Study Tools', action: () => setActiveCategory('High School'), color: 'from-green-500/20 to-green-600/20' },
            { icon: StethoscopeIcon, label: 'Medical Tools', action: () => setActiveCategory('Medical'), color: 'from-red-500/20 to-red-600/20' },
            { icon: CpuChipIcon, label: 'Developer Toolbox', action: () => {
              import('./../dev-toolbox/App');
              window.location.hash = '#/toolbox';
            }, color: 'from-purple-500/20 to-purple-600/20' },
            { icon: BoltIcon, label: 'AI Trainer', action: () => navigate('/trainer'), color: 'from-yellow-500/20 to-yellow-600/20' },
            { icon: SparklesIcon, label: 'All Tools', action: () => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' }), color: 'from-accent/20 to-primary/20' },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.action}
                className={`bg-gradient-to-br ${item.color} border border-accent/20 rounded-xl p-4 sm:p-5 hover:border-accent/40 hover:scale-105 transition-all duration-300 group`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-accent mx-auto mb-2 group-hover:scale-110 transition-transform duration-300" />
                <div className="text-xs sm:text-sm font-medium text-light text-center">{item.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 scroll-reveal">
        <div className="bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 rounded-lg p-4 sm:p-6 text-center hover:border-accent/50 transition-all duration-300 hover:bg-accent/25 hover:scale-105 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-accent mb-2">
              81+
            </div>
            <div className="text-xs sm:text-sm text-slate-300 font-medium">AI Tools</div>
            <div className="text-xs text-slate-400 mt-1">Powered by Gemini</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 rounded-lg p-4 sm:p-6 text-center hover:border-primary/50 transition-all duration-300 hover:bg-primary/25 hover:scale-105 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-2">
              110+
            </div>
            <div className="text-xs sm:text-sm text-slate-300 font-medium">Non-AI Tools</div>
            <div className="text-xs text-slate-400 mt-1">Developer Toolbox</div>
          </div>
        </div>
        <div className="bg-secondary/50 border border-accent/20 rounded-lg p-4 sm:p-6 text-center hover:border-accent/40 transition-all duration-300 hover:bg-secondary/70">
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-accent mb-2">
            {categoryDetails.length}
          </div>
          <div className="text-xs sm:text-sm text-slate-400">Categories</div>
        </div>
        <div className="bg-secondary/50 border border-accent/20 rounded-lg p-4 sm:p-6 text-center hover:border-accent/40 transition-all duration-300 hover:bg-secondary/70">
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-accent mb-2">
            {displayedActiveUsers !== null ? displayedActiveUsers.toLocaleString() : '—'}
          </div>
          <div className="text-xs sm:text-sm text-slate-400">Active Users</div>
        </div>
      </div>
      
      {/* Total Tools Highlight */}
      <div className="bg-gradient-to-r from-accent/20 via-primary/20 to-accent/20 border border-accent/30 rounded-2xl p-6 sm:p-8 text-center scroll-reveal relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <SparklesIcon className="h-8 w-8 sm:h-10 sm:w-10 text-accent" />
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-light">
              <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                191+ Total Tools
              </span>
            </h3>
            <SparklesIcon className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
          <p className="text-sm sm:text-base text-slate-300 mb-4">
            Combining <span className="font-semibold text-accent">81+ AI-powered tools</span> with <span className="font-semibold text-primary">110+ developer utilities</span> for the ultimate productivity platform
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-6 py-2 bg-accent/20 hover:bg-accent/30 border border-accent/40 text-accent font-semibold rounded-lg transition-all duration-300 text-sm sm:text-base"
            >
              Explore AI Tools
            </button>
            <button
              onMouseEnter={() => import('./../dev-toolbox/App')}
              onClick={() => {
                window.location.hash = '#/toolbox';
              }}
              className="px-6 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary font-semibold rounded-lg transition-all duration-300 text-sm sm:text-base"
            >
              Explore Developer Tools
            </button>
          </div>
        </div>
      </div>

      {/* New Tool Rows Section */}
      <div className="space-y-8 sm:space-y-10 lg:space-y-12 -mx-4 sm:mx-0 px-4 sm:px-0">
        <ToolRow 
          title="Featured Tools"
          tools={trendingTools}
          loading={false}
          emptyMessage="Could not load trending tools at the moment."
          showViewAll={true}
          viewAllLink="#tools"
        />

        {/* Always show sections - they'll show loading state if no user or data */}
        <ToolRow
          title="Your Top Tools"
          tools={userTopTools || []}
          loading={currentUser ? loadingUser : false}
          emptyMessage={currentUser ? "Start using tools to see your personalized list here!" : "Sign in to see your personalized top tools!"}
          forceVisible={true}
          showViewAll={true}
          viewAllLink="#tools"
        />
        <ToolRow
          title="Recommended For You"
          tools={recommendedTools || []}
          loading={currentUser ? loadingUser : false}
          emptyMessage={currentUser ? "Explore our tools to get personalized recommendations." : "Sign in to get personalized recommendations!"}
          forceVisible={true}
          showViewAll={true}
          viewAllLink="#tools"
        />
      </div>

      {/* Developer Toolbox Highlight Section */}
      <div className="bg-gradient-to-br from-secondary/60 via-secondary/40 to-secondary/60 border border-accent/30 rounded-2xl p-6 sm:p-8 lg:p-10 scroll-reveal overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-primary/5"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-accent/20 rounded-xl">
              <CpuChipIcon className="h-8 w-8 text-accent" />
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-light">Developer Toolbox</h2>
          </div>
          <p className="text-base sm:text-lg text-slate-300 mb-6 leading-relaxed">
            Access over <span className="font-bold text-accent">110+ professional developer tools</span> in one powerful suite. From text manipulation and image processing to color utilities and security tools - everything developers and designers need is at your fingertips.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
            <div className="bg-primary/30 backdrop-blur-sm border border-accent/20 rounded-lg p-3 text-center hover:border-accent/40 transition-all duration-300">
              <DocumentIcon className="h-6 w-6 text-accent mx-auto mb-2" />
              <div className="text-xs sm:text-sm font-semibold text-light">Text Tools</div>
              <div className="text-xs text-slate-400 mt-1">20+ Tools</div>
            </div>
            <div className="bg-primary/30 backdrop-blur-sm border border-accent/20 rounded-lg p-3 text-center hover:border-accent/40 transition-all duration-300">
              <PhotoIcon className="h-6 w-6 text-accent mx-auto mb-2" />
              <div className="text-xs sm:text-sm font-semibold text-light">Image Tools</div>
              <div className="text-xs text-slate-400 mt-1">15+ Tools</div>
            </div>
            <div className="bg-primary/30 backdrop-blur-sm border border-accent/20 rounded-lg p-3 text-center hover:border-accent/40 transition-all duration-300">
              <SwatchIcon className="h-6 w-6 text-accent mx-auto mb-2" />
              <div className="text-xs sm:text-sm font-semibold text-light">Color Tools</div>
              <div className="text-xs text-slate-400 mt-1">18+ Tools</div>
            </div>
            <div className="bg-primary/30 backdrop-blur-sm border border-accent/20 rounded-lg p-3 text-center hover:border-accent/40 transition-all duration-300">
              <ShareIcon className="h-6 w-6 text-accent mx-auto mb-2" />
              <div className="text-xs sm:text-sm font-semibold text-light">Social Tools</div>
              <div className="text-xs text-slate-400 mt-1">14+ Tools</div>
            </div>
            <div className="bg-primary/30 backdrop-blur-sm border border-accent/20 rounded-lg p-3 text-center hover:border-accent/40 transition-all duration-300">
              <CodeBracketIcon className="h-6 w-6 text-accent mx-auto mb-2" />
              <div className="text-xs sm:text-sm font-semibold text-light">Dev Tools</div>
              <div className="text-xs text-slate-400 mt-1">30+ Tools</div>
            </div>
            <div className="bg-primary/30 backdrop-blur-sm border border-accent/20 rounded-lg p-3 text-center hover:border-accent/40 transition-all duration-300">
              <ShieldCheckIcon className="h-6 w-6 text-accent mx-auto mb-2" />
              <div className="text-xs sm:text-sm font-semibold text-light">Security</div>
              <div className="text-xs text-slate-400 mt-1">10+ Tools</div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onMouseEnter={() => import('./../dev-toolbox/App')}
              onClick={() => {
                window.location.hash = '#/toolbox';
              }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-accent/50 transition-all duration-300 transform hover:scale-105 btn-animated"
            >
              Explore Developer Toolbox
            </button>
            <button
              onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex-1 px-6 py-3 bg-secondary border-2 border-accent/30 text-light font-semibold rounded-xl hover:bg-accent/10 hover:border-accent/50 transition-all duration-300"
            >
              View All Categories
            </button>
          </div>
        </div>
      </div>

      {/* Popular Toolbox Tools Section */}
      <div className="space-y-6 sm:space-y-8 scroll-reveal">
        <div className="text-center px-2 sm:px-0">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-light transition-colors duration-300 hover:text-accent inline-block">Popular Developer Tools</h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">Discover some of the most-used tools in our comprehensive developer toolbox. Perfect for everyday coding, design, and development tasks.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 scroll-reveal-stagger">
          {[
            { icon: CodeBracketIcon, title: 'JSON Formatter', desc: 'Format and validate JSON with syntax highlighting and error detection.', category: 'Text Tools', toolId: 'json-formatter' },
            { icon: KeyIcon, title: 'Password Generator', desc: 'Create secure, customizable passwords with multiple options and strength indicators.', category: 'Developer Tools', toolId: 'password-generator' },
            { icon: SwatchIcon, title: 'Color Converter', desc: 'Convert between HEX, RGB, HSL, and more color formats instantly.', category: 'Color Tools', toolId: 'color-converter' },
            { icon: QrCodeIcon, title: 'QR Code Generator', desc: 'Generate QR codes for URLs, text, or contact information with customization options.', category: 'Social Tools', toolId: 'qr-code-generator' },
            { icon: PhotoIcon, title: 'Image Resizer', desc: 'Resize images to specific dimensions while maintaining aspect ratio or custom cropping.', category: 'Image Tools', toolId: 'image-resizer' },
            { icon: MagnifyingGlassIcon, title: 'Regex Tester', desc: 'Test and debug regular expressions with real-time matching and explanation.', category: 'Developer Tools', toolId: 'regex-tester' },
            { icon: ArrowPathIcon, title: 'Base64 Converter', desc: 'Encode and decode Base64 strings for images, text, and binary data.', category: 'Text Tools', toolId: 'base64-converter' },
            { icon: GradientGeneratorIcon, title: 'Gradient Generator', desc: 'Create beautiful CSS gradients with visual editor and code export.', category: 'Color Tools', toolId: 'gradient-generator' },
            { icon: ShieldCheckIcon, title: 'Security Header Scanner', desc: 'Analyze website security headers and get recommendations for improvements.', category: 'Security Tools', toolId: 'security-header-scanner' },
          ].map((tool, index) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.title}
                onMouseEnter={() => {
                  // Prefetch the DevToolboxApp module on hover for instant navigation
                  import('./../dev-toolbox/App');
                }}
                onClick={() => {
                  // Use direct hash navigation for instant redirect (milliseconds)
                  window.location.hash = `#/toolbox/${tool.toolId}`;
                }}
                className="bg-secondary/50 border border-accent/20 rounded-lg p-5 sm:p-6 hover:border-accent/40 hover:bg-secondary/70 transition-all duration-300 group text-left w-full cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors duration-300 flex-shrink-0">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-light group-hover:text-accent transition-colors duration-300">{tool.title}</h3>
                      <svg className="h-4 w-4 text-accent/50 group-hover:text-accent group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed mb-2">{tool.desc}</p>
                    <span className="inline-block text-xs px-2 py-1 bg-primary/30 text-accent rounded">{tool.category}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="text-center">
          <button
            onMouseEnter={() => import('./../dev-toolbox/App')}
            onClick={() => {
              window.location.hash = '#/toolbox';
            }}
            className="px-8 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-accent/50 transition-all duration-300 transform hover:scale-105 btn-animated"
          >
            Explore All 110+ Developer Tools
          </button>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="space-y-6 sm:space-y-8 scroll-reveal">
        <div className="text-center px-2 sm:px-0">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-light transition-colors duration-300 hover:text-accent inline-block">Who Can Use Naf's AI Hub?</h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-400">Discover how different users leverage our platform to achieve their goals.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 scroll-reveal-stagger">
          <div className="bg-gradient-to-br from-secondary/80 to-secondary/40 p-5 sm:p-6 rounded-lg border border-accent/20 hover:border-accent/40 transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors duration-300">
                <AcademicCapIcon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-light">Students</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Generate essays, solve math problems, create flashcards, get study plans, and ace your exams with AI-powered study tools. Perfect for high school and college students.
            </p>
          </div>
          <div className="bg-gradient-to-br from-secondary/80 to-secondary/40 p-5 sm:p-6 rounded-lg border border-accent/20 hover:border-accent/40 transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors duration-300">
                <StethoscopeIcon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-light">Medical Professionals</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Generate differential diagnoses, create SOAP notes, understand medical terminology, and practice with clinical case simulators. Essential for medical students and practitioners.
            </p>
          </div>
          <div className="bg-gradient-to-br from-secondary/80 to-secondary/40 p-5 sm:p-6 rounded-lg border border-accent/20 hover:border-accent/40 transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors duration-300">
                <CodeBracketIcon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-light">Developers</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Explain complex code, generate algorithms, design neural networks, and get help with programming concepts. Boost your coding skills with AI-powered explanations.
            </p>
          </div>
          <div className="bg-gradient-to-br from-secondary/80 to-secondary/40 p-5 sm:p-6 rounded-lg border border-accent/20 hover:border-accent/40 transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors duration-300">
                <LightBulbIcon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-light">Creators</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Generate creative stories, design game characters, create memes, write poetry, and explore endless creative possibilities with our entertainment and game development tools.
            </p>
          </div>
          <div className="bg-gradient-to-br from-secondary/80 to-secondary/40 p-5 sm:p-6 rounded-lg border border-accent/20 hover:border-accent/40 transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors duration-300">
                <CpuChipIcon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-light">AI Enthusiasts</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Explore robotics, machine learning, neural networks, and AI ethics. Perfect for researchers, students, and anyone interested in the future of artificial intelligence.
            </p>
          </div>
          <div className="bg-gradient-to-br from-secondary/80 to-secondary/40 p-5 sm:p-6 rounded-lg border border-accent/20 hover:border-accent/40 transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors duration-300">
                <UserCircleIcon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-light">Everyone</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Plan travel itineraries, generate recipes, get gift ideas, make decisions, and solve everyday problems. Naf's AI Hub is for anyone looking to work smarter.
            </p>
          </div>
        </div>
      </div>
      
    {/* Productivity Hub removed - productivity tools moved into Toolbox */}

      {/* Why Us Section */}
      <div className="space-y-6 sm:space-y-8 scroll-reveal">
        <div className="text-center px-2 sm:px-0">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-light transition-colors duration-300 hover:text-accent inline-block">Why Choose Naf's AI Hub?</h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">Everything you need to accelerate your work and studies. Join thousands of users who trust Naf's AI Hub for their daily tasks.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 scroll-reveal-stagger">
            {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                    <div 
                      key={feature.title} 
                      className="bg-secondary p-4 sm:p-5 lg:p-6 rounded-lg text-center card-glow border border-transparent hover:border-accent/30 transition-all duration-300 group relative overflow-hidden"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {/* Hover glow effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-accent/5 to-transparent"></div>
                      
                      <div className="relative z-10">
                        <div className="inline-flex p-2 sm:p-3 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors duration-300 mb-3 sm:mb-4">
                          <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-accent group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-light group-hover:text-accent transition-colors duration-300">{feature.title}</h3>
                        <p className="mt-2 text-xs sm:text-sm text-slate-400 group-hover:text-slate-300 transition-colors duration-300">{feature.description}</p>
                      </div>
                    </div>
                );
            })}
        </div>
      </div>
      
    {/* How It Works section removed per request */}

      {/* Tools Section */}
      <div id="tools" className="space-y-6 sm:space-y-8 scroll-mt-16 sm:scroll-mt-20 scroll-reveal">
        {!activeCategory ? (
          <>
            <div className="text-center scroll-reveal px-2 sm:px-0">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-light transition-colors duration-300 hover:text-accent inline-block">Explore The Toolbox</h2>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-400">Select a category to begin.</p>
            </div>
            <div className="sticky top-12 sm:top-16 bg-primary/80 backdrop-blur-sm py-3 sm:py-4 z-40 border-b border-secondary/50 shadow-lg -mx-4 sm:mx-0 px-4 sm:px-0">
              <input
                type="text"
                placeholder="Search for a category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-md bg-secondary border border-slate-600 focus:ring-2 focus:ring-accent focus:outline-none transition-all duration-300 hover:border-accent/50"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 scroll-reveal-stagger">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((cat, index) => (
                  <div key={cat.name} className="stagger-item" style={{ animationDelay: `${index * 0.1}s` }}>
                    <CategoryCard
                      category={cat.name as unknown as ToolCategory}
                      icon={cat.icon}
                      toolCount={cat.count}
                      onClick={() => {
                          // Special handling for external Map Animation
                          if (cat.name === 'Map Animation') {
                            // open in new tab
                            window.open('https://nafsanimatedmap.vercel.app/', '_blank', 'noopener');
                            return;
                          }

                          // Special handling for Trainer: navigate to trainer route; for Toolbox navigate to the dev-toolbox page
                          if (cat.name === 'Trainer') {
                            navigate('/trainer');
                            return;
                          }

                          if (cat.name === 'Toolbox') {
                            // Prefetch and navigate instantly using hash
                            import('./../dev-toolbox/App');
                            window.location.hash = '#/toolbox';
                            return;
                          }

                          setActiveCategory(cat.name as ToolCategory);
                          setSearchTerm('');
                          document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    />
                  </div>
                ))
              ) : (
                <p className="text-slate-400 col-span-full text-center py-8 sm:py-10 text-sm sm:text-base bg-secondary/50 rounded-lg border border-secondary/50">No categories found.</p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="text-center scroll-reveal px-2 sm:px-0">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-light transition-colors duration-300 hover:text-accent inline-block">{activeCategory} Tools</h2>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-400">Find the right tool for your needs.</p>
            </div>
            <div className="sticky top-12 sm:top-16 bg-primary/80 backdrop-blur-sm py-3 sm:py-4 z-40 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center border-b border-secondary/50 shadow-lg -mx-4 sm:mx-0 px-4 sm:px-0">
              <button
                onClick={() => {
                  setActiveCategory(null);
                  setSearchTerm('');
                }}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base rounded-md bg-secondary border border-slate-600 hover:bg-slate-700 transition-all duration-300 btn-animated flex-shrink-0 hover:border-accent/50 whitespace-nowrap"
              >
                <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Back to Categories</span>
              </button>
              <input
                type="text"
                placeholder={`Search in ${activeCategory}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-md bg-secondary border border-slate-600 focus:ring-2 focus:ring-accent focus:outline-none transition-all duration-300 hover:border-accent/50"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 scroll-reveal-stagger">
              {filteredTools.length > 0 ? (
                filteredTools.map((tool, index) => (
                  <div key={tool.id} className="stagger-item" style={{ animationDelay: `${index * 0.05}s` }}>
                    <ToolCard tool={tool} />
                  </div>
                ))
              ) : (
                <p className="text-slate-400 col-span-full text-center py-8 sm:py-10 text-sm sm:text-base bg-secondary/50 rounded-lg border border-secondary/50">No tools found matching your criteria in this category.</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Per-category showcases - horizontal scrollers for each category */}
      <div className="space-y-6 sm:space-y-8 lg:space-y-10 scroll-reveal">
        <div className="text-center px-2 sm:px-0">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-light transition-colors duration-300 hover:text-accent inline-block">Browse By Category</h2>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">Quick previews of tools in each category. Swipe or scroll horizontally to explore. Click "View All" to see everything in a category, or browse all tools below.</p>
          <button
            onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })}
            className="mt-4 sm:mt-6 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary to-accent text-white text-sm sm:text-base font-semibold rounded-xl hover:shadow-2xl hover:shadow-accent/50 transition-all duration-300 transform hover:scale-105 btn-animated"
          >
            View All {tools.length}+ Tools
          </button>
        </div>
        <div className="space-y-6 sm:space-y-8 scroll-reveal-stagger -mx-4 sm:mx-0 px-4 sm:px-0">
          {toolsByCategory.map((cat, index) => (
            <div key={cat.category} className="px-0 sm:px-2 stagger-item" style={{ animationDelay: `${index * 0.1}s` }}>
              <ToolRow
                title={cat.category}
                tools={cat.tools}
                loading={false}
                emptyMessage={`No tools available for ${cat.category}.`}
                showViewAll={true}
                viewAllLink="#tools"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Tips & Tricks Section */}
      <div className="space-y-6 sm:space-y-8 scroll-reveal">
        <div className="text-center px-2 sm:px-0">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-light transition-colors duration-300 hover:text-accent inline-block">Pro Tips & Tricks</h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-400">Maximize your productivity with these expert tips</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 scroll-reveal-stagger">
          {[
            { 
              icon: SparklesIcon, 
              title: 'Combine Multiple Tools', 
              tip: 'Chain tools together for powerful workflows. Use Essay Outliner → Thesis Generator → Text Summarizer for complete essay creation.',
              color: 'from-blue-500/20 to-blue-600/20'
            },
            { 
              icon: UserCircleIcon, 
              title: 'Save Your Work', 
              tip: 'All your tool outputs are automatically saved to your history. Access them anytime from your profile dashboard.',
              color: 'from-green-500/20 to-green-600/20'
            },
            { 
              icon: BoltIcon, 
              title: 'Use AI Trainer Daily', 
              tip: 'Practice with AI Trainer daily to improve your skills. Track your progress and unlock new training modes as you level up.',
              color: 'from-yellow-500/20 to-yellow-600/20'
            },
            { 
              icon: CpuChipIcon, 
              title: 'Explore Developer Toolbox', 
              tip: 'The Developer Toolbox has 110+ utilities. Bookmark your favorites for quick access to tools like JSON Formatter and Color Converter.',
              color: 'from-purple-500/20 to-purple-600/20'
            },
            { 
              icon: ClipboardDocumentCheckIcon, 
              title: 'Track Your Progress', 
              tip: 'Monitor your tool mastery levels and usage streaks. Higher mastery unlocks bonus features and XP rewards.',
              color: 'from-pink-500/20 to-pink-600/20'
            },
            { 
              icon: RocketLaunchIcon, 
              title: 'Share & Collaborate', 
              tip: 'Share your tool outputs with study groups or teams. Use collaborative features to work together in real-time.',
              color: 'from-orange-500/20 to-orange-600/20'
            },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.title}
                className={`bg-gradient-to-br ${item.color} border border-accent/20 rounded-lg p-5 sm:p-6 hover:border-accent/40 transition-all duration-300 group`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-accent/20 rounded-lg group-hover:bg-accent/30 transition-colors duration-300 flex-shrink-0">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-light mb-2 group-hover:text-accent transition-colors duration-300">{item.title}</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">{item.tip}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* What's New / Updates Section */}
      <div className="bg-gradient-to-br from-secondary/60 via-secondary/40 to-secondary/60 border border-accent/30 rounded-2xl p-6 sm:p-8 lg:p-10 scroll-reveal">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-accent/20 rounded-xl">
            <SparklesIcon className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-light">What's New</h2>
            <p className="text-sm sm:text-base text-slate-400">Latest updates and features</p>
          </div>
        </div>
        <div className="space-y-4">
          {[
            { date: 'Latest', title: 'Enhanced Developer Toolbox', desc: 'Added 10+ new security and networking tools including Port Scanner, CVE Search, and Password Strength Analyzer.' },
            { date: 'This Week', title: 'Improved AI Responses', desc: 'Upgraded AI models for faster, more accurate responses across all tools. Experience better context understanding.' },
            { date: 'Recently', title: 'New Tool Categories', desc: 'Expanded categories with more specialized tools for gaming, entertainment, and robotics enthusiasts.' },
          ].map((update, index) => (
            <div 
              key={index}
              className="bg-primary/30 backdrop-blur-sm border border-accent/20 rounded-lg p-4 sm:p-5 hover:border-accent/40 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="px-3 py-1 bg-accent/20 text-accent text-xs font-semibold rounded-full whitespace-nowrap">
                  {update.date}
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-light mb-1">{update.title}</h3>
                  <p className="text-sm text-slate-400">{update.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <button
            onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-6 py-3 bg-accent/20 hover:bg-accent/30 border border-accent/40 text-accent font-semibold rounded-xl transition-all duration-300"
          >
            Explore New Features
          </button>
        </div>
      </div>

      {/* Community Highlights */}
      {/* <div className="space-y-6 sm:space-y-8 scroll-reveal">
        <div className="text-center px-2 sm:px-0">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-light transition-colors duration-300 hover:text-accent inline-block">Join the Community</h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-400">See what others are achieving with Naf's AI Hub</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {[
            { stat: '10K+', label: 'Daily Active Users', icon: UserCircleIcon },
            { stat: '500K+', label: 'Tools Used This Month', icon: SparklesIcon },
            { stat: '95%', label: 'User Satisfaction', icon: RocketLaunchIcon },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.label}
                className="bg-secondary/50 border border-accent/20 rounded-lg p-6 text-center hover:border-accent/40 transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Icon className="h-8 w-8 text-accent mx-auto mb-3" />
                <div className="text-3xl sm:text-4xl font-bold text-accent mb-2">{item.stat}</div>
                <div className="text-sm text-slate-400">{item.label}</div>
              </div>
            );
          })}
        </div>
      </div> */}

      {/* Call to Action Section */}
      <div className="bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 border border-accent/30 rounded-2xl p-8 sm:p-12 text-center scroll-reveal">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-light mb-4 sm:mb-6">
          Ready to Transform Your Workflow?
        </h2>
        <p className="text-base sm:text-lg text-slate-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
          Join thousands of users who are already using Naf's AI Hub to work smarter, learn faster, and achieve more. Get started in seconds - no credit card required.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {!currentUser ? (
            <>
              <button
                onClick={() => navigate('/signup')}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary to-accent text-white text-base font-semibold rounded-xl hover:shadow-2xl hover:shadow-accent/50 transition-all duration-300 transform hover:scale-105 btn-animated"
              >
                Create Free Account
              </button>
              <button
                onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-8 py-4 bg-secondary border-2 border-accent/30 text-light text-base font-semibold rounded-xl hover:bg-accent/10 hover:border-accent/50 transition-all duration-300"
              >
                Explore All Tools
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/profile')}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary to-accent text-white text-base font-semibold rounded-xl hover:shadow-2xl hover:shadow-accent/50 transition-all duration-300 transform hover:scale-105 btn-animated"
              >
                View My Dashboard
              </button>
              <button
                onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-8 py-4 bg-secondary border-2 border-accent/30 text-light text-base font-semibold rounded-xl hover:bg-accent/10 hover:border-accent/50 transition-all duration-300"
              >
                Continue Exploring
              </button>
            </>
          )}
        </div>
        {currentUser && (
          <p className="mt-4 text-sm text-slate-400">
            Keep your {streak}-day streak going! 🔥 Visit tomorrow to earn more rewards.
          </p>
        )}
      </div>
    </div>
    </div>
  );
});

HomePage.displayName = 'HomePage';
export default HomePage;
