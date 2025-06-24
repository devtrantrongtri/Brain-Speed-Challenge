"use client"

import { useState, useEffect, useCallback, ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { Home, RotateCcw, Pause, Play, Settings as SettingsIcon } from "lucide-react"
import Link from "next/link"
import { audioManager } from "@/lib/audio-manager"

export interface GameStats {
  score: number
  level: number
  streak: number
  accuracy: number
  timeElapsed: number
  bestScore: number
}

export interface GameSettings {
  timeLimit?: number
  difficulty: "easy" | "medium" | "hard" | "auto"
  soundEnabled: boolean
  showHints: boolean
}

export interface BaseGameState {
  phase: "idle" | "ready" | "playing" | "paused" | "result" | "gameover"
  stats: GameStats
  settings: GameSettings
  timeLeft: number
  isCorrect: boolean | null
  currentRound: number
  maxRounds: number
}

interface BaseGameProps {
  gameTitle: string
  gameIcon: ReactNode
  gameDescription: string
  children: ReactNode
  onGameStart: () => void
  onGamePause: () => void
  onGameResume: () => void
  onGameReset: () => void
  onGameEnd: () => void
  gameState: BaseGameState
  colorScheme: {
    primary: string
    secondary: string
    accent: string
  }
  showTimer?: boolean
  showProgress?: boolean
  enablePause?: boolean
}

export default function BaseGame({
  gameTitle,
  gameIcon,
  gameDescription,
  children,
  onGameStart,
  onGamePause,
  onGameResume,
  onGameReset,
  onGameEnd,
  gameState,
  colorScheme,
  showTimer = true,
  showProgress = true,
  enablePause = true
}: BaseGameProps) {
  const [showSettings, setShowSettings] = useState(false)

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (gameState.phase === "playing" && gameState.timeLeft > 0) {
      interval = setInterval(() => {
        if (gameState.timeLeft <= 3000 && gameState.timeLeft > 2900) {
          audioManager.playTimerWarning()
        }
      }, 100)
    } else if (gameState.phase === "playing" && gameState.timeLeft <= 0) {
      audioManager.playSound('time-up')
      onGameEnd()
    }

    return () => clearInterval(interval)
  }, [gameState.phase, gameState.timeLeft, onGameEnd])

  const handleStartGame = useCallback(() => {
    audioManager.playButtonClick()
    onGameStart()
  }, [onGameStart])

  const handlePauseGame = useCallback(() => {
    audioManager.playButtonClick()
    if (gameState.phase === "playing") {
      onGamePause()
    } else if (gameState.phase === "paused") {
      onGameResume()
    }
  }, [gameState.phase, onGamePause, onGameResume])

  const handleResetGame = useCallback(() => {
    audioManager.playButtonClick()
    onGameReset()
  }, [onGameReset])

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.ceil(milliseconds / 1000)
    return `${seconds}s`
  }

  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy >= 80) return "text-green-600"
    if (accuracy >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  // Render different phases
  if (gameState.phase === "idle") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/">
                <Button variant="outline" size="icon">
                  <Home className="h-4 w-4" />
                </Button>
              </Link>

              <h1 className="text-xl font-bold">{gameTitle}</h1>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
              >
                <SettingsIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="max-w-2xl mx-auto"
          >
            <Card>
              <CardHeader className="text-center">
                <div className={`mx-auto mb-4 p-4 rounded-full ${colorScheme.primary} text-white w-fit`}>
                  {gameIcon}
                </div>
                <CardTitle className="text-3xl mb-4">{gameTitle}</CardTitle>
                <div className="text-gray-600 space-y-2">
                  <p>{gameDescription}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Game Statistics */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className={`p-4 ${colorScheme.secondary} rounded-lg`}>
                    <div className="text-2xl font-bold">{gameState.stats.bestScore}</div>
                    <div className="text-sm text-gray-600">Điểm cao</div>
                  </div>
                  <div className={`p-4 ${colorScheme.accent} rounded-lg`}>
                    <div className="text-2xl font-bold">{gameState.stats.level}</div>
                    <div className="text-sm text-gray-600">Level</div>
                  </div>
                  <div className={`p-4 bg-gray-100 rounded-lg`}>
                    <div className={`text-2xl font-bold ${getAccuracyColor(gameState.stats.accuracy)}`}>
                      {gameState.stats.accuracy}%
                    </div>
                    <div className="text-sm text-gray-600">Độ chính xác</div>
                  </div>
                </div>

                <Button
                  onClick={handleStartGame}
                  className={`w-full h-16 text-lg ${colorScheme.primary} hover:opacity-90`}
                >
                  <Play className="h-6 w-6 mr-2" />
                  Bắt đầu chơi
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="outline" size="icon">
                <Home className="h-4 w-4" />
              </Button>
            </Link>

            <div className="flex items-center gap-4">
              {/* Game Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Điểm:</span>
                  <Badge variant="secondary">{gameState.stats.score}</Badge>
                </div>
                {gameState.stats.streak > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Streak:</span>
                    <Badge className={colorScheme.primary}>{gameState.stats.streak}</Badge>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-medium">Level:</span>
                  <Badge variant="outline">{gameState.stats.level}</Badge>
                </div>
              </div>

              {/* Game Controls */}
              <div className="flex items-center gap-2">
                {enablePause && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePauseGame}
                    disabled={gameState.phase === "result"}
                  >
                    {gameState.phase === "paused" ? (
                      <Play className="h-4 w-4" />
                    ) : (
                      <Pause className="h-4 w-4" />
                    )}
                  </Button>
                )}
                <Button variant="outline" size="icon" onClick={handleResetGame}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {showProgress && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Tiến độ: {gameState.currentRound}/{gameState.maxRounds}</span>
                {showTimer && (
                  <span className={gameState.timeLeft < 3000 ? "text-red-600 font-bold" : ""}>
                    {formatTime(gameState.timeLeft)}
                  </span>
                )}
              </div>
              <Progress 
                value={(gameState.currentRound / gameState.maxRounds) * 100} 
                className="h-2"
              />
            </div>
          )}
        </div>
      </header>

      {/* Game Content */}
      <div className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {gameState.phase === "paused" ? (
            <motion.div
              key="paused"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-md mx-auto"
            >
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Tạm dừng</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="text-6xl">⏸️</div>
                  <div className="space-y-2">
                    <Button onClick={handlePauseGame} className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Tiếp tục
                    </Button>
                    <Button onClick={handleResetGame} variant="outline" className="w-full">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Chơi lại
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="game-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 