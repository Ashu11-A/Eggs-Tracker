import { providerRegistry, BaseProvider, DefaultProvider } from '@/core'

/**
 * Gerenciador de regras de repositório (agora usando providers)
 * @deprecated Use providerRegistry diretamente
 */
export class RuleManager {
  /**
   * Obtém o provider apropriado para um repositório
   */
  public getProvider(authorRepo: string, repoName: string): BaseProvider {
    // Tenta encontrar um provider específico
    const provider = providerRegistry.getProviderForRepo(authorRepo)
    if (provider) return provider

    // Fallback para DefaultProvider
    return new DefaultProvider(`${authorRepo}/${repoName}`)
  }

  /**
   * Obtém o tipo de egg baseado no path e nas regras do repositório
   */
  public getEggType(path: string, authorRepo: string, repoName: string): string {
    const provider = this.getProvider(authorRepo, repoName)
    return provider.getType(path, repoName)
  }

  /**
   * Obtém os padrões de arquivos a serem ignorados para um repositório
   */
  public getIgnorePatterns(authorRepo: string, repoName: string = ''): string[] {
    const provider = this.getProvider(authorRepo, repoName)
    return provider.getIgnorePatterns()
  }
}

/**
 * Instância singleton do gerenciador de regras
 */
export const ruleManager = new RuleManager()


