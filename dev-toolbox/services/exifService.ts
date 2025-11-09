// A client-side EXIF data parser.
// This is a simplified implementation based on the EXIF and TIFF specifications.

const EXIF_TAGS: Record<number, string> = {
    // Image data structure
    0x0100: 'ImageWidth',
    0x0101: 'ImageHeight',
    0x0102: 'BitsPerSample',
    0x0103: 'Compression',
    0x0106: 'PhotometricInterpretation',
    0x0112: 'Orientation',
    0x0115: 'SamplesPerPixel',
    0x011C: 'PlanarConfiguration',
    0x0212: 'YCbCrSubSampling',
    0x0213: 'YCbCrPositioning',
    0x011A: 'XResolution',
    0x011B: 'YResolution',
    0x0128: 'ResolutionUnit',
    // Image data characteristics
    0x010E: 'ImageDescription',
    0x010F: 'Make',
    0x0110: 'Model',
    0x0131: 'Software',
    0x0132: 'DateTime',
    0x013B: 'Artist',
    0x8298: 'Copyright',
    // EXIF specific
    0x8769: 'ExifIFDPointer',
    0x8825: 'GPSInfoIFDPointer',
    0xA005: 'InteroperabilityIFDPointer',
    0x829A: 'ExposureTime',
    0x829D: 'FNumber',
    0x8822: 'ExposureProgram',
    0x8827: 'ISOSpeedRatings',
    0x920A: 'FocalLength',
    0x9003: 'DateTimeOriginal',
    0x9004: 'DateTimeDigitized',
    0xA420: 'ImageUniqueID',
};

const GPS_TAGS: Record<number, string> = {
    0x0000: "GPSVersionID",
    0x0001: "GPSLatitudeRef",
    0x0002: "GPSLatitude",
    0x0003: "GPSLongitudeRef",
    0x0004: "GPSLongitude",
    0x0005: "GPSAltitudeRef",
    0x0006: "GPSAltitude",
    0x0007: "GPSTimeStamp",
    0x001D: "GPSDateStamp",
};


function readData(view: DataView, offset: number, length: number, isLittleEndian: boolean, format: number) {
    if (format === 3) { // 16-bit unsigned
        return view.getUint16(offset, isLittleEndian);
    }
    if (format === 4) { // 32-bit unsigned
        return view.getUint32(offset, isLittleEndian);
    }
    if (format === 5) { // Unsigned rational
        const numerator = view.getUint32(offset, isLittleEndian);
        const denominator = view.getUint32(offset + 4, isLittleEndian);
        return numerator / denominator;
    }
     if (format === 2) { // ASCII string
        let str = '';
        for (let i = 0; i < length; i++) {
            const charCode = view.getUint8(offset + i);
            if (charCode === 0) break;
            str += String.fromCharCode(charCode);
        }
        return str;
    }
    return null;
}

function parseIFD(view: DataView, offset: number, tiffHeaderOffset: number, isLittleEndian: boolean, tagsDict: Record<number, string>) {
    const numEntries = view.getUint16(offset, isLittleEndian);
    const tags: Record<string, any> = {};
    const entrySize = 12;

    for (let i = 0; i < numEntries; i++) {
        const entryOffset = offset + 2 + (i * entrySize);
        const tagId = view.getUint16(entryOffset, isLittleEndian);
        const format = view.getUint16(entryOffset + 2, isLittleEndian);
        const components = view.getUint32(entryOffset + 4, isLittleEndian);
        const dataValue = view.getUint32(entryOffset + 8, isLittleEndian);
        
        const tagName = tagsDict[tagId];
        if (!tagName) continue;

        const componentSize = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8][format] || 0;
        const totalSize = components * componentSize;
        let dataOffset = totalSize > 4 ? tiffHeaderOffset + dataValue : entryOffset + 8;
        
        tags[tagName] = readData(view, dataOffset, components, isLittleEndian, format);
    }
    
    return tags;
}

export const parseExif = (arrayBuffer: ArrayBuffer): Record<string, any> => {
    const view = new DataView(arrayBuffer);
    if (view.getUint16(0, false) !== 0xFFD8) {
        throw new Error("Not a valid JPEG file.");
    }

    let offset = 2;
    while (offset < view.byteLength) {
        const marker = view.getUint16(offset, false);
        offset += 2;

        if (marker === 0xFFE1) { // APP1 marker for EXIF
            const length = view.getUint16(offset, false);
            const exifHeader = view.getUint32(offset + 2, false);
            if (exifHeader !== 0x45786966) { // "Exif"
                offset += length;
                continue;
            }
            
            const tiffHeaderOffset = offset + 8;
            const endianMarker = view.getUint16(tiffHeaderOffset, false);
            const isLittleEndian = endianMarker === 0x4949; // "II" for Intel (little-endian)

            const ifd0Offset = view.getUint32(tiffHeaderOffset + 4, isLittleEndian);
            const ifd0 = parseIFD(view, tiffHeaderOffset + ifd0Offset, tiffHeaderOffset, isLittleEndian, EXIF_TAGS);
            
            let allTags = {...ifd0};

            if (ifd0.ExifIFDPointer) {
                const exifIfd = parseIFD(view, tiffHeaderOffset + ifd0.ExifIFDPointer, tiffHeaderOffset, isLittleEndian, EXIF_TAGS);
                allTags = {...allTags, ...exifIfd};
            }
            if (ifd0.GPSInfoIFDPointer) {
                const gpsIfd = parseIFD(view, tiffHeaderOffset + ifd0.GPSInfoIFDPointer, tiffHeaderOffset, isLittleEndian, GPS_TAGS);
                allTags = {...allTags, ...gpsIfd};
            }
            
            // Clean up pointer tags
            delete allTags.ExifIFDPointer;
            delete allTags.GPSInfoIFDPointer;

            return Object.fromEntries(Object.entries(allTags).filter(([_, v]) => v !== null && v !== ''));
        } else if (marker >= 0xFFE0 && marker <= 0xFFEF) {
            offset += view.getUint16(offset, false);
        } else {
            break; // Not an APPn marker, stop searching
        }
    }

    throw new Error("No EXIF data found in the image.");
};
