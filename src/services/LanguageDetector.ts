import axios from 'axios'
import { AsyncQueue } from '@/utils/AsyncQueue'
import { normalizeLanguageCode } from '@/utils/LanguageCodeNormalizer'

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
  async detect(text: string): Promise<string | null> {
    // Se o texto estiver vazio ou muito curto, retorna null
    if (!text || text.trim().length < 10) {
      return null
    }

    // Limita o texto para 1024 caracteres (limite da API)
    const truncatedText = text.trim().slice(0, 1024)

    // Adiciona à fila de processamento (máximo 5 requisições simultâneas)
    return this.queue.add(async () => {
      try {
        const response = await axios.post<LanguageDetectionResult>(
          `${this.apiUrl}/identify`,
          { text_content: truncatedText },
          { timeout: 10000 } // Aumentado para 10s devido à fila
        )

        // Normaliza o código de idioma para ISO 639-1 (eng_Latn -> en, por_Latn -> pt)
        const normalizedLanguage = normalizeLanguageCode(response.data.language)
        return normalizedLanguage
      } catch (error) {
        console.warn('Erro ao detectar idioma via API, usando fallback:', error instanceof Error ? error.message : error)
        return this.fallbackLanguage
      }
    })
  }

  /**
   * Detecta o idioma combinando múltiplos textos
   */
  async detectFromMultiple(texts: string[]): Promise<string | null> {
    const combinedText = texts
      .filter(text => text && text.trim().length > 0)
      .join(' ')
    
    // Se não há texto suficiente, retorna null
    if (!combinedText || combinedText.trim().length < 10) {
      return null
    }
    
    return this.detect(combinedText)
  }

  /**
   * Detecta idioma de um egg baseado em seus campos
   * Retorna null se não houver conteúdo suficiente para análise
   */
  async detectFromEgg(eggConfig: {
    name?: string
    description?: string
    variables?: Array<{ name?: string; description?: string }>
  }): Promise<string | null> {
    const texts: string[] = []

    // Adiciona descrição (peso maior) - apenas se não for null
    if (eggConfig.description && eggConfig.description.trim().length > 0) {
      texts.push(eggConfig.description)
      texts.push(eggConfig.description) // Adiciona duas vezes para dar mais peso
    }

    // Adiciona descrições das variáveis
    if (eggConfig.variables && Array.isArray(eggConfig.variables) && eggConfig.variables.length > 0) {
      for (const variable of eggConfig.variables) {
        if (variable.description && variable.description.trim().length > 0) {
          texts.push(variable.description)
        }
        // Não usa nome de variável se não tiver descrição suficiente
      }
    }

    // Se não há textos para analisar, retorna null (não usa nome do egg)
    if (texts.length === 0) {
      return null
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
