/**
 * Classe base abstrata para provedores de repositórios
 */
export abstract class BaseProvider {
  protected repository: string
  protected branch: string
  protected ignorePatterns: string[]

  constructor(repository: string, branch: string = 'main', ignorePatterns: string[] = []) {
    this.repository = repository
    this.branch = branch
    this.ignorePatterns = ignorePatterns
  }

  /**
   * Obtém o repositório completo (autor/repo)
   */
  public getRepository(): string {
    return this.repository
  }

  /**
   * Obtém o branch do repositório
   */
  public getBranch(): string {
    return this.branch
  }

  /**
   * Obtém o autor do repositório
   */
  public getAuthor(): string {
    return this.repository.split('/')[0]
  }

  /**
   * Obtém o nome do repositório
   */
  public getRepoName(): string {
    return this.repository.split('/')[1]
  }

  /**
   * Verifica se este provider corresponde ao padrão fornecido
   */
  public matches(authorRepo: string): boolean {
    return this.getAuthor() === authorRepo
  }

  /**
   * Obtém os padrões de arquivos a serem ignorados
   */
  public getIgnorePatterns(): string[] {
    return this.ignorePatterns
  }

  /**
   * Obtém o tipo do egg baseado no path (deve ser implementado por subclasses)
   */
  public abstract getType(path: string, repoName: string): string

  /**
   * Método opcional para obter tipo recursivamente
   */
  public getTypeRecursive?(path: string): string
}
