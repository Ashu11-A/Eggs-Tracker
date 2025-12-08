import { RepositoryRule } from './RepositoryRule'

/**
 * Regra específica para repositórios pelican-eggs
 */
export class PelicanEggsRule extends RepositoryRule {
  constructor() {
    super('pelican-eggs', ['**/Archived/**/*', '**/package.json'])
  }

  public getType(_path: string, repoName: string): string {
    return repoName
  }
}

