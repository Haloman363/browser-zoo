import AdmZip from 'adm-zip';
import * as fs from 'fs';
import * as path from 'path';

export class ArchiveManager {
    private archives: Map<string, AdmZip> = new Map();
    private fileMap: Map<string, { archive: string, originalPath: string }> = new Map();

    constructor(private gameFilesDir: string) {
        this.indexArchives();
    }

    private indexArchives() {
        if (!fs.existsSync(this.gameFilesDir)) {
            console.warn(`Warning: Gamefiles directory not found at ${this.gameFilesDir}`);
            return;
        }

        const ztdFiles: string[] = [];
        const scan = (dir: string) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                if (fs.statSync(fullPath).isDirectory()) {
                    scan(fullPath);
                } else if (file.toLowerCase().endsWith('.ztd')) {
                    ztdFiles.push(fullPath);
                }
            }
        };

        // Scan both base Gamefiles and Extras
        scan(this.gameFilesDir);
        if (fs.existsSync('Extras')) {
            scan('Extras');
        }

        // Sort to ensure updates override
        ztdFiles.sort((a, b) => {
            const isUpdateA = a.toLowerCase().includes('update') || a.toLowerCase().includes('xpack');
            const isUpdateB = b.toLowerCase().includes('update') || b.toLowerCase().includes('xpack');
            if (isUpdateA && !isUpdateB) return -1;
            if (!isUpdateA && isUpdateB) return 1;
            return b.localeCompare(a);
        });

        for (const fullPath of ztdFiles) {
            const fileName = path.basename(fullPath);
            try {
                const zip = new AdmZip(fullPath);
                this.archives.set(fullPath, zip);
                
                for (const entry of zip.getEntries()) {
                    if (entry.isDirectory) continue;
                    const entryName = entry.entryName;
                    const entryPathLower = entryName.toLowerCase().replace(/\\/g, '/');
                    
                    if (!this.fileMap.has(entryPathLower)) {
                        this.fileMap.set(entryPathLower, { archive: fullPath, originalPath: entryName });
                    }
                }
            } catch (err) {
                console.error(`Error loading archive ${fullPath}:`, err);
            }
        }
        console.log(`Indexed ${this.fileMap.size} files across ${this.archives.size} archives.`);
    }

    public getFile(filePath: string): Buffer | null {
        const normalizedPath = filePath.toLowerCase().replace(/\\/g, '/');
        const entry = this.fileMap.get(normalizedPath);
        if (!entry) return null;
        const zip = this.archives.get(entry.archive);
        return zip?.getEntry(entry.originalPath)?.getData() || null;
    }

    public hasFile(filePath: string): boolean {
        return this.fileMap.has(filePath.toLowerCase().replace(/\\/g, '/'));
    }

    public listFiles(filter?: (path: string) => boolean): string[] {
        const files = Array.from(this.fileMap.keys());
        return filter ? files.filter(filter) : files;
    }
}
