import React, { useState, useEffect } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Loader } from '../../common/Loader';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const THUMBNAIL_QUALITIES = [
    { name: 'Max Resolution', key: 'maxresdefault' },
    { name: 'Standard Definition', key: 'sddefault' },
    { name: 'High Quality', key: 'hqdefault' },
    { name: 'Medium Quality', key: 'mqdefault' },
    { name: 'Default', key: 'default' },
];


interface ThumbnailCardProps {
  imageUrl: string;
  filename: string;
  qualityName: string;
  onDownload: (imageUrl: string, filename:string) => void;
}

const ThumbnailCard: React.FC<ThumbnailCardProps> = ({ imageUrl, filename, qualityName, onDownload }) => {
  const [isCopied, copyToClipboard] = useCopyToClipboard();

  return (
    <Card>
      <img
        src={imageUrl}
        alt={`${qualityName} thumbnail`}
        className="w-full rounded-md"
      />
      <h3 className="text-white font-semibold mt-2">{qualityName}</h3>
      <div className="mt-2 flex gap-2">
        <Button
          onClick={() => onDownload(imageUrl, filename)}
          className="w-full text-sm"
        >
          Download
        </Button>
        <Button
          onClick={() => copyToClipboard(imageUrl)}
          variant="secondary"
          className="w-full text-sm"
        >
          {isCopied ? 'Copied!' : 'Copy Link'}
        </Button>
      </div>
    </Card>
  );
};


export const YTThumbnailDownloader: React.FC = () => {
    const [url, setUrl] = useState('');
    const [videoId, setVideoId] = useState<string | null>(null);
    const [thumbnailStatus, setThumbnailStatus] = useState<Record<string, 'loading' | 'loaded' | 'error'>>({});

    const handleFetch = () => {
        const id = getYouTubeVideoId(url);
        setVideoId(id);
        if (!id) {
            setThumbnailStatus({});
        }
    };

    useEffect(() => {
        if (videoId) {
            const initialStatuses: Record<string, 'loading'> = {};
            THUMBNAIL_QUALITIES.forEach(q => initialStatuses[q.key] = 'loading');
            setThumbnailStatus(initialStatuses);

            THUMBNAIL_QUALITIES.forEach(quality => {
                const imageUrl = `https://img.youtube.com/vi/${videoId}/${quality.key}.jpg`;
                const img = new Image();
                img.onload = () => {
                    setThumbnailStatus(prev => ({ ...prev, [quality.key]: 'loaded' }));
                };
                img.onerror = () => {
                    setThumbnailStatus(prev => ({ ...prev, [quality.key]: 'error' }));
                };
                img.src = imageUrl;
            });
        }
    }, [videoId]);


    const handleDownload = async (imageUrl: string, filename: string) => {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error('Network response was not ok.');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed, opening in new tab as fallback:', error);
            // Fallback for browsers with strict CORS policies or if fetch fails
            window.open(imageUrl, '_blank');
        }
    };


    return (
        <ToolContainer>
            <ToolHeader
                title="YouTube Thumbnail Downloader"
                description="Enter a YouTube video URL to download its thumbnail in various resolutions."
            />
             <Card>
                <div className="flex flex-col md:flex-row gap-4">
                    <Input
                        type="text"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="flex-grow"
                    />
                    <Button onClick={handleFetch} disabled={!url.trim()}>
                        Fetch Thumbnails
                    </Button>
                </div>
            </Card>

            {videoId && (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {THUMBNAIL_QUALITIES.map(quality => {
                        const status = thumbnailStatus[quality.key];
                        
                        if (status === 'error') {
                            return null;
                        }

                        if (status === 'loading') {
                             return (
                                <Card key={quality.key} className="flex items-center justify-center min-h-[200px]">
                                    <Loader text={`Checking ${quality.name}...`} />
                                </Card>
                            );
                        }

                        if (status === 'loaded') {
                            const imageUrl = `https://img.youtube.com/vi/${videoId}/${quality.key}.jpg`;
                            const filename = `thumbnail-${videoId}-${quality.key}.jpg`;
                            return (
                                <ThumbnailCard
                                    key={quality.key}
                                    imageUrl={imageUrl}
                                    filename={filename}
                                    qualityName={quality.name}
                                    onDownload={handleDownload}
                                />
                            );
                        }
                        
                        return null;
                    })}
                </div>
            )}
        </ToolContainer>
    );
};