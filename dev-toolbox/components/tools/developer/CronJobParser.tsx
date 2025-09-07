import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Input } from '../../common/Input';
import { Card } from '../../common/Card';

const parseCronPart = (part: string, unit: string, values: string[] | null = null): string => {
    if (part === '*') return '';
    if (part.includes(',')) {
        return `at ${unit} ${part.split(',').map(v => values ? values[parseInt(v)] : v).join(', ')}`;
    }
    if (part.includes('-')) {
        const [start, end] = part.split('-');
        return `from ${unit} ${values ? values[parseInt(start)] : start} through ${values ? values[parseInt(end)] : end}`;
    }
    if (part.includes('*/')) {
        const step = part.split('/')[1];
        return `every ${step} ${unit.slice(0, -1)}(s)`;
    }
    return `at ${unit} ${values ? values[parseInt(part)] : part}`;
};

const parseCron = (cronString: string): string => {
    const parts = cronString.trim().split(/\s+/);
    if (parts.length !== 5) return 'Invalid CRON string. It must have 5 parts.';

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    try {
        const timeDesc = `At ${parseCronPart(minute, 'minute') || 'every minute'}${hour !== '*' ? ' past hour ' + hour : ''}.`;
        
        let dateDesc = '';
        if (dayOfMonth !== '*' && dayOfWeek !== '*') {
            dateDesc = `On day-of-month ${dayOfMonth} and on ${days[parseInt(dayOfWeek)]}`;
        } else if (dayOfMonth !== '*') {
            dateDesc = `On day-of-month ${dayOfMonth}`;
        } else if (dayOfWeek !== '*') {
            dateDesc = `On ${parseCronPart(dayOfWeek, 'day-of-week', days)}`;
        }

        const monthDesc = month !== '*' ? `in ${parseCronPart(month, 'month', months)}` : '';

        return `Runs: ${timeDesc} ${[dateDesc, monthDesc].filter(Boolean).join(' ')}.`.replace(/\s+/g, ' ');

    } catch (e) {
        return "Couldn't parse the CRON string. Check for invalid characters or format.";
    }
};

export const CronJobParser: React.FC = () => {
    const [cronString, setCronString] = useState('* * * * *');
    
    const explanation = useMemo(() => parseCron(cronString), [cronString]);

    return (
        <ToolContainer>
            <ToolHeader
                title="CRON Job Parser"
                description="Translate CRON schedule expressions into human-readable text."
            />
            <Card>
                <label className="block text-sm font-medium text-slate-300 mb-2">CRON String</label>
                <Input
                    value={cronString}
                    onChange={(e) => setCronString(e.target.value)}
                    placeholder="* * * * *"
                    className="font-mono text-lg"
                />
            </Card>

            <Card>
                <h3 className="text-lg font-semibold text-white mb-2">Explanation</h3>
                <div className="p-4 bg-slate-900 rounded-md min-h-[5rem] flex items-center">
                    <p className="text-lg text-indigo-300">{explanation}</p>
                </div>
            </Card>
        </ToolContainer>
    );
};