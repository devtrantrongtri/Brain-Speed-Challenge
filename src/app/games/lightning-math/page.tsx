"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Zap, Calculator } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import BaseGame, { BaseGameState, GameStats, GameSettings } from "@/components/game/BaseGame"
import GameResult from "@/components/game/GameResult"
import { audioManager } from "@/lib/audio-manager"
import { LightningMathManager } from "@/lib/game-manager"

interface LightningMathState extends BaseGameState {
  currentProblem: { expression: string; answer: number } | null
  userAnswer: string
  gameManager: LightningMathManager | null
}

export default function LightningMathGame() {
  const [gameState, setGameState] = useState<LightningMathState>({
    phase: "idle",
    stats: {
      score: 0,
      level: 1,
      streak: 0,
      accuracy: 0,
      timeElapsed: 0,
      bestScore: parseInt(localStorage.getItem('lightning-math-best-score') || '0')
    },
    settings: {
      timeLimit: 5000, // 5 seconds per problem
      difficulty: "auto",
      soundEnabled: true,
      showHints: false
    },
    timeLeft: 5000,
    isCorrect: null,
    currentRound: 1,
    maxRounds: 20,
    currentProblem: null,
    userAnswer: "",
    gameManager: null
  })

  const [startTime, setStartTime] = useState<number>(0)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (gameState.phase === "playing" && gameState.timeLeft > 0 && gameState.gameManager) {
      interval = setInterval(() => {
        const newTimeLeft = gameState.timeLeft - 100
        gameState.gameManager.updateTimeLeft(newTimeLeft)
        
        setGameState(prev => ({
          ...prev,
          timeLeft: newTimeLeft,
          stats: {
            ...prev.stats,
            timeElapsed: Date.now() - startTime
          }
        }))

        if (newTimeLeft <= 0) {
          handleTimeUp()
        }
      }, 100)
    }

    return () => clearInterval(interval)
  }, [gameState.phase, gameState.timeLeft, gameState.gameManager, startTime])

  const startGame = useCallback(() => {
    const config = {
      timeLimit: gameState.settings.timeLimit || 5000,
      maxRounds: gameState.maxRounds,
      difficulty: gameState.settings.difficulty,
      soundEnabled: gameState.settings.soundEnabled,
      showHints: gameState.settings.showHints
    }
    
    const manager = new LightningMathManager(config)
    manager.startGame()
    
    const problem = manager.generateChallenge()
    const now = Date.now()
    setStartTime(now)
    
    setGameState(prev => ({
      ...prev,
      phase: "playing",
      gameManager: manager,
      currentProblem: problem,
      userAnswer: "",
      timeLeft: config.timeLimit,
      stats: {
        ...prev.stats,
        score: 0,
        streak: 0,
        timeElapsed: 0
      }
    }))

    audioManager.playSound('countdown')
  }, [gameState.settings, gameState.maxRounds])

  const handleTimeUp = useCallback(() => {
    if (!gameState.gameManager) return
    
    const result = gameState.gameManager.submitAnswer(null)
    setGameState(prev => ({
      ...prev,
      isCorrect: false
    }))

    setTimeout(() => {
      nextProblem()
    }, 1000)
  }, [gameState.gameManager])

  const submitAnswer = useCallback(() => {
    if (!gameState.gameManager || !gameState.currentProblem || !gameState.userAnswer.trim()) return

    const userNum = parseInt(gameState.userAnswer)
    const result = gameState.gameManager.submitAnswer(userNum)
    
    setGameState(prev => ({
      ...prev,
      userAnswer: "",
      isCorrect: result.isCorrect,
      stats: {
        ...prev.stats,
        score: prev.gameManager?.getScore() || 0,
        streak: prev.gameManager?.getStreak() || 0
      }
    }))

    setTimeout(() => {
      nextProblem()
    }, 1000)
  }, [gameState.gameManager, gameState.currentProblem, gameState.userAnswer])

  const nextProblem = useCallback(() => {
    if (!gameState.gameManager) return

    const canContinue = gameState.gameManager.nextRound()
    
    if (!canContinue) {
      endGame()
      return
    }

    const problem = gameState.gameManager.generateChallenge()
    setGameState(prev => ({
      ...prev,
      currentProblem: problem,
      userAnswer: "",
      timeLeft: prev.settings.timeLimit || 5000,
      currentRound: prev.gameManager?.getCurrentRound() || 1,
      isCorrect: null,
      stats: {
        ...prev.stats,
        level: prev.gameManager?.getCurrentLevel() || 1
      }
    }))
  }, [gameState.gameManager])

  const endGame = useCallback(() => {
    if (!gameState.gameManager) return

    const result = gameState.gameManager.endGame()
    const accuracy = gameState.currentRound > 1 ? (gameState.stats.score / (gameState.currentRound - 1)) * 100 : 0
    
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
      localStorage.setItem('lightning-math-best-score', result.score.toString())
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
      currentProblem: null,
      userAnswer: "",
      gameManager: null,
      currentRound: 1,
      timeLeft: prev.settings.timeLimit || 5000,
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && gameState.phase === "playing") {
      submitAnswer()
    }
  }

  // Result phase
  if (gameState.phase === "result") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-4">
        <div className="container mx-auto py-8">
          <GameResult
            title="Lightning Math"
            isVictory={gameState.stats.accuracy >= 70}
            stats={gameState.stats}
            previousBest={{
              score: gameState.stats.bestScore,
              accuracy: 0,
              level: 1
            }}
            onPlayAgain={resetGame}
            colorScheme={{
              primary: "bg-orange-500",
              secondary: "bg-orange-100",
              accent: "bg-red-100"
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <BaseGame
      gameTitle="Lightning Math"
      gameIcon={<Calculator className="h-8 w-8" />}
      gameDescription="Giải toán nhanh trong thời gian giới hạn. Mỗi câu có 5 giây!"
      onGameStart={startGame}
      onGamePause={pauseGame}
      onGameResume={resumeGame}
      onGameReset={resetGame}
      onGameEnd={endGame}
      gameState={gameState}
      colorScheme={{
        primary: "bg-orange-500",
        secondary: "bg-orange-100",
        accent: "bg-red-100"
      }}
      showTimer={true}
      showProgress={true}
      enablePause={true}
    >
      {/* Game Content */}
      <AnimatePresence mode="wait">
        {gameState.phase === "playing" && gameState.currentProblem && (
          <motion.div
            key="game-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-8"
          >
            {/* Problem Display */}
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="text-6xl font-bold text-gray-800 mb-6">
                {gameState.currentProblem.expression}
              </div>
              
              {/* Answer Input */}
              <div className="flex justify-center">
                <Input
                  type="number"
                  placeholder="Nhập đáp án..."
                  value={gameState.userAnswer}
                  onChange={(e) => setGameState(prev => ({ ...prev, userAnswer: e.target.value }))}
                  onKeyPress={handleKeyPress}
                  className="text-center text-2xl font-bold w-48 h-16"
                  autoFocus
                />
              </div>

              <Button
                onClick={submitAnswer}
                disabled={!gameState.userAnswer.trim()}
                className="mt-6 bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg"
              >
                <Zap className="h-5 w-5 mr-2" />
                Xác nhận
              </Button>
            </div>

            {/* Game Info */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{gameState.stats.score}</div>
                <div className="text-sm text-gray-600">Điểm</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{gameState.stats.streak}</div>
                <div className="text-sm text-gray-600">Streak</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{gameState.stats.level}</div>
                <div className="text-sm text-gray-600">Level</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{gameState.currentRound}/{gameState.maxRounds}</div>
                <div className="text-sm text-gray-600">Câu</div>
              </div>
            </div>

            {/* Feedback */}
            {gameState.isCorrect !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-2xl font-bold ${
                  gameState.isCorrect ? "text-green-600" : "text-red-600"
                }`}
              >
                {gameState.isCorrect ? "Chính xác! 🎉" : "Sai rồi! 😞"}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </BaseGame>
  )
}
