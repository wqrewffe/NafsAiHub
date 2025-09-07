// A service to convert an HTML DOM node to a canvas.
// This is necessary for the "Download as PNG" feature in advanced components.

const XMLNS = 'http://www.w3.org/2000/svg';
const FO_XMLNS = 'http://www.w3.org/1999/xhtml';

const getStyles = (node: HTMLElement, pseudoElt: string | null = null): CSSStyleDeclaration => {
    return window.getComputedStyle(node, pseudoElt);
};

// Recursively inline all computed styles into the element's style attribute.
const inlineStyles = (node: HTMLElement, defaultBgColor: string): void => {
    const style = getStyles(node);
    let styleStr = '';
    for (let i = 0; i < style.length; i++) {
        const prop = style[i];
        styleStr += `${prop}: ${style.getPropertyValue(prop)}; `;
    }

    // Explicitly set background color if transparent to avoid issues
    if (style.backgroundColor === 'rgba(0, 0, 0, 0)' || style.backgroundColor === 'transparent') {
        styleStr += `background-color: ${defaultBgColor};`;
    }

    node.setAttribute('style', styleStr);

    // Recurse for children
    for (let i = 0; i < node.children.length; i++) {
        inlineStyles(node.children[i] as HTMLElement, defaultBgColor);
    }

    // Handle images separately to prevent CORS issues if possible
    if (node.tagName === 'IMG') {
        const img = node as HTMLImageElement;
        // This is a simplistic approach; a real implementation might need a CORS proxy
        // for cross-origin images. For same-origin images (like uploaded blobs), this is fine.
    }
};

export const renderToCanvas = (node: HTMLElement, defaultBgColor: string): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
        const { width, height } = node.getBoundingClientRect();

        // 1. Clone the node to avoid modifying the original DOM
        const clonedNode = node.cloneNode(true) as HTMLElement;

        // 2. Recursively inline all styles
        inlineStyles(clonedNode, defaultBgColor);
        
        // 3. Create an SVG with a foreignObject to embed the HTML
        const foreignObject = document.createElementNS(XMLNS, 'foreignObject');
        foreignObject.setAttribute('width', `${width}`);
        foreignObject.setAttribute('height', `${height}`);
        foreignObject.setAttribute('x', '0');
        foreignObject.setAttribute('y', '0');
        
        // The HTML needs a proper structure inside the foreignObject
        const body = document.createElementNS(FO_XMLNS, 'body');
        body.setAttribute('style', 'margin: 0; padding: 0;');
        body.appendChild(clonedNode);
        foreignObject.appendChild(body);

        const svg = document.createElementNS(XMLNS, 'svg');
        svg.setAttribute('xmlns', XMLNS);
        svg.setAttribute('width', `${width}`);
        svg.setAttribute('height', `${height}`);
        svg.appendChild(foreignObject);
        
        // 4. Serialize the SVG to a string and create a data URL
        const svgString = new XMLSerializer().serializeToString(svg);
        const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

        // 5. Draw the SVG data URL onto a canvas
        const img = new Image();
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            ctx?.drawImage(img, 0, 0);
            resolve(canvas);
        };
        img.onerror = (e) => {
            console.error("Image loading failed:", e);
            console.error("SVG Data URL:", dataUrl); // For debugging
            reject(new Error('Failed to load SVG into image for canvas rendering. This may be due to CORS restrictions on images within the component.'));
        }
        img.src = dataUrl;
    });
};
