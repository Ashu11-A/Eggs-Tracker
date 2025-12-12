import { BaseProvider } from '@/core/BaseProvider'

/**
 * Provider para os múltiplos repositórios do pelican-eggs
 */
export class PelicanEggsProvider extends BaseProvider {
  constructor(repoName: string, branch: string = 'main') {
    super(`pelican-eggs/${repoName}`, branch)
  }

  public getType(_path: string, repoName: string): string {
    return repoName
  }

  public matches(authorRepo: string): boolean {
    return authorRepo === 'pelican-eggs'
  }
}
