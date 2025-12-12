import { basename, join } from 'path'
import { BaseProvider } from '@/core/BaseProvider'

/**
 * Provider específico para o repositório Ashu11-A/Ashu_eggs
 * Possui regras customizadas para estrutura de pastas pt-br/en e Archived
 */
export class Ashu11AProvider extends BaseProvider {
  constructor() {
    super('Ashu11-A/Ashu_eggs', 'main', ['**/Archived/**/*', '**/package.json'])
  }

  public getType(path: string): string {
    return this.getTypeRecursive(path)
  }

  /**
   * Lógica recursiva para determinar o tipo baseado na estrutura de pastas
   * Ignora pastas 'eggs', arquivos '.json' e idiomas 'pt-br'/'en'
   */
  public getTypeRecursive(currentPath: string): string {
    const baseName = basename(currentPath)
    
    // Ignora estas pastas/arquivos e sobe na hierarquia
    if (
      baseName === 'eggs'
      || currentPath.endsWith('.json')
      || ['pt-br', 'en'].includes(baseName.toLowerCase())
    ) {
      return this.getTypeRecursive(join(currentPath, '..'))
    }

    return baseName
  }
}
