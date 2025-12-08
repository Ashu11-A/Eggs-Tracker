/**
 * Classe abstrata base para regras de repositório
 */
export abstract class RepositoryRule {
  protected pattern: string | RegExp
  protected ignorePatterns: string[]

  constructor(pattern: string | RegExp, ignorePatterns: string[] = []) {
    this.pattern = pattern
    this.ignorePatterns = ignorePatterns
  }

  /**
   * Verifica se a regra se aplica ao repositório
   */
  public matches(authorRepo: string): boolean {
    if (typeof this.pattern === 'string') {
      return authorRepo === this.pattern
    }
    return this.pattern.test(authorRepo)
  }

  /**
   * Obtém o tipo do egg baseado no path
   */
  public abstract getType(path: string, repoName: string): string

  /**
   * Obtém os padrões de arquivos a serem ignorados
   */
  public getIgnorePatterns(): string[] {
    return this.ignorePatterns
  }
}

