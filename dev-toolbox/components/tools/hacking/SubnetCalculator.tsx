import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';

const ipToLong = (ip: string) => {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
};

const longToIp = (long: number) => {
    return [long >>> 24, (long >> 16) & 255, (long >> 8) & 255, long & 255].join('.');
};

const calculateSubnet = (ip: string, cidr: number) => {
    try {
        if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip) || cidr < 0 || cidr > 32) {
            throw new Error("Invalid input");
        }
        const ipLong = ipToLong(ip);
        const mask = (-1 << (32 - cidr)) >>> 0;
        const network = ipLong & mask;
        const broadcast = network | (~mask >>> 0);
        const firstHost = network + 1;
        const lastHost = broadcast - 1;
        const hosts = Math.pow(2, 32 - cidr) - 2;

        return {
            networkAddress: longToIp(network),
            broadcastAddress: longToIp(broadcast),
            netmask: longToIp(mask),
            wildcard: longToIp(~mask >>> 0),
            ipRange: `${longToIp(firstHost)} - ${longToIp(lastHost)}`,
            numHosts: hosts > 0 ? hosts : 0,
            error: null,
        };
    } catch (e) {
        return { error: 'Invalid IP address or CIDR.' };
    }
};

const ResultRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-slate-800 last:border-b-0">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono text-white">{value}</span>
    </div>
);

export const SubnetCalculator: React.FC = () => {
    const [ip, setIp] = useState('192.168.1.10');
    const [cidr, setCidr] = useState(24);

    const results = useMemo(() => calculateSubnet(ip, cidr), [ip, cidr]);

    return (
        <ToolContainer>
            <ToolHeader title="Subnet Calculator" description="Calculate network information from an IP address and CIDR mask." />
            <Card>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Input label="IP Address" value={ip} onChange={e => setIp(e.target.value)} />
                    <Input label="CIDR" type="number" value={cidr} onChange={e => setCidr(parseInt(e.target.value) || 0)} min="0" max="32" />
                </div>
            </Card>
            <Card>
                {results.error ? (
                    <p className="text-red-400 text-center">{results.error}</p>
                ) : (
                    <div className="space-y-2">
                        <ResultRow label="Network Address" value={results.networkAddress!} />
                        <ResultRow label="Broadcast Address" value={results.broadcastAddress!} />
                        <ResultRow label="Subnet Mask" value={results.netmask!} />
                        <ResultRow label="Wildcard Mask" value={results.wildcard!} />
                        <ResultRow label="Usable IP Range" value={results.ipRange!} />
                        <ResultRow label="Number of Hosts" value={results.numHosts!.toLocaleString()} />
                    </div>
                )}
            </Card>
        </ToolContainer>
    );
};
