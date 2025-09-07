import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

const TWEET_LIMIT = 280;

const splitIntoTweets = (text: string): string[] => {
    if (!text.trim()) return [];

    const words = text.split(/\s+/);
    const tweets: string[] = [];
    let currentTweet = '';

    words.forEach(word => {
        if (currentTweet.length + word.length + 1 > TWEET_LIMIT - 10) { // leave room for " (x/y)"
            tweets.push(currentTweet.trim());
            currentTweet = '';
        }
        currentTweet += `${word} `;
    });
    
    if (currentTweet.trim()) {
        tweets.push(currentTweet.trim());
    }

    const total = tweets.length;
    return tweets.map((tweet, index) => {
        const counter = `(${index + 1}/${total})`;
        const availableSpace = TWEET_LIMIT - counter.length - 1;
        if (tweet.length > availableSpace) {
             // This can happen with very long words, truncate for safety
            return `${tweet.substring(0, availableSpace - 1)}… ${counter}`;
        }
        return `${tweet} ${counter}`;
    });
};

const Tweet: React.FC<{ text: string }> = ({ text }) => {
    const [isCopied, copy] = useCopyToClipboard();
    return (
        <div className="bg-slate-800/50 p-3 rounded-lg relative">
            <p className="text-slate-300 whitespace-pre-wrap break-words">{text}</p>
             <Button onClick={() => copy(text)} variant="ghost" className="absolute top-1 right-1 px-2 py-1 text-xs">
                {isCopied ? 'Copied' : 'Copy'}
            </Button>
        </div>
    );
};

export const TweetThreader: React.FC = () => {
    const [longText, setLongText] = useState('');
    
    const tweets = useMemo(() => splitIntoTweets(longText), [longText]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Tweet Thread Splitter"
                description="Automatically split long text into a numbered Twitter thread."
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Textarea
                    placeholder="Write or paste your long-form content here..."
                    value={longText}
                    onChange={e => setLongText(e.target.value)}
                    rows={20}
                />
                 <Card>
                    <h3 className="text-lg font-semibold text-white mb-3">Generated Tweets ({tweets.length})</h3>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {tweets.length > 0 ? (
                            tweets.map((tweet, index) => <Tweet key={index} text={tweet} />)
                        ) : (
                            <p className="text-slate-500">Your thread will appear here.</p>
                        )}
                    </div>
                </Card>
            </div>
        </ToolContainer>
    );
};
