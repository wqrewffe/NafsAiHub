import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Card } from '../../common/Card';

export const HashtagCounter: React.FC = () => {
    const [text, setText] = useState('#dev #tools #frontend #react #css');

    const hashtagCount = useMemo(() => {
        const matches = text.match(/#[\w-]+/g);
        return matches ? matches.length : 0;
    }, [text]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Hashtag Counter"
                description="Count the number of hashtags in a piece of text."
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Textarea
                    placeholder="Paste text with hashtags here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={10}
                    className="md:col-span-2"
                />
                <Card className="flex flex-col items-center justify-center text-center">
                    <p className="text-6xl font-extrabold text-white">{hashtagCount}</p>
                    <p className="text-slate-400 mt-2">Hashtag(s)</p>
                </Card>
            </div>
        </ToolContainer>
    );
};
