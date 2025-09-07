import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Card } from '../../common/Card';

const essentialTags = {
    'og:title': 'The title of your content.',
    'og:type': 'The type of your object (e.g., "website").',
    'og:image': 'URL of an image for the share.',
    'og:url': 'The canonical URL of your page.',
    'twitter:card': 'The type of Twitter card (e.g., "summary_large_image").',
};

const recommendedTags = {
    'og:description': 'A one to two sentence description.',
    'og:site_name': 'The name of your website.',
    'twitter:title': 'Title for Twitter (can be same as og:title).',
    'twitter:description': 'Description for Twitter.',
    'twitter:image': 'Image for Twitter (can be same as og:image).',
};

type TagStatus = 'found' | 'missing' | 'warning';

interface TagResult {
    tag: string;
    description: string;
    status: TagStatus;
    value?: string;
}

const debugOgTags = (html: string): TagResult[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const checkTag = (prop: string): { status: TagStatus; value?: string } => {
        const el = doc.querySelector(`meta[property="${prop}"], meta[name="${prop}"]`);
        const content = el?.getAttribute('content');
        if (content) return { status: 'found', value: content };
        return { status: 'missing' };
    };

    const results: TagResult[] = [];

    Object.entries(essentialTags).forEach(([tag, description]) => {
        results.push({ tag, description, ...checkTag(tag) });
    });

    Object.entries(recommendedTags).forEach(([tag, description]) => {
        results.push({ tag, description, ...checkTag(tag) });
    });

    return results;
};

const StatusPill: React.FC<{ status: TagStatus }> = ({ status }) => {
    const styles = {
        found: 'bg-green-500/20 text-green-300',
        missing: 'bg-red-500/20 text-red-300',
        warning: 'bg-yellow-500/20 text-yellow-300',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>{status.toUpperCase()}</span>;
};

export const OgDebugger: React.FC = () => {
    const [html, setHtml] = useState('<!-- Paste your <head> HTML here -->\n<meta property="og:title" content="My Awesome Page">');

    const results = useMemo(() => debugOgTags(html), [html]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Open Graph Debugger"
                description="Paste your page's HTML source to analyze its OG and Twitter meta tags."
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Textarea
                    placeholder="<head>...</head>"
                    value={html}
                    onChange={e => setHtml(e.target.value)}
                    rows={25}
                    className="font-mono text-sm"
                />
                <Card>
                    <h3 className="text-lg font-semibold text-white mb-3">Analysis Results</h3>
                    <div className="space-y-3">
                        {results.map(res => (
                            <div key={res.tag} className="bg-slate-800/50 p-3 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <code className="text-indigo-400">{res.tag}</code>
                                    <StatusPill status={res.status} />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">{res.description}</p>
                                {res.value && <p className="text-sm text-white mt-2 break-all font-mono bg-slate-900 p-2 rounded">"{res.value}"</p>}
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </ToolContainer>
    );
};
