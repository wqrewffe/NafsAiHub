
import React, { useState, useMemo, useEffect } from 'react';
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


const HERO_ANIMATION_URL = 'https://lottie.host/80b18f76-b48e-4a6f-a859-9941a1a5b88f/aWvNoz32pP.json';

const HomePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<ToolCategory | null>(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { streak, dailyReward } = useEngagement();
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(true);
  const [interactionCount, setInteractionCount] = useState(0);
  
  const [trendingTools, setTrendingTools] = useState<Tool[] | null>(null);
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
  
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);

  const toolsById = useMemo(() => {
    return new Map(tools.map(tool => [tool.id, tool]));
  }, []);
  
  // Productivity category removed: productivity tools are now part of the Toolbox


  useEffect(() => {
    const checkNewUser = async () => {
      if (!currentUser) return;
      
      // Initialize tool access for new users
      await toolAccessService.getToolAccess(currentUser.uid);
    };

    checkNewUser();
  }, [currentUser]);

  useEffect(() => {
    const setFeaturedTools = () => {
      setLoadingTrending(true);
      try {
        const featuredToolIds = [
          'mcq-generator',
          'cosmic-explorer',
          'flashcard-generator',
          'travel-itinerary-planner',
          'recipe-creator',
          'learning-path-generator'
        ];
        const featuredTools = featuredToolIds
          .map(id => toolsById.get(id))
          .filter((t): t is Tool => !!t);
        setTrendingTools(featuredTools);
      } catch (error) {
        console.error("Error setting featured tools:", error);
      } finally {
        setLoadingTrending(false);
      }
    };
    setFeaturedTools();
  }, [toolsById]);

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
  }, [currentUser, toolsById]);

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

  const features = [
    {
      icon: AcademicCapIcon,
      title: 'Vast Tool Library',
      description: 'Over 75 specialized tools for students, developers, and creators. Find the perfect AI assistant for any task.',
    },
     {
      icon: UserCircleIcon,
      title: 'Personalized Experience',
      description: 'Sign up for a free account to save your usage history and track your learning journey across all tools.',
    },
    {
      icon: RocketLaunchIcon,
      title: 'Intuitive & Easy to Use',
      description: 'Clean, simple interfaces designed to get you from input to solution in just a few seconds.',
    }
  ];
  
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
      <div className="relative z-10 space-y-16">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row items-center gap-8 py-12 md:py-16">
        <div className="md:w-1/2 text-center md:text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-light">Welcome to Naf's AI Hub</h1>
          <p className="mt-6 text-lg max-w-3xl mx-auto md:mx-0 leading-8 text-slate-300">
            Unlock your potential with over 220 specialized AI tools designed for students, professionals, and curious minds. Your all-in-one platform for learning, creating, and innovating.
          </p>
        </div>
        <div className="md:w-1/2">
        </div>
      </div>

      {/* New Tool Rows Section */}
      <div className="space-y-12">
        <ToolRow 
          title="Featured Tools"
          tools={trendingTools}
          loading={loadingTrending}
          emptyMessage="Could not load trending tools at the moment."
        />

        {currentUser && (
          <>
            <ToolRow
              title="Your Top Tools"
              tools={userTopTools}
              loading={loadingUser}
              emptyMessage="Start using tools to see your personalized list here!"
            />
            <ToolRow
              title="Recommended For You"
              tools={recommendedTools}
              loading={loadingUser}
              emptyMessage="Explore our tools to get personalized recommendations."
            />
          </>
        )}
      </div>
      
    {/* Productivity Hub removed - productivity tools moved into Toolbox */}

      {/* Why Us Section */}
      <div className="space-y-8">
        <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-light sm:text-4xl">Why Choose Naf's AI Hub?</h2>
            <p className="mt-4 text-slate-400">Everything you need to accelerate your work and studies.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(feature => {
                const Icon = feature.icon;
                return (
                    <div key={feature.title} className="bg-secondary p-6 rounded-lg text-center">
                        <Icon className="h-10 w-10 text-accent mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-light">{feature.title}</h3>
                        <p className="mt-2 text-sm text-slate-400">{feature.description}</p>
                    </div>
                );
            })}
        </div>
      </div>
      
    {/* How It Works section removed per request */}

      {/* Tools Section */}
      <div id="tools" className="space-y-8 scroll-mt-20">
        {!activeCategory ? (
          <>
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-light sm:text-4xl">Explore The Toolbox</h2>
              <p className="mt-4 text-slate-400">Select a category to begin.</p>
            </div>
            <div className="sticky top-16 bg-primary/80 backdrop-blur-sm py-4 z-40">
              <input
                type="text"
                placeholder="Search for a category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-secondary border border-slate-600 focus:ring-2 focus:ring-accent focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCategories.length > 0 ? (
                filteredCategories.map(cat => (
                  <CategoryCard
                    key={cat.name}
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
                          // Navigate to the dedicated Toolbox page which loads the dev-toolbox folder
                          navigate('/toolbox');
                          return;
                        }

                        setActiveCategory(cat.name as ToolCategory);
                        setSearchTerm('');
                        document.getElementById('tools')?.scrollIntoView();
                    }}
                  />
                ))
              ) : (
                <p className="text-slate-400 col-span-full text-center">No categories found.</p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-light sm:text-4xl">{activeCategory} Tools</h2>
              <p className="mt-4 text-slate-400">Find the right tool for your needs.</p>
            </div>
            <div className="sticky top-16 bg-primary/80 backdrop-blur-sm py-4 z-40 flex flex-col md:flex-row gap-4 items-center">
              <button
                onClick={() => {
                  setActiveCategory(null);
                  setSearchTerm('');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-secondary border border-slate-600 hover:bg-slate-700 transition-colors btn-animated flex-shrink-0"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                Back to Categories
              </button>
              <input
                type="text"
                placeholder={`Search in ${activeCategory}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-secondary border border-slate-600 focus:ring-2 focus:ring-accent focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTools.length > 0 ? (
                filteredTools.map(tool => <ToolCard key={tool.id} tool={tool} />)
              ) : (
                <p className="text-slate-400 col-span-full text-center">No tools found matching your criteria in this category.</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Per-category showcases - horizontal scrollers for each category */}
      <div className="space-y-10">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-light sm:text-4xl">Browse By Category</h2>
          <p className="mt-2 text-slate-400">Quick previews of tools in each category. Swipe or scroll horizontally to explore.</p>
        </div>
        <div className="space-y-8">
          {toolsByCategory.map(cat => (
            <div key={cat.category} className="px-2">
              <ToolRow
                title={cat.category}
                tools={cat.tools}
                loading={false}
                emptyMessage={`No tools available for ${cat.category}.`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
}

export default HomePage;
