import { Egg } from '@/types'
import { exists } from 'fs-extra'
import { mkdir, readFile, writeFile } from 'fs/promises'

export interface MergeOptions {
  data: Egg[]
  author: string
  repoName: string
}

export class Merge {
  static metadata = new Map<string, { [repoName: string]: Egg[] }>()
  public author: string
  public repoName: string
  public data: Egg[]

  constructor({ author, data, repoName }: MergeOptions) {
    this.author = author
    this.repoName = repoName
    this.data = data
  }

  async read() {
    const cache = await exists(`api/${this.author}.cache.json`)
      ? JSON.parse(await readFile(`api/${this.author}.cache.json`, { encoding: 'utf-8' })) as { [repoName: string]: Egg[] }[]
      : {}

    Merge.metadata.set(this.author,
      Object.assign(
        cache,
        Merge.metadata.get(this.author),
        { [this.repoName]: this.data }
      )
    )

    return this
  }

  async write() {
    const data = Merge.metadata.get(this.author)
    if (data === undefined) return

    const merged: Egg[] = []


    for (const key of Object.keys(data)) {
      console.log(key)
      merged.push(...data[key])
    }

    merged.sort((eggA, eggB) => eggA.name.localeCompare(eggB.name))

    if (!(await exists('api'))) mkdir('api')
    await writeFile(`api/${this.author}.json`, JSON.stringify(merged, null, 2))
    await writeFile(`api/${this.author}.min.json`, JSON.stringify(merged))
    await writeFile(`api/${this.author}.cache.json`, JSON.stringify(data, null, 2))

    return this
  }
}

