export interface AudioSettings {
  masterVolume: number
  soundEffects: boolean
  backgroundMusic: boolean
  voiceChat: boolean
}

export interface SoundDefinition {
  url: string
  volume: number
  loop?: boolean
  preload?: boolean
}

export type SoundType = 
  | 'correct-answer'
  | 'wrong-answer' 
  | 'timer-warning'
  | 'time-up'
  | 'button-click'
  | 'combo-streak'
  | 'match-found'
  | 'countdown'
  | 'victory'
  | 'defeat'
  | 'opponent-joined'
  | 'level-up'
  | 'power-up'
  | 'page-transition'
  | 'notification'
  | 'background-music'
  | 'battle-music'

class AudioManager {
  private audioContext: AudioContext | null = null
  private sounds: Map<SoundType, HTMLAudioElement[]> = new Map()
  private settings: AudioSettings = {
    masterVolume: 0.75,
    soundEffects: true,
    backgroundMusic: true,
    voiceChat: false
  }
  private backgroundMusic: HTMLAudioElement | null = null
  private isInitialized = false

  private soundDefinitions: Record<SoundType, SoundDefinition> = {
    'correct-answer': { url: '/sounds/correct-ding.mp3', volume: 0.6 },
    'wrong-answer': { url: '/sounds/wrong-buzz.mp3', volume: 0.5 },
    'timer-warning': { url: '/sounds/timer-tick.mp3', volume: 0.7 },
    'time-up': { url: '/sounds/time-up-bell.mp3', volume: 0.8 },
    'button-click': { url: '/sounds/button-click.mp3', volume: 0.4 },
    'combo-streak': { url: '/sounds/combo-whoosh.mp3', volume: 0.7 },
    'match-found': { url: '/sounds/match-ready.mp3', volume: 0.6 },
    'countdown': { url: '/sounds/countdown-321go.mp3', volume: 0.8 },
    'victory': { url: '/sounds/victory-fanfare.mp3', volume: 0.7 },
    'defeat': { url: '/sounds/defeat-aww.mp3', volume: 0.6 },
    'opponent-joined': { url: '/sounds/notification-ping.mp3', volume: 0.5 },
    'level-up': { url: '/sounds/level-up-achievement.mp3', volume: 0.8 },
    'power-up': { url: '/sounds/power-up-magic.mp3', volume: 0.7 },
    'page-transition': { url: '/sounds/page-swoosh.mp3', volume: 0.3 },
    'notification': { url: '/sounds/notification-gentle.mp3', volume: 0.5 },
    'background-music': { url: '/sounds/background-lofi.mp3', volume: 0.3, loop: true },
    'battle-music': { url: '/sounds/battle-intense.mp3', volume: 0.4, loop: true }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Initialize Audio Context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Load settings from localStorage
      const savedSettings = localStorage.getItem('audio-settings')
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) }
      }

      // Preload critical sounds
      await this.preloadSounds([
        'correct-answer', 
        'wrong-answer', 
        'button-click', 
        'timer-warning',
        'background-music'
      ])

      this.isInitialized = true
    } catch (error) {
      console.warn('Audio initialization failed:', error)
    }
  }

  private async preloadSounds(soundTypes: SoundType[]): Promise<void> {
    const loadPromises = soundTypes.map(async (type) => {
      try {
        const audio = await this.createAudioElement(type)
        if (!this.sounds.has(type)) {
          this.sounds.set(type, [])
        }
        this.sounds.get(type)!.push(audio)
      } catch (error) {
        console.warn(`Failed to preload sound: ${type}`, error)
      }
    })

    await Promise.allSettled(loadPromises)
  }

  private async createAudioElement(type: SoundType): Promise<HTMLAudioElement> {
    const definition = this.soundDefinitions[type]
    const audio = new Audio()
    
    return new Promise((resolve, reject) => {
      audio.addEventListener('canplaythrough', () => resolve(audio), { once: true })
      audio.addEventListener('error', reject, { once: true })
      
      audio.src = definition.url
      audio.volume = definition.volume * this.settings.masterVolume
      audio.loop = definition.loop || false
      audio.preload = 'auto'
    })
  }

  async playSound(type: SoundType, options?: { volume?: number, interrupt?: boolean }): Promise<void> {
    if (!this.settings.soundEffects && !['background-music', 'battle-music'].includes(type)) {
      return
    }

    if (!this.settings.backgroundMusic && ['background-music', 'battle-music'].includes(type)) {
      return
    }

    try {
      let audioElement: HTMLAudioElement

      // Get or create audio element
      const existingSounds = this.sounds.get(type)
      if (existingSounds && existingSounds.length > 0) {
        // Find available audio element (not playing)
        audioElement = existingSounds.find(audio => audio.paused) || existingSounds[0]
      } else {
        audioElement = await this.createAudioElement(type)
        if (!this.sounds.has(type)) {
          this.sounds.set(type, [])
        }
        this.sounds.get(type)!.push(audioElement)
      }

      // Stop current playback if interrupt is true
      if (options?.interrupt && !audioElement.paused) {
        audioElement.pause()
        audioElement.currentTime = 0
      }

      // Set volume
      const definition = this.soundDefinitions[type]
      const volume = (options?.volume || definition.volume) * this.settings.masterVolume
      audioElement.volume = Math.max(0, Math.min(1, volume))

      // Play audio
      audioElement.currentTime = 0
      await audioElement.play()

    } catch (error) {
      console.warn(`Failed to play sound: ${type}`, error)
    }
  }

  playBackgroundMusic(type: 'background-music' | 'battle-music' = 'background-music'): void {
    if (!this.settings.backgroundMusic) return

    // Stop current background music
    this.stopBackgroundMusic()

    // Start new background music
    this.playSound(type, { interrupt: true }).then(() => {
      const sounds = this.sounds.get(type)
      if (sounds && sounds.length > 0) {
        this.backgroundMusic = sounds[0]
      }
    })
  }

  stopBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause()
      this.backgroundMusic.currentTime = 0
      this.backgroundMusic = null
    }
  }

  updateSettings(newSettings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
    
    // Save to localStorage
    localStorage.setItem('audio-settings', JSON.stringify(this.settings))

    // Update volume for all loaded sounds
    this.sounds.forEach((audioElements, type) => {
      const definition = this.soundDefinitions[type]
      audioElements.forEach(audio => {
        audio.volume = definition.volume * this.settings.masterVolume
      })
    })

    // Handle background music toggle
    if (!this.settings.backgroundMusic && this.backgroundMusic) {
      this.stopBackgroundMusic()
    }
  }

  getSettings(): AudioSettings {
    return { ...this.settings }
  }

  // Utility methods for common game actions
  playCorrectAnswer(streak: number = 0): void {
    if (streak > 5) {
      this.playSound('combo-streak')
    } else {
      this.playSound('correct-answer')
    }
  }

  playWrongAnswer(): void {
    this.playSound('wrong-answer')
  }

  playTimerWarning(): void {
    this.playSound('timer-warning')
  }

  playButtonClick(): void {
    this.playSound('button-click')
  }

  playLevelUp(): void {
    this.playSound('level-up')
  }

  playCountdown(): void {
    this.playSound('countdown')
  }

  playVictory(): void {
    this.playSound('victory')
  }

  playDefeat(): void {
    this.playSound('defeat')
  }

  // Clean up resources
  dispose(): void {
    this.stopBackgroundMusic()
    this.sounds.clear()
    
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}

// Singleton instance
export const audioManager = new AudioManager()

// Initialize audio on first user interaction
let isAudioInitialized = false

export const initializeAudioOnUserInteraction = (): void => {
  if (isAudioInitialized) return

  const initAudio = async () => {
    await audioManager.initialize()
    audioManager.playBackgroundMusic()
    isAudioInitialized = true
    
    // Remove event listeners
    document.removeEventListener('click', initAudio)
    document.removeEventListener('keydown', initAudio)
    document.removeEventListener('touchstart', initAudio)
  }

  // Add event listeners for user interaction
  document.addEventListener('click', initAudio, { once: true })
  document.addEventListener('keydown', initAudio, { once: true })
  document.addEventListener('touchstart', initAudio, { once: true })
}

// Auto-initialize audio system
if (typeof window !== 'undefined') {
  initializeAudioOnUserInteraction()
} 