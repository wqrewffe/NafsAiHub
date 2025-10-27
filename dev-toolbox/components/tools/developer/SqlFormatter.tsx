import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

// A simple regex-based SQL formatter
const formatSql = (sql: string): string => {
    let formatted = sql
        .replace(/\s+/g, ' ')
        .replace(/ ?\(/g, ' (')
        .replace(/ ?\)/g, ') ')
        .trim();

    const keywords = [
        'SELECT', 'FROM', 'WHERE', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN',
        'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'VALUES', 'SET', 'INSERT INTO', 'UPDATE'
    ];
    
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        formatted = formatted.replace(regex, `\n${keyword}`);
    });
    
    // Indent subqueries
    let indentLevel = 0;
    const lines = formatted.split('\n');
    return lines.map(line => {
        if (line.includes(')')) {
            indentLevel = Math.max(0, indentLevel - 1);
        }
        let indentedLine = '  '.repeat(indentLevel) + line.trim();
        if (line.includes('(')) {
            indentLevel++;
        }
        return indentedLine;
    }).join('\n').trim();
};

export const SqlFormatter: React.FC = () => {
    const [input, setInput] = useState('SELECT u.id, p.title FROM users u JOIN posts p ON u.id = p.user_id WHERE u.active = true ORDER BY p.created_at DESC LIMIT 10;');
    const [isCopied, copy] = useCopyToClipboard();

    const output = useMemo(() => formatSql(input), [input]);

    return (
        <ToolContainer>
            <ToolHeader title="SQL Formatter" description="Format your SQL queries to make them more readable." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea
                    placeholder="Paste your SQL query here..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                />
                <div className="relative">
                    <Textarea
                        placeholder="Formatted SQL..."
                        value={output}
                        readOnly
                        rows={12}
                        className="bg-slate-800/50 font-mono text-sm"
                    />
                    <Button onClick={() => copy(output)} className="absolute top-2 right-2 px-3 py-1 text-xs" variant="secondary">
                        {isCopied ? 'Copied!' : 'Copy'}
                    </Button>
                </div>
            </div>
        </ToolContainer>
    );
};