import { Egg, EggConfig } from '@/types'
import { ruleManager } from '@/config/RuleManager'
import { readFile, stat } from 'fs-extra'
import { glob } from 'glob'
import { Formatter } from './Formatter'
import cld from 'cld'

/**
 * Configuração para processamento de eggs
 */
export interface EggProcessorConfig {
  repository: string
  branch: string
  path: string
}

/**
 * Classe para processar e extrair eggs de repositórios
 */
export class EggProcessor {
  private readonly authorRepo: string
  private readonly repoName: string
  private readonly branch: string
  private readonly path: string
  private readonly repository: string

  constructor(config: EggProcessorConfig) {
    this.repository = config.repository
    this.branch = config.branch
    this.path = config.path
    this.authorRepo = config.repository.split('/')[0]
    this.repoName = config.repository.split('/')[1]
  }

  /**
   * Processa todos os eggs do repositório
   */
  public async process(): Promise<Egg[]> {
    const files = await this.findEggFiles()
    const eggs: Egg[] = []

    for (const filePath of files) {
      const egg = await this.processFile(filePath)
      if (egg) {
        eggs.push(egg)
      }
    }

    return this.sortEggs(eggs)
  }

  /**
   * Encontra todos os arquivos JSON que podem ser eggs
   */
  private async findEggFiles(): Promise<string[]> {
    const ignorePatterns = ruleManager.getIgnorePatterns(this.authorRepo)
    return await glob(`${this.path}/**/*.json`, { ignore: ignorePatterns })
  }

  /**
   * Processa um arquivo individual
   */
  private async processFile(filePath: string): Promise<Egg | null> {
    try {
      const content = await readFile(filePath, 'utf8')
      const { size } = await stat(filePath)
      const config = JSON.parse(content) as EggConfig

      if (!this.isValidEgg(config, size, filePath)) {
        return null
      }

      return await this.createEgg(config, filePath, size)
    } catch (error) {
      console.log(`Ocorreu um erro ao processar o arquivo: ${filePath}`)
      return null
    }
  }

  /**
   * Valida se o arquivo é um egg válido
   */
  private isValidEgg(config: EggConfig, size: number, filePath: string): boolean {
    if (size <= 735) {
      console.log(`Arquivo: ${filePath} é muito leve para ser um egg! Pulando.`)
      return false
    }

    if (!config.name || !config.author) {
      console.log(`Arquivo: ${filePath} não é um egg!`)
      return false
    }

    return true
  }

  /**
   * Cria um objeto Egg a partir da configuração
   */
  private async createEgg(config: EggConfig, filePath: string, size: number): Promise<Egg> {
    const pathEgg = filePath.replace(`${filePath.split('/')[0]}/`, '')
    const link = this.buildRawGithubUrl(pathEgg)
    const language = await this.detectLanguage(config.description)
    const type = ruleManager.getEggType(pathEgg, this.authorRepo, this.repoName)

    return {
      name: config.name,
      description: config.description,
      language,
      size: Formatter.formatBytes(size),
      type,
      author: config.author,
      link,
      exported_at: config.exported_at,
    }
  }

  /**
   * Constrói a URL do GitHub Raw
   */
  private buildRawGithubUrl(pathEgg: string): string {
    return `https://raw.githubusercontent.com/${this.repository}/${this.branch}/${pathEgg}`
  }

  /**
   * Detecta o idioma da descrição
   */
  private async detectLanguage(description: string): Promise<string> {
    try {
      const result = await cld.detect(description)
      return result.languages.reduce((max, language) => 
        language.percent > max.percent ? language : max
      ).code
    } catch {
      return 'en'
    }
  }

  /**
   * Ordena eggs por nome
   */
  private sortEggs(eggs: Egg[]): Egg[] {
    return eggs.sort((a, b) => a.name.localeCompare(b.name))
  }

  /**
   * Obtém informações do processador
   */
  public getInfo(): { author: string; repo: string; branch: string } {
    return {
      author: this.authorRepo,
      repo: this.repoName,
      branch: this.branch
    }
  }
}

