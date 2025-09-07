
import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Textarea } from '../../common/Textarea';
import { Button } from '../../common/Button';
import { Loader } from '../../common/Loader';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { fetchUrlMetadata } from '../../../services/captureService';

interface ShareData {
    url: string;
    title: string;
    description: string;
    imageUrl: string;
}

type PreviewPlatform = 'twitter' | 'facebook' | 'linkedin';

const ImageContainer: React.FC<{ imageUrl: string }> = ({ imageUrl }) => (
    <div className="aspect-video bg-slate-700 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
            <img src={imageUrl} alt="Social Share Preview" className="w-full h-full object-cover" />
        ) : (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        )}
    </div>
);

const TwitterPreview: React.FC<{ data: ShareData }> = ({ data }) => {
    const domain = data.url ? new URL(data.url).hostname.replace('www.', '') : 'example.com';
    return (
        <div className="border border-slate-700 rounded-2xl max-w-lg mx-auto overflow-hidden">
            <ImageContainer imageUrl={data.imageUrl} />
            <div className="p-4">
                <p className="text-sm text-slate-400 truncate">{domain}</p>
                <h3 className="text-md font-semibold text-white truncate">{data.title || 'Your Title Here'}</h3>
                <p className="text-sm text-slate-400 mt-1 line-clamp-2">{data.description || 'Your description will appear here...'}</p>
            </div>
        </div>
    );
};

const FacebookPreview: React.FC<{ data: ShareData }> = ({ data }) => {
    const domain = data.url ? new URL(data.url).hostname.replace('www.', '').toUpperCase() : 'EXAMPLE.COM';
    return (
        <div className="bg-[#242526] border border-slate-700 max-w-lg mx-auto">
            <ImageContainer imageUrl={data.imageUrl} />
            <div className="p-3 bg-[#3A3B3C]">
                <p className="text-xs text-slate-400 truncate">{domain}</p>
                <h3 className="text-md font-bold text-white truncate">{data.title || 'Your Title Here'}</h3>
                <p className="text-sm text-slate-300 mt-1 line-clamp-1">{data.description || 'Your description will appear here...'}</p>
            </div>
        </div>
    );
};

const LinkedInPreview: React.FC<{ data: ShareData }> = ({ data }) => {
    const domain = data.url ? new URL(data.url).hostname.replace('www.', '') : 'example.com';
    return (
        <div className="bg-[#1D2226] border border-slate-600 rounded-lg max-w-lg mx-auto overflow-hidden">
            <ImageContainer imageUrl={data.imageUrl} />
            <div className="p-4">
                <h3 className="text-md font-semibold text-white truncate">{data.title || 'Your Title Here'}</h3>
                <p className="text-sm text-slate-400 mt-1">{domain}</p>
            </div>
        </div>
    );
};

const GeneratedMetaTags: React.FC<{ data: ShareData }> = ({ data }) => {
    const [isCopied, copy] = useCopyToClipboard();
    const code = useMemo(() => `<!-- Essential Meta Tags -->
<meta property="og:title" content="${data.title}">
<meta property="og:description" content="${data.description}">
<meta property="og:image" content="${data.imageUrl}">
<meta property="og:url" content="${data.url}">
<meta name="twitter:card" content="summary_large_image">

<!-- Optional Meta Tags -->
<meta property="og:site_name" content="Your Site Name">
<meta name="twitter:image:alt" content="Image description for screen readers">
`, [data]);

    return (
        <Card>
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-white">Generated Meta Tags</h3>
                <Button variant="secondary" onClick={() => copy(code)}>{isCopied ? 'Copied!' : 'Copy Code'}</Button>
            </div>
            <pre className="text-sm bg-slate-900 rounded-md p-4 whitespace-pre-wrap break-all text-slate-300 font-mono">
                <code>{code}</code>
            </pre>
        </Card>
    );
};

const PREVIEWS: Record<PreviewPlatform, React.FC<{ data: ShareData }>> = {
    twitter: TwitterPreview,
    facebook: FacebookPreview,
    linkedin: LinkedInPreview,
};

export const SocialSharePreviewer: React.FC = () => {
    const [data, setData] = useState<ShareData>({
        url: 'https://aistudio.google.com/app',
        title: 'Google AI Studio',
        description: "A suite of tools to help you develop with generative AI. Prompt, tune, and build with Google's latest models.",
        imageUrl: 'https://lh3.googleusercontent.com/avgr-S5kG5Yh2-1gJAU0QJtp_s_X2vP2Fs_2Sg9s9j4R0z-o-n5k-D-32qveSQSCkOlb8iP5V0B8s3s-ZmTfbv4pIOQ4o2j28W2XoA=w1200-h630-p-nu-iv1',
    });
    const [urlToFetch, setUrlToFetch] = useState('https://aistudio.google.com/app');
    const [activePreview, setActivePreview] = useState<PreviewPlatform>('twitter');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }));
    };

    const handleFetchMetadata = async () => {
        if (!urlToFetch) return;
        setIsLoading(true);
        setError('');
        try {
            const metadata = await fetchUrlMetadata(urlToFetch);
            setData(metadata);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const ActivePreviewComponent = PREVIEWS[activePreview];

    return (
        <ToolContainer>
            <ToolHeader
                title="Advanced Social Share Previewer"
                description="Fetch live metadata, preview how your links look on social platforms, and generate the necessary meta tags."
            />
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-4">Share Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-300">URL</label>
                                <div className="flex gap-2">
                                    <Input name="urlToFetch" type="url" value={urlToFetch} onChange={(e) => setUrlToFetch(e.target.value)} placeholder="https://example.com" />
                                    <Button onClick={handleFetchMetadata} disabled={isLoading}>{isLoading ? '...' : 'Fetch'}</Button>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-300">Title</label>
                                <Input name="title" value={data.title} onChange={handleInputChange} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-300">Description</label>
                                <Textarea name="description" value={data.description} onChange={handleInputChange} rows={3} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-300">Image URL</label>
                                <Input name="imageUrl" type="url" value={data.imageUrl} onChange={handleInputChange} />
                            </div>
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-3 space-y-6">
                    {isLoading ? (
                        <Card className="flex items-center justify-center min-h-[300px]"><Loader text="Fetching metadata..." /></Card>
                    ) : error ? (
                        <Card className="flex items-center justify-center min-h-[300px] text-center">
                            <p className="text-red-400">{error}</p>
                        </Card>
                    ) : (
                        <>
                            <Card>
                                <div className="border-b border-slate-800 mb-4 flex space-x-2">
                                    {(['twitter', 'facebook', 'linkedin'] as PreviewPlatform[]).map(p => (
                                        <button key={p} onClick={() => setActivePreview(p)} className={`px-4 py-2 text-sm font-medium capitalize rounded-t-lg transition-colors ${activePreview === p ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 text-slate-400'}`}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                                <ActivePreviewComponent data={data} />
                            </Card>
                            <GeneratedMetaTags data={data} />
                        </>
                    )}
                </div>
            </div>
        </ToolContainer>
    );
};
