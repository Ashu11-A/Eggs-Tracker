import axios from 'axios'

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

  constructor(apiUrl: string = process.env.GLOTLID_API_URL || 'http://localhost:8000', fallbackLanguage: string = 'en') {
    this.apiUrl = apiUrl
    this.fallbackLanguage = fallbackLanguage
  }

  /**
   * Detecta o idioma de um texto
   */
  async detect(text: string): Promise<string> {
    // Se o texto estiver vazio ou muito curto, retorna idioma padrão
    if (!text || text.trim().length < 10) {
      return this.fallbackLanguage
    }

    try {
      const response = await axios.post<LanguageDetectionResult>(
        `${this.apiUrl}/identify`,
        { text_content: text },
        { timeout: 5000 }
      )

      return response.data.language
    } catch (error) {
      console.warn('Erro ao detectar idioma via API, usando fallback:', error instanceof Error ? error.message : error)
      return this.fallbackLanguage
    }
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
}

/**
 * Instância singleton do detector de idioma
 */
export const languageDetector = new LanguageDetector()
