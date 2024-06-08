import axios from 'axios'
import { simpleGit } from 'simple-git'
import { genMap } from './functions/genMap'
import { getEggs } from './functions/getEggs'
import { exists, read, readFile, rm, writeFile } from 'fs-extra'
import { EggMap } from './types/EggMapping'

interface Repo {
    repository: string,
    branch: string
}
interface LinkData {
    author: string
    link: string
    eggs: number
    pushed_at: string
}

const repos = [
  { repository: 'Ashu11-A/Ashu_eggs', branch: 'main' },
  { repository: 'drylian/Eggs', branch: 'main' },
  { repository: 'QuintenQVD0/Q_eggs', branch: 'main' },
  { repository: 'kry008/pterodactyl-io-ARM-eggs', branch: 'main' },
  { repository: 'Sigma-Production/ptero-eggs', branch: 'main' },
  { repository: 'GeyserMC/pterodactyl-stuff', branch: 'master' },
  { repository: 'DanBot-Hosting/pterodactyl-eggs', branch: 'main' },
  { repository: 'ysdragon/Pterodactyl-VPS-Egg', branch: 'main' },
  { repository: 'Draakoor/codptero', branch: 'main' },
  { repository: 'gOOvER/own-pterodactyl-eggs', branch: 'main' }
] satisfies Repo[]

const officialRepos = [
  { repository: 'pelican-eggs/games-steamcmd', branch: 'main' },
  { repository: 'pelican-eggs/minecraft', branch: 'main' },
  { repository: 'pelican-eggs/software', branch: 'main' },
  { repository: 'pelican-eggs/generic', branch: 'main' },
  { repository: 'pelican-eggs/chatbots', branch: 'main' },
  { repository: 'pelican-eggs/games-standalone', branch: 'main' },
  { repository: 'pelican-eggs/monitoring', branch: 'main' },
  { repository: 'pelican-eggs/database', branch: 'main' },
  { repository: 'pelican-eggs/voice', branch: 'main' },

] satisfies Repo[]

repos.push(...officialRepos)
const links: LinkData[] = []
const linkCache: LinkData[] = []

void (async () => {
  if (await exists('api/links.json')) linkCache.push(...JSON.parse(await readFile('api/links.json', 'utf8')) as LinkData[])

  for (const { repository, branch } of repos) {
    const author = repository.split('/')[0]
    const repoName = repository.split('/')[1]
    const repoData = (await axios.get(`https://api.github.com/repos/${repository}`)).data as { pushed_at: string }

    if (repoData.pushed_at === linkCache.find((element) => element.author === author)?.pushed_at) {
      console.log('Repositorio sem alterações');
      continue
    }

    await simpleGit().clone(`https://github.com/${repository}`, { '--branch': branch })
      .then(async () => {
        if (await exists(repoName)) {
          const eggs = await getEggs(repoName)
          await genMap(eggs, branch, repository)

          const eggsMapped = JSON.parse(await readFile(`api/${author}.json`, 'utf-8')) as EggMap[]
          links.push({
            author,
            link: `https://raw.githubusercontent.com/Ashu11-A/Eggs-Tracker/main/api/${author}.min.json`,
            eggs: eggsMapped.length,
            pushed_at: repoData.pushed_at
          })
        } else {
          console.log(`Download do Repositorio ${repoName} não foi realizado!`)
        }
      })
      .finally(async () => {
        await rm(repoName, { recursive: true })
      })
  }

})().then(async () => {
  // Sistema de mesclagem
  for (const link of links) {
    const index = linkCache.findIndex((element) => element.author === link.author)
    if (index !== -1) {
      linkCache[index] = link
      continue
    }

    linkCache.push(link)
  }
  await writeFile('api/links.json', JSON.stringify(linkCache, null, 2))
})
