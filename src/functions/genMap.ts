import { EggMap } from "@/types/EggMapping"
import { EggConfig } from "@/types/EggType"
import { exists, readFile, stat, writeFile } from "fs-extra"
import { formatBytes } from "./format"
import cld from 'cld'

export async function genMap(eggs: string[], branch: string, repository: string): Promise<EggMap[]> {
  const EggsMapping: EggMap[] = []
  const authorEggs = repository.split('/')[0]
  const repoName = repository.split('/')[1]

  for (const eggPath of eggs) {
    try {
      const file = await readFile(eggPath, 'utf8')
      const { size } = await stat(eggPath)
      const { name, description, author, exported_at } = JSON.parse(file) as EggConfig

      if (size <= 735) { console.log(`Arquivo: ${eggPath} é muito leve para ser um egg! Pulando.`); continue }
      if (name === undefined) { console.log(`Arquivo: ${eggPath} não é um egg!`); continue }

      const pathEgg = eggPath.replace(`${eggPath.split('/')[0]}/`, '')
      const link = `https://raw.githubusercontent.com/${repository}/${branch}/${pathEgg}`
      const language = await cld.detect(description)
        .then(({ languages }) => {
          return languages.reduce((max, language) => language.percent > max.percent ?? 0 ? language : max).code
        })
        .catch((err: Error) => {
          console.log({
            error: err.message,
            egg: eggPath.split('/').pop(),
            link,
            description,
          })
          return 'en'
        })

      const languages = ['pt-br', 'en']
      const pathEggSplit = pathEgg.split('/')
      let type = undefined
      if (authorEggs === 'pelican-eggs') {
        type = repoName
      } else if (pathEggSplit[0].toLowerCase() !== 'eggs') {
        type = pathEggSplit[0].toLowerCase().replace('game_eggs', 'games')
      } else if (languages.some(language => pathEggSplit[1].toLowerCase() === language)) {
        type = pathEggSplit[2]
      }

      if (type?.endsWith('.json')) type = undefined

      EggsMapping.push({
        author,
        name,
        description,
        exported_at,
        link,
        size: formatBytes(size),
        language,
        type: type ?? null
      })
    } catch {
      console.log(`Ocorreu um erro ao tentar processar o arquivo: ${eggPath}`)
      continue
    }
  }

  const oldData = await exists(`api/${authorEggs}.json`) ?
    JSON.parse(await readFile(`api/${authorEggs}.json`, 'utf-8')) as EggMap[]
    : []
  const newData: EggMap[] = []

  for (const egg of EggsMapping) {
    const index = oldData.findIndex((oldEgg) => oldEgg.name === egg.name)
    if (index !== -1) { oldData[index] = egg; continue }
    newData.push(egg)
  }
  oldData.push(...newData)

  await writeFile(`api/${authorEggs}.min.json`, JSON.stringify(oldData))
  await writeFile(`api/${authorEggs}.json`, JSON.stringify(oldData, null, 2))

  return EggsMapping
}
