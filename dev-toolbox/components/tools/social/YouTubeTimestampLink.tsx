
import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Loader } from '../../common/Loader';

interface VideoData {
    title: string;
    author_name: string;
    html: string; // The iframe embed code
    thumbnail_url: string;
}

const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const TimeInput: React.FC<{ value: number, onChange: (v: number) => void, max?: number, label: string }> = ({ value, onChange, max = 59, label }) => (
    <div className="flex items-center gap-2">
        <Input
            type="number"
            value={value}
            onChange={e => onChange(parseInt(e.target.value, 10) || 0)}
            min="0"
            max={max}
            className="w-20 text-center"
        />
        <span className="text-slate-400">{label}</span>
    </div>
);

export const YouTubeTimestampLink: React.FC = () => {
    const [url, setUrl] = useState('https://www.youtube.com/watch?v=-TkoO8Z07hI');
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(5);
    const [seconds, setSeconds] = useState(30);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [videoData, setVideoData] = useState<VideoData | null>(null);
    const [previewTime, setPreviewTime] = useState(0); // For forcing iframe re-render

    const [isCopied, copy] = useCopyToClipboard();

    const videoId = useMemo(() => getYouTubeVideoId(url), [url]);
    const totalSeconds = useMemo(() => (hours * 3600) + (minutes * 60) + seconds, [hours, minutes, seconds]);

    const timestampLink = useMemo(() => {
        if (!videoId) return '';
        return `https://youtu.be/${videoId}?t=${totalSeconds}`;
    }, [videoId, totalSeconds]);

    const embedUrl = useMemo(() => {
        if (!videoId) return '';
        return `https://www.youtube.com/embed/${videoId}?start=${previewTime}`;
    }, [videoId, previewTime]);

    const fetchVideoInfo = async () => {
        if (!videoId) {
            setError('Invalid YouTube URL.');
            setVideoData(null);
            return;
        }
        setIsLoading(true);
        setError('');
        setVideoData(null);
        try {
            // Using a simple, public oEmbed proxy to avoid CORS issues.
            const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
            if (!response.ok) throw new Error('Could not fetch video data.');
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            setVideoData(data);
            setPreviewTime(totalSeconds);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            setVideoData(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePreview = () => {
        setPreviewTime(totalSeconds);
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="Advanced YouTube Timestamp Link Generator"
                description="Fetch video info, see a live preview, and create a link that starts playing at a specific time."
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">1. Video URL</h3>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
                            <Button onClick={fetchVideoInfo} disabled={isLoading || !url} className="w-full sm:w-auto">
                                {isLoading ? 'Fetching...' : 'Fetch Video'}
                            </Button>
                        </div>
                    </Card>

                    {videoData && (
                        <>
                        <Card>
                            <h3 className="text-lg font-semibold text-white mb-2">2. Set Timestamp</h3>
                            <div className="flex items-center gap-4">
                                <TimeInput value={hours} onChange={setHours} max={99} label="h" />
                                <TimeInput value={minutes} onChange={setMinutes} label="m" />
                                <TimeInput value={seconds} onChange={setSeconds} label="s" />
                            </div>
                            <Button onClick={handlePreview} variant="secondary" className="w-full mt-4">
                                Preview in Player
                            </Button>
                        </Card>
                        <Card>
                            <h3 className="text-lg font-semibold text-white mb-2">3. Generated Link</h3>
                            <div className="relative">
                                <Input readOnly value={timestampLink} className="font-mono pr-20" />
                                <Button onClick={() => copy(timestampLink)} className="absolute right-2 top-1/2 -translate-y-1/2" variant="secondary">
                                    {isCopied ? 'Copied!' : 'Copy'}
                                </Button>
                            </div>
                        </Card>
                        </>
                    )}
                </div>
                
                <Card className="flex items-center justify-center min-h-[300px]">
                    {isLoading && <Loader text="Fetching video info..." />}
                    {error && <p className="text-red-400 text-center">{error}</p>}
                    {videoData && (
                        <div className="w-full">
                             <h3 className="text-lg font-bold text-white mb-2 truncate" title={videoData.title}>{videoData.title}</h3>
                             <p className="text-sm text-slate-400 mb-4">by {videoData.author_name}</p>
                            <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                <iframe
                                    key={previewTime} // Force re-render on preview click
                                    width="100%"
                                    height="100%"
                                    src={embedUrl}
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </div>
                    )}
                    {!isLoading && !error && !videoData && <p className="text-slate-500">Video preview will appear here</p>}
                </Card>
            </div>
        </ToolContainer>
    );
};
