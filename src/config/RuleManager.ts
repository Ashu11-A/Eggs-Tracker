import { RepositoryRule } from './RepositoryRule'
import { PelicanEggsRule } from './PelicanEggsRule'
import { DefaultRule } from './DefaultRule'

/**
 * Gerenciador de regras de repositório
 */
export class RuleManager {
  private rules: RepositoryRule[]

  constructor(rules?: RepositoryRule[]) {
    this.rules = rules || [
      new PelicanEggsRule(),
      new DefaultRule()
    ]
  }

  /**
   * Adiciona uma nova regra
   */
  public addRule(rule: RepositoryRule): void {
    this.rules.unshift(rule)
  }

  /**
   * Obtém a regra apropriada para um repositório
   */
  public getRule(authorRepo: string): RepositoryRule {
    const rule = this.rules.find(r => r.matches(authorRepo))
    return rule || this.rules[this.rules.length - 1]
  }

  /**
   * Obtém o tipo de egg baseado no path e nas regras do repositório
   */
  public getEggType(path: string, authorRepo: string, repoName: string): string {
    const rule = this.getRule(authorRepo)
    return rule.getType(path, repoName)
  }

  /**
   * Obtém os padrões de arquivos a serem ignorados para um repositório
   */
  public getIgnorePatterns(authorRepo: string): string[] {
    const rule = this.getRule(authorRepo)
    return rule.getIgnorePatterns()
  }
}

/**
 * Instância singleton do gerenciador de regras
 */
export const ruleManager = new RuleManager()

