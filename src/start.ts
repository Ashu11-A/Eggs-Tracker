import { existsSync } from 'fs'
import { simpleGit } from 'simple-git'
import { genMap } from './functions/genMap'
import { getEggs } from './functions/getEggs'

const repos = ['https://github.com/Ashu11-A/Ashu_eggs']

for (const repo of repos) {
    const array = repo.split('/')
    const repoName = array.pop()

    if (repoName === undefined) {
        console.log('URL invalida!')
        continue
    }

    if (!existsSync(repoName)) {
        simpleGit().clone(repo)
            .then((res) => console.log(res))
            .catch((err) => console.log(err))
    }
    const { eggs } = getEggs(repoName)
    genMap(eggs)
}