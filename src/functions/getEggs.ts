import { lstatSync, readdirSync } from "fs";
import pathLib from "path";


export function getEggs(path: string) {
    const eggs: string[] = []

    function scanDirectory(dir: string) {
        readdirSync(dir).forEach((file) => {
            const fullPath = pathLib.join(dir, file);
    
            if (lstatSync(fullPath).isDirectory()) {
                scanDirectory(fullPath);
            } else if (
                pathLib.extname(fullPath) === ".json" &&
                !fullPath.includes('Archived') &&
                !fullPath.includes('package.json')
            ) {
                console.log(fullPath)
                eggs.push(fullPath);
            }
        })
    }

    scanDirectory(path)
    return { eggs }
}