export interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
}

export class PaletteResolver {
    public static parse(data: Buffer): Color[] {
        const colors: Color[] = [];
        
        // Skip header (often 4 bytes or starts with 2 bytes count)
        // From research: skip 4-byte header, then 256 * 4 bytes (BGRA)
        let offset = 4;
        
        for (let i = 0; i < 256; i++) {
            if (offset + 4 > data.length) break;
            const b = data.readUInt8(offset);
            const g = data.readUInt8(offset + 1);
            const r = data.readUInt8(offset + 2);
            const a = data.readUInt8(offset + 3);
            
            // Note: In some ZT1 palettes, A is used for transparency (0 = transparent).
            // But sometimes Magic Pink (255, 0, 255) is the primary key.
            // We'll preserve the alpha but the Extractor will handle final logic.
            colors.push({ r, g, b, a });
            offset += 4;
        }

        // Fill up to 256 if needed
        while (colors.length < 256) {
            colors.push({ r: 0, g: 0, b: 0, a: 0 });
        }

        return colors;
    }

    public static getGrayscale(): Color[] {
        const colors: Color[] = [];
        for (let i = 0; i < 256; i++) {
            colors.push({ r: i, g: i, b: i, a: 255 });
        }
        return colors;
    }
}
