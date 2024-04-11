import { existsSync, rmdirSync } from 'fs'
import { simpleGit } from 'simple-git'
import { genMap } from './functions/genMap'
import { getEggs } from './functions/getEggs'
import { rm } from 'fs/promises'
import { writeFile, readFileSync } from 'fs'
import axios from 'axios'

const repos = [
    { repository: 'Ashu11-A/Ashu_eggs', branch: 'main' },
    { repository: 'parkervcp/eggs', branch: 'master' },
    { repository: 'drylian/Eggs', branch: 'main' },
    { repository: 'QuintenQVD0/Q_eggs', branch: 'main' },
    { repository: 'kry008/pterodactyl-io-ARM-eggs', branch: 'main' },
    { repository: 'Sigma-Production/ptero-eggs', branch: 'main' },
    { repository: 'GeyserMC/pterodactyl-stuff', branch: 'master' },
    { repository: 'DanBot-Hosting/pterodactyl-eggs', branch: 'main' },
    { repository: 'ysdragon/Pterodactyl-VPS-Egg', branch: 'main' },
    { repository: 'Draakoor/codptero', branch: 'main' },
    { repository: 'gOOvER/own-pterodactyl-eggs', branch: 'main' }
]

interface LinkData {
    author: string
    link: string
    eggs: number
    updated_at: string
}

async function start() {
    const links: LinkData[] = []
    let linkData = JSON.parse(readFileSync('api/links.json', 'utf8')) as LinkData[]

    for (const { repository, branch } of repos) {
        const array = repository.split('/')
        const repoName = array.pop()

        if (repoName === undefined) {
            console.log(`URL invalida: ${repository}`)
            continue
        }

        const repoData = (await axios.get(`https://api.github.com/repos/${repository}`)).data

        if (repoData.pushed_at === linkData.find((element) => element.author === array[0])?.pushed_at) {
            console.log('Repositorio sem alterações');
            continue
        }
    
        await simpleGit().clone(`https://github.com/${repository}`, { '--branch': branch })
            .then(async () => {
                try {
                    if (existsSync(repoName)) {
                        const { eggs } = getEggs(repoName)
            
                        const eggsMapped = await genMap(eggs, branch, repository)
                        links.push({
                            author: array[0],
                            link: `https://raw.githubusercontent.com/Ashu11-A/Eggs-Tracker/main/api/${array[0]}.min.json`,
                            eggs: eggsMapped.length,
                            pushed_at: repoData?.pushed_at
                        })
                    } else {
                        console.log(`Download do Repositorio ${repoName} não foi realizado!`)
                    }
                } catch {
                    rm(repoName, { recursive: true })
                }
            })
            .finally(() => {
                rm(repoName, { recursive: true })
            })
    }

    // Sistema de mesclagem
    for (const link of links) {
        const index = linkData.findIndex((element) => element.author === link.author)
        if (index !== -1) {
            linkData[index] = link
            continue
        }

        linkData.push(link)
    }

    writeFile('api/links.json', JSON.stringify(linkData, null, 2), {}, ((err) => {
        if (err) console.log('Ocorreu um erro ao salvar os Dados:', err)
    }))
}

void start()
