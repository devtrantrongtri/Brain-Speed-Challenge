"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Zap, Home, RotateCcw, Trophy, Clock, Target, Flame } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

interface MathProblem {
  expression: string
  answer: number
  difficulty: number
}

interface GameState {
  currentProblem: MathProblem | null
  userAnswer: string
  score: number
  streak: number
  timeLeft: number
  gameActive: boolean
  problemCount: number
  correctAnswers: number
  gameStarted: boolean
  showResult: boolean
  resultType: "correct" | "wrong" | null
}

const generateProblem = (difficulty: number): MathProblem => {
  const operations = ["+", "-", "*"]
  const maxNum = Math.min(5 + difficulty * 2, 20)

  if (difficulty <= 3) {
    // Simple operations
    const a = Math.floor(Math.random() * maxNum) + 1
    const b = Math.floor(Math.random() * maxNum) + 1
    const op = operations[Math.floor(Math.random() * operations.length)]

    let expression: string
    let answer: number

    switch (op) {
      case "+":
        expression = `${a} + ${b}`
        answer = a + b
        break
      case "-":
        expression = `${Math.max(a, b)} - ${Math.min(a, b)}`
        answer = Math.max(a, b) - Math.min(a, b)
        break
      case "*":
        expression = `${a} × ${b}`
        answer = a * b
        break
      default:
        expression = `${a} + ${b}`
        answer = a + b
    }

    return { expression, answer, difficulty }
  } else {
    // Complex operations with multiple steps
    const a = Math.floor(Math.random() * 15) + 1
    const b = Math.floor(Math.random() * 15) + 1
    const c = Math.floor(Math.random() * 10) + 1

    const expressions = [
      { expr: `${a} × ${b} + ${c}`, ans: a * b + c },
      { expr: `${a} × ${b} - ${c}`, ans: a * b - c },
      { expr: `${a + b} × ${c}`, ans: (a + b) * c },
      { expr: `${a * c} + ${b} - ${Math.floor(c / 2)}`, ans: a * c + b - Math.floor(c / 2) },
    ]

    const selected = expressions[Math.floor(Math.random() * expressions.length)]
    return { expression: selected.expr, answer: selected.ans, difficulty }
  }
}

export default function LightningMathGame() {
  const [gameState, setGameState] = useState<GameState>({
    currentProblem: null,
    userAnswer: "",
    score: 0,
    streak: 0,
    timeLeft: 5000, // 5 seconds in milliseconds
    gameActive: false,
    problemCount: 0,
    correctAnswers: 0,
    gameStarted: false,
    showResult: false,
    resultType: null,
  })

  const [difficulty, setDifficulty] = useState(1)
  const [gameSettings, setGameSettings] = useState({
    timePerProblem: 5000,
    maxProblems: 20,
  })

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (gameState.gameActive && gameState.timeLeft > 0) {
      interval = setInterval(() => {
        setGameState((prev) => ({
          ...prev,
          timeLeft: prev.timeLeft - 100,
        }))
      }, 100)
    } else if (gameState.gameActive && gameState.timeLeft <= 0) {
      // Time's up
      handleAnswer(false)
    }

    return () => clearInterval(interval)
  }, [gameState.gameActive, gameState.timeLeft])

  const startGame = () => {
    const newProblem = generateProblem(difficulty)
    setGameState({
      currentProblem: newProblem,
      userAnswer: "",
      score: 0,
      streak: 0,
      timeLeft: gameSettings.timePerProblem,
      gameActive: true,
      problemCount: 1,
      correctAnswers: 0,
      gameStarted: true,
      showResult: false,
      resultType: null,
    })
  }

  const handleAnswer = useCallback(
    (isCorrect: boolean) => {
      if (!gameState.gameActive) return

      const points = isCorrect ? (10 + gameState.streak * 2) * difficulty : 0
      const newStreak = isCorrect ? gameState.streak + 1 : 0

      setGameState((prev) => ({
        ...prev,
        score: prev.score + points,
        streak: newStreak,
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        showResult: true,
        resultType: isCorrect ? "correct" : "wrong",
        gameActive: false,
      }))

      // Show result for 1 second then continue
      setTimeout(() => {
        if (gameState.problemCount >= gameSettings.maxProblems) {
          // Game over
          setGameState((prev) => ({
            ...prev,
            gameActive: false,
            showResult: false,
          }))
        } else {
          // Next problem
          const newDifficulty = Math.floor(gameState.problemCount / 5) + 1
          const newProblem = generateProblem(newDifficulty)
          setGameState((prev) => ({
            ...prev,
            currentProblem: newProblem,
            userAnswer: "",
            timeLeft: gameSettings.timePerProblem,
            gameActive: true,
            problemCount: prev.problemCount + 1,
            showResult: false,
            resultType: null,
          }))
          setDifficulty(newDifficulty)
        }
      }, 1000)
    },
    [
      gameState.gameActive,
      gameState.streak,
      gameState.problemCount,
      gameSettings.maxProblems,
      gameSettings.timePerProblem,
      difficulty,
    ],
  )

  const submitAnswer = () => {
    if (!gameState.currentProblem || !gameState.gameActive) return

    const userNum = Number.parseInt(gameState.userAnswer)
    const isCorrect = userNum === gameState.currentProblem.answer
    handleAnswer(isCorrect)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      submitAnswer()
    }
  }

  const resetGame = () => {
    setGameState({
      currentProblem: null,
      userAnswer: "",
      score: 0,
      streak: 0,
      timeLeft: 5000,
      gameActive: false,
      problemCount: 0,
      correctAnswers: 0,
      gameStarted: false,
      showResult: false,
      resultType: null,
    })
    setDifficulty(1)
  }

  const timePercentage = (gameState.timeLeft / gameSettings.timePerProblem) * 100
  const accuracy =
    gameState.problemCount > 0 ? Math.round((gameState.correctAnswers / gameState.problemCount) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
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
                <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Lightning Math</h1>
                  <p className="text-sm text-gray-500">Giải toán nhanh như chớp</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium">Điểm: {gameState.score}</div>
                <div className="text-xs text-gray-500">Streak: {gameState.streak}</div>
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
                <CardTitle className="text-3xl mb-4">Lightning Math</CardTitle>
                <div className="text-gray-600 space-y-2">
                  <p>Giải các phép tính nhanh nhất có thể!</p>
                  <p>
                    Bạn có <strong>{gameSettings.timePerProblem / 1000} giây</strong> cho mỗi câu
                  </p>
                  <p>Độ khó sẽ tăng dần theo thời gian</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-sm font-medium">Điểm cao</div>
                    <div className="text-lg font-bold text-yellow-600">850</div>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <Target className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-sm font-medium">Độ chính xác</div>
                    <div className="text-lg font-bold text-orange-600">87%</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <Flame className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <div className="text-sm font-medium">Streak tốt nhất</div>
                    <div className="text-lg font-bold text-red-600">12</div>
                  </div>
                </div>

                <Button
                  onClick={startGame}
                  className="w-full h-16 text-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                >
                  <Zap className="h-6 w-6 mr-2" />
                  Bắt đầu chơi
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : gameState.problemCount > gameSettings.maxProblems ? (
          // Game Over Screen
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl mb-4">Hoàn thành!</CardTitle>
                <div className="text-6xl mb-4">🎉</div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{gameState.score}</div>
                    <div className="text-sm text-gray-600">Tổng điểm</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{accuracy}%</div>
                    <div className="text-sm text-gray-600">Độ chính xác</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{gameState.correctAnswers}</div>
                    <div className="text-sm text-gray-600">Câu đúng</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.max(...Array.from({ length: gameState.problemCount }, (_, i) => gameState.streak))}
                    </div>
                    <div className="text-sm text-gray-600">Streak tốt nhất</div>
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
          <div className="max-w-2xl mx-auto space-y-6">
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
                  <div className="text-2xl font-bold text-orange-600">{gameState.streak}</div>
                  <div className="text-sm text-gray-500">Streak</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{gameState.problemCount}</div>
                  <div className="text-sm text-gray-500">Câu hỏi</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{accuracy}%</div>
                  <div className="text-sm text-gray-500">Chính xác</div>
                </CardContent>
              </Card>
            </div>

            {/* Timer */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Thời gian còn lại</span>
                  <Badge variant={timePercentage > 50 ? "default" : timePercentage > 25 ? "secondary" : "destructive"}>
                    <Clock className="h-3 w-3 mr-1" />
                    {Math.ceil(gameState.timeLeft / 1000)}s
                  </Badge>
                </div>
                <Progress value={timePercentage} className={`h-3 ${timePercentage <= 25 ? "animate-pulse" : ""}`} />
              </CardContent>
            </Card>

            {/* Problem */}
            <AnimatePresence mode="wait">
              {gameState.showResult ? (
                <motion.div
                  key="result"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="text-center"
                >
                  <Card
                    className={`border-4 ${gameState.resultType === "correct" ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}
                  >
                    <CardContent className="p-8">
                      <div
                        className={`text-6xl mb-4 ${gameState.resultType === "correct" ? "text-green-600" : "text-red-600"}`}
                      >
                        {gameState.resultType === "correct" ? "✓" : "✗"}
                      </div>
                      <div className="text-2xl font-bold mb-2">
                        {gameState.resultType === "correct" ? "Chính xác!" : "Sai rồi!"}
                      </div>
                      {gameState.resultType === "wrong" && gameState.currentProblem && (
                        <div className="text-lg text-gray-600">Đáp án đúng: {gameState.currentProblem.answer}</div>
                      )}
                      {gameState.resultType === "correct" && gameState.streak > 1 && (
                        <div className="flex items-center justify-center gap-2 text-orange-600">
                          <Flame className="h-5 w-5" />
                          <span>Streak x{gameState.streak}!</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="problem"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                >
                  <Card>
                    <CardHeader className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <Badge variant="outline">Câu {gameState.problemCount}</Badge>
                        <Badge variant="secondary">Level {difficulty}</Badge>
                      </div>
                      <CardTitle className="text-6xl font-mono mb-6">{gameState.currentProblem?.expression}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex gap-4">
                        <Input
                          type="number"
                          value={gameState.userAnswer}
                          onChange={(e) => setGameState((prev) => ({ ...prev, userAnswer: e.target.value }))}
                          onKeyPress={handleKeyPress}
                          placeholder="Nhập đáp án..."
                          className="text-2xl text-center h-16"
                          autoFocus
                          disabled={!gameState.gameActive}
                        />
                        <Button
                          onClick={submitAnswer}
                          disabled={!gameState.userAnswer || !gameState.gameActive}
                          className="h-16 px-8 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                        >
                          <Zap className="h-5 w-5 mr-2" />
                          Gửi
                        </Button>
                      </div>

                      <div className="text-center text-sm text-gray-500">Nhấn Enter để gửi đáp án</div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
