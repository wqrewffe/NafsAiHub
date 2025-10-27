import React, { useState, useEffect } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';

export const UnixTimestampConverter: React.FC = () => {
    const [timestamp, setTimestamp] = useState(Math.floor(Date.now() / 1000));
    const [humanDate, setHumanDate] = useState(new Date().toISOString());

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Math.floor(Date.now() / 1000);
            setTimestamp(now);
            setHumanDate(new Date(now * 1000).toISOString());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleTimestampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTimestamp = parseInt(e.target.value, 10);
        if (!isNaN(newTimestamp)) {
            setTimestamp(newTimestamp);
            setHumanDate(new Date(newTimestamp * 1000).toISOString());
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        setHumanDate(newDate);
        const newTimestamp = Math.floor(new Date(newDate).getTime() / 1000);
        if (!isNaN(newTimestamp)) {
            setTimestamp(newTimestamp);
        }
    };

    const setToNow = () => {
        const now = Math.floor(Date.now() / 1000);
        setTimestamp(now);
        setHumanDate(new Date(now * 1000).toISOString());
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="Unix Timestamp Converter"
                description="Convert between Unix timestamps and human-readable dates."
            />
            <div className="text-center mb-4">
                 <Button onClick={setToNow}>Set to Current Time</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Unix Timestamp (seconds)</label>
                    <Input
                        type="number"
                        value={timestamp}
                        onChange={handleTimestampChange}
                        className="font-mono text-lg"
                    />
                </Card>
                <Card>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Human Readable Date (UTC)</label>
                    <Input
                        type="datetime-local"
                        value={humanDate.substring(0, 16)}
                        onChange={handleDateChange}
                        className="font-mono text-lg"
                    />
                    <p className="text-slate-400 text-sm mt-2">UTC: {new Date(timestamp * 1000).toUTCString()}</p>
                </Card>
            </div>
        </ToolContainer>
    );
};
