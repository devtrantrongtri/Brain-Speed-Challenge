"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Brain, Shapes, Grid3X3 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import BaseGame, { BaseGameState, GameStats, GameSettings } from "@/components/game/BaseGame"
import GameResult from "@/components/game/GameResult"
import { audioManager } from "@/lib/audio-manager"
import { MemoryFlashManager } from "@/lib/game-manager"

interface MemoryItem {
  id: number
  value: string | number
  color?: string
  shape?: string
}

interface MemoryFlashState extends BaseGameState {
  sequence: MemoryItem[]
  userSequence: MemoryItem[]
  currentPhase: "ready" | "showing" | "input" | "result"
  showTime: number
  sequenceType: "numbers" | "colors" | "shapes" | "mixed"
  gameManager: MemoryFlashManager | null
}

const colors = ["red", "blue", "green", "yellow", "purple", "orange", "pink", "cyan"]
const shapes = ["circle", "square", "triangle", "diamond", "star", "heart"]

export default function MemoryFlashGame() {
  const [gameState, setGameState] = useState<MemoryFlashState>({
    phase: "idle",
    stats: {
      score: 0,
      level: 1,
      streak: 0,
      accuracy: 0,
      timeElapsed: 0,
      bestScore: parseInt(localStorage.getItem('memory-flash-best-score') || '0')
    },
    settings: {
      timeLimit: 3000, // 3 seconds to memorize
      difficulty: "auto",
      soundEnabled: true,
      showHints: true
    },
    timeLeft: 3000,
    isCorrect: null,
    currentRound: 1,
    maxRounds: 15,
    sequence: [],
    userSequence: [],
    currentPhase: "ready",
    showTime: 3000,
    sequenceType: "numbers",
    gameManager: null
  })

  const [startTime, setStartTime] = useState<number>(0)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (gameState.currentPhase === "showing" && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 100)
      }, 100)
    } else if (gameState.currentPhase === "showing" && countdown <= 0) {
      setGameState(prev => ({ ...prev, currentPhase: "input" }))
    }

    return () => clearInterval(interval)
  }, [gameState.currentPhase, countdown])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (gameState.phase === "playing") {
      interval = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            timeElapsed: Date.now() - startTime
          }
        }))
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [gameState.phase, startTime])

  const startGame = useCallback(() => {
    const config = {
      timeLimit: gameState.settings.timeLimit || 3000,
      maxRounds: gameState.maxRounds,
      difficulty: gameState.settings.difficulty,
      soundEnabled: gameState.settings.soundEnabled,
      showHints: gameState.settings.showHints
    }
    
    const manager = new MemoryFlashManager(config)
    manager.startGame()
    
    const sequence = manager.generateChallenge()
    const sequenceType = manager.getSequenceType()
    const now = Date.now()
    setStartTime(now)
    
    setGameState(prev => ({
      ...prev,
      phase: "playing",
      gameManager: manager,
      sequence: sequence,
      userSequence: [],
      currentPhase: "showing",
      sequenceType: sequenceType as "numbers" | "colors" | "shapes" | "mixed",
      showTime: config.timeLimit,
      stats: {
        ...prev.stats,
        score: 0,
        streak: 0,
        timeElapsed: 0
      }
    }))

    setCountdown(config.timeLimit)
    audioManager.playSound('countdown')
  }, [gameState.settings, gameState.maxRounds])

  const handleItemClick = useCallback((item: MemoryItem) => {
    if (gameState.currentPhase !== "input" || !gameState.gameManager) return

    const newUserSequence = [...gameState.userSequence, item]
    setGameState(prev => ({ ...prev, userSequence: newUserSequence }))

    // Check if sequence is complete
    if (newUserSequence.length === gameState.sequence.length) {
      checkAnswer(newUserSequence)
    }
  }, [gameState.currentPhase, gameState.gameManager, gameState.userSequence, gameState.sequence])

  const checkAnswer = useCallback((userSequence: MemoryItem[]) => {
    if (!gameState.gameManager) return

    const result = gameState.gameManager.submitAnswer(userSequence)
    
    setGameState(prev => ({
      ...prev,
      currentPhase: "result",
      isCorrect: result.isCorrect,
      stats: {
        ...prev.stats,
        score: prev.gameManager?.getScore() || 0,
        streak: prev.gameManager?.getStreak() || 0
      }
    }))

    // Auto continue after 2 seconds
    setTimeout(() => {
      if (result.isCorrect) {
        nextRound()
      } else {
        endGame()
      }
    }, 2000)
  }, [gameState.gameManager])

  const nextRound = useCallback(() => {
    if (!gameState.gameManager) return

    const canContinue = gameState.gameManager.nextRound()
    
    if (!canContinue) {
      endGame()
      return
    }

    const sequence = gameState.gameManager.generateChallenge()
    const sequenceType = gameState.gameManager.getSequenceType()
    
    setGameState(prev => ({
      ...prev,
      sequence: sequence,
      userSequence: [],
      currentPhase: "showing",
      sequenceType: sequenceType as "numbers" | "colors" | "shapes" | "mixed",
      currentRound: prev.gameManager?.getCurrentRound() || 1,
      isCorrect: null,
      stats: {
        ...prev.stats,
        level: prev.gameManager?.getCurrentLevel() || 1
      }
    }))

    setCountdown(gameState.showTime)
  }, [gameState.gameManager, gameState.showTime])

  const endGame = useCallback(() => {
    if (!gameState.gameManager) return

    const result = gameState.gameManager.endGame()
    const accuracy = gameState.currentRound > 1 ? (gameState.stats.score / (gameState.currentRound - 1)) * 10 : 0
    
    setGameState(prev => ({
      ...prev,
      phase: "result",
      stats: {
        ...prev.stats,
        accuracy: Math.min(100, accuracy),
        timeElapsed: Date.now() - startTime
      }
    }))

    // Save best score
    if (result.score > gameState.stats.bestScore) {
      localStorage.setItem('memory-flash-best-score', result.score.toString())
    }
  }, [gameState.gameManager, gameState.currentRound, gameState.stats, startTime])

  const pauseGame = useCallback(() => {
    if (!gameState.gameManager) return
    gameState.gameManager.pauseGame()
    setGameState(prev => ({ ...prev, phase: "paused" }))
  }, [gameState.gameManager])

  const resumeGame = useCallback(() => {
    if (!gameState.gameManager) return
    gameState.gameManager.resumeGame()
    setGameState(prev => ({ ...prev, phase: "playing" }))
  }, [gameState.gameManager])

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      phase: "idle",
      sequence: [],
      userSequence: [],
      currentPhase: "ready",
      gameManager: null,
      currentRound: 1,
      timeLeft: prev.settings.timeLimit || 3000,
      isCorrect: null,
      stats: {
        ...prev.stats,
        score: 0,
        streak: 0,
        accuracy: 0,
        timeElapsed: 0
      }
    }))
  }, [])

  const renderMemoryItem = (item: MemoryItem, index: number, isClickable = false) => {
    const getItemDisplay = () => {
      if (item.color && !item.shape) {
        return (
          <div 
            className={`w-16 h-16 rounded-lg border-2 border-gray-300 flex items-center justify-center text-2xl font-bold text-white`}
            style={{ backgroundColor: item.color }}
          >
            {item.value}
          </div>
        )
      }
      
      if (item.shape && !item.color) {
        return (
          <div className="w-16 h-16 rounded-lg border-2 border-gray-300 bg-gray-100 flex items-center justify-center">
            {item.shape === "circle" && <div className="w-12 h-12 rounded-full bg-gray-600" />}
            {item.shape === "square" && <div className="w-12 h-12 bg-gray-600" />}
            {item.shape === "triangle" && <div className="w-0 h-0 border-l-6 border-r-6 border-b-12 border-transparent border-b-gray-600" />}
            {item.shape === "diamond" && <div className="w-8 h-8 bg-gray-600 transform rotate-45" />}
            {item.shape === "star" && <div className="text-2xl text-gray-600">⭐</div>}
            {item.shape === "heart" && <div className="text-2xl text-red-600">❤️</div>}
          </div>
        )
      }
      
      // Mixed or numbers only
      return (
        <div 
          className={`w-16 h-16 rounded-lg border-2 border-gray-300 flex items-center justify-center text-2xl font-bold ${
            item.color ? 'text-white' : 'text-gray-800 bg-gray-100'
          }`}
          style={{ backgroundColor: item.color || undefined }}
        >
          {item.value}
        </div>
      )
    }

    return (
      <motion.div
        key={`${item.id}-${index}`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: index * 0.1 }}
        className={isClickable ? "cursor-pointer hover:scale-110 transition-transform" : ""}
        onClick={() => isClickable && handleItemClick(item)}
      >
        {getItemDisplay()}
      </motion.div>
    )
  }

  const generateClickableItems = () => {
    // Generate a shuffled array of possible items for the user to click
    const possibleItems: MemoryItem[] = []
    
    if (gameState.sequenceType === "numbers") {
      for (let i = 1; i <= 9; i++) {
        possibleItems.push({ id: i, value: i })
      }
    } else if (gameState.sequenceType === "colors") {
      colors.forEach((color, i) => {
        possibleItems.push({ id: i, value: i + 1, color })
      })
    } else if (gameState.sequenceType === "shapes") {
      shapes.forEach((shape, i) => {
        possibleItems.push({ id: i, value: i + 1, shape })
      })
    } else {
      // Mixed
      for (let i = 1; i <= 6; i++) {
        possibleItems.push({ id: i, value: i })
        if (i <= colors.length) {
          possibleItems.push({ id: i + 10, value: i, color: colors[i - 1] })
        }
        if (i <= shapes.length) {
          possibleItems.push({ id: i + 20, value: i, shape: shapes[i - 1] })
        }
      }
    }
    
    return possibleItems.sort(() => Math.random() - 0.5).slice(0, 12)
  }

  // Result phase
  if (gameState.phase === "result") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="container mx-auto py-8">
          <GameResult
            title="Memory Flash"
            isVictory={gameState.stats.accuracy >= 70}
            stats={gameState.stats}
            previousBest={{
              score: gameState.stats.bestScore,
              accuracy: 0,
              level: 1
            }}
            onPlayAgain={resetGame}
            colorScheme={{
              primary: "bg-blue-500",
              secondary: "bg-blue-100",
              accent: "bg-purple-100"
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <BaseGame
      gameTitle="Memory Flash"
      gameIcon={<Brain className="h-8 w-8" />}
      gameDescription="Ghi nhớ chuỗi màu sắc, hình dạng và số trong thời gian ngắn!"
      onGameStart={startGame}
      onGamePause={pauseGame}
      onGameResume={resumeGame}
      onGameReset={resetGame}
      onGameEnd={endGame}
      gameState={gameState}
      colorScheme={{
        primary: "bg-blue-500",
        secondary: "bg-blue-100",
        accent: "bg-purple-100"
      }}
      showTimer={false}
      showProgress={true}
      enablePause={true}
    >
      {/* Game Content */}
      <AnimatePresence mode="wait">
        {gameState.phase === "playing" && (
          <motion.div
            key="game-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-8"
          >
            {/* Phase Header */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Badge variant="outline" className="text-lg px-4 py-2">
                  Round {gameState.currentRound}/{gameState.maxRounds}
                </Badge>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  Level {gameState.stats.level}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`text-lg px-4 py-2 ${
                    gameState.sequenceType === "numbers" ? "bg-green-100" :
                    gameState.sequenceType === "colors" ? "bg-blue-100" :
                    gameState.sequenceType === "shapes" ? "bg-purple-100" :
                    "bg-yellow-100"
                  }`}
                >
                  {gameState.sequenceType === "numbers" && "Số"}
                  {gameState.sequenceType === "colors" && "Màu sắc"}
                  {gameState.sequenceType === "shapes" && "Hình dạng"}
                  {gameState.sequenceType === "mixed" && "Hỗn hợp"}
                </Badge>
              </div>

              {gameState.currentPhase === "showing" && (
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-blue-600">Ghi nhớ chuỗi này!</h3>
                  <div className="text-lg text-gray-600">
                    Thời gian còn lại: {Math.ceil(countdown / 1000)}s
                  </div>
                </div>
              )}

              {gameState.currentPhase === "input" && (
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-green-600">Chọn theo thứ tự đã ghi nhớ!</h3>
                  <div className="text-lg text-gray-600">
                    Đã chọn: {gameState.userSequence.length}/{gameState.sequence.length}
                  </div>
                </div>
              )}

              {gameState.currentPhase === "result" && (
                <div className="space-y-4">
                  <h3 className={`text-2xl font-bold ${gameState.isCorrect ? "text-green-600" : "text-red-600"}`}>
                    {gameState.isCorrect ? "Chính xác! 🎉" : "Sai rồi! 😞"}
                  </h3>
                  {gameState.isCorrect && gameState.stats.streak > 1 && (
                    <div className="text-lg text-orange-600">Streak x{gameState.stats.streak}!</div>
                  )}
                </div>
              )}
            </div>

            {/* Sequence Display */}
            {gameState.currentPhase === "showing" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl p-8 shadow-lg"
              >
                <div className="grid grid-cols-4 md:grid-cols-6 gap-4 justify-items-center">
                  {gameState.sequence.map((item, index) => renderMemoryItem(item, index, false))}
                </div>
              </motion.div>
            )}

            {/* Input Interface */}
            {gameState.currentPhase === "input" && (
              <div className="space-y-6">
                {/* User's sequence so far */}
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h4 className="text-lg font-semibold mb-4">Chuỗi đã chọn:</h4>
                  <div className="grid grid-cols-6 md:grid-cols-8 gap-2 justify-items-center min-h-20">
                    {gameState.userSequence.map((item, index) => renderMemoryItem(item, index, false))}
                  </div>
                </div>

                {/* Clickable items */}
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h4 className="text-lg font-semibold mb-4">Chọn các mục:</h4>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-4 justify-items-center">
                    {generateClickableItems().map((item, index) => renderMemoryItem(item, index, true))}
                  </div>
                </div>
              </div>
            )}

            {/* Game Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{gameState.stats.score}</div>
                <div className="text-sm text-gray-600">Điểm</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{gameState.stats.streak}</div>
                <div className="text-sm text-gray-600">Streak</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{gameState.stats.level}</div>
                <div className="text-sm text-gray-600">Level</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{gameState.sequence.length}</div>
                <div className="text-sm text-gray-600">Độ dài</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </BaseGame>
  )
}
