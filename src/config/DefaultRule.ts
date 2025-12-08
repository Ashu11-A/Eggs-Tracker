import { basename, join } from 'path'
import { RepositoryRule } from './RepositoryRule'

/**
 * Regra padrão para outros repositórios
 */
export class DefaultRule extends RepositoryRule {
  constructor() {
    super(/.*/, ['**/Archived/**/*', '**/package.json'])
  }

  public getType(path: string, _repoName: string): string {
    return this.getTypeRecursive(path)
  }

  private getTypeRecursive(currentPath: string): string {
    if (
      basename(currentPath) === 'eggs'
      || currentPath.endsWith('.json')
      || ['pt-br', 'en'].includes(currentPath.toLowerCase())
    ) {
      return this.getTypeRecursive(join(currentPath, '..'))
    }

    return basename(currentPath)
  }
}

