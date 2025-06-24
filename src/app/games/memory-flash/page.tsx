"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Eye, Home, RotateCcw, Play, Clock, Target, Brain, Star } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

interface MemoryItem {
  id: number
  value: string | number
  color?: string
  shape?: string
}

interface GameState {
  sequence: MemoryItem[]
  userSequence: MemoryItem[]
  currentPhase: "ready" | "showing" | "input" | "result" | "gameover"
  score: number
  level: number
  round: number
  showTime: number
  gameStarted: boolean
  isCorrect: boolean | null
}

const colors = ["red", "blue", "green", "yellow", "purple", "orange", "pink", "cyan"]
const shapes = ["circle", "square", "triangle", "diamond", "star", "heart"]

const generateSequence = (length: number, type: "numbers" | "colors" | "shapes" | "mixed"): MemoryItem[] => {
  const sequence: MemoryItem[] = []

  for (let i = 0; i < length; i++) {
    let item: MemoryItem

    switch (type) {
      case "numbers":
        item = {
          id: i,
          value: Math.floor(Math.random() * 9) + 1,
        }
        break
      case "colors":
        item = {
          id: i,
          value: i + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
        }
        break
      case "shapes":
        item = {
          id: i,
          value: i + 1,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
        }
        break
      case "mixed":
        const useColor = Math.random() > 0.5
        item = {
          id: i,
          value: Math.floor(Math.random() * 9) + 1,
          color: useColor ? colors[Math.floor(Math.random() * colors.length)] : undefined,
          shape: !useColor ? shapes[Math.floor(Math.random() * shapes.length)] : undefined,
        }
        break
      default:
        item = { id: i, value: Math.floor(Math.random() * 9) + 1 }
    }

    sequence.push(item)
  }

  return sequence
}

const getSequenceType = (level: number): "numbers" | "colors" | "shapes" | "mixed" => {
  if (level <= 3) return "numbers"
  if (level <= 6) return "colors"
  if (level <= 9) return "shapes"
  return "mixed"
}

const getSequenceLength = (level: number): number => {
  return Math.min(4 + Math.floor(level / 2), 12)
}

const getShowTime = (level: number): number => {
  return Math.max(3000 - (level - 1) * 200, 1500) // 3s to 1.5s
}

export default function MemoryFlashGame() {
  const [gameState, setGameState] = useState<GameState>({
    sequence: [],
    userSequence: [],
    currentPhase: "ready",
    score: 0,
    level: 1,
    round: 1,
    showTime: 3000,
    gameStarted: false,
    isCorrect: null,
  })

  const [countdown, setCountdown] = useState(0)

  const startGame = () => {
    const sequenceLength = getSequenceLength(1)
    const sequenceType = getSequenceType(1)
    const showTime = getShowTime(1)
    const newSequence = generateSequence(sequenceLength, sequenceType)

    setGameState({
      sequence: newSequence,
      userSequence: [],
      currentPhase: "showing",
      score: 0,
      level: 1,
      round: 1,
      showTime,
      gameStarted: true,
      isCorrect: null,
    })

    setCountdown(showTime)
  }

  const nextRound = useCallback(() => {
    const newLevel = Math.floor((gameState.round - 1) / 3) + 1
    const sequenceLength = getSequenceLength(newLevel)
    const sequenceType = getSequenceType(newLevel)
    const showTime = getShowTime(newLevel)
    const newSequence = generateSequence(sequenceLength, sequenceType)

    setGameState((prev) => ({
      ...prev,
      sequence: newSequence,
      userSequence: [],
      currentPhase: "showing",
      level: newLevel,
      round: prev.round + 1,
      showTime,
      isCorrect: null,
    }))

    setCountdown(showTime)
  }, [gameState.round])

  // Countdown timer for showing sequence
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (gameState.currentPhase === "showing" && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 100)
      }, 100)
    } else if (gameState.currentPhase === "showing" && countdown <= 0) {
      setGameState((prev) => ({ ...prev, currentPhase: "input" }))
    }

    return () => clearInterval(interval)
  }, [gameState.currentPhase, countdown])

  const handleItemClick = (item: MemoryItem) => {
    if (gameState.currentPhase !== "input") return

    const newUserSequence = [...gameState.userSequence, item]
    setGameState((prev) => ({ ...prev, userSequence: newUserSequence }))

    // Check if sequence is complete
    if (newUserSequence.length === gameState.sequence.length) {
      checkAnswer(newUserSequence)
    }
  }

  const checkAnswer = (userSequence: MemoryItem[]) => {
    const isCorrect = userSequence.every((item, index) => {
      const originalItem = gameState.sequence[index]
      return item.value === originalItem.value && item.color === originalItem.color && item.shape === originalItem.shape
    })

    const points = isCorrect ? gameState.level * 50 + gameState.sequence.length * 10 : 0

    setGameState((prev) => ({
      ...prev,
      currentPhase: "result",
      score: prev.score + points,
      isCorrect,
    }))

    // Auto continue after 2 seconds
    setTimeout(() => {
      if (isCorrect) {
        if (gameState.round >= 15) {
          setGameState((prev) => ({ ...prev, currentPhase: "gameover" }))
        } else {
          nextRound()
        }
      } else {
        setGameState((prev) => ({ ...prev, currentPhase: "gameover" }))
      }
    }, 2000)
  }

  const resetGame = () => {
    setGameState({
      sequence: [],
      userSequence: [],
      currentPhase: "ready",
      score: 0,
      level: 1,
      round: 1,
      showTime: 3000,
      gameStarted: false,
      isCorrect: null,
    })
    setCountdown(0)
  }

  const renderMemoryItem = (item: MemoryItem, index: number, isClickable = false) => {
    const baseClasses =
      "w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl transition-all duration-200"
    const colorClasses = {
      red: "bg-red-500",
      blue: "bg-blue-500",
      green: "bg-green-500",
      yellow: "bg-yellow-500",
      purple: "bg-purple-500",
      orange: "bg-orange-500",
      pink: "bg-pink-500",
      cyan: "bg-cyan-500",
    }

    const shapeIcons = {
      circle: "●",
      square: "■",
      triangle: "▲",
      diamond: "♦",
      star: "★",
      heart: "♥",
    }

    const bgColor = item.color ? colorClasses[item.color as keyof typeof colorClasses] : "bg-gray-600"
    const clickableClasses = isClickable ? "hover:scale-110 cursor-pointer hover:shadow-lg" : ""

    return (
      <motion.div
        key={`${item.id}-${index}`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: index * 0.1 }}
        className={`${baseClasses} ${bgColor} ${clickableClasses}`}
        onClick={() => isClickable && handleItemClick(item)}
      >
        {item.shape ? shapeIcons[item.shape as keyof typeof shapeIcons] : item.value}
      </motion.div>
    )
  }

  const shuffledSequence =
    gameState.currentPhase === "input" ? [...gameState.sequence].sort(() => Math.random() - 0.5) : gameState.sequence

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="outline" size="icon">
                  <Home className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Memory Flash</h1>
                  <p className="text-sm text-gray-500">Ghi nhớ và tái hiện pattern</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium">Điểm: {gameState.score}</div>
                <div className="text-xs text-gray-500">Level: {gameState.level}</div>
              </div>
              <Button variant="outline" onClick={resetGame}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {!gameState.gameStarted ? (
          // Start Screen
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl mb-4">Memory Flash</CardTitle>
                <div className="text-gray-600 space-y-2">
                  <p>Ghi nhớ chuỗi số, màu sắc và hình dạng!</p>
                  <p>Quan sát trong thời gian ngắn, sau đó sắp xếp lại theo thứ tự</p>
                  <p>Độ khó tăng dần qua các level</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <Brain className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-sm font-medium">Điểm cao</div>
                    <div className="text-lg font-bold text-blue-600">720</div>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <Target className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                    <div className="text-sm font-medium">Level cao nhất</div>
                    <div className="text-lg font-bold text-indigo-600">8</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <Star className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-sm font-medium">Chuỗi dài nhất</div>
                    <div className="text-lg font-bold text-purple-600">10</div>
                  </div>
                </div>

                <Button
                  onClick={startGame}
                  className="w-full h-16 text-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                >
                  <Play className="h-6 w-6 mr-2" />
                  Bắt đầu chơi
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : gameState.currentPhase === "gameover" ? (
          // Game Over Screen
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl mb-4">
                  {gameState.isCorrect === false ? "Game Over!" : "Hoàn thành!"}
                </CardTitle>
                <div className="text-6xl mb-4">{gameState.isCorrect === false ? "😔" : "🎉"}</div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{gameState.score}</div>
                    <div className="text-sm text-gray-600">Tổng điểm</div>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">{gameState.level}</div>
                    <div className="text-sm text-gray-600">Level đạt được</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{gameState.round - 1}</div>
                    <div className="text-sm text-gray-600">Vòng hoàn thành</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{gameState.sequence.length}</div>
                    <div className="text-sm text-gray-600">Chuỗi dài nhất</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={startGame} className="flex-1">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Chơi lại
                  </Button>
                  <Link href="/" className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Home className="h-4 w-4 mr-2" />
                      Về trang chủ
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          // Game Screen
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Game Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{gameState.score}</div>
                  <div className="text-sm text-gray-500">Điểm</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-600">{gameState.level}</div>
                  <div className="text-sm text-gray-500">Level</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{gameState.round}</div>
                  <div className="text-sm text-gray-500">Vòng</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{gameState.sequence.length}</div>
                  <div className="text-sm text-gray-500">Items</div>
                </CardContent>
              </Card>
            </div>

            {/* Game Area */}
            <Card>
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Badge variant="outline">Vòng {gameState.round}</Badge>
                  <Badge variant="secondary">Level {gameState.level}</Badge>
                  <Badge variant="outline">{getSequenceType(gameState.level)}</Badge>
                </div>

                <CardTitle className="text-2xl">
                  {gameState.currentPhase === "showing" && "Ghi nhớ chuỗi này!"}
                  {gameState.currentPhase === "input" && "Chọn theo thứ tự đã thấy"}
                  {gameState.currentPhase === "result" && (gameState.isCorrect ? "Chính xác!" : "Sai rồi!")}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {gameState.currentPhase === "showing" && (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="text-lg font-medium">{Math.ceil(countdown / 1000)}s</span>
                    </div>
                    <Progress value={(countdown / gameState.showTime) * 100} className="mb-6" />
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {gameState.currentPhase === "result" ? (
                    <motion.div
                      key="result"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="text-center"
                    >
                      <div className={`text-6xl mb-4 ${gameState.isCorrect ? "text-green-600" : "text-red-600"}`}>
                        {gameState.isCorrect ? "✓" : "✗"}
                      </div>
                      <div className="text-2xl font-bold mb-4">
                        {gameState.isCorrect ? "Tuyệt vời!" : "Thử lại lần sau!"}
                      </div>
                      {gameState.isCorrect && (
                        <div className="text-lg text-gray-600">
                          +{gameState.level * 50 + gameState.sequence.length * 10} điểm
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="sequence"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-wrap justify-center gap-4"
                    >
                      {(gameState.currentPhase === "showing" ? gameState.sequence : shuffledSequence).map(
                        (item, index) => renderMemoryItem(item, index, gameState.currentPhase === "input"),
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {gameState.currentPhase === "input" && gameState.userSequence.length > 0 && (
                  <div className="border-t pt-6">
                    <div className="text-center mb-4">
                      <span className="text-sm text-gray-500">
                        Đã chọn: {gameState.userSequence.length}/{gameState.sequence.length}
                      </span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {gameState.userSequence.map((item, index) => (
                        <div
                          key={index}
                          className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs font-medium"
                        >
                          {index + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
