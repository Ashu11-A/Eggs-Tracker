/**
 * Classe para formatação de dados
 */
export class Formatter {
  private static readonly KILOBYTE = 1024
  private static readonly UNITS = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  /**
   * Formata bytes em uma string legível
   * @param bytes - Quantidade de bytes
   * @param decimals - Número de casas decimais (padrão: 2)
   * @returns String formatada com a unidade apropriada
   */
  public static formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes'
    
    const dm = decimals < 0 ? 0 : decimals
    const i = Math.floor(Math.log(bytes) / Math.log(this.KILOBYTE))
    
    return parseFloat((bytes / Math.pow(this.KILOBYTE, i)).toFixed(dm)) + ' ' + this.UNITS[i]
  }

  /**
   * Formata uma data para string ISO
   */
  public static formatDate(date: Date): string {
    return date.toISOString()
  }

  /**
   * Normaliza uma string removendo espaços extras
   */
  public static normalizeString(str: string): string {
    return str.trim().replace(/\s+/g, ' ')
  }
}

