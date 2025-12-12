import axios from 'axios'
import { exists, readFile, writeFile } from 'fs-extra'
import { simpleGit } from 'simple-git'
import { rm } from 'fs/promises'
import { Merge } from './core/Merge'
import { EggProcessor } from './processors/EggProcessor'
import { providerRegistry, BaseProvider } from './core'
import { Egg, LinkData } from './types'

/**
 * Gerenciador principal da aplicação
 */
export class EggTrackerApp {
  private authorLinksMap = new Map<string, { repositories: string[], pushedDates: string[] }>()
  private linkCache: LinkData[] = []

  /**
   * Inicia o processamento de todos os repositórios
   */
  public async run(): Promise<void> {
    await this.loadCache()
    await this.processAllAuthors()
    await this.saveLinks()
    await this.cleanupAllRepositories()
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
   * Processa todos os autores e seus repositórios
   */
  private async processAllAuthors(): Promise<void> {
    const authors = providerRegistry.getUniqueAuthors()

    for (const author of authors) {
      console.log(`\n📦 Processando autor: ${author}`)
      const providers = providerRegistry.getProvidersByAuthor(author)

      if (await this.shouldSkipAuthor(author, providers)) {
        console.log(`✓ Autor ${author} sem alterações`)
        continue
      }

      await this.processAuthor(author, providers)
    }
  }

  /**
   * Verifica se o autor deve ser ignorado (sem alterações em nenhum repositório)
   */
  private async shouldSkipAuthor(
    author: string,
    providers: BaseProvider[]
  ): Promise<boolean> {
    try {
      const cachedLink = this.linkCache.find((element) => element.author === author)
      if (!cachedLink) return false

      // Verifica se algum repositório do autor foi atualizado
      for (const provider of providers) {
        const repository = provider.getRepository()
        const repoData = await this.getRepoData(repository)
        
        if (repoData && repoData.pushed_at !== cachedLink.pushed_at) {
          return false // Tem alteração
        }
      }

      return true // Nenhum repositório mudou
    } catch (error) {
      console.error(`Erro ao verificar autor ${author}:`, error)
      return false
    }
  }

  /**
   * Processa todos os repositórios de um autor
   */
  private async processAuthor(author: string, providers: BaseProvider[]): Promise<void> {
    const repositories: string[] = []
    const pushedDates: string[] = []

    for (const provider of providers) {
      const repository = provider.getRepository()
      const branch = provider.getBranch()
      const repoName = provider.getRepoName()

      console.log(`  → Processando ${repository}`)

      try {
        await this.cloneRepositoryIfNeeded(repository, branch, repoName)
        
        const processor = new EggProcessor({
          repository,
          branch,
          path: repoName
        })

        const eggs = await processor.process()
        await this.mergeAndSaveEggs(author, repoName, eggs)
        
        const repoData = await this.getRepoData(repository)
        if (repoData) {
          repositories.push(repository)
          pushedDates.push(repoData.pushed_at)
        }

        await this.cleanupRepository(repoName)
      } catch (error) {
        console.error(`  ✗ Erro ao processar ${repository}:`, error)
      }
    }

    // Salva informações consolidadas do autor
    this.authorLinksMap.set(author, { repositories, pushedDates })
  }

  /**
   * Obtém dados do repositório do GitHub
   */
  private async getRepoData(repository: string): Promise<{ pushed_at: string } | null> {
    try {
      const response = await axios.get(`https://api.github.com/repos/${repository}`)
      return response.data
    } catch (error) {
      console.error(`Erro ao buscar dados de ${repository}:`, error)
      return null
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
        .clone(`https://github.com/${repository}`, repoName, { '--branch': branch })
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
   * Remove o diretório do repositório clonado
   */
  private async cleanupRepository(repoName: string): Promise<void> {
    try {
      if (await exists(repoName)) {
        await rm(repoName, { recursive: true, force: true })
        console.log(`  ✓ Limpeza: ${repoName}`)
      }
    } catch (error) {
      console.error(`  ✗ Erro ao limpar ${repoName}:`, error)
    }
  }

  /**
   * Limpa todos os diretórios de repositórios que possam ter ficado
   */
  private async cleanupAllRepositories(): Promise<void> {
    console.log('\n🧹 Limpeza final de repositórios...')
    const allProviders = providerRegistry.getAllProviders()
    
    for (const provider of allProviders) {
      const repoName = provider.getRepoName()
      await this.cleanupRepository(repoName)
    }
  }

  /**
   * Salva os links atualizados
   */
  private async saveLinks(): Promise<void> {
    console.log('\n💾 Salvando links...')
    
    for (const [author, data] of this.authorLinksMap.entries()) {
      const eggsMapped = JSON.parse(await readFile(`api/${author}.json`, 'utf-8')) as Egg[]
      
      // Pega o pushed_at mais recente entre todos os repositórios do autor
      const mostRecentPush = data.pushedDates.sort((a, b) => 
        new Date(b).getTime() - new Date(a).getTime()
      )[0]

      const linkData: LinkData = {
        author,
        authorUrl: `https://github.com/${author}`,
        repositories: data.repositories,
        link: `https://raw.githubusercontent.com/Ashu11-A/Eggs-Tracker/main/api/${author}.min.json`,
        eggs: eggsMapped.length,
        pushed_at: mostRecentPush
      }

      const index = this.linkCache.findIndex((element) => element.author === author)
      if (index !== -1) {
        this.linkCache[index] = linkData
      } else {
        this.linkCache.push(linkData)
      }
    }

    await writeFile('api/links.json', JSON.stringify(this.linkCache, null, 2))
    console.log('✓ Links salvos com sucesso!')
  }
}


