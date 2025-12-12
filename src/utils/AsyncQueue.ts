/**
 * Fila assíncrona com limite de concorrência
 * Permite processar tarefas com um número máximo de execuções simultâneas
 */
export class AsyncQueue {
  private queue: Array<() => Promise<void>> = []
  private running = 0
  private readonly concurrency: number

  constructor(concurrency: number = 5) {
    this.concurrency = concurrency
  }

  /**
   * Adiciona uma tarefa à fila
   */
  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      
      this.processNext()
    })
  }

  /**
   * Processa a próxima tarefa da fila se houver espaço
   */
  private async processNext(): Promise<void> {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return
    }

    const task = this.queue.shift()
    if (!task) return

    this.running++
    
    try {
      await task()
    } finally {
      this.running--
      this.processNext()
    }
  }

  /**
   * Aguarda todas as tarefas serem concluídas
   */
  async waitAll(): Promise<void> {
    while (this.running > 0 || this.queue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  /**
   * Retorna o número de tarefas em execução
   */
  getRunningCount(): number {
    return this.running
  }

  /**
   * Retorna o número de tarefas na fila
   */
  getQueuedCount(): number {
    return this.queue.length
  }
}
