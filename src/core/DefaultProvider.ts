import { basename } from 'path'
import { BaseProvider } from './BaseProvider'

/**
 * Provider padrão para repositórios genéricos
 * Usa apenas regras básicas sem estrutura específica
 */
export class DefaultProvider extends BaseProvider {
  constructor(repository: string, branch: string = 'main', ignorePatterns: string[] = []) {
    super(repository, branch, ['**/package.json', ...ignorePatterns])
  }

  /**
   * Obtém o tipo do egg baseado no nome do diretório pai
   */
  public getType(path: string): string {
    // Remove o nome do arquivo .json do path
    const pathWithoutFile = path.replace(/\/[^/]+\.json$/, '')
    
    // Pega o último diretório do path
    const parts = pathWithoutFile.split('/')
    return parts[parts.length - 1] || basename(path).replace('.json', '')
  }
}
