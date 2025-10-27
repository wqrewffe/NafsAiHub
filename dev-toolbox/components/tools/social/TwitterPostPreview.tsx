
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { Select } from '../../common/Select';
import { Loader } from '../../common/Loader';
import { fetchUrlMetadata, UrlMetadata } from '../../../services/captureService';
import { renderToCanvas } from '../../../services/domToImage';

const CHAR_LIMIT = 280;

type VerificationStatus = 'none' | 'blue' | 'gold' | 'grey';
type Theme = 'light' | 'dark';

interface Profile {
    name: string;
    handle: string;
    avatar: string | null;
    verified: VerificationStatus;
}

interface Stats {
    replies: string;
    retweets: string;
    likes: string;
    views: string;
}


const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iMjQiIGZpbGw9IiM0NzU1NjkiLz4KPHBhdGggZD0iTTI0IDI1QzI4LjQxODMgMjUgMzIgMjEuNDE4MyAzMiAxN0MzMiAxMi41ODIzIDI4LjQxODMgOSAyNCA5QzE5LjU4MTcgOSAxNiAxMi41ODIzIDE2IDE3QzE2IDIxLjQxODMgMTkuNTgxNyAyNSAyNCAyNVoiIGZpbGw9IiM5NEExQjIiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMiAzOUMxMiAzMi45MjQ5IDE3LjM3MjYgMjggMjQgMjhDMzAuNjI3NCAyOCAzNiAzMi45MjQ5IDM2IDM5SDEyWiIgZmlsbD0iIzk0QTFCMiIvPgo8L3N2Zz4K";

// --- SVG Icons ---
const VerificationBadge: React.FC<{ status: VerificationStatus; className?: string }> = ({ status, className }) => {
    if (status === 'none') return null;
    const colors = {
        blue: { bg: '#1D9BF0', path: 'M13.25 2.25L12 3.5l-1.25-1.25L9.5 3.5 8.25 2.25 7 3.5 5.75 2.25 4.5 3.5 3.25 2.25 2 3.5l11.25 11.25L22 3.5l-1.25-1.25L19.5 3.5l-1.25-1.25L17 3.5l-1.25-1.25L14.5 3.5l-1.25-1.25zM10.44 11.28l-3.3-3.3-.94.94 3.3 3.3c.52.52 1.36.52 1.88 0l5.88-5.88-.94-.94-5.88 5.88c-.52.52-1.36.52-1.88 0z' },
        gold: { bg: '#FFD700', path: 'M12 1.69l2.36 5.51 6.09.5-4.59 4.07 1.29 6.04-5.15-3.1-5.15 3.1 1.29-6.04-4.59-4.07 6.09-.5L12 1.69z' },
        grey: { bg: '#808080', path: 'M10.5 2h3v5h5v3h-5v5h-3v-5h-5v-3h5V2z' }
    };
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
            <g><path fill={colors[status].bg} d={colors[status].path}></path></g>
        </svg>
    );
};
const ReplyIcon: React.FC<{className?: string}> = (props) => (<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" {...props}><g><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.031 7.12l-1.106 1.38c-.37.46-.92.73-1.51.73H8.25c-.828 0-1.5-.67-1.5-1.5v-3.5c0-.83-.672-1.5-1.5-1.5h-1.5c-.414 0-.75-.34-.75-.75s.336-.75.75-.75h.251c.276 0 .5-.22.5-.5s-.224-.5-.5-.5h-.251zM8.25 18.99c.39 0 .73.23.88.59l.62 1.44c.14.33.45.56.81.56h3.21c.32 0 .6-.16.76-.43l1.1-1.38c2.1-2.63 3.32-5.73 3.32-9.18 0-5.01-4.06-9.07-9.07-9.07H9.756c-4.96 0-8.99 4.03-8.99 8.99V12c0 .41.34.75.75.75h1.5c.828 0 1.5.67 1.5 1.5v3.99z"></path></g></svg>);
const RetweetIcon: React.FC<{className?: string}> = (props) => (<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" {...props}><g><path d="M4.75 3.79l4.603 4.3-1.706 1.82L6 8.38v7.37c0 .97.784 1.75 1.75 1.75h6.5c.966 0 1.75-.78 1.75-1.75v-2.25h2v2.25c0 2.07-1.68 3.75-3.75 3.75h-6.5C5.12 21 3 18.88 3 16.75V8.38l-1.647 1.53L0 8.09l4.603-4.3c.09-.08.236-.08.326 0zm15.698 16.42l-4.603-4.3 1.706-1.82L18 15.62V8.25c0-.97-.784-1.75-1.75-1.75h-6.5c-.966 0-1.75.78-1.75 1.75v2.25h-2V8.25c0-2.07 1.68-3.75 3.75-3.75h6.5C20.03 4.5 22 6.12 22 8.25v7.37l1.647-1.53L25 15.91l-4.603 4.3c-.09.08-.236-.08-.326 0z"></path></g></svg>);
const LikeIcon: React.FC<{className?: string}> = (props) => (<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" {...props}><g><path d="M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.58 4.646 2.73.814-1.148 2.354-2.73 4.645-2.73 2.88 0 5.404 2.69 5.404 5.754 0 6.376-7.454 13.11-10.037 13.157H12z"></path></g></svg>);
const ViewsIcon: React.FC<{className?: string}> = (props) => (<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" {...props}><g><path d="M8.75 21V3h2v18h-2zM18.75 21V8h2v13h-2zM3.75 21v-8h2v8h-2zM13.75 21V11h2v10h-2z"></path></g></svg>);
const BookmarkIcon: React.FC<{className?: string}> = (props) => (<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" {...props}><g><path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5z"></path></g></svg>);
const ShareIcon: React.FC<{className?: string}> = (props) => (<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" {...props}><g><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"></path></g></svg>);

const parseTweetText = (text: string) => {
    const parts = text.split(/(#\w+|@\w+|https?:\/\/\S+)/g);
    return parts.map((part, i) => {
        if (part.match(/^#/)) return <span key={i} className="text-blue-500">{part}</span>;
        if (part.match(/^@/)) return <span key={i} className="text-blue-500">{part}</span>;
        if (part.match(/^https?/)) return <span key={i} className="text-blue-500">{part}</span>;
        return part;
    });
};

const ImageGrid: React.FC<{ images: string[] }> = ({ images }) => {
    if (images.length === 0) return null;
    const gridClasses = {
        1: 'grid-cols-1 grid-rows-1',
        2: 'grid-cols-2 grid-rows-1',
        3: 'grid-cols-2 grid-rows-2 h-[251px]',
        4: 'grid-cols-2 grid-rows-2',
    }[images.length] || 'grid-cols-2 grid-rows-2';

    return (
        <div className={`mt-3 grid gap-0.5 rounded-2xl overflow-hidden border border-slate-700 ${gridClasses}`}>
            {images.map((src, i) => (
                <div key={i} className={`relative ${images.length === 3 && i === 0 ? 'row-span-2' : ''}`}>
                    <img src={src} className="absolute inset-0 w-full h-full object-cover" />
                </div>
            ))}
        </div>
    );
};

const UrlCard: React.FC<{ data: UrlMetadata }> = ({ data }) => {
    const domain = useMemo(() => {
        try {
            return new URL(data.url).hostname.replace('www.', '');
        } catch { return ''; }
    }, [data.url]);

    return (
        <div className="mt-3 border border-slate-700 rounded-2xl overflow-hidden">
            {data.imageUrl && <div className="aspect-video bg-slate-800"><img src={data.imageUrl} className="w-full h-full object-cover" /></div>}
            <div className="p-3">
                <p className="text-sm text-slate-400 truncate">{domain}</p>
                <h3 className="text-white font-semibold truncate">{data.title}</h3>
                <p className="text-slate-400 text-sm line-clamp-2">{data.description}</p>
            </div>
        </div>
    );
};

const ActionItem: React.FC<{
    icon: React.ReactNode;
    value?: string;
    hoverClasses: string;
    hoverBgClasses: string;
    theme: Theme;
}> = ({ icon, value, hoverClasses, hoverBgClasses, theme }) => (
    <button className={`group flex items-center transition-colors duration-200 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} ${hoverClasses}`}>
        <div className={`p-1.5 rounded-full transition-colors duration-200 ${hoverBgClasses}`}>
             {icon}
        </div>
        {value && <span className="text-sm ml-1">{value}</span>}
    </button>
);


export const TwitterPostPreview: React.FC = () => {
    const [text, setText] = useState('Check out this amazing Dev Toolbox built with Google AI! #DevToolbox https://aistudio.google.com/app');
    const [profile, setProfile] = useState<Profile>({
        name: 'Dev Toolbox',
        handle: 'DevToolbox',
        avatar: null,
        verified: 'blue'
    });
    const [stats, setStats] = useState<Stats>({
        replies: '18',
        retweets: '1.2K',
        likes: '11K',
        views: '129K'
    });
    const [images, setImages] = useState<string[]>([]);
    const [urlCard, setUrlCard] = useState<UrlMetadata | null>(null);
    const [isLoadingCard, setIsLoadingCard] = useState(false);
    const [theme, setTheme] = useState<Theme>('dark');
    const previewRef = useRef<HTMLDivElement>(null);
    const lastFetchedUrl = useRef<string | null>(null);

    const charsLeft = CHAR_LIMIT - text.length;
    const progress = Math.min((text.length / CHAR_LIMIT) * 100, 100);

    // Debounced URL fetching
    useEffect(() => {
        const handler = setTimeout(async () => {
            const urls = text.match(/https?:\/\/\S+/g);
            const currentUrl = urls && urls.length > 0 ? urls[urls.length - 1] : null;

            if (currentUrl) {
                if (currentUrl !== lastFetchedUrl.current) {
                    lastFetchedUrl.current = currentUrl;
                    setIsLoadingCard(true);
                    setUrlCard(null);
                    try {
                        const metadata = await fetchUrlMetadata(currentUrl);
                        setUrlCard(metadata);
                    } catch (error) {
                        console.error(error);
                        setUrlCard(null);
                    } finally {
                        setIsLoadingCard(false);
                    }
                }
            } else {
                setUrlCard(null);
                lastFetchedUrl.current = null;
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [text]);


    const handleProfileChange = (field: keyof Profile, value: any) => {
        setProfile(p => ({ ...p, [field]: value }));
    };

    const handleStatsChange = (field: keyof Stats, value: string) => {
        setStats(s => ({...s, [field]: value}));
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            handleProfileChange('avatar', URL.createObjectURL(e.target.files[0]));
        }
    };
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files) as File[];
            const fileUrls = files.slice(0, 4).map(file => URL.createObjectURL(file as Blob));
            setImages(fileUrls);
        }
    };

    const handleDownload = async () => {
        const element = previewRef.current;
        if (!element) return;
        
        try {
            const canvas = await renderToCanvas(element, theme === 'light' ? '#ffffff' : '#000000');
            const dataUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = 'tweet-preview.png';
            a.click();
        } catch (error) {
            console.error('oops, something went wrong!', error);
            alert('Could not generate image. Your browser may be blocking this action.');
        }
    };
    
    return (
        <ToolContainer>
            <ToolHeader
                title="Advanced Twitter/X Post Previewer"
                description="Create realistic tweet mockups with custom profiles, images, URL previews, and dark/light themes."
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">Tweet Content</h3>
                        <div className="relative">
                            <Textarea
                                value={text}
                                onChange={e => setText(e.target.value)}
                                rows={5}
                                className="pr-16"
                            />
                            <div className="absolute top-3 right-3">
                                <svg width="30" height="30" viewBox="0 0 36 36">
                                    <circle cx="18" cy="18" r="16" fill="none" strokeWidth="2" className="stroke-slate-700" />
                                    <circle cx="18" cy="18" r="16" fill="none" strokeWidth="2"
                                        className={`transition-all duration-300 ${charsLeft < 0 ? 'stroke-red-500' : (charsLeft < 20 ? 'stroke-yellow-400' : 'stroke-blue-500')}`}
                                        strokeDasharray={`${(progress / 100) * 100.53} 100.53`}
                                        transform="rotate(-90 18 18)"
                                    />
                                </svg>
                            </div>
                        </div>
                    </Card>
                    <Card>
                         <h3 className="text-lg font-semibold text-white mb-2">User Profile</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input label="Name" value={profile.name} onChange={e => handleProfileChange('name', e.target.value)} />
                            <Input label="Handle" value={profile.handle} onChange={e => handleProfileChange('handle', e.target.value.replace(/@/g, ''))} addon="@" />
                            <Input label="Avatar" type="file" accept="image/*" onChange={handleAvatarUpload} />
                            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Verification</label><Select value={profile.verified} onChange={e => handleProfileChange('verified', e.target.value)}>
                                <option value="none">None</option><option value="blue">Blue</option><option value="gold">Gold (Business)</option><option value="grey">Grey (Government)</option>
                            </Select></div>
                         </div>
                    </Card>
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">Engagement Stats</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <Input label="Replies" value={stats.replies} onChange={e => handleStatsChange('replies', e.target.value)} />
                            <Input label="Retweets" value={stats.retweets} onChange={e => handleStatsChange('retweets', e.target.value)} />
                            <Input label="Likes" value={stats.likes} onChange={e => handleStatsChange('likes', e.target.value)} />
                            <Input label="Views" value={stats.views} onChange={e => handleStatsChange('views', e.target.value)} />
                        </div>
                    </Card>
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">Attachments</h3>
                        <Input label="Images (up to 4)" type="file" accept="image/*" multiple onChange={handleImageUpload} />
                        {images.length > 0 && <Button variant="secondary" className="mt-2 w-full" onClick={() => setImages([])}>Remove Images</Button>}
                    </Card>
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">Options</h3>
                        <div className="flex gap-2">
                             <Button onClick={() => setTheme('dark')} variant={theme === 'dark' ? 'primary' : 'secondary'} className="w-full">Dark Mode</Button>
                             <Button onClick={() => setTheme('light')} variant={theme === 'light' ? 'primary' : 'secondary'} className="w-full">Light Mode</Button>
                             <Button onClick={handleDownload} className="w-full">Download PNG</Button>
                        </div>
                    </Card>
                </div>

                <div ref={previewRef} className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'}`}>
                    <Card className={`${theme === 'dark' ? 'bg-black border-slate-800' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-start space-x-3">
                            <img src={profile.avatar || defaultAvatar} className="w-12 h-12 rounded-full flex-shrink-0 bg-slate-500" />
                            <div className="flex-1 overflow-hidden min-w-0">
                                <div className="flex items-center space-x-1">
                                    <span className={`font-bold truncate ${theme === 'dark' ? 'text-slate-50' : 'text-slate-900'}`}>{profile.name}</span>
                                    <VerificationBadge status={profile.verified} className="w-5 h-5 fill-current flex-shrink-0" />
                                    <span className="text-slate-500 truncate">@{profile.handle}</span>
                                </div>
                                <div className={`whitespace-pre-wrap break-words ${theme === 'dark' ? 'text-slate-50' : 'text-slate-900'}`}>
                                    {parseTweetText(text)}
                                </div>
                                
                                {images.length > 0 ? (
                                    <ImageGrid images={images} />
                                ) : (
                                    <>
                                        {isLoadingCard && <Loader text="Loading preview..." />}
                                        {!isLoadingCard && urlCard && <UrlCard data={urlCard} />}
                                    </>
                                )}

                                <div className={`mt-3 flex justify-between items-center w-full max-w-md`}>
                                    <div className="flex items-center space-x-5 sm:space-x-8">
                                        <ActionItem icon={<ReplyIcon className="w-5 h-5" />} value={stats.replies} hoverClasses="hover:text-blue-500" hoverBgClasses="group-hover:bg-blue-500/10" theme={theme} />
                                        <ActionItem icon={<RetweetIcon className="w-5 h-5" />} value={stats.retweets} hoverClasses="hover:text-green-500" hoverBgClasses="group-hover:bg-green-500/10" theme={theme} />
                                        <ActionItem icon={<LikeIcon className="w-5 h-5" />} value={stats.likes} hoverClasses="hover:text-pink-500" hoverBgClasses="group-hover:bg-pink-500/10" theme={theme} />
                                        <ActionItem icon={<ViewsIcon className="w-5 h-5" />} value={stats.views} hoverClasses="hover:text-blue-500" hoverBgClasses="group-hover:bg-blue-500/10" theme={theme} />
                                    </div>
                                    <div className={`flex items-center`}>
                                        <ActionItem icon={<BookmarkIcon className="w-5 h-5" />} hoverClasses="hover:text-blue-500" hoverBgClasses="group-hover:bg-blue-500/10" theme={theme} />
                                        <ActionItem icon={<ShareIcon className="w-5 h-5" />} hoverClasses="hover:text-blue-500" hoverBgClasses="group-hover:bg-blue-500/10" theme={theme} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </ToolContainer>
    );
};
