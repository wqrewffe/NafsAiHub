import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { Select } from '../../common/Select';
import { Loader } from '../../common/Loader';
import { performCapture, CaptureRequest } from '../../../services/captureService';

type CaptureMode = 'viewport' | 'full' | 'element' | 'mobile' | 'video';
type ActiveTab = 'capture' | 'page' | 'data';

interface Artifact {
    name: string;
    type: string;
    icon: React.ReactNode;
    content: string;
    mimeType: string;
}

const FileIcon: React.FC<{className?: string}> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12.75h.008v.008H9v-.008z" /></svg>);
const CodeIcon: React.FC<{className?: string}> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" /></svg>);
const LinkIcon: React.FC<{className?: string}> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>);
const VideoIcon: React.FC<{className?: string}> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" /></svg>);

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            active ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
        }`}
    >
        {children}
    </button>
);

export const AdvancedScreenshotTool: React.FC = () => {
    // Input state
    const [url, setUrl] = useState('https://aistudio.google.com/app');
    const [activeTab, setActiveTab] = useState<ActiveTab>('capture');
    
    // Capture Settings
    const [captureMode, setCaptureMode] = useState<CaptureMode>('viewport');
    const [elementSelector, setElementSelector] = useState('');
    
    // Page Setup
    const [autoScroll, setAutoScroll] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [hideSelectors, setHideSelectors] = useState('.cookie-banner, #sticky-header');

    // Data Extraction
    const [saveDom, setSaveDom] = useState(true);
    const [extractLinks, setExtractLinks] = useState(true);
    const [axReport, setAxReport] = useState(false);
    const [seoMeta, setSeoMeta] = useState(true);
    
    // Result state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<{ screenshotUrl: string; artifacts: Artifact[], capturedUrl: string } | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleTextDownload = (filename: string, content: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImageDownload = async (imageUrl: string, filename: string) => {
        setIsDownloading(true);
        try {
            const CORS_PROXY_URL = 'https://api.allorigins.win/raw?url=';
            const proxiedUrl = `${CORS_PROXY_URL}${encodeURIComponent(imageUrl)}`;

            const response = await fetch(proxiedUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch image via proxy: ${response.statusText}`);
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Image download failed, falling back to new tab:", error);
            window.open(imageUrl, '_blank');
        } finally {
            setIsDownloading(false);
        }
    };


    const handleCapture = async () => {
        if (!url) return;
        setIsLoading(true);
        setResults(null);
        setError(null);

        const request: CaptureRequest = {
            url,
            extract: {
                dom: saveDom,
                links: extractLinks,
                accessibility: axReport,
                seo: seoMeta,
            },
        };

        const response = await performCapture(request);
        
        if (response.status === 'error') {
            setError(response.message || 'An unknown error occurred.');
            setIsLoading(false);
            return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const urlHost = new URL(url).hostname.replace('www.', '');
        const generatedArtifacts: Artifact[] = [];

        // Main artifact (screenshot or video placeholder)
        if (captureMode !== 'video') {
            generatedArtifacts.push({
                name: `${urlHost}-${timestamp}.png`,
                type: 'PNG Image',
                icon: <FileIcon className="w-5 h-5" />,
                content: response.mainArtifactUrl,
                mimeType: 'image/png'
            });
        } else {
             generatedArtifacts.push({
                 name: `${urlHost}-${timestamp}.mp4`,
                 type: 'MP4 Video',
                 icon: <VideoIcon className="w-5 h-5" />,
                 content: 'video-placeholder',
                 mimeType: 'video/mp4'
             });
        }
        
        // Data artifacts
        const { dataArtifacts } = response;
        if (dataArtifacts.dom) {
            generatedArtifacts.push({ name: `dom.html`, type: 'HTML Document', icon: <CodeIcon className="w-5 h-5" />, content: dataArtifacts.dom, mimeType: 'text/html' });
        }
        if (dataArtifacts.links) {
            generatedArtifacts.push({ name: `links.txt`, type: 'Text Document', icon: <LinkIcon className="w-5 h-5" />, content: dataArtifacts.links.join('\n'), mimeType: 'text/plain' });
        }
        if (dataArtifacts.accessibilityReport) {
            generatedArtifacts.push({ name: `accessibility.json`, type: 'JSON Report', icon: <CodeIcon className="w-5 h-5" />, content: JSON.stringify(dataArtifacts.accessibilityReport, null, 2), mimeType: 'application/json' });
        }
        if (dataArtifacts.seoMetadata) {
            generatedArtifacts.push({ name: `seo.json`, type: 'JSON Report', icon: <CodeIcon className="w-5 h-5" />, content: JSON.stringify(dataArtifacts.seoMetadata, null, 2), mimeType: 'application/json' });
        }

        setResults({
            screenshotUrl: response.mainArtifactUrl,
            artifacts: generatedArtifacts,
            capturedUrl: response.capturedUrl
        });
        setIsLoading(false);
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="Advanced Screenshot Tool"
                description="Capture, record, and analyze web pages with powerful options."
            />
            <Card>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Input
                        type="url"
                        placeholder="https://example.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="flex-grow"
                    />
                    <Button onClick={handleCapture} disabled={isLoading || !url} className="w-full sm:w-auto">
                        {isLoading ? 'Capturing...' : 'Capture'}
                    </Button>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <Card className="p-0">
                        <div className="border-b border-slate-800 flex justify-around">
                            <TabButton active={activeTab === 'capture'} onClick={() => setActiveTab('capture')}>Capture</TabButton>
                            <TabButton active={activeTab === 'page'} onClick={() => setActiveTab('page')}>Page</TabButton>
                            <TabButton active={activeTab === 'data'} onClick={() => setActiveTab('data')}>Data</TabButton>
                        </div>
                        <div className="p-6 space-y-4">
                            {activeTab === 'capture' && <>
                                <div>
                                    <label className="text-sm font-medium text-slate-300">Capture Mode</label>
                                    <Select value={captureMode} onChange={e => setCaptureMode(e.target.value as CaptureMode)}>
                                        <option value="viewport">Viewport</option>
                                        <option value="full">Full Page</option>
                                        <option value="element">Element (CSS Selector)</option>
                                        <option value="mobile">Mobile (Emulated)</option>
                                        <option value="video" disabled>Video Recording (Soon)</option>
                                    </Select>
                                </div>
                                {captureMode === 'element' && <div>
                                    <label className="text-sm font-medium text-slate-300">CSS Selector</label>
                                    <Input placeholder="#main-content, .hero" value={elementSelector} onChange={e => setElementSelector(e.target.value)} disabled/>
                                </div>}
                            </>}
                            {activeTab === 'page' && <>
                                <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} disabled/><span>Auto-scroll to bottom</span></label>
                                <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={darkMode} onChange={e => setDarkMode(e.target.checked)} disabled/><span>Emulate dark mode</span></label>
                                <div>
                                    <label className="text-sm font-medium text-slate-300">Hide Selectors (comma-separated)</label>
                                    <Input placeholder=".cookie-banner" value={hideSelectors} onChange={e => setHideSelectors(e.target.value)} disabled/>
                                </div>
                                <p className="text-xs text-slate-500">Note: Page setup options require a backend service and are currently disabled.</p>
                            </>}
                            {activeTab === 'data' && <>
                                <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={saveDom} onChange={e => setSaveDom(e.target.checked)} /><span>Save DOM</span></label>
                                <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={extractLinks} onChange={e => setExtractLinks(e.target.checked)} /><span>Extract all links</span></label>
                                <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={axReport} onChange={e => setAxReport(e.target.checked)} /><span>Accessibility report (mocked)</span></label>
                                <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={seoMeta} onChange={e => setSeoMeta(e.target.checked)} /><span>SEO metadata</span></label>
                            </>}
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    {isLoading && <Card className="flex items-center justify-center min-h-[400px]"><Loader text="Fetching and analyzing page..." /></Card>}
                    {!isLoading && error && <Card className="flex flex-col items-center justify-center min-h-[400px] text-center"><p className="text-red-400 font-semibold mb-2">Capture Failed</p><p className="text-slate-400 text-sm max-w-md">{error}</p></Card>}
                    {!isLoading && !results && !error && <Card className="flex items-center justify-center min-h-[400px]"><p className="text-slate-500">Results will be displayed here</p></Card>}
                    {results && (
                        <>
                        <Card className="p-2 space-y-2 bg-slate-800">
                            <div className="bg-slate-900 rounded-t-lg px-4 py-2 flex items-center gap-2">
                                <div className="flex space-x-1.5">
                                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                </div>
                                <div className="bg-slate-800 text-slate-400 text-sm rounded px-3 py-1 flex-grow text-center truncate">{results.capturedUrl}</div>
                            </div>
                            <div className="bg-slate-900 aspect-video w-full flex items-center justify-center">
                                {captureMode !== 'video' ? (
                                    <img src={results.screenshotUrl} alt="Captured Screenshot" className="object-contain w-full h-full" />
                                ) : (
                                    <div className="text-center text-slate-400">
                                        <VideoIcon className="w-16 h-16 mx-auto text-slate-500"/>
                                        <p>Video capture complete</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                         <Card>
                            <h3 className="text-lg font-semibold text-white mb-3">Generated Artifacts</h3>
                            <div className="space-y-2">
                                {results.artifacts.map(artifact => (
                                    <div key={artifact.name} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <span className="text-indigo-400">{artifact.icon}</span>
                                            <div>
                                                <p className="font-medium text-white">{artifact.name}</p>
                                                <p className="text-sm text-slate-400">{artifact.type}</p>
                                            </div>
                                        </div>
                                        {artifact.type.includes('Image') ? (
                                            <Button
                                                variant="secondary"
                                                onClick={() => handleImageDownload(artifact.content, artifact.name)}
                                                disabled={isDownloading}
                                            >
                                                {isDownloading ? 'Downloading...' : 'Download'}
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="secondary"
                                                onClick={() => handleTextDownload(artifact.name, artifact.content, artifact.mimeType)}
                                                disabled={artifact.content === 'video-placeholder'}
                                            >
                                                Download
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>
                        </>
                    )}
                </div>
            </div>
        </ToolContainer>
    );
};