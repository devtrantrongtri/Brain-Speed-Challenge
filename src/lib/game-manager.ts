import { audioManager } from './audio-manager'

export interface GameConfig {
  timeLimit: number
  maxRounds: number
  difficulty: 'easy' | 'medium' | 'hard' | 'auto'
  soundEnabled: boolean
  showHints: boolean
}

export interface GameResult {
  score: number
  accuracy: number
  timeElapsed: number
  level: number
  streak: number
  isVictory: boolean
}

export abstract class BaseGameManager {
  protected config: GameConfig
  protected startTime: number = 0
  protected currentRound: number = 1
  protected score: number = 0
  protected streak: number = 0
  protected gameActive: boolean = false
  protected timeLeft: number = 0

  constructor(config: GameConfig) {
    this.config = config
    this.timeLeft = config.timeLimit
  }

  // Abstract methods that must be implemented by subclasses
  abstract generateChallenge(): any
  abstract checkAnswer(userAnswer: any): boolean
  abstract calculateScore(isCorrect: boolean, timeUsed: number): number
  abstract getGameType(): string

  // Common game management methods
  startGame(): void {
    this.gameActive = true
    this.startTime = Date.now()
    this.currentRound = 1
    this.score = 0
    this.streak = 0
    this.timeLeft = this.config.timeLimit

    if (this.config.soundEnabled) {
      audioManager.playSound('countdown')
    }
  }

  pauseGame(): void {
    this.gameActive = false
  }

  resumeGame(): void {
    this.gameActive = true
  }

  endGame(): GameResult {
    this.gameActive = false
    const timeElapsed = Date.now() - this.startTime
    const accuracy = this.calculateAccuracy()
    const isVictory = accuracy >= 70

    const result: GameResult = {
      score: this.score,
      accuracy,
      timeElapsed,
      level: this.getCurrentLevel(),
      streak: this.streak,
      isVictory
    }

    // Play victory/defeat sound
    if (this.config.soundEnabled) {
      if (isVictory) {
        audioManager.playVictory()
      } else {
        audioManager.playDefeat()
      }
    }

    return result
  }

  submitAnswer(userAnswer: any): { isCorrect: boolean; points: number } {
    if (!this.gameActive) {
      return { isCorrect: false, points: 0 }
    }

    const isCorrect = this.checkAnswer(userAnswer)
    const timeUsed = this.config.timeLimit - this.timeLeft
    const points = this.calculateScore(isCorrect, timeUsed)

    if (isCorrect) {
      this.score += points
      this.streak += 1
      
      if (this.config.soundEnabled) {
        audioManager.playCorrectAnswer(this.streak)
      }
    } else {
      this.streak = 0
      
      if (this.config.soundEnabled) {
        audioManager.playWrongAnswer()
      }
    }

    return { isCorrect, points }
  }

  nextRound(): boolean {
    if (this.currentRound >= this.config.maxRounds) {
      return false // Game should end
    }

    this.currentRound += 1
    this.timeLeft = this.config.timeLimit

    // Level up sound every few rounds
    if (this.currentRound % 3 === 0 && this.config.soundEnabled) {
      audioManager.playLevelUp()
    }

    return true // Continue game
  }

  updateTimeLeft(newTime: number): void {
    this.timeLeft = Math.max(0, newTime)
    
    // Timer warning
    if (this.timeLeft <= 3000 && this.timeLeft > 2900 && this.config.soundEnabled) {
      audioManager.playTimerWarning()
    }
    
    // Time up
    if (this.timeLeft <= 0 && this.gameActive && this.config.soundEnabled) {
      audioManager.playSound('time-up')
    }
  }

  // Getters
  getCurrentLevel(): number {
    return Math.floor((this.currentRound - 1) / 3) + 1
  }

  getScore(): number {
    return this.score
  }

  getStreak(): number {
    return this.streak
  }

  getCurrentRound(): number {
    return this.currentRound
  }

  getTimeLeft(): number {
    return this.timeLeft
  }

  isActive(): boolean {
    return this.gameActive
  }

  getConfig(): GameConfig {
    return { ...this.config }
  }

  // Protected helper methods
  protected calculateAccuracy(): number {
    // This is a basic implementation, can be overridden by subclasses
    const totalAttempts = this.currentRound - 1
    if (totalAttempts === 0) return 0
    
    // Estimate based on current streak and round progression
    return Math.min(100, (this.streak / totalAttempts) * 100)
  }

  protected getBaseDifficulty(): number {
    switch (this.config.difficulty) {
      case 'easy': return 1
      case 'medium': return 2
      case 'hard': return 3
      case 'auto': return Math.min(Math.floor(this.currentRound / 3) + 1, 4)
      default: return 1
    }
  }

  protected saveScore(gameType: string): void {
    const key = `${gameType}-best-score`
    const currentBest = parseInt(localStorage.getItem(key) || '0')
    
    if (this.score > currentBest) {
      localStorage.setItem(key, this.score.toString())
    }
  }
}

// Lightning Math Game Manager
export class LightningMathManager extends BaseGameManager {
  private currentProblem: { expression: string; answer: number } | null = null

  generateChallenge(): { expression: string; answer: number } {
    const difficulty = this.getBaseDifficulty()
    const maxNum = Math.min(5 + difficulty * 2, 20)

    if (difficulty <= 2) {
      // Simple operations
      const a = Math.floor(Math.random() * maxNum) + 1
      const b = Math.floor(Math.random() * maxNum) + 1
      const operations = ['+', '-', '*']
      const op = operations[Math.floor(Math.random() * operations.length)]

      let expression: string
      let answer: number

      switch (op) {
        case '+':
          expression = `${a} + ${b}`
          answer = a + b
          break
        case '-':
          expression = `${Math.max(a, b)} - ${Math.min(a, b)}`
          answer = Math.max(a, b) - Math.min(a, b)
          break
        case '*':
          expression = `${a} × ${b}`
          answer = a * b
          break
        default:
          expression = `${a} + ${b}`
          answer = a + b
      }

      this.currentProblem = { expression, answer }
      return this.currentProblem
    } else {
      // Complex operations
      const a = Math.floor(Math.random() * 15) + 1
      const b = Math.floor(Math.random() * 15) + 1
      const c = Math.floor(Math.random() * 10) + 1

      const expressions = [
        { expr: `${a} × ${b} + ${c}`, ans: a * b + c },
        { expr: `${a} × ${b} - ${c}`, ans: a * b - c },
        { expr: `(${a} + ${b}) × ${c}`, ans: (a + b) * c },
        { expr: `${a * c} + ${b} - ${Math.floor(c / 2)}`, ans: a * c + b - Math.floor(c / 2) },
      ]

      const selected = expressions[Math.floor(Math.random() * expressions.length)]
      this.currentProblem = { expression: selected.expr, answer: selected.ans }
      return this.currentProblem
    }
  }

  checkAnswer(userAnswer: any): boolean {
    if (!this.currentProblem) return false
    const userNum = parseInt(userAnswer.toString())
    return !isNaN(userNum) && userNum === this.currentProblem.answer
  }

  calculateScore(isCorrect: boolean, timeUsed: number): number {
    if (!isCorrect) return 0
    
    const basePoints = 10
    const difficultyBonus = this.getBaseDifficulty() * 10
    const timeBonus = Math.max(0, Math.floor((this.config.timeLimit - timeUsed) / 1000) * 2)
    const streakBonus = this.streak * 5
    
    return basePoints + difficultyBonus + timeBonus + streakBonus
  }

  getGameType(): string {
    return 'lightning-math'
  }

  getCurrentProblem(): { expression: string; answer: number } | null {
    return this.currentProblem
  }
}

// Memory Flash Game Manager
export class MemoryFlashManager extends BaseGameManager {
  private currentSequence: any[] = []
  private sequenceType: 'numbers' | 'colors' | 'shapes' | 'mixed' = 'numbers'

  generateChallenge(): any[] {
    const difficulty = this.getBaseDifficulty()
    const length = Math.min(4 + Math.floor(difficulty * 1.5), 12)
    
    // Determine sequence type based on level
    if (difficulty <= 2) this.sequenceType = 'numbers'
    else if (difficulty <= 3) this.sequenceType = 'colors'
    else this.sequenceType = 'mixed'

    this.currentSequence = this.generateSequence(length, this.sequenceType)
    return this.currentSequence
  }

  checkAnswer(userSequence: any[]): boolean {
    if (userSequence.length !== this.currentSequence.length) return false
    
    return userSequence.every((item, index) => {
      const original = this.currentSequence[index]
      return JSON.stringify(item) === JSON.stringify(original)
    })
  }

  calculateScore(isCorrect: boolean, timeUsed: number): number {
    if (!isCorrect) return 0
    
    const basePoints = this.currentSequence.length * 10
    const difficultyBonus = this.getBaseDifficulty() * 20
    const streakBonus = this.streak * 10
    
    return basePoints + difficultyBonus + streakBonus
  }

  getGameType(): string {
    return 'memory-flash'
  }

  getCurrentSequence(): any[] {
    return [...this.currentSequence]
  }

  getSequenceType(): string {
    return this.sequenceType
  }

  private generateSequence(length: number, type: string): any[] {
    const sequence = []
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange']
    const shapes = ['circle', 'square', 'triangle', 'diamond', 'star']

    for (let i = 0; i < length; i++) {
      switch (type) {
        case 'numbers':
          sequence.push(Math.floor(Math.random() * 9) + 1)
          break
        case 'colors':
          sequence.push({
            id: i,
            value: i + 1,
            color: colors[Math.floor(Math.random() * colors.length)]
          })
          break
        case 'shapes':
          sequence.push({
            id: i,
            value: i + 1,
            shape: shapes[Math.floor(Math.random() * shapes.length)]
          })
          break
        case 'mixed':
          const useColor = Math.random() > 0.5
          sequence.push({
            id: i,
            value: Math.floor(Math.random() * 9) + 1,
            color: useColor ? colors[Math.floor(Math.random() * colors.length)] : undefined,
            shape: !useColor ? shapes[Math.floor(Math.random() * shapes.length)] : undefined
          })
          break
      }
    }

    return sequence
  }
}

// Game Manager Factory
export class GameManagerFactory {
  static createManager(gameType: string, config: GameConfig): BaseGameManager {
    switch (gameType) {
      case 'lightning-math':
        return new LightningMathManager(config)
      case 'memory-flash':
        return new MemoryFlashManager(config)
      // Add more game types here
      default:
        throw new Error(`Unknown game type: ${gameType}`)
    }
  }
}

// Statistics Tracker
export class GameStatistics {
  private stats: Map<string, any> = new Map()

  constructor() {
    this.loadFromStorage()
  }

  recordGame(gameType: string, result: GameResult): void {
    const gameStats = this.stats.get(gameType) || {
      gamesPlayed: 0,
      totalScore: 0,
      bestScore: 0,
      totalAccuracy: 0,
      bestStreak: 0,
      averageTime: 0,
      victories: 0
    }

    gameStats.gamesPlayed += 1
    gameStats.totalScore += result.score
    gameStats.bestScore = Math.max(gameStats.bestScore, result.score)
    gameStats.totalAccuracy = (gameStats.totalAccuracy * (gameStats.gamesPlayed - 1) + result.accuracy) / gameStats.gamesPlayed
    gameStats.bestStreak = Math.max(gameStats.bestStreak, result.streak)
    gameStats.averageTime = (gameStats.averageTime * (gameStats.gamesPlayed - 1) + result.timeElapsed) / gameStats.gamesPlayed
    if (result.isVictory) gameStats.victories += 1

    this.stats.set(gameType, gameStats)
    this.saveToStorage()
  }

  getStats(gameType: string): any {
    return this.stats.get(gameType) || {
      gamesPlayed: 0,
      totalScore: 0,
      bestScore: 0,
      totalAccuracy: 0,
      bestStreak: 0,
      averageTime: 0,
      victories: 0
    }
  }

  getAllStats(): Map<string, any> {
    return new Map(this.stats)
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('game-statistics')
      if (saved) {
        const parsed = JSON.parse(saved)
        this.stats = new Map(Object.entries(parsed))
      }
    } catch (error) {
      console.warn('Failed to load game statistics:', error)
    }
  }

  private saveToStorage(): void {
    try {
      const obj = Object.fromEntries(this.stats)
      localStorage.setItem('game-statistics', JSON.stringify(obj))
    } catch (error) {
      console.warn('Failed to save game statistics:', error)
    }
  }
}

// Global statistics instance
export const gameStatistics = new GameStatistics() 