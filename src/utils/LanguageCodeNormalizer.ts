/**
 * Utilitário para normalizar códigos de idioma complexos para ISO 639-1
 * Converte formatos como "eng_Latn" para "en", "por_Latn" para "pt", etc.
 */

/**
 * Converte códigos de linguagem complexos (ex: eng_Latn, por_Latn) para ISO 639-1 (ex: en, pt).
 * Utiliza a API nativa Intl.Locale do JavaScript para conversão automática.
 * 
 * @param inputLanguageCode - O código de entrada (ex: "eng_Latn", "por_Latn", "spa_Latn")
 * @returns O código de idioma normalizado no formato ISO 639-1 (ex: "en", "pt", "es")
 * 
 * @example
 * ```typescript
 * normalizeLanguageCode('eng_Latn') // Retorna "en"
 * normalizeLanguageCode('por_Latn') // Retorna "pt"
 * normalizeLanguageCode('spa_Latn') // Retorna "es"
 * normalizeLanguageCode('en')       // Retorna "en" (já normalizado)
 * normalizeLanguageCode('invalid')  // Retorna "invalid" (fallback)
 * ```
 */
export function normalizeLanguageCode(inputLanguageCode: string | null): string | null {
  // Se o código for null, retorna null
  if (!inputLanguageCode) {
    return null
  }

  try {
    // Remove espaços e converte para lowercase
    const cleanCode = inputLanguageCode.trim().toLowerCase()
    
    // Se já está no formato ISO 639-1 (2 letras), retorna como está
    if (/^[a-z]{2}$/.test(cleanCode)) {
      return cleanCode
    }

    // A API Intl espera hífens em vez de sublinhados para o padrão BCP 47
    // Converte "eng_Latn" para "eng-Latn"
    const formattedTag = cleanCode.replace('_', '-')
    
    // Instancia o objeto Locale que faz o parse automático
    // Isso converte automaticamente "eng" -> "en", "por" -> "pt", etc.
    const localeObject = new Intl.Locale(formattedTag)
    
    // Retorna apenas a parte base do idioma (ISO 639-1)
    return localeObject.language
  } catch (error) {
    // Se houver erro no parsing, tenta extrair manualmente
    // Remove tudo após underscore ou hífen
    const baseCode = inputLanguageCode.split(/[_-]/)[0].toLowerCase()
    
    // Se tem 3 letras, tenta usar Intl novamente
    if (baseCode.length === 3) {
      try {
        const localeObject = new Intl.Locale(baseCode)
        return localeObject.language
      } catch {
        // Se falhar, retorna o código de 3 letras como fallback
        return baseCode
      }
    }
    
    // Retorna o valor original como último fallback
    return inputLanguageCode
  }
}

/**
 * Converte múltiplos códigos de idioma de uma vez
 * 
 * @param languageCodes - Array de códigos de idioma
 * @returns Array de códigos normalizados
 * 
 * @example
 * ```typescript
 * normalizeLanguageCodes(['eng_Latn', 'por_Latn', 'spa_Latn'])
 * // Retorna ['en', 'pt', 'es']
 * ```
 */
export function normalizeLanguageCodes(languageCodes: string[]): string[] {
  return languageCodes
    .map(code => normalizeLanguageCode(code))
    .filter((code): code is string => code !== null)
}

/**
 * Verifica se um código de idioma está no formato ISO 639-1 (2 letras)
 * 
 * @param code - Código de idioma para verificar
 * @returns true se estiver no formato ISO 639-1
 */
export function isISO6391(code: string): boolean {
  return /^[a-z]{2}$/.test(code.toLowerCase())
}

/**
 * Mapeamento manual para casos especiais que o Intl.Locale pode não cobrir
 * Usado apenas como fallback adicional
 */
const MANUAL_LANGUAGE_MAP: Record<string, string> = {
  // Casos especiais que podem precisar de mapeamento manual
  'und': 'en', // Indefinido -> Inglês como fallback
}

/**
 * Normaliza um código de idioma com fallback manual para casos especiais
 * 
 * @param code - Código de idioma
 * @returns Código normalizado ou fallback
 */
export function normalizeWithFallback(code: string | null): string | null {
  if (!code) return null
  
  // Tenta normalização via Intl.Locale primeiro
  const normalized = normalizeLanguageCode(code)
  
  // Se retornou null ou se está no mapeamento manual, usa o manual
  if (!normalized || MANUAL_LANGUAGE_MAP[normalized]) {
    return MANUAL_LANGUAGE_MAP[normalized] || normalized
  }
  
  return normalized
}
