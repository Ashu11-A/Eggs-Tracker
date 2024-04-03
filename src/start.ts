import { existsSync, rmdirSync } from 'fs'
import { simpleGit } from 'simple-git'
import { genMap } from './functions/genMap'
import { getEggs } from './functions/getEggs'
import { rm } from 'fs/promises'

const repos = [
    { repository: 'Ashu11-A/Ashu_eggs', branch: 'main' },
    { repository: 'parkervcp/eggs', branch: 'master' },
    { repository: 'drylian/Eggs', branch: 'main' }
]

async function start() {
    for (const { repository, branch } of repos) {
        const array = repository.split('/')
        const repoName = array.pop()
        console.log(repoName)
    
        if (repoName === undefined) {
            console.log('URL invalida!')
            continue
        }
    
        simpleGit().clone(`https://github.com/${repository}`, { '--branch': branch })
            .then(async () => {
                const { eggs } = getEggs(repoName)
                await genMap(eggs, branch, repository)
            })
            .catch((err) => console.log(err))
            .finally(() => {
                if (existsSync(repoName)) rm(repoName, { recursive: true })
            })
    }
}

void start()
