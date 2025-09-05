
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

import { GlobeAltIcon } from '../tools/Icons';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEngagement } from '../hooks/useEngagement';
import { getTopUsedToolsGlobal, getTopUsedToolsForUser } from '../services/firebaseService';
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
  
  const [trendingTools, setTrendingTools] = useState<Tool[] | null>(null);
  const [userTopTools, setUserTopTools] = useState<Tool[] | null>(null);
  const [recommendedTools, setRecommendedTools] = useState<Tool[] | null>(null);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);

  const toolsById = useMemo(() => {
    return new Map(tools.map(tool => [tool.id, tool]));
  }, []);
  
  const productivityTools = useMemo(() => {
      const toolIds = ['flashcard-generator', 'todo-list', 'note-taking'];
      return toolIds.map(id => tools.find(tool => tool.id === id)).filter((t): t is Tool => !!t);
  }, []);


  useEffect(() => {
    const checkNewUser = async () => {
      if (!currentUser) return;
      
      // Initialize tool access for new users
      await toolAccessService.getToolAccess(currentUser.uid);
    };

    checkNewUser();
  }, [currentUser]);

  useEffect(() => {
    const fetchTrendingTools = async () => {
      setLoadingTrending(true);
      try {
        const topToolsData = await getTopUsedToolsGlobal(7);
        const fetchedTools = topToolsData
          .map(data => {
            const found = toolsById.get(data.toolId);
            if (found) return found;
            // Support trainer tools which are recorded as toolStats with id like 'trainer-<mode>'
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
        setTrendingTools(fetchedTools);
      } catch (error) {
        console.error("Error fetching trending tools:", error);
      } finally {
        setLoadingTrending(false);
      }
    };
    fetchTrendingTools();
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
  
  const categoryDetails: Array<{ name: ToolCategory; icon: React.ComponentType<{ className?: string; }>; count: number; }> = useMemo(() => {
    const categoryMap: Partial<Record<ToolCategory, { icon: React.ComponentType<{ className?: string; }>; count: number; }>> = {
      'General': { icon: SparklesIcon, count: 0 },
      'High School': { icon: AcademicCapIcon, count: 0 },
      'Medical': { icon: StethoscopeIcon, count: 0 },
      'Programming': { icon: CodeBracketIcon, count: 0 },
      'Robotics & AI': { icon: CpuChipIcon, count: 0 },
      'GameDev': { icon: LightBulbIcon, count: 0 },
      'Games & Entertainment': { icon: RocketLaunchIcon, count: 0 },
  'Productivity': { icon: ClipboardDocumentCheckIcon, count: 0 },
  'Online': { icon: GlobeAltIcon, count: 0 },
  'Utility': { icon: KeyIcon, count: 0 },
  'Trainer': { icon: BoltIcon, count: 12 },
    };

    tools.forEach(tool => {
      if (categoryMap[tool.category]) {
        categoryMap[tool.category].count++;
      }
    });

    return (Object.keys(categoryMap) as ToolCategory[]).map(name => ({
      name,
      ...categoryMap[name]
    })).filter(cat => cat.count > 0 || cat.name === 'Trainer');
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

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row items-center gap-8 py-12 md:py-16">
        <div className="md:w-1/2 text-center md:text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-light">Welcome to Naf's AI Hub</h1>
          <p className="mt-6 text-lg max-w-3xl mx-auto md:mx-0 leading-8 text-slate-300">
            Unlock your potential with over 110 specialized AI tools designed for students, professionals, and curious minds. Your all-in-one platform for learning, creating, and innovating.
          </p>
        </div>
        <div className="md:w-1/2">
        </div>
      </div>

      {/* New Tool Rows Section */}
      <div className="space-y-12">
        <ToolRow 
          title="Trending Tools"
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
      
      {/* NEW Productivity Hub Section */}
      <div className="space-y-8">
        <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-light sm:text-4xl">Productivity Hub</h2>
            <p className="mt-4 text-slate-400">Quick tools to boost your workflow.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {productivityTools.map(tool => (
                <ToolCard key={tool.id} tool={tool} />
            ))}
        </div>
      </div>

      {/* Why Us Section */}
      <div className="space-y-8">
        <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-light sm:text-4xl">Why Choose Naf's AI Hub?</h2>
            <p className="mt-4 text-slate-400">Everything you need to accelerate your work and studies.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(feature => (
                <div key={feature.title} className="bg-secondary p-6 rounded-lg text-center">
                    <feature.icon className="h-10 w-10 text-accent mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-light">{feature.title}</h3>
                    <p className="mt-2 text-sm text-slate-400">{feature.description}</p>
                </div>
            ))}
        </div>
      </div>
      
      {/* How It Works Section */}
       {!currentUser && (
         <div className="space-y-8 bg-secondary/50 p-6 sm:p-8 rounded-lg">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight text-light sm:text-4xl">How It Works</h2>
                <p className="mt-4 text-slate-400">Get results in three simple steps.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="p-4">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-accent text-primary font-bold text-xl mx-auto mb-4">1</div>
                    <h3 className="text-lg font-semibold text-light">Create an Account</h3>
                    <p className="mt-2 text-sm text-slate-400">Sign up for free to unlock all tools and save your work history.</p>
                </div>
                 <div className="p-4">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-accent text-primary font-bold text-xl mx-auto mb-4">2</div>
                    <h3 className="text-lg font-semibold text-light">Select a Tool</h3>
                    <p className="mt-2 text-sm text-slate-400">Browse our categorized library or search to find the exact tool you need.</p>
                </div>
                 <div className="p-4">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-accent text-primary font-bold text-xl mx-auto mb-4">3</div>
                    <h3 className="text-lg font-semibold text-light">Generate & Innovate</h3>
                    <p className="mt-2 text-sm text-slate-400">Enter your input, get instant AI-powered results, and accelerate your learning.</p>
                </div>
            </div>
          </div>
        )}

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
                    category={cat.name}
                    icon={cat.icon}
                    toolCount={cat.count}
                    onClick={() => {
                      // Special handling for Trainer category: open the TRAINER folder index.html in a new tab
                      if (cat.name === 'Trainer') {
                        // Navigate to in-app Trainer route
                        navigate('/trainer');
                        return;
                      }

                      setActiveCategory(cat.name);
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
    </div>
  );
};

export default HomePage;
