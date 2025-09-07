import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Input } from '../../common/Input';
import { Card } from '../../common/Card';

const explanations: Record<string, string> = {
    '.': 'Matches any character except newline.',
    '\\d': 'Matches any digit (0-9).',
    '\\D': 'Matches any non-digit.',
    '\\w': 'Matches any word character (alphanumeric & underscore).',
    '\\W': 'Matches any non-word character.',
    '\\s': 'Matches any whitespace character.',
    '\\S': 'Matches any non-whitespace character.',
    '\\b': 'Matches a word boundary.',
    '\\B': 'Matches a non-word boundary.',
    '^': 'Asserts position at the start of the string.',
    '$': 'Asserts position at the end of the string.',
    '|': 'Acts like a boolean OR. Matches the expression before or after it.',
    '*': 'Matches the preceding token 0 or more times.',
    '+': 'Matches the preceding token 1 or more times.',
    '?': 'Matches the preceding token 0 or 1 time. Also used for lazy matching.',
    '{n}': 'Matches the preceding token exactly n times.',
    '{n,}': 'Matches the preceding token n or more times.',
    '{n,m}': 'Matches the preceding token between n and m times.',
    '[]': 'Character set. Matches any single character within the brackets.',
    '[^]': 'Negated character set. Matches any single character not within the brackets.',
    '()': 'Capturing group. Groups multiple tokens together and creates a capture group.',
    '(?:)': 'Non-capturing group. Groups tokens but does not create a capture group.',
    '(?=)': 'Positive lookahead. Asserts that the following characters match, without consuming them.',
    '(?!)': 'Negative lookahead. Asserts that the following characters do not match.',
};

const explainRegex = (regex: string) => {
    // This is a simplified explainer and won't handle all complex cases perfectly.
    const parts = [];
    let currentPart = '';
    
    for (let i = 0; i < regex.length; i++) {
        const char = regex[i];
        let token = char;
        
        if (char === '\\' && i + 1 < regex.length) {
            token += regex[++i];
        }
        
        if (explanations[token]) {
            parts.push({ token, explanation: explanations[token] });
        } else if (explanations[token[0]]) {
            parts.push({ token: token[0], explanation: explanations[token[0]] });
            if (token.length > 1) {
                 parts.push({ token: token.substring(1), explanation: `Literal character(s) "${token.substring(1)}"` });
            }
        } else if (char === '[') {
            const end = regex.indexOf(']', i);
            if(end > -1) {
                const group = regex.substring(i, end + 1);
                const isNegated = group.startsWith('[^');
                parts.push({ token: group, explanation: isNegated ? 'Matches any single character NOT in the set.' : 'Matches any single character in the set.' });
                i = end;
            }
        } else if (char === '(') {
            const end = regex.indexOf(')', i);
             if(end > -1) {
                const group = regex.substring(i, end + 1);
                let explanation = 'Capturing group.';
                if (group.startsWith('(?:')) explanation = 'Non-capturing group.';
                if (group.startsWith('(?=')) explanation = 'Positive lookahead.';
                if (group.startsWith('(?!)')) explanation = 'Negative lookahead.';
                parts.push({ token: group, explanation });
                i = end;
            }
        }
        else {
             parts.push({ token: char, explanation: `Literal character "${char}"` });
        }
    }
    
    return parts;
};

export const RegexExplainer: React.FC = () => {
    const [regex, setRegex] = useState('\\b([A-Z0-9._%+-]+)@([A-Z0-9.-]+)\\.([A-Z]{2,})\\b');
    const [flags, setFlags] = useState('gi');

    const explainedParts = useMemo(() => {
        try {
            new RegExp(regex, flags);
            return explainRegex(regex);
        } catch {
            return [{ token: 'Invalid Regex', explanation: 'Please check your expression for errors.' }];
        }
    }, [regex, flags]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Regex Explainer"
                description="Break down a regular expression into a human-readable summary."
            />
            <Card>
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex flex-1">
                        <span className="flex items-center p-2 bg-slate-700 rounded-l-md text-slate-400">/</span>
                        <Input
                            value={regex}
                            onChange={e => setRegex(e.target.value)}
                            placeholder="Regular Expression"
                            className="font-mono rounded-none"
                        />
                        <span className="flex items-center p-2 bg-slate-700 rounded-r-md text-slate-400">/</span>
                    </div>
                    <Input
                        value={flags}
                        onChange={e => setFlags(e.target.value)}
                        placeholder="flags"
                        className="font-mono sm:w-20"
                    />
                </div>
            </Card>
            <Card>
                 <h3 className="text-lg font-semibold text-white mb-3">Explanation</h3>
                 <div className="space-y-2">
                     {explainedParts.map((part, index) => (
                         <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-2 bg-slate-800/50 rounded">
                            <code className="md:col-span-1 text-indigo-400 font-bold break-all">{part.token}</code>
                            <p className="md:col-span-3 text-slate-300">{part.explanation}</p>
                         </div>
                     ))}
                 </div>
            </Card>
        </ToolContainer>
    );
};
