"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Play, Clock, Target, Star, Check, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import BaseGame, { BaseGameState, GameStats, GameSettings } from "@/components/game/BaseGame"
import GameResult from "@/components/game/GameResult"
import { audioManager } from "@/lib/audio-manager"

interface WordChallenge {
  prompt: string
  category: string
  validWords: string[]
  difficulty: number
}

interface WordStormState extends BaseGameState {
  currentChallenge: WordChallenge | null
  userWords: string[]
  currentWord: string
  wordsRemaining: number
  showHint: boolean
}

// Vietnamese word database
const wordChallenges: WordChallenge[] = [
  {
    prompt: "Đỏ",
    category: "Màu sắc",
    validWords: ["máu", "hoa hồng", "cờ", "táo", "son", "ớt", "ruby", "đỏ", "tình yêu", "lửa"],
    difficulty: 1
  },
  {
    prompt: "Biển",
    category: "Thiên nhiên",
    validWords: ["sóng", "cá", "muối", "nước", "xanh", "rộng", "sâu", "thuyền", "bơi", "cát"],
    difficulty: 1
  },
  {
    prompt: "Học tập",
    category: "Giáo dục",
    validWords: ["sách", "bút", "giáo viên", "bài tập", "kiến thức", "thi cử", "lớp học", "học sinh", "nghiên cứu", "đọc"],
    difficulty: 2
  },
  {
    prompt: "Thành công",
    category: "Khái niệm",
    validWords: ["nỗ lực", "kiên trì", "mục tiêu", "thành tựu", "vinh quang", "chiến thắng", "hoàn thành", "đạt được", "xuất sắc", "tự hào"],
    difficulty: 3
  },
  {
    prompt: "Công nghệ",
    category: "Hiện đại",
    validWords: ["máy tính", "internet", "smartphone", "AI", "robot", "tương lai", "sáng tạo", "phát triển", "kỹ thuật số", "đổi mới"],
    difficulty: 3
  }
]

export default function WordStormGame() {
  const [gameState, setGameState] = useState<WordStormState>({
    phase: "idle",
    stats: {
      score: 0,
      level: 1,
      streak: 0,
      accuracy: 0,
      timeElapsed: 0,
      bestScore: parseInt(localStorage.getItem('word-storm-best-score') || '0')
    },
    settings: {
      timeLimit: 60000, // 60 seconds
      difficulty: "auto",
      soundEnabled: true,
      showHints: true
    },
    timeLeft: 60000,
    isCorrect: null,
    currentRound: 1,
    maxRounds: 5,
    currentChallenge: null,
    userWords: [],
    currentWord: "",
    wordsRemaining: 5,
    showHint: false
  })

  const [startTime, setStartTime] = useState<number>(0)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (gameState.phase === "playing" && gameState.timeLeft > 0) {
      interval = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 100,
          stats: {
            ...prev.stats,
            timeElapsed: Date.now() - startTime
          }
        }))
      }, 100)
    }

    return () => clearInterval(interval)
  }, [gameState.phase, gameState.timeLeft, startTime])

  const getRandomChallenge = useCallback((): WordChallenge => {
    const difficultyLevel = Math.min(Math.floor(gameState.currentRound / 2) + 1, 3)
    const availableChallenges = wordChallenges.filter(c => c.difficulty <= difficultyLevel)
    return availableChallenges[Math.floor(Math.random() * availableChallenges.length)]
  }, [gameState.currentRound])

  const startGame = useCallback(() => {
    const challenge = getRandomChallenge()
    const now = Date.now()
    setStartTime(now)
    
    setGameState(prev => ({
      ...prev,
      phase: "playing",
      currentChallenge: challenge,
      userWords: [],
      currentWord: "",
      wordsRemaining: 5,
      timeLeft: prev.settings.timeLimit || 60000,
      stats: {
        ...prev.stats,
        score: 0,
        streak: 0,
        timeElapsed: 0
      },
      showHint: false
    }))

    audioManager.playSound('countdown')
  }, [getRandomChallenge])

  const submitWord = useCallback(() => {
    if (!gameState.currentChallenge || !gameState.currentWord.trim()) return

    const word = gameState.currentWord.trim().toLowerCase()
    const challenge = gameState.currentChallenge
    
    // Check if word is valid
    const isValid = challenge.validWords.some(validWord => 
      validWord.toLowerCase().includes(word) || word.includes(validWord.toLowerCase())
    )
    
    // Check if word already used
    const alreadyUsed = gameState.userWords.some(usedWord => 
      usedWord.toLowerCase() === word
    )

    if (isValid && !alreadyUsed) {
      // Correct word
      const points = Math.floor((word.length * 10) + (gameState.stats.streak * 5))
      audioManager.playCorrectAnswer(gameState.stats.streak)
      
      setGameState(prev => ({
        ...prev,
        userWords: [...prev.userWords, word],
        currentWord: "",
        wordsRemaining: prev.wordsRemaining - 1,
        stats: {
          ...prev.stats,
          score: prev.stats.score + points,
          streak: prev.stats.streak + 1
        },
        isCorrect: true
      }))

      // Check if round complete
      if (gameState.wordsRemaining <= 1) {
        setTimeout(() => {
          nextRound()
        }, 1000)
      }
    } else {
      // Wrong word
      audioManager.playWrongAnswer()
      setGameState(prev => ({
        ...prev,
        currentWord: "",
        stats: {
          ...prev.stats,
          streak: 0
        },
        isCorrect: false
      }))
    }

    // Clear feedback after delay
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        isCorrect: null
      }))
    }, 1500)
  }, [gameState.currentChallenge, gameState.currentWord, gameState.userWords, gameState.wordsRemaining, gameState.stats.streak])

  const nextRound = useCallback(() => {
    if (gameState.currentRound >= gameState.maxRounds) {
      endGame()
      return
    }

    const challenge = getRandomChallenge()
    setGameState(prev => ({
      ...prev,
      currentRound: prev.currentRound + 1,
      currentChallenge: challenge,
      userWords: [],
      currentWord: "",
      wordsRemaining: 5,
      stats: {
        ...prev.stats,
        level: Math.floor(prev.currentRound / 2) + 1
      },
      showHint: false
    }))

    audioManager.playLevelUp()
  }, [gameState.currentRound, gameState.maxRounds, getRandomChallenge])

  const endGame = useCallback(() => {
    const accuracy = gameState.userWords.length > 0 ? 
      (gameState.userWords.length / (gameState.currentRound * 5)) * 100 : 0
    
    const finalStats = {
      ...gameState.stats,
      accuracy: Math.round(accuracy),
      timeElapsed: Date.now() - startTime
    }

    // Save best score
    if (finalStats.score > finalStats.bestScore) {
      localStorage.setItem('word-storm-best-score', finalStats.score.toString())
      finalStats.bestScore = finalStats.score
    }

    setGameState(prev => ({
      ...prev,
      phase: "gameover",
      stats: finalStats
    }))

    if (finalStats.accuracy >= 70) {
      audioManager.playVictory()
    } else {
      audioManager.playDefeat()
    }
  }, [gameState.userWords.length, gameState.currentRound, gameState.stats, startTime])

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      phase: "idle",
      currentRound: 1,
      currentChallenge: null,
      userWords: [],
      currentWord: "",
      wordsRemaining: 5,
      timeLeft: prev.settings.timeLimit || 60000,
      isCorrect: null,
      showHint: false
    }))
  }, [])

  const toggleHint = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      showHint: !prev.showHint
    }))
  }, [])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      submitWord()
    }
  }

  const colorScheme = {
    primary: "bg-gradient-to-r from-green-500 to-teal-500",
    secondary: "bg-green-50",
    accent: "bg-teal-50"
  }

  if (gameState.phase === "gameover") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 p-4">
        <div className="container mx-auto py-8">
          <GameResult
            title="Word Storm"
            isVictory={gameState.stats.accuracy >= 70}
            stats={gameState.stats}
            onPlayAgain={resetGame}
            colorScheme={colorScheme}
          />
        </div>
      </div>
    )
  }

  return (
    <BaseGame
      gameTitle="Word Storm"
      gameIcon={<MessageSquare className="h-8 w-8" />}
      gameDescription="Liên tưởng từ ngữ sáng tạo - Tìm những từ liên quan đến chủ đề đã cho!"
      gameState={gameState}
      onGameStart={startGame}
      onGamePause={() => setGameState(prev => ({ ...prev, phase: "paused" }))}
      onGameResume={() => setGameState(prev => ({ ...prev, phase: "playing" }))}
      onGameReset={resetGame}
      onGameEnd={endGame}
      colorScheme={colorScheme}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Game Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Challenge Card */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                Chủ đề: <span className="text-green-600">{gameState.currentChallenge?.prompt}</span>
              </CardTitle>
              <div className="text-sm text-gray-600">
                Danh mục: {gameState.currentChallenge?.category} • 
                Còn lại: {gameState.wordsRemaining} từ
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Input Section */}
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={gameState.currentWord}
                    onChange={(e) => setGameState(prev => ({ 
                      ...prev, 
                      currentWord: e.target.value 
                    }))}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập từ liên quan..."
                    className="flex-1 text-lg"
                    disabled={gameState.phase !== "playing"}
                  />
                  <Button 
                    onClick={submitWord}
                    disabled={!gameState.currentWord.trim() || gameState.phase !== "playing"}
                    className={colorScheme.primary}
                  >
                    Gửi
                  </Button>
                </div>

                {/* Hint Button */}
                {gameState.settings.showHints && (
                  <Button
                    variant="outline"
                    onClick={toggleHint}
                    className="w-full"
                  >
                    {gameState.showHint ? "Ẩn gợi ý" : "Hiện gợi ý"}
                  </Button>
                )}

                {/* Hint Display */}
                <AnimatePresence>
                  {gameState.showHint && gameState.currentChallenge && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                      <div className="text-sm font-medium text-yellow-800 mb-2">Gợi ý:</div>
                      <div className="text-sm text-yellow-700">
                        {gameState.currentChallenge.validWords.slice(0, 3).join(", ")}...
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Feedback */}
              <AnimatePresence>
                {gameState.isCorrect !== null && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`text-center p-4 rounded-lg ${
                      gameState.isCorrect 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {gameState.isCorrect ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <X className="h-5 w-5" />
                      )}
                      <span className="font-medium">
                        {gameState.isCorrect ? "Tuyệt vời!" : "Thử lại!"}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* User Words */}
              <div>
                <div className="text-sm font-medium text-gray-600 mb-3">
                  Từ đã tìm được ({gameState.userWords.length}):
                </div>
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {gameState.userWords.map((word, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-block"
                      >
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {word}
                        </Badge>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Indicators */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <div className="text-lg font-bold">{gameState.wordsRemaining}</div>
                <div className="text-sm text-gray-600">Còn lại</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Star className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                <div className="text-lg font-bold">{gameState.stats.streak}</div>
                <div className="text-sm text-gray-600">Streak</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <div className="text-lg font-bold">
                  {Math.ceil(gameState.timeLeft / 1000)}s
                </div>
                <div className="text-sm text-gray-600">Thời gian</div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </BaseGame>
  )
} 