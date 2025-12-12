import { BaseProvider } from './BaseProvider'
import { DefaultProvider } from './DefaultProvider'
import { PelicanEggsProvider } from '@/providers/PelicanEggsProvider'
import { Ashu11AProvider } from '@/providers/Ashu11AProvider'

/**
 * Registro de todos os providers de repositórios
 */
export class ProviderRegistry {
  private providers: BaseProvider[] = []

  constructor() {
    this.registerDefaultProviders()
  }

  /**
   * Registra os providers padrão
   */
  private registerDefaultProviders(): void {
    // Pelican Eggs - múltiplos repositórios
    this.providers.push(
      new PelicanEggsProvider('chatbots'),
      new PelicanEggsProvider('database'),
      new PelicanEggsProvider('games-standalone'),
      new PelicanEggsProvider('games-steamcmd'),
      new PelicanEggsProvider('generic'),
      new PelicanEggsProvider('minecraft'),
      new PelicanEggsProvider('monitoring'),
      new PelicanEggsProvider('software'),
      new PelicanEggsProvider('voice')
    )

    // Provider específico para Ashu11-A/Ashu_eggs
    this.providers.push(
      new Ashu11AProvider()
    )

    // Outros repositórios com provider genérico
    this.providers.push(
      new DefaultProvider('DanBot-Hosting/pterodactyl-eggs'),
      new DefaultProvider('Draakoor/codptero'),
      new DefaultProvider('drylian/Eggs'),
      new DefaultProvider('GeyserMC/pterodactyl-stuff', 'master'),
      new DefaultProvider('gOOvER/own-pterodactyl-eggs'),
      new DefaultProvider('kry008/pterodactyl-io-ARM-eggs'),
      new DefaultProvider('QuintenQVD0/Q_eggs'),
      new DefaultProvider('Sigma-Production/ptero-eggs'),
      new DefaultProvider('ysdragon/Pterodactyl-VPS-Egg')
    )
  }

  /**
   * Adiciona um novo provider
   */
  public addProvider(provider: BaseProvider): void {
    this.providers.push(provider)
  }

  /**
   * Obtém todos os providers registrados
   */
  public getAllProviders(): BaseProvider[] {
    return this.providers
  }

  /**
   * Obtém providers por autor (para consolidar múltiplos repos do mesmo autor)
   */
  public getProvidersByAuthor(author: string): BaseProvider[] {
    return this.providers.filter(provider => provider.getAuthor() === author)
  }

  /**
   * Obtém um provider específico para um repositório
   */
  public getProviderForRepo(authorRepo: string): BaseProvider | undefined {
    return this.providers.find(provider => provider.matches(authorRepo))
  }

  /**
   * Obtém todos os autores únicos
   */
  public getUniqueAuthors(): string[] {
    const authors = new Set<string>()
    this.providers.forEach(provider => authors.add(provider.getAuthor()))
    return Array.from(authors)
  }
}

/**
 * Instância singleton do registro de providers
 */
export const providerRegistry = new ProviderRegistry()
