
import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Card } from '../../common/Card';

// Simple implementation of Longest Common Subsequence (LCS) algorithm for line-based diff
const diffLines = (textA: string, textB: string) => {
    const linesA = textA.split('\n');
    const linesB = textB.split('\n');
    const m = linesA.length;
    const n = linesB.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (linesA[i - 1] === linesB[j - 1]) {
                dp[i][j] = 1 + dp[i - 1][j - 1];
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    let i = m, j = n;
    const result: { line: string; type: 'common' | 'added' | 'removed' }[] = [];
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
            result.unshift({ line: linesA[i - 1], type: 'common' });
            i--; j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            result.unshift({ line: linesB[j - 1], type: 'added' });
            j--;
        } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
            result.unshift({ line: linesA[i - 1], type: 'removed' });
            i--;
        }
    }
    return result;
};


export const DiffChecker: React.FC = () => {
    const [textA, setTextA] = useState('This is the original text.\nIt has a few lines.\nThis line is the same.\nThis line will be removed.');
    const [textB, setTextB] = useState('This is the new text.\nIt has a few lines.\nThis line is the same.\nThis line has been added.');
    
    const diffResult = useMemo(() => diffLines(textA, textB), [textA, textB]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Text Diff Checker"
                description="Compare two blocks of text and highlight the differences."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea
                    placeholder="Text A"
                    value={textA}
                    onChange={(e) => setTextA(e.target.value)}
                    rows={12}
                    className="font-mono"
                />
                <Textarea
                    placeholder="Text B"
                    value={textB}
                    onChange={(e) => setTextB(e.target.value)}
                    rows={12}
                    className="font-mono"
                />
            </div>
            <Card>
                <h3 className="text-lg font-semibold text-white mb-3">Differences</h3>
                <div className="bg-slate-900 rounded-md p-4 font-mono text-sm whitespace-pre-wrap">
                    {diffResult.map((item, index) => {
                        const classes = {
                            common: 'text-slate-400',
                            added: 'bg-green-500/20 text-green-300',
                            removed: 'bg-red-500/20 text-red-300 line-through'
                        };
                        const prefix = {
                            common: '  ',
                            added: '+ ',
                            removed: '- '
                        };
                        return (
                            <div key={index} className={classes[item.type]}>
                                <span>{prefix[item.type]}</span>
                                <span>{item.line || ' '}</span>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </ToolContainer>
    );
};
