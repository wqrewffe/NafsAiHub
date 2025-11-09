import React, { useState, useEffect } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';

interface KeyEventInfo {
    key: string;
    code: string;
    keyCode: number;
    which: number;
    metaKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    ctrlKey: boolean;
}

const InfoCard: React.FC<{ title: string; value: string | number | boolean, large?: boolean }> = ({ title, value, large }) => (
    <div className={`bg-slate-800 p-4 rounded-lg text-center ${large ? 'col-span-2' : ''}`}>
        <p className={`font-bold text-white ${large ? 'text-4xl' : 'text-3xl'}`}>{String(value)}</p>
        <p className="text-sm text-slate-400 mt-1">{title}</p>
    </div>
);

export const KeyboardEventFinder: React.FC = () => {
    const [eventInfo, setEventInfo] = useState<KeyEventInfo | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // e.preventDefault();
            setEventInfo({
                key: e.key,
                code: e.code,
                keyCode: e.keyCode,
                which: e.which,
                metaKey: e.metaKey,
                shiftKey: e.shiftKey,
                altKey: e.altKey,
                ctrlKey: e.ctrlKey,
            });
        };
        
        window.addEventListener('keydown', handleKeyDown);
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <ToolContainer>
            <ToolHeader
                title="Keyboard Event Finder"
                description="Press any key to see the JavaScript event details."
            />
            <Card className="flex items-center justify-center min-h-[150px] text-center border-2 border-dashed border-slate-700">
                {eventInfo ? (
                    <p className="text-6xl font-bold text-indigo-400">{eventInfo.key === ' ' ? 'Space' : eventInfo.key}</p>
                ) : (
                    <p className="text-2xl text-slate-500">Press any key to begin</p>
                )}
            </Card>

            {eventInfo && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <InfoCard title="event.key" value={eventInfo.key} large />
                    <InfoCard title="event.code" value={eventInfo.code} large />
                    <InfoCard title="event.keyCode" value={eventInfo.keyCode} />
                    <InfoCard title="event.which" value={eventInfo.which} />
                    <InfoCard title="shiftKey" value={eventInfo.shiftKey} />
                    <InfoCard title="altKey" value={eventInfo.altKey} />
                    <InfoCard title="ctrlKey" value={eventInfo.ctrlKey} />
                    <InfoCard title="metaKey" value={eventInfo.metaKey} />
                </div>
            )}
        </ToolContainer>
    );
};
