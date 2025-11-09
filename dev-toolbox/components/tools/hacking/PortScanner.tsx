import React, { useState } from "react";
import { ToolContainer } from "../../common/ToolContainer";
import { ToolHeader } from "../../common/ToolHeader";
import { Card } from "../../common/Card";
import { Input } from "../../common/Input";
import { Button } from "../../common/Button";

/**
 * Simple local Progress component to avoid missing module import.
 * Renders a horizontal bar and percentage text; accepts optional className.
 */
type ProgressProps = {
  value?: number;
  className?: string;
};
const Progress: React.FC<ProgressProps> = ({ value = 0, className = "" }) => {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={className}>
      <div className="w-full bg-slate-700 rounded h-2 overflow-hidden">
        <div
          className="bg-blue-500 h-2"
          style={{ width: `${pct}%`, transition: "width 200ms ease" }}
        />
      </div>
      <div className="text-sm text-slate-400 mt-1">{pct}%</div>
    </div>
  );
};

type PortStatus = "Scanning..." | "Open" | "Closed" | "Filtered";
interface ScanResult {
  port: number;
  status: PortStatus;
  banner?: string;
}

const DEFAULT_PORTS = [80, 443, 21, 22, 25, 53, 110, 143, 3306, 5432, 6379, 8080, 8443];

const scanPort = async (host: string, port: number, timeout = 2000): Promise<ScanResult> => {
  return new Promise(resolve => {
    const url = `https://${host}:${port}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      resolve({ port, status: "Filtered" });
    }, timeout);

    fetch(url, { mode: "no-cors", signal: controller.signal })
      .then(() => {
        clearTimeout(timeoutId);
        resolve({ port, status: "Open" });
      })
      .catch(() => {
        clearTimeout(timeoutId);
        resolve({ port, status: "Closed" });
      });
  });
};

// Limit concurrency
const promisePool = async <T,>(items: T[], fn: (item: T) => Promise<any>, limit = 50) => {
  const results: any[] = [];
  const executing: Promise<any>[] = [];
  for (const item of items) {
    const p = fn(item).then(res => {
      results.push(res);
      executing.splice(executing.indexOf(p), 1);
    });
    executing.push(p);
    if (executing.length >= limit) await Promise.race(executing);
  }
  await Promise.all(executing);
  return results;
};

const PortResultRow: React.FC<ScanResult> = ({ port, status, banner }) => {
  const color =
    status === "Open" ? "text-green-400" : status === "Closed" ? "text-red-400" : "text-yellow-400";
  return (
    <div className="flex justify-between py-2 border-b border-slate-800 last:border-b-0">
      <span className="font-mono text-white">{port}</span>
      <span className={`font-bold ${color}`}>{status}</span>
      {banner && <span className="text-slate-400 ml-2">{banner}</span>}
    </div>
  );
};

export const PortScanner: React.FC = () => {
  const [host, setHost] = useState("scanme.nmap.org");
  const [range, setRange] = useState("1-1024");
  const [results, setResults] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleScan = async () => {
    if (!host) return;
    setIsScanning(true);
    setResults([]);
    setProgress(0);

    let ports: number[] = [];
    if (range.includes("-")) {
      const [start, end] = range.split("-").map(Number);
      ports = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    } else {
      ports = DEFAULT_PORTS;
    }

    let count = 0;
    const scanned = await promisePool(
      ports,
      async (p) => {
        const r = await scanPort(host, p);
        count++;
        setProgress(Math.round((count / ports.length) * 100));
        setResults(prev => [...prev, r]);
        return r;
      },
      100 // concurrency
    );

    setResults(scanned.sort((a, b) => a.port - b.port));
    setIsScanning(false);
  };

  return (
    <ToolContainer>
  <ToolHeader title="⚡ Advanced Port Scanner" description="Scan multiple ports concurrently with progress tracking." />
      <Card className="border-l-4 border-blue-500 bg-blue-500/10">
        <h4 className="font-bold text-blue-300">Disclaimer</h4>
        <p className="text-blue-400 text-sm mt-1">
          This is a browser-based scanner. It may give false positives/negatives due to CORS, firewalls, or browser restrictions.
          For reliable scans, use tools like <code>nmap</code>.
        </p>
      </Card>
      <Card>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input placeholder="Target host" value={host} onChange={e => setHost(e.target.value)} />
          <Input placeholder="1-1024 or leave blank for common ports" value={range} onChange={e => setRange(e.target.value)} />
          <Button onClick={handleScan} disabled={isScanning || !host}>
            {isScanning ? "Scanning..." : "Start Scan"}
          </Button>
        </div>
        {isScanning && <Progress value={progress} className="mt-3" />}
      </Card>
      {results.length > 0 && (
        <Card>
          {results.map(r => <PortResultRow key={r.port} {...r} />)}
        </Card>
      )}
    </ToolContainer>
  );
};
