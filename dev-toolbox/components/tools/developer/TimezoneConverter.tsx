import React, { useState, useEffect, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Select } from '../../common/Select';

const timezones = (Intl as any).supportedValuesOf('timeZone');

export const TimezoneConverter: React.FC = () => {
    const [localTime, setLocalTime] = useState(new Date());
    const [fromTz, setFromTz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [toTz, setToTz] = useState('Europe/London');

    useEffect(() => {
        const timer = setInterval(() => setLocalTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fromTimeFormatted = useMemo(() => 
        new Intl.DateTimeFormat('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false,
            timeZone: fromTz,
            timeZoneName: 'short'
        }).format(localTime), 
    [localTime, fromTz]);

     const toTimeFormatted = useMemo(() => 
        new Intl.DateTimeFormat('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false,
            timeZone: toTz,
            timeZoneName: 'short'
        }).format(localTime), 
    [localTime, toTz]);


    return (
        <ToolContainer>
            <ToolHeader title="Timezone Converter" description="Convert dates and times between different timezones." />
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">From</h3>
                        <Select value={fromTz} onChange={e => setFromTz(e.target.value)}>
                            {timezones.map((tz: string) => <option key={tz}>{tz}</option>)}
                        </Select>
                        <p className="font-mono text-xl sm:text-2xl mt-4 text-white">{fromTimeFormatted}</p>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold text-white mb-2">To</h3>
                        <Select value={toTz} onChange={e => setToTz(e.target.value)}>
                            {timezones.map((tz: string) => <option key={tz}>{tz}</option>)}
                        </Select>
                         <p className="font-mono text-xl sm:text-2xl mt-4 text-indigo-300">{toTimeFormatted}</p>
                    </div>
                </div>
            </Card>
        </ToolContainer>
    );
};