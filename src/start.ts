import { existsSync, rmdirSync } from 'fs'
import { simpleGit } from 'simple-git'
import { genMap } from './functions/genMap'
import { getEggs } from './functions/getEggs'
import { rm } from 'fs/promises'
import { writeFile } from 'fs'

const repos = [
    { repository: 'Ashu11-A/Ashu_eggs', branch: 'main' },
    { repository: 'parkervcp/eggs', branch: 'master' },
    { repository: 'drylian/Eggs', branch: 'main' },
    { repository: 'QuintenQVD0/Q_eggs', branch: 'main' }
]

async function start() {
    const links: { author: string; link: string, eggs: number }[] = []

    for (const { repository, branch } of repos) {
        const array = repository.split('/')
        const repoName = array.pop()

        if (repoName === undefined) {
            console.log(`URL invalida: ${repository}`)
            continue
        }
    
        await simpleGit().clone(`https://github.com/${repository}`, { '--branch': branch })
            .then(async () => {
                if (existsSync(repoName)) {
                    const { eggs } = getEggs(repoName)
        
                    await genMap(eggs, branch, repository)
                    links.push({ author: array[0], link: `https://raw.githubusercontent.com/Ashu11-A/Eggs-Tracker/main/api/${array[0]}.min.json`, eggs: eggs.length })
                } else {
                    console.log('Download do Repositorio ${repoName} não foi realizado!')
                }
            })
            .finally(() => {
                rm(repoName, { recursive: true })
            })
    }

    writeFile('api/links.json', JSON.stringify(links, null, 2), {}, ((err) => {
        if (err) console.log('Ocorreu um erro ao salvar os Dados:', err)
    }))
}

void start()
