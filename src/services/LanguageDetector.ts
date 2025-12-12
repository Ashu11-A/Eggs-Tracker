import axios from 'axios'
import { AsyncQueue } from '@/utils/AsyncQueue'

export interface LanguageDetectionResult {
  language: string
  confidence: number
}

/**
 * Serviço para detectar idioma usando a API GlotLID
 */
export class LanguageDetector {
  private apiUrl: string
  private fallbackLanguage: string
  private queue: AsyncQueue

  constructor(apiUrl: string = process.env.GLOTLID_API_URL || 'http://localhost:8000', fallbackLanguage: string = 'en', concurrency: number = 5) {
    this.apiUrl = apiUrl
    this.fallbackLanguage = fallbackLanguage
    this.queue = new AsyncQueue(concurrency)
  }

  /**
   * Detecta o idioma de um texto usando fila de processamento
   */
  async detect(text: string): Promise<string> {
    // Se o texto estiver vazio ou muito curto, retorna idioma padrão
    if (!text || text.trim().length < 10) {
      return this.fallbackLanguage
    }

    // Adiciona à fila de processamento (máximo 5 requisições simultâneas)
    return this.queue.add(async () => {
      try {
        const response = await axios.post<LanguageDetectionResult>(
          `${this.apiUrl}/identify`,
          { text_content: text },
          { timeout: 10000 } // Aumentado para 10s devido à fila
        )

        return response.data.language
      } catch (error) {
        console.warn('Erro ao detectar idioma via API, usando fallback:', error instanceof Error ? error.message : error)
        return this.fallbackLanguage
      }
    })
  }

  /**
   * Detecta o idioma combinando múltiplos textos
   */
  async detectFromMultiple(texts: string[]): Promise<string> {
    const combinedText = texts
      .filter(text => text && text.trim().length > 0)
      .join(' ')
    
    return this.detect(combinedText)
  }

  /**
   * Detecta idioma de um egg baseado em seus campos
   */
  async detectFromEgg(eggConfig: {
    name?: string
    description?: string
    variables?: Array<{ name?: string; description?: string }>
  }): Promise<string> {
    const texts: string[] = []

    // Adiciona descrição (peso maior)
    if (eggConfig.description) {
      texts.push(eggConfig.description)
      texts.push(eggConfig.description) // Adiciona duas vezes para dar mais peso
    }

    // Adiciona descrições das variáveis
    if (eggConfig.variables && Array.isArray(eggConfig.variables)) {
      for (const variable of eggConfig.variables) {
        if (variable.description) {
          texts.push(variable.description)
        }
        if (variable.name) {
          texts.push(variable.name)
        }
      }
    }

    // Se não há textos para analisar, usa o nome
    if (texts.length === 0 && eggConfig.name) {
      texts.push(eggConfig.name)
    }

    return this.detectFromMultiple(texts)
  }

  /**
   * Verifica se a API está disponível
   */
  async isAvailable(): Promise<boolean> {
    try {
      await axios.get(`${this.apiUrl}/docs`, { timeout: 2000 })
      return true
    } catch {
      return false
    }
  }

  /**
   * Retorna informações sobre o estado da fila
   */
  getQueueInfo(): { running: number; queued: number } {
    return {
      running: this.queue.getRunningCount(),
      queued: this.queue.getQueuedCount()
    }
  }

  /**
   * Aguarda todas as requisições pendentes serem concluídas
   */
  async waitAll(): Promise<void> {
    return this.queue.waitAll()
  }
}

/**
 * Instância singleton do detector de idioma
 */
export const languageDetector = new LanguageDetector()
