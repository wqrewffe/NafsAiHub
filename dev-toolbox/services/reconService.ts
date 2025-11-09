// A service for performing various reconnaissance tasks.
// Uses a CORS proxy for client-side API requests.

const CORS_PROXY_URL = 'https://api.allorigins.win/raw?url=';

// --- WHOIS Lookup ---
export const whoisLookup = async (domain: string): Promise<string> => {
    try {
        const apiUrl = `https://api.hackertarget.com/whois/?q=${domain}`;
        const response = await fetch(`${CORS_PROXY_URL}${encodeURIComponent(apiUrl)}`);
        if (!response.ok) throw new Error('Network response was not ok.');
        const text = await response.text();
        if (text.includes("error check your api input")) {
            throw new Error("Invalid domain or API error.");
        }
        return text;
    } catch (error) {
        return `Error performing WHOIS lookup: ${error instanceof Error ? error.message : String(error)}`;
    }
};

// --- DNS Lookup ---
export const dnsLookup = async (domain: string, type: string): Promise<any> => {
    try {
        const response = await fetch(`https://dns.google/resolve?name=${domain}&type=${type}`);
        if (!response.ok) throw new Error(`DNS query failed with status ${response.status}`);
        return await response.json();
    } catch (error) {
        return { error: `Error performing DNS lookup: ${error instanceof Error ? error.message : String(error)}` };
    }
};

// --- Reverse IP Lookup ---
export const reverseIpLookup = async (ip: string): Promise<string> => {
     try {
        const apiUrl = `https://api.hackertarget.com/reverseiplookup/?q=${ip}`;
        const response = await fetch(`${CORS_PROXY_URL}${encodeURIComponent(apiUrl)}`);
        if (!response.ok) throw new Error('Network response was not ok.');
        const text = await response.text();
        if (text.includes("error check your api input")) {
            throw new Error("Invalid IP address or API error.");
        }
        return text;
    } catch (error) {
        return `Error performing Reverse IP lookup: ${error instanceof Error ? error.message : String(error)}`;
    }
};

// --- Security Header Scanner ---
const SECURITY_HEADERS = [
    'Strict-Transport-Security',
    'Content-Security-Policy',
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Referrer-Policy',
    'Permissions-Policy'
];

export const scanSecurityHeaders = async (url: string): Promise<{ [key: string]: { present: boolean; value?: string } }> => {
    const results: { [key: string]: { present: boolean; value?: string } } = {};
    try {
        const response = await fetch(`${CORS_PROXY_URL}${encodeURIComponent(url)}`);
        
        SECURITY_HEADERS.forEach(header => {
            const headerKey = header.toLowerCase();
            if (response.headers.has(headerKey)) {
                results[header] = { present: true, value: response.headers.get(headerKey) || '' };
            } else {
                results[header] = { present: false };
            }
        });
        return results;
    } catch (error) {
        SECURITY_HEADERS.forEach(header => {
            results[header] = { present: false, value: `Error: ${error instanceof Error ? error.message : 'Fetch failed'}` };
        });
        return results;
    }
};


// --- CVE Search ---
export const searchCve = async (cveId: string): Promise<any> => {
     try {
        const response = await fetch(`https://cve.circl.lu/api/cve/${cveId}`);
        if (!response.ok) {
            if (response.status === 404) return { error: `CVE ID "${cveId}" not found.` };
            throw new Error(`API request failed with status ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        return { error: `Error searching CVE: ${error instanceof Error ? error.message : String(error)}` };
    }
}
