import { glob } from "glob";


export async function getEggs(path: string) {
  return await glob(`${path}/**/*.json`, { ignore: ['**/Archived/**/*', '**/package.json'] })
}