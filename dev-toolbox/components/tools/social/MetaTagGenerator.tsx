import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

interface MetaData {
    title: string;
    description: string;
    url: string;
    imageUrl: string;
    siteName: string;
    twitterHandle: string;
}

const generateMetaTags = (data: MetaData): string => {
    const tags = [
        // Standard SEO
        `<title>${data.title}</title>`,
        `<meta name="description" content="${data.description}">`,
        
        // Open Graph (Facebook, Pinterest, etc.)
        `<meta property="og:title" content="${data.title}">`,
        `<meta property="og:description" content="${data.description}">`,
        `<meta property="og:image" content="${data.imageUrl}">`,
        `<meta property="og:url" content="${data.url}">`,
        `<meta property="og:site_name" content="${data.siteName}">`,
        `<meta property="og:type" content="website">`,

        // Twitter Card
        `<meta name="twitter:card" content="summary_large_image">`,
        `<meta name="twitter:title" content="${data.title}">`,
        `<meta name="twitter:description" content="${data.description}">`,
        `<meta name="twitter:image" content="${data.imageUrl}">`,
    ];
    if (data.twitterHandle) {
        tags.push(`<meta name="twitter:creator" content="@${data.twitterHandle.replace('@', '')}">`);
    }
    return tags.join('\n');
};

export const MetaTagGenerator: React.FC = () => {
    const [data, setData] = useState<MetaData>({
        title: 'Dev Toolbox',
        description: 'A suite of useful online tools for developers.',
        url: 'https://nafsaihub.vercel.app',
        imageUrl: 'https://nafsaihub.vercel.app/assets/fav-Ck4NQm_F.png',
        siteName: 'Dev Toolbox',
        twitterHandle: 'username',
    });
    const [isCopied, copy] = useCopyToClipboard();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }));
    };

    const generatedCode = useMemo(() => generateMetaTags(data), [data]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Meta Tag Generator"
                description="Create the essential meta tags for SEO and social sharing."
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="space-y-4">
                     <h3 className="text-lg font-semibold text-white">Content Details</h3>
                    <div>
                        <label className="text-sm font-medium text-slate-300">Title</label>
                        <Input name="title" value={data.title} onChange={handleInputChange} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-300">Description</label>
                        <Input name="description" value={data.description} onChange={handleInputChange} />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-slate-300">Website URL</label>
                        <Input name="url" type="url" value={data.url} onChange={handleInputChange} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-300">Image URL</label>
                        <Input name="imageUrl" type="url" value={data.imageUrl} onChange={handleInputChange} />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-slate-300">Site Name</label>
                        <Input name="siteName" value={data.siteName} onChange={handleInputChange} />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-slate-300">Twitter Handle (optional)</label>
                        <Input name="twitterHandle" value={data.twitterHandle} onChange={handleInputChange} placeholder="@username" />
                    </div>
                </Card>
                <Card>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-white">Generated HTML</h3>
                        <Button variant="secondary" onClick={() => copy(generatedCode)}>
                            {isCopied ? 'Copied!' : 'Copy Code'}
                        </Button>
                    </div>
                    <pre className="text-sm bg-slate-900 rounded-md p-4 whitespace-pre-wrap break-all text-slate-300 h-full overflow-auto font-mono">
                        <code>{generatedCode}</code>
                    </pre>
                </Card>
            </div>
        </ToolContainer>
    );
};
