// services/captureService.ts

// A proxy is needed to bypass CORS restrictions for client-side fetching.
// Using allorigins.win as it's generally more reliable.
const CORS_PROXY_URL = 'https://api.allorigins.win/raw?url=';

export interface CaptureRequest {
  url: string;
  extract: {
    dom: boolean;
    links: boolean;
    accessibility: boolean; // Note: Real accessibility report is not feasible client-side
    seo: boolean;
  };
}

export interface DataArtifacts {
    dom?: string;
    links?: string[];
    accessibilityReport?: object;
    seoMetadata?: object;
}

export interface CaptureResponse {
  status: 'success' | 'error';
  message?: string;
  mainArtifactUrl: string;
  dataArtifacts: DataArtifacts;
  capturedUrl: string;
}

export interface UrlMetadata {
    title: string;
    description: string;
    imageUrl: string;
    url: string;
}

export interface HttpStatusResult {
    status: number;
    statusText: string;
    url: string;
}

export interface InspectionResult {
    status: number;
    statusText: string;
    url: string;
    headers: Record<string, string>;
    body: string;
    size: number;
    duration: number;
}

const parseHtml = (htmlString: string, baseUrl: string): { seo: object, links: string[] } => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    // Extract SEO metadata
    const title = doc.querySelector('title')?.innerText || '';
    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const keywords = doc.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';
    const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
    const ogDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
    const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';

    const seo = { title, description, keywords, ogTitle, ogDescription, ogImage };

    // Extract all links
    const links: string[] = [];
    doc.querySelectorAll('a').forEach(anchor => {
        const href = anchor.getAttribute('href');
        if (href) {
            try {
                // Resolve relative URLs to absolute URLs
                const absoluteUrl = new URL(href, baseUrl).href;
                links.push(absoluteUrl);
            } catch (e) {
                // Ignore invalid URLs
            }
        }
    });

    return { seo, links: [...new Set(links)] }; // Return unique links
};

export const performCapture = async (request: CaptureRequest): Promise<CaptureResponse> => {
    try {
        const proxiedUrl = `${CORS_PROXY_URL}${encodeURIComponent(request.url)}`;
        const response = await fetch(proxiedUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
        }
        
        const html = await response.text();
        const dataArtifacts: DataArtifacts = {};
        
        const { seo, links } = parseHtml(html, request.url);

        if (request.extract.dom) {
            dataArtifacts.dom = html;
        }
        if (request.extract.seo) {
            dataArtifacts.seoMetadata = seo;
        }
        if (request.extract.links) {
            dataArtifacts.links = links;
        }
        // Mock accessibility report as it's not feasible to run client-side
        if (request.extract.accessibility) {
            dataArtifacts.accessibilityReport = { 
                info: "Client-side accessibility reporting is not available.",
                passes: "N/A",
                violations: "N/A"
            };
        }

        // Use the wordpress service for the main screenshot artifact, with higher resolution
        const screenshotUrl = `https://s.wordpress.com/mshots/v1/${encodeURIComponent(request.url)}?w=1920&h=1080`;

        return {
            status: 'success',
            mainArtifactUrl: screenshotUrl,
            dataArtifacts,
            capturedUrl: request.url,
        };

    } catch (error) {
        let message = 'An unknown error occurred.';
        if (error instanceof Error) {
            message = error.message;
        }
        console.error("Capture failed:", message);
        return {
            status: 'error',
            message: `Capture failed: ${message}. This could be a network issue, an ad-blocker preventing the request, or the proxy service being temporarily down. Please check your connection and try again.`,
            mainArtifactUrl: '',
            dataArtifacts: {},
            capturedUrl: request.url,
        };
    }
};

export const fetchUrlMetadata = async (url: string): Promise<UrlMetadata> => {
    try {
        const proxiedUrl = `${CORS_PROXY_URL}${encodeURIComponent(url)}`;
        const response = await fetch(proxiedUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
        }
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const getMetaContent = (prop: string, name?: string) => {
            const propSelector = `meta[property="${prop}"]`;
            const nameSelector = name ? `meta[name="${name}"]` : null;
            
            let element = doc.querySelector(propSelector);
            if (!element && nameSelector) {
                element = doc.querySelector(nameSelector);
            }
            return element?.getAttribute('content') || '';
        };

        const title = getMetaContent('og:title', 'twitter:title') || doc.querySelector('title')?.innerText || '';
        const description = getMetaContent('og:description', 'twitter:description') || getMetaContent('', 'description');
        let imageUrl = getMetaContent('og:image', 'twitter:image');

        if (imageUrl && !imageUrl.startsWith('http')) {
            try {
                imageUrl = new URL(imageUrl, url).href;
            } catch (e) {
                console.warn(`Could not resolve relative image URL: ${imageUrl}`);
            }
        }
        
        return {
            title,
            description,
            imageUrl,
            url,
        };
    } catch (error) {
        let message = 'An unknown error occurred.';
        if (error instanceof Error) {
            message = error.message;
        }
        console.error("Metadata fetch failed:", message);
        throw new Error(`Metadata fetch failed: ${message}. This may be a network issue or the target site blocking scrapers.`);
    }
};

export const inspectUrl = async (
    url: string,
    method: string,
    headers: Record<string, string>,
    body: string | null
): Promise<InspectionResult> => {
    try {
        const proxiedUrl = `${CORS_PROXY_URL}${encodeURIComponent(url)}`;
        const startTime = Date.now();
        const response = await fetch(proxiedUrl, {
            method: method,
            headers: headers,
            body: (method === 'POST' || method === 'PUT') ? body : null,
        });
        const endTime = Date.now();

        const responseBody = await response.text();
        
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });

        return {
            status: response.status,
            statusText: response.statusText,
            url: response.url.replace(CORS_PROXY_URL, ''),
            headers: responseHeaders,
            body: responseBody,
            size: new Blob([responseBody]).size,
            duration: endTime - startTime,
        };
    } catch (error) {
        let message = 'Network Error';
        if (error instanceof Error) {
            message = error.message;
        }
        console.error("HTTP inspection failed:", message);
        throw new Error(message);
    }
};