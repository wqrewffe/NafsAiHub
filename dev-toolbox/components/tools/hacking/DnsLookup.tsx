import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { Loader } from '../../common/Loader';
import { dnsLookup } from '../../../services/reconService';
import { Select } from '../../common/Select';

const RECORD_TYPES = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'SOA'];

interface DnsResult {
  [key: string]: any;
  error?: string;
}

export const DnsLookup: React.FC = () => {
  const [domain, setDomain] = useState('google.com');
  const [type, setType] = useState('A');
  const [result, setResult] = useState<DnsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLookup = async () => {
    if (!domain.trim()) return;
    setIsLoading(true);
    setResult(null);

    try {
      const data = await dnsLookup(domain.trim(), type);
      setResult(data);
    } catch (err: any) {
      setResult({ error: err.message || 'Something went wrong while fetching DNS records.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ToolContainer>
      <ToolHeader title="DNS Lookup" description="Query DNS records for a domain." />
      <Card>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="example.com"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLookup()}
          />
          <Select value={type} onChange={e => setType(e.target.value)}>
            {RECORD_TYPES.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Button onClick={handleLookup} disabled={isLoading || !domain}>
            {isLoading ? 'Querying...' : 'Query'}
          </Button>
        </div>
      </Card>

      {(isLoading || result) && (
        <Card>
          {isLoading ? (
            <Loader />
          ) : result?.error ? (
            <p className="text-red-400">{result.error}</p>
          ) : (
            <pre className="font-mono text-sm whitespace-pre-wrap break-all max-h-96 overflow-y-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </Card>
      )}
    </ToolContainer>
  );
};
