import axios from 'axios'
import { exists, readFile, writeFile } from 'fs-extra'
import { simpleGit } from 'simple-git'
import { rm } from 'fs/promises'
import { Merge } from './class/Merge'
import { EggProcessor } from './functions/EggProcessor'
import { repositories } from './config/Repositories'
import { Egg, LinkData } from './types'

/**
 * Gerenciador principal da aplicação
 */
export class EggTrackerApp {
  private links: LinkData[] = []
  private linkCache: LinkData[] = []

  /**
   * Inicia o processamento de todos os repositórios
   */
  public async run(): Promise<void> {
    await this.loadCache()
    await this.processRepositories()
    await this.saveLinks()
  }

  /**
   * Carrega o cache de links
   */
  private async loadCache(): Promise<void> {
    if (await exists('api/links.json')) {
      const data = await readFile('api/links.json', 'utf8')
      this.linkCache.push(...JSON.parse(data) as LinkData[])
    }
  }

  /**
   * Processa todos os repositórios
   */
  private async processRepositories(): Promise<void> {
    for (const repo of repositories) {
      const repository = repo.repository
      const branch = repo?.branch ?? 'main'

      const author = repository.split('/')[0]
      const repoName = repository.split('/')[1]

      if (await this.shouldSkipRepository(repository, author)) {
        console.log(`Repositório ${repository} sem alterações`)
        continue
      }

      await this.processRepository(repository, branch, author, repoName)
    }
  }

  /**
   * Verifica se o repositório deve ser ignorado (sem alterações)
   */
  private async shouldSkipRepository(repository: string, author: string): Promise<boolean> {
    try {
      const repoData = (await axios.get(`https://api.github.com/repos/${repository}`)).data as { pushed_at: string }
      const cachedLink = this.linkCache.find((element) => element.author === author)
      return repoData.pushed_at === cachedLink?.pushed_at
    } catch (error) {
      console.error(`Erro ao verificar repositório ${repository}:`, error)
      return false
    }
  }

  /**
   * Processa um repositório individual
   */
  private async processRepository(
    repository: string,
    branch: string,
    author: string,
    repoName: string
  ): Promise<void> {
    try {
      await this.cloneRepositoryIfNeeded(repository, branch, repoName)
      
      const processor = new EggProcessor({
        repository,
        branch,
        path: repoName
      })

      const eggs = await processor.process()
      await this.mergeAndSaveEggs(author, repoName, eggs)
      await this.updateLinkData(repository, author)
      
      await this.cleanupRepository(repoName)
    } catch (error) {
      console.error(`Erro ao processar repositório ${repository}:`, error)
    }
  }

  /**
   * Clona o repositório se necessário
   */
  private async cloneRepositoryIfNeeded(
    repository: string,
    branch: string,
    repoName: string
  ): Promise<void> {
    if (!(await exists(repoName))) {
      await simpleGit()
        .clone(`https://github.com/${repository}`, { '--branch': branch })
        .catch((err) => {
          throw new Error(`Erro ao clonar repositório: ${err}`)
        })
    }
  }

  /**
   * Faz merge e salva os eggs processados
   */
  private async mergeAndSaveEggs(author: string, repoName: string, eggs: Egg[]): Promise<void> {
    const merger = new Merge({ author, data: eggs, repoName })
    await merger.read()
    await merger.write()
  }

  /**
   * Atualiza os dados de link para o autor
   */
  private async updateLinkData(repository: string, author: string): Promise<void> {
    const eggsMapped = JSON.parse(await readFile(`api/${author}.json`, 'utf-8')) as Egg[]
    const repoData = (await axios.get(`https://api.github.com/repos/${repository}`)).data as { pushed_at: string }

    this.links.push({
      author,
      link: `https://raw.githubusercontent.com/Ashu11-A/Eggs-Tracker/main/api/${author}.min.json`,
      eggs: eggsMapped.length,
      pushed_at: repoData.pushed_at
    })
  }

  /**
   * Remove o diretório do repositório clonado
   */
  private async cleanupRepository(repoName: string): Promise<void> {
    await rm(repoName, { recursive: true })
  }

  /**
   * Salva os links atualizados
   */
  private async saveLinks(): Promise<void> {
    for (const link of this.links) {
      const index = this.linkCache.findIndex((element) => element.author === link.author)
      if (index !== -1) {
        this.linkCache[index] = link
      } else {
        this.linkCache.push(link)
      }
    }

    await writeFile('api/links.json', JSON.stringify(this.linkCache, null, 2))
  }
}

