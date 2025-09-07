// A simple client-side steganography implementation using LSB (Least Significant Bit).
// This is not cryptographically secure, but a fun demonstration of data hiding.

const DELIMITER = '$$END$$';
const BITS_PER_CHAR = 16; // Using 16 bits for broader character support (UTF-16)

const textToBinary = (text: string): string => {
    return text.split('').map(char => {
        return char.charCodeAt(0).toString(2).padStart(BITS_PER_CHAR, '0');
    }).join('');
};

const binaryToText = (binary: string): string => {
    let text = '';
    for (let i = 0; i < binary.length; i += BITS_PER_CHAR) {
        const chunk = binary.substr(i, BITS_PER_CHAR);
        text += String.fromCharCode(parseInt(chunk, 2));
    }
    return text;
};

// Hides a message in the canvas image data
export const encodeMessage = (ctx: CanvasRenderingContext2D, message: string): ImageData => {
    const { width, height } = ctx.canvas;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const binaryMessage = textToBinary(message + DELIMITER);

    if (binaryMessage.length > data.length / 4 * 3) {
        throw new Error("Message is too long to hide in this image.");
    }

    let dataIndex = 0;
    for (let i = 0; i < binaryMessage.length; i++) {
        // Find next available color channel (skip alpha channel)
        while ((dataIndex + 1) % 4 === 0) {
            dataIndex++;
        }
        
        // Modify the LSB of the color channel
        const bit = parseInt(binaryMessage[i], 10);
        if (bit === 1) {
            data[dataIndex] |= 1; // Set LSB to 1
        } else {
            data[dataIndex] &= ~1; // Set LSB to 0
        }
        dataIndex++;
    }
    return imageData;
};

// Reveals a message from the canvas image data
export const decodeMessage = (ctx: CanvasRenderingContext2D): string | null => {
    const { width, height } = ctx.canvas;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    let binaryMessage = '';
    let dataIndex = 0;
    
    while(dataIndex < data.length) {
         // Find next available color channel (skip alpha channel)
         while ((dataIndex + 1) % 4 === 0) {
            dataIndex++;
        }
        if (dataIndex >= data.length) break;

        const lsb = data[dataIndex] & 1;
        binaryMessage += lsb;

        // Check if we have formed the delimiter
        if (binaryMessage.length % BITS_PER_CHAR === 0) {
            const decodedText = binaryToText(binaryMessage);
            if (decodedText.endsWith(DELIMITER)) {
                return decodedText.substring(0, decodedText.length - DELIMITER.length);
            }
        }
        dataIndex++;
    }

    return null; // Delimiter not found
};
