import axios from 'axios'
import { exists, readFile, writeFile } from 'fs-extra'
import { simpleGit } from 'simple-git'
import { Merge } from './class/merge'
import { getEggs } from './functions/getEggs'

interface Repo {
    repository: string,
    branch?: string
}
interface LinkData {
    author: string
    link: string
    eggs: number
    pushed_at: string
}

const repos = [
  { repository: 'Ashu11-A/Ashu_eggs' },
  { repository: 'drylian/Eggs' },
  { repository: 'QuintenQVD0/Q_eggs' },
  { repository: 'kry008/pterodactyl-io-ARM-eggs' },
  { repository: 'Sigma-Production/ptero-eggs' },
  { repository: 'GeyserMC/pterodactyl-stuff', branch: 'master' },
  { repository: 'DanBot-Hosting/pterodactyl-eggs' },
  { repository: 'ysdragon/Pterodactyl-VPS-Egg' },
  { repository: 'Draakoor/codptero' },
  { repository: 'gOOvER/own-pterodactyl-eggs' },

  { repository: 'pelican-eggs/games-steamcmd' },
  { repository: 'pelican-eggs/minecraft' },
  { repository: 'pelican-eggs/software' },
  { repository: 'pelican-eggs/generic' },
  { repository: 'pelican-eggs/chatbots' },
  { repository: 'pelican-eggs/games-standalone' },
  { repository: 'pelican-eggs/monitoring' },
  { repository: 'pelican-eggs/database' },
  { repository: 'pelican-eggs/voice' },

] satisfies Repo[]

const links: LinkData[] = []
const linkCache: LinkData[] = []

void (async () => {
  if (await exists('api/links.json')) linkCache.push(...JSON.parse(await readFile('api/links.json', 'utf8')) as LinkData[])

  for (const repo of repos) {
    const repository = repo.repository
    const branch = repo?.branch ?? 'main'

    const author = repository.split('/')[0]
    const repoName = repository.split('/')[1]
    const repoData = (await axios.get(`https://api.github.com/repos/${repository}`)).data as { pushed_at: string }

    if (repoData.pushed_at === linkCache.find((element) => element.author === author)?.pushed_at) {
      console.log('Repositorio sem alterações');
      continue
    }

    async function processRepo () {
      const eggs = await getEggs(repoName, { branch, repository })
      await (await (new Merge({ author, data: eggs, repoName })).read()).write()

      links.push({
        author,
        link: `https://raw.githubusercontent.com/Ashu11-A/Eggs-Tracker/main/api/${author}.min.json`,
        eggs: eggs.length,
        pushed_at: repoData.pushed_at
      })
    }

    if (await exists(repoName)) {
      await processRepo()
    } else {
      await simpleGit().clone(`https://github.com/${repository}`, { '--branch': branch }).catch((err) => new Error(err))
      await processRepo()
    }
    // // await rm(repoName, { recursive: true })
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
