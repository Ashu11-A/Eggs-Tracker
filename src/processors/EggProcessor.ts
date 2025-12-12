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

    console.log(`  📊 Total de arquivos encontrados: ${files.length}`)
    
    for (let i = 0; i < files.length; i++) {
      const filePath = files[i]
      const egg = await this.processFile(filePath, i + 1, files.length)
      if (egg) {
        eggs.push(egg)
      }
    }

    // Aguarda todas as detecções de idioma pendentes
    const { languageDetector } = await import('@/services/LanguageDetector')
    await languageDetector.waitAll()

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
  private async processFile(filePath: string, current: number, total: number): Promise<Egg | null> {
    try {
      const content = await readFile(filePath, 'utf8')
      const { size } = await stat(filePath)
      const config = JSON.parse(content) as EggConfig

      if (!this.isValidEgg(config, size, filePath)) {
        return null
      }

      const egg = await this.createEgg(config, filePath, size, current, total)
      
      return egg
    } catch {
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
  private async createEgg(config: EggConfig, filePath: string, size: number, current: number, total: number): Promise<Egg> {
    const pathEgg = filePath.replace(`${filePath.split('/')[0]}/`, '')
    const link = this.buildRawGithubUrl(pathEgg)
    
    // Mostra progresso da fila
    const { languageDetector } = await import('@/services/LanguageDetector')
    const queueInfo = languageDetector.getQueueInfo()
    console.log(`  🔄 [${current}/${total}] ${config.name} | Fila: ${queueInfo.running} processando, ${queueInfo.queued} aguardando`)
    
    const language = await this.detectLanguageFromEgg(config)
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
   * Detecta idioma considerando múltiplos campos do egg
   * Retorna null se não houver conteúdo suficiente
   */
  private async detectLanguageFromEgg(config: EggConfig): Promise<string | null> {
    try {
      const { languageDetector } = await import('@/services/LanguageDetector')
      const isAvailable = await languageDetector.isAvailable()
      
      if (isAvailable) {
        const result = await languageDetector.detectFromEgg(config)
        // Se retornou null, significa que não há conteúdo suficiente
        return result
      }
      
      // Fallback para método antigo se API não disponível
      return await this.detectLanguage(config.description)
    } catch {
      return await this.detectLanguage(config.description)
    }
  }

  /**
   * Constrói a URL do GitHub Raw
   */
  private buildRawGithubUrl(pathEgg: string): string {
    return `https://raw.githubusercontent.com/${this.repository}/${this.branch}/${pathEgg}`
  }

  /**
   * Detecta o idioma da descrição usando a API GlotLID
   * Retorna null se não houver descrição válida
   */
  private async detectLanguage(description: string | null | undefined): Promise<string | null> {
    // Se não há descrição, retorna null
    if (!description || description.trim().length < 10) {
      return null
    }

    try {
      // Tenta usar a nova API GlotLID primeiro
      const { languageDetector } = await import('@/services/LanguageDetector')
      const isAvailable = await languageDetector.isAvailable()
      
      if (isAvailable) {
        return await languageDetector.detect(description)
      }
      
      // Fallback para CLD se a API não estiver disponível
      const result = await cld.detect(description)
      return result.languages.reduce((max, language) => 
        language.percent > max.percent ? language : max
      ).code
    } catch {
      return null // Retorna null em vez de 'en' quando não consegue detectar
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


