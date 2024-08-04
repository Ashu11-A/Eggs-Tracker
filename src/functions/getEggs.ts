import { EggConfig } from "@/types/EggType";
import { readFile, stat } from "fs-extra";
import { glob } from "glob";
import { formatBytes } from "./format";
import { basename, join } from "path";
import cld from 'cld'


export interface Egg {
  name: string,
  description: string,
  author: string,
  type: string,
  language: string,
  exported_at: string,
  link: string,
  size: string
}

export async function getEggs(path: string, { branch, repository }: { repository: string, branch: string }): Promise<Egg[]> {
  const jsons = await glob(`${path}/**/*.json`, { ignore: ['**/Archived/**/*', '**/package.json'] })
  const authorRepo = repository.split('/')[0]
  const repoName = repository.split('/')[1]

  const eggs: Egg[] = []
  for (const path of jsons) {
    try {
      const file = await readFile(path, 'utf8')
      const { size } = await stat(path)
      const { name, description, author: authorEgg, exported_at } = JSON.parse(file) as EggConfig

      if (size <= 735) { console.log(`Arquivo: ${path} é muito leve para ser um egg! Pulando.`); continue }
      if (name === undefined || authorEgg === undefined) { console.log(`Arquivo: ${path} não é um egg!`); continue }

      const pathEgg = path.replace(`${path.split('/')[0]}/`, '')
      const link = `https://raw.githubusercontent.com/${repository}/${branch}/${pathEgg}`

      function getType (path: string): string {
        if (authorRepo === 'pelican-eggs') return repoName

        if (
          basename(path) === 'eggs'
          || path.endsWith('.json')
          || ['pt-br', 'en'].includes(path.toLowerCase())
        ) return getType(join(path, '..'))

        return basename(path)
      }

      const language = await cld.detect(description)
        .then(({ languages }) => languages.reduce((max, language) => language.percent > max.percent ? language : max).code)
        .catch(() => 'en')

      eggs.push({
        name,
        description,
        language,
        size: formatBytes(size),
        type: getType(pathEgg),
        author: authorEgg,
        link,
        exported_at,
      })
    } catch {
      console.log(`Ocorreu um erro ao processar o arquivo: ${path}`)
    }
  }

  return eggs
}