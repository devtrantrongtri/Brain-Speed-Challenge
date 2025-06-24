"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Home, RotateCcw, Trophy, Target, Clock, Star, TrendingUp } from "lucide-react"
import Link from "next/link"
import { GameStats } from "./BaseGame"

interface GameResultProps {
  title: string
  isVictory: boolean
  stats: GameStats
  previousBest?: {
    score: number
    accuracy: number
    level: number
  }
  onPlayAgain: () => void
  colorScheme: {
    primary: string
    secondary: string
    accent: string
  }
  showComparison?: boolean
}

export default function GameResult({
  title,
  isVictory,
  stats,
  previousBest,
  onPlayAgain,
  colorScheme,
  showComparison = true
}: GameResultProps) {
  const getPerformanceLevel = (accuracy: number): string => {
    if (accuracy >= 90) return "Xuất sắc"
    if (accuracy >= 80) return "Tốt"
    if (accuracy >= 70) return "Khá"
    if (accuracy >= 60) return "Trung bình"
    return "Cần cải thiện"
  }

  const getPerformanceColor = (accuracy: number): string => {
    if (accuracy >= 90) return "text-green-600"
    if (accuracy >= 80) return "text-blue-600"
    if (accuracy >= 70) return "text-yellow-600"
    if (accuracy >= 60) return "text-orange-600"
    return "text-red-600"
  }

  const formatTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000)
    const seconds = Math.floor((milliseconds % 60000) / 1000)
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
  }

  const getNewRecords = () => {
    if (!previousBest) return []
    
    const records = []
    if (stats.score > previousBest.score) records.push("Điểm cao mới!")
    if (stats.accuracy > previousBest.accuracy) records.push("Độ chính xác tốt hơn!")
    if (stats.level > previousBest.level) records.push("Level cao hơn!")
    
    return records
  }

  const newRecords = getNewRecords()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto"
    >
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl mb-4">
            {isVictory ? "Hoàn thành!" : "Kết thúc!"}
          </CardTitle>
          <div className="text-8xl mb-4">
            {isVictory ? "🎉" : "😊"}
          </div>
          
          {/* New Records */}
          {newRecords.length > 0 && (
            <div className="space-y-2 mb-4">
              {newRecords.map((record, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <Star className="h-3 w-3 mr-1" />
                    {record}
                  </Badge>
                </motion.div>
              ))}
            </div>
          )}

          <div className={`text-xl font-semibold ${getPerformanceColor(stats.accuracy)}`}>
            {getPerformanceLevel(stats.accuracy)}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Main Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`text-center p-4 ${colorScheme.primary} text-white rounded-lg`}
            >
              <Trophy className="h-6 w-6 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.score}</div>
              <div className="text-sm opacity-90">Tổng điểm</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`text-center p-4 ${colorScheme.secondary} rounded-lg`}
            >
              <Target className="h-6 w-6 mx-auto mb-2 text-gray-600" />
              <div className={`text-2xl font-bold ${getPerformanceColor(stats.accuracy)}`}>
                {stats.accuracy}%
              </div>
              <div className="text-sm text-gray-600">Độ chính xác</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`text-center p-4 ${colorScheme.accent} rounded-lg`}
            >
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-gray-600" />
              <div className="text-2xl font-bold text-purple-600">{stats.streak}</div>
              <div className="text-sm text-gray-600">Streak tốt nhất</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center p-4 bg-gray-100 rounded-lg"
            >
              <Clock className="h-6 w-6 mx-auto mb-2 text-gray-600" />
              <div className="text-2xl font-bold text-gray-700">{formatTime(stats.timeElapsed)}</div>
              <div className="text-sm text-gray-600">Thời gian</div>
            </motion.div>
          </div>

          {/* Comparison with Previous Best */}
          {showComparison && previousBest && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="border-t pt-6"
            >
              <h4 className="text-lg font-semibold mb-4 text-center">So sánh với lần chơi tốt nhất</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-gray-600">Điểm</div>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="font-bold">{stats.score}</span>
                    <span className={stats.score >= previousBest.score ? "text-green-600" : "text-red-600"}>
                      {stats.score >= previousBest.score ? "+" : ""}{stats.score - previousBest.score}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-600">Độ chính xác</div>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="font-bold">{stats.accuracy}%</span>
                    <span className={stats.accuracy >= previousBest.accuracy ? "text-green-600" : "text-red-600"}>
                      {stats.accuracy >= previousBest.accuracy ? "+" : ""}{(stats.accuracy - previousBest.accuracy).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-600">Level</div>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="font-bold">{stats.level}</span>
                    <span className={stats.level >= previousBest.level ? "text-green-600" : "text-red-600"}>
                      {stats.level >= previousBest.level ? "+" : ""}{stats.level - previousBest.level}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex gap-4 pt-4"
          >
            <Button 
              onClick={onPlayAgain} 
              className={`flex-1 ${colorScheme.primary} hover:opacity-90`}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Chơi lại
            </Button>
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Về trang chủ
              </Button>
            </Link>
          </motion.div>

          {/* Share Score (Optional) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-sm text-gray-500"
          >
            <p>Chia sẻ điểm số của bạn với bạn bè!</p>
            <div className="flex justify-center gap-2 mt-2">
              {/* Social share buttons can be added here */}
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 