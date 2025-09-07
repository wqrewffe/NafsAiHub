import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { Loader } from '../../common/Loader';
import { whoisLookup } from '../../../services/reconService';

interface WhoisResult {
  raw?: string;
  parsed?: Record<string, any>;
  error?: string;
}

export const WhoisLookup: React.FC = () => {
  const [domain, setDomain] = useState('google.com');
  const [result, setResult] = useState<WhoisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLookup = async () => {
    if (!domain.trim()) return;
    setIsLoading(true);
    setResult(null);

    try {
      const data = await whoisLookup(domain.trim());

      // Detect if data is JSON (parsed WHOIS) or just raw text
      if (typeof data === 'string') {
        setResult({ raw: data });
      } else {
        setResult({ parsed: data });
      }
    } catch (err: any) {
      setResult({ error: err.message || 'Failed to fetch WHOIS info.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const textToCopy = result.raw || JSON.stringify(result.parsed, null, 2) || '';
    navigator.clipboard.writeText(textToCopy).catch(() => alert('Failed to copy'));
  };

  return (
    <ToolContainer>
      <ToolHeader
        title="WHOIS Lookup"
        description="Perform a WHOIS lookup to find registration and ownership information for a domain."
      />

      {/* Input Section */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="example.com"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLookup()}
          />
          <Button onClick={handleLookup} disabled={isLoading || !domain.trim()}>
            {isLoading ? 'Looking up...' : 'Lookup'}
          </Button>
        </div>
      </Card>

      {/* Results Section */}
      {(isLoading || result) && (
        <Card>
          {isLoading ? (
            <Loader />
          ) : result?.error ? (
            <p className="text-red-400">{result.error}</p>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex justify-end">
                <Button onClick={handleCopy}>Copy</Button>
              </div>
              <pre className="font-mono text-sm whitespace-pre-wrap break-all max-h-96 overflow-y-auto">
                {result?.parsed
                  ? JSON.stringify(result.parsed, null, 2)
                  : result?.raw}
              </pre>
            </div>
          )}
        </Card>
      )}
    </ToolContainer>
  );
};
