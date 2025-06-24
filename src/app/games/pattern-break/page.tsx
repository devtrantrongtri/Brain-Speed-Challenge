"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Puzzle, Clock, Target, Star, CheckCircle, XCircle, HelpCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import BaseGame, { BaseGameState, GameStats, GameSettings } from "@/components/game/BaseGame"
import GameResult from "@/components/game/GameResult"
import { audioManager } from "@/lib/audio-manager"

interface Pattern {
  sequence: (number | string)[]
  answer: number | string
  explanation: string
  difficulty: number
  type: "numeric" | "geometric" | "logical" | "fibonacci" | "arithmetic"
}

interface PatternBreakState extends BaseGameState {
  currentPattern: Pattern | null
  userAnswer: string
  showHint: boolean
  hintUsed: boolean
}

// Pattern database
const patterns: Pattern[] = [
  // Arithmetic sequences (difficulty 1)
  {
    sequence: [2, 4, 6, 8, "?"],
    answer: 10,
    explanation: "Dãy số chẵn tăng dần +2",
    difficulty: 1,
    type: "arithmetic"
  },
  {
    sequence: [1, 3, 5, 7, "?"],
    answer: 9,
    explanation: "Dãy số lẻ tăng dần +2",
    difficulty: 1,
    type: "arithmetic"
  },
  {
    sequence: [5, 10, 15, 20, "?"],
    answer: 25,
    explanation: "Bội số của 5, mỗi lần +5",
    difficulty: 1,
    type: "arithmetic"
  },

  // Geometric sequences (difficulty 2)
  {
    sequence: [2, 4, 8, 16, "?"],
    answer: 32,
    explanation: "Mỗi số nhân với 2",
    difficulty: 2,
    type: "geometric"
  },
  {
    sequence: [1, 3, 9, 27, "?"],
    answer: 81,
    explanation: "Mỗi số nhân với 3",
    difficulty: 2,
    type: "geometric"
  },
  {
    sequence: [100, 50, 25, 12.5, "?"],
    answer: 6.25,
    explanation: "Mỗi số chia cho 2",
    difficulty: 2,
    type: "geometric"
  },

  // Fibonacci sequences (difficulty 2)
  {
    sequence: [1, 1, 2, 3, 5, "?"],
    answer: 8,
    explanation: "Dãy Fibonacci: mỗi số = tổng 2 số trước",
    difficulty: 2,
    type: "fibonacci"
  },
  {
    sequence: [0, 1, 1, 2, 3, 5, "?"],
    answer: 8,
    explanation: "Dãy Fibonacci bắt đầu từ 0",
    difficulty: 2,
    type: "fibonacci"
  },

  // Complex numeric patterns (difficulty 3)
  {
    sequence: [1, 4, 9, 16, 25, "?"],
    answer: 36,
    explanation: "Dãy số chính phương: 1², 2², 3², 4², 5², 6²",
    difficulty: 3,
    type: "numeric"
  },
  {
    sequence: [2, 6, 12, 20, 30, "?"],
    answer: 42,
    explanation: "n×(n+1): 1×2, 2×3, 3×4, 4×5, 5×6, 6×7",
    difficulty: 3,
    type: "numeric"
  },
  {
    sequence: [1, 8, 27, 64, 125, "?"],
    answer: 216,
    explanation: "Dãy số lập phương: 1³, 2³, 3³, 4³, 5³, 6³",
    difficulty: 3,
    type: "numeric"
  },

  // Logical patterns (difficulty 3)
  {
    sequence: ["A", "C", "E", "G", "?"],
    answer: "I",
    explanation: "Bỏ qua một chữ cái: A->C->E->G->I",
    difficulty: 3,
    type: "logical"
  },
  {
    sequence: [1, 11, 21, 1211, "?"],
    answer: 111221,
    explanation: "Đọc mô tả: 1 -> một 1 (11) -> hai 1 (21) -> một 2 một 1 (1211) -> một 1 một 2 hai 1 (111221)",
    difficulty: 3,
    type: "logical"
  },

  // Advanced patterns (difficulty 4)
  {
    sequence: [2, 3, 5, 7, 11, "?"],
    answer: 13,
    explanation: "Dãy số nguyên tố",
    difficulty: 4,
    type: "numeric"
  },
  {
    sequence: [1, 1, 2, 6, 24, "?"],
    answer: 120,
    explanation: "Dãy giai thừa: 1!, 1!, 2!, 3!, 4!, 5!",
    difficulty: 4,
    type: "numeric"
  },

  // More arithmetic patterns (difficulty 1)
  {
    sequence: [10, 8, 6, 4, "?"],
    answer: 2,
    explanation: "Giảm dần mỗi số 2",
    difficulty: 1,
    type: "arithmetic"
  },
  {
    sequence: [3, 6, 9, 12, "?"],
    answer: 15,
    explanation: "Bảng cửu chương 3",
    difficulty: 1,
    type: "arithmetic"
  },
  {
    sequence: [1, 4, 7, 10, "?"],
    answer: 13,
    explanation: "Tăng dần mỗi số 3",
    difficulty: 1,
    type: "arithmetic"
  },

  // More geometric patterns (difficulty 2)
  {
    sequence: [5, 10, 20, 40, "?"],
    answer: 80,
    explanation: "Nhân 2 mỗi lần",
    difficulty: 2,
    type: "geometric"
  },
  {
    sequence: [256, 64, 16, 4, "?"],
    answer: 1,
    explanation: "Chia 4 mỗi lần",
    difficulty: 2,
    type: "geometric"
  },
  {
    sequence: [1, 5, 25, 125, "?"],
    answer: 625,
    explanation: "Lũy thừa của 5",
    difficulty: 2,
    type: "geometric"
  },

  // More Fibonacci variants (difficulty 2-3)
  {
    sequence: [2, 3, 5, 8, 13, "?"],
    answer: 21,
    explanation: "Fibonacci bắt đầu từ 2, 3",
    difficulty: 2,
    type: "fibonacci"
  },
  {
    sequence: [1, 2, 3, 5, 8, 13, "?"],
    answer: 21,
    explanation: "Dãy Fibonacci mở rộng",
    difficulty: 3,
    type: "fibonacci"
  },

  // More complex numeric patterns (difficulty 3)
  {
    sequence: [0, 1, 4, 9, 16, "?"],
    answer: 25,
    explanation: "Số chính phương: 0², 1², 2², 3², 4², 5²",
    difficulty: 3,
    type: "numeric"
  },
  {
    sequence: [1, 3, 6, 10, 15, "?"],
    answer: 21,
    explanation: "Số tam giác: n(n+1)/2",
    difficulty: 3,
    type: "numeric"
  },
  {
    sequence: [2, 5, 11, 23, 47, "?"],
    answer: 95,
    explanation: "Nhân 2 rồi cộng 1",
    difficulty: 3,
    type: "numeric"
  },
  {
    sequence: [1, 4, 13, 40, 121, "?"],
    answer: 364,
    explanation: "Nhân 3 rồi cộng 1",
    difficulty: 3,
    type: "numeric"
  },

  // More logical patterns (difficulty 3-4)
  {
    sequence: ["B", "D", "F", "H", "?"],
    answer: "J",
    explanation: "Chữ cái chẵn trong bảng chữ cái",
    difficulty: 3,
    type: "logical"
  },
  {
    sequence: ["Z", "Y", "X", "W", "?"],
    answer: "V",
    explanation: "Bảng chữ cái ngược từ Z",
    difficulty: 3,
    type: "logical"
  },
  {
    sequence: [21, 1211, 111221, 31211311, "?"],
    answer: 13112221,
    explanation: "Look-and-say: đọc mô tả số trước",
    difficulty: 4,
    type: "logical"
  },

  // Advanced mathematical patterns (difficulty 4)
  {
    sequence: [6, 28, 496, 8128, "?"],
    answer: 33550336,
    explanation: "Số hoàn hảo: bằng tổng ước số thực sự",
    difficulty: 4,
    type: "numeric"
  },
  {
    sequence: [1, 2, 6, 24, 120, 720, "?"],
    answer: 5040,
    explanation: "Giai thừa: 1!, 2!, 3!, 4!, 5!, 6!, 7!",
    difficulty: 4,
    type: "numeric"
  },
  {
    sequence: [1, 11, 121, 1331, "?"],
    answer: 14641,
    explanation: "Lũy thừa của 11: 11⁰, 11¹, 11², 11³, 11⁴",
    difficulty: 4,
    type: "numeric"
  },
  {
    sequence: [1, 2, 4, 7, 11, 16, "?"],
    answer: 22,
    explanation: "Tăng dần: +1, +2, +3, +4, +5, +6",
    difficulty: 4,
    type: "numeric"
  },
  {
    sequence: [2, 6, 30, 210, 2310, "?"],
    answer: 30030,
    explanation: "Primorial: tích các số nguyên tố đầu tiên",
    difficulty: 4,
    type: "numeric"
  }
]

export default function PatternBreakGame() {
  const [gameState, setGameState] = useState<PatternBreakState>({
    phase: "idle",
    stats: {
      score: 0,
      level: 1,
      streak: 0,
      accuracy: 0,
      timeElapsed: 0,
      bestScore: parseInt(localStorage.getItem('pattern-break-best-score') || '0')
    },
    settings: {
      timeLimit: 30000, // 30 seconds per pattern
      difficulty: "auto",
      soundEnabled: true,
      showHints: true
    },
    timeLeft: 30000,
    isCorrect: null,
    currentRound: 1,
    maxRounds: 10,
    currentPattern: null,
    userAnswer: "",
    showHint: false,
    hintUsed: false
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
    } else if (gameState.phase === "playing" && gameState.timeLeft <= 0) {
      // Time's up, show answer and move to next
      showResult(false)
    }

    return () => clearInterval(interval)
  }, [gameState.phase, gameState.timeLeft, startTime])

  const getRandomPattern = useCallback((): Pattern => {
    const maxDifficulty = Math.min(Math.floor(gameState.currentRound / 3) + 1, 4)
    const availablePatterns = patterns.filter(p => p.difficulty <= maxDifficulty)
    return availablePatterns[Math.floor(Math.random() * availablePatterns.length)]
  }, [gameState.currentRound])

  const startGame = useCallback(() => {
    const pattern = getRandomPattern()
    const now = Date.now()
    setStartTime(now)
    
    setGameState(prev => ({
      ...prev,
      phase: "playing",
      currentPattern: pattern,
      userAnswer: "",
      showHint: false,
      hintUsed: false,
      timeLeft: prev.settings.timeLimit || 30000,
      stats: {
        ...prev.stats,
        score: 0,
        streak: 0,
        timeElapsed: 0
      }
    }))

    audioManager.playSound('countdown')
  }, [getRandomPattern])

  const submitAnswer = useCallback(() => {
    if (!gameState.currentPattern || !gameState.userAnswer.trim()) return

    const userAnswer = gameState.userAnswer.trim()
    const correctAnswer = gameState.currentPattern.answer.toString()
    
    const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase()
    showResult(isCorrect)
  }, [gameState.currentPattern, gameState.userAnswer])

  const showResult = useCallback((isCorrect: boolean) => {
    if (!gameState.currentPattern) return

    if (isCorrect) {
      // Calculate score based on difficulty, time, and hint usage
      const timeBonus = Math.max(0, Math.floor(gameState.timeLeft / 1000) * 10)
      const difficultyBonus = gameState.currentPattern.difficulty * 50
      const hintPenalty = gameState.hintUsed ? -25 : 0
      const streakBonus = gameState.stats.streak * 20
      
      const points = difficultyBonus + timeBonus + streakBonus + hintPenalty
      
      audioManager.playCorrectAnswer(gameState.stats.streak)
      
      setGameState(prev => ({
        ...prev,
        phase: "result",
        stats: {
          ...prev.stats,
          score: prev.stats.score + Math.max(points, 10), // Minimum 10 points
          streak: prev.stats.streak + 1
        },
        isCorrect: true
      }))
    } else {
      audioManager.playWrongAnswer()
      setGameState(prev => ({
        ...prev,
        phase: "result",
        stats: {
          ...prev.stats,
          streak: 0
        },
        isCorrect: false
      }))
    }

    // Show result for 3 seconds then continue
    setTimeout(() => {
      nextRound()
    }, 3000)
  }, [gameState.currentPattern, gameState.timeLeft, gameState.hintUsed, gameState.stats.streak])

  const nextRound = useCallback(() => {
    if (gameState.currentRound >= gameState.maxRounds) {
      endGame()
      return
    }

    const pattern = getRandomPattern()
    setGameState(prev => ({
      ...prev,
      phase: "playing",
      currentRound: prev.currentRound + 1,
      currentPattern: pattern,
      userAnswer: "",
      showHint: false,
      hintUsed: false,
      timeLeft: prev.settings.timeLimit || 30000,
      stats: {
        ...prev.stats,
        level: Math.floor(prev.currentRound / 3) + 1
      },
      isCorrect: null
    }))

    if (gameState.currentRound % 3 === 0) {
      audioManager.playLevelUp()
    }
  }, [gameState.currentRound, gameState.maxRounds, getRandomPattern])

  const endGame = useCallback(() => {
    const totalAnswers = gameState.currentRound - 1
    const correctAnswers = Math.round((gameState.stats.streak / totalAnswers) * totalAnswers)
    const accuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0
    
    const finalStats = {
      ...gameState.stats,
      accuracy: Math.round(accuracy),
      timeElapsed: Date.now() - startTime
    }

    // Save best score
    if (finalStats.score > finalStats.bestScore) {
      localStorage.setItem('pattern-break-best-score', finalStats.score.toString())
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
  }, [gameState.currentRound, gameState.stats, startTime])

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      phase: "idle",
      currentRound: 1,
      currentPattern: null,
      userAnswer: "",
      showHint: false,
      hintUsed: false,
      timeLeft: prev.settings.timeLimit || 30000,
      isCorrect: null
    }))
  }, [])

  const toggleHint = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      showHint: !prev.showHint,
      hintUsed: !prev.showHint || prev.hintUsed
    }))
  }, [])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && gameState.phase === "playing") {
      submitAnswer()
    }
  }

  const colorScheme = {
    primary: "bg-gradient-to-r from-purple-500 to-indigo-500",
    secondary: "bg-purple-50",
    accent: "bg-indigo-50"
  }

  if (gameState.phase === "gameover") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-4">
        <div className="container mx-auto py-8">
          <GameResult
            title="Pattern Break"
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
      gameTitle="Pattern Break"
      gameIcon={<Puzzle className="h-8 w-8" />}
      gameDescription="Phá vỡ quy luật logic - Tìm ra quy luật và điền số/chữ tiếp theo!"
      gameState={gameState}
      onGameStart={startGame}
      onGamePause={() => setGameState(prev => ({ ...prev, phase: "paused" }))}
      onGameResume={() => setGameState(prev => ({ ...prev, phase: "playing" }))}
      onGameReset={resetGame}
      onGameEnd={endGame}
      colorScheme={colorScheme}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {gameState.phase === "result" ? (
          // Result Screen
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Card>
              <CardContent className="p-8">
                <div className={`text-8xl mb-6 ${gameState.isCorrect ? "text-green-600" : "text-red-600"}`}>
                  {gameState.isCorrect ? <CheckCircle className="h-20 w-20 mx-auto" /> : <XCircle className="h-20 w-20 mx-auto" />}
                </div>
                
                <div className="text-2xl font-bold mb-4">
                  {gameState.isCorrect ? "Chính xác!" : "Sai rồi!"}
                </div>

                {gameState.currentPattern && (
                  <div className="space-y-4">
                    <div className="text-lg">
                      Đáp án: <span className="font-bold text-purple-600">{gameState.currentPattern.answer}</span>
                    </div>
                    <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                      <strong>Giải thích:</strong> {gameState.currentPattern.explanation}
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-500 mt-4">
                  Tự động chuyển sang câu tiếp theo...
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          // Game Content
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Pattern Display */}
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Tìm quy luật</CardTitle>
                <div className="text-sm text-gray-600">
                  Câu {gameState.currentRound}/{gameState.maxRounds} • 
                  Level {gameState.stats.level} • 
                  Độ khó: {gameState.currentPattern?.difficulty}/4
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pattern Sequence */}
                {gameState.currentPattern && (
                  <div className="flex justify-center">
                    <div className="flex flex-wrap items-center justify-center gap-4">
                      {gameState.currentPattern.sequence.map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className={`
                            flex items-center justify-center w-16 h-16 text-xl font-bold rounded-lg border-2
                            ${item === "?" 
                              ? "bg-purple-100 border-purple-300 text-purple-600 border-dashed" 
                              : "bg-white border-gray-300 text-gray-800"
                            }
                          `}
                        >
                          {item === "?" ? <HelpCircle className="h-8 w-8" /> : item}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Answer Input */}
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={gameState.userAnswer}
                      onChange={(e) => setGameState(prev => ({ 
                        ...prev, 
                        userAnswer: e.target.value 
                      }))}
                      onKeyPress={handleKeyPress}
                      placeholder="Nhập đáp án..."
                      className="flex-1 text-lg text-center"
                      disabled={gameState.phase !== "playing"}
                    />
                    <Button 
                      onClick={submitAnswer}
                      disabled={!gameState.userAnswer.trim() || gameState.phase !== "playing"}
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
                      disabled={gameState.phase !== "playing"}
                    >
                      {gameState.showHint ? "Ẩn gợi ý" : "Hiện gợi ý"}
                      {gameState.hintUsed && <Badge variant="secondary" className="ml-2">-25 điểm</Badge>}
                    </Button>
                  )}

                  {/* Hint Display */}
                  <AnimatePresence>
                    {gameState.showHint && gameState.currentPattern && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                      >
                        <div className="text-sm font-medium text-yellow-800 mb-2">Gợi ý:</div>
                        <div className="text-sm text-yellow-700">
                          Loại pattern: <strong>{gameState.currentPattern.type}</strong>
                          <br />
                          {gameState.currentPattern.type === "arithmetic" && "Quan sát hiệu số giữa các số"}
                          {gameState.currentPattern.type === "geometric" && "Quan sát tỷ lệ giữa các số"}
                          {gameState.currentPattern.type === "fibonacci" && "Mỗi số = tổng 2 số trước đó"}
                          {gameState.currentPattern.type === "numeric" && "Quan sát các phép toán đặc biệt"}
                          {gameState.currentPattern.type === "logical" && "Tìm quy luật logic hoặc thứ tự"}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>

            {/* Progress Indicators */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                  <div className={`text-lg font-bold ${gameState.timeLeft < 10000 ? "text-red-600" : ""}`}>
                    {Math.ceil(gameState.timeLeft / 1000)}s
                  </div>
                  <div className="text-sm text-gray-600">Thời gian</div>
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
                  <Target className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-lg font-bold">{gameState.currentPattern?.difficulty || 0}</div>
                  <div className="text-sm text-gray-600">Độ khó</div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </BaseGame>
  )
} 