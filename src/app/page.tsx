"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Brain,
  Zap,
  Eye,
  MessageSquare,
  Puzzle,
  Trophy,
  Settings,
  Users,
  Play,
  Target,
  Clock,
  Star,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

interface GameStats {
  played: number
  bestScore: number
  avgTime: number
  streak: number
}

interface UserProgress {
  level: number
  totalXP: number
  brainAge: number
  gamesStats: {
    lightningMath: GameStats
    memoryFlash: GameStats
    wordStorm: GameStats
    patternBreak: GameStats
  }
}

const games = [
  {
    id: "lightning-math",
    title: "Lightning Math",
    description: "Giải toán nhanh như chớp",
    icon: Zap,
    color: "bg-yellow-500",
    difficulty: "Dễ → Khó",
    timeLimit: "3-5s",
    href: "/games/lightning-math",
  },
  {
    id: "memory-flash",
    title: "Memory Flash",
    description: "Ghi nhớ và tái hiện pattern",
    icon: Eye,
    color: "bg-blue-500",
    difficulty: "6-12 items",
    timeLimit: "2s",
    href: "/games/memory-flash",
  },
  {
    id: "word-storm",
    title: "Word Storm",
    description: "Liên tưởng từ ngữ sáng tạo",
    icon: MessageSquare,
    color: "bg-green-500",
    difficulty: "Sáng tạo",
    timeLimit: "10s",
    href: "/games/word-storm",
  },
  {
    id: "pattern-break",
    title: "Pattern Break",
    description: "Phá vỡ quy luật logic",
    icon: Puzzle,
    color: "bg-purple-500",
    difficulty: "Logic",
    timeLimit: "15s",
    href: "/games/pattern-break",
  },
]

export default function HomePage() {
  const [userProgress, setUserProgress] = useState<UserProgress>({
    level: 12,
    totalXP: 2450,
    brainAge: 25,
    gamesStats: {
      lightningMath: { played: 45, bestScore: 850, avgTime: 2.3, streak: 12 },
      memoryFlash: { played: 32, bestScore: 720, avgTime: 4.1, streak: 8 },
      wordStorm: { played: 28, bestScore: 650, avgTime: 7.2, streak: 5 },
      patternBreak: { played: 19, bestScore: 480, avgTime: 12.5, streak: 3 },
    },
  })

  const [dailyStreak, setDailyStreak] = useState(7)
  const [todayProgress, setTodayProgress] = useState(65)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Brain Speed Challenge
                </h1>
                <p className="text-sm text-gray-500">Luyện não thông minh</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium">Level {userProgress.level}</div>
                <div className="text-xs text-gray-500">{userProgress.totalXP} XP</div>
              </div>
              <Link href="/settings">
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Brain className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{userProgress.brainAge}</div>
                    <div className="text-sm text-gray-500">Tuổi não</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Target className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{dailyStreak}</div>
                    <div className="text-sm text-gray-500">Ngày liên tiếp</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Trophy className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {Math.max(...Object.values(userProgress.gamesStats).map((s) => s?.bestScore || 0))}
                    </div>
                    <div className="text-sm text-gray-500">Điểm cao nhất</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{todayProgress}%</div>
                    <div className="text-sm text-gray-500">Hôm nay</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Daily Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Thử thách hàng ngày
              </CardTitle>
              <CardDescription>Hoàn thành {todayProgress}% mục tiêu hôm nay</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={todayProgress} className="mb-2" />
              <div className="flex justify-between text-sm text-gray-500">
                <span>3/5 trò chơi đã hoàn thành</span>
                <span>+150 XP khi hoàn thành</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Game Modes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Solo Mode */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-blue-500" />
                  Chế độ Solo
                </CardTitle>
                <CardDescription>Luyện tập cá nhân và cải thiện kỹ năng</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {games.map((game, index) => {
                  const Icon = game.icon
                  const stats = userProgress.gamesStats[game.id as keyof typeof userProgress.gamesStats] || {
                    played: 0,
                    bestScore: 0,
                    avgTime: 0,
                    streak: 0,
                  }

                  return (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                    >
                      <Link href={game.href}>
                        <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 ${game.color} rounded-lg group-hover:scale-110 transition-transform`}
                              >
                                <Icon className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <div className="font-medium">{game.title}</div>
                                <div className="text-sm text-gray-500">{game.description}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">Best: {stats.bestScore}</div>
                              <div className="text-xs text-gray-500">Streak: {stats.streak}</div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </CardContent>
            </Card>
          </motion.div>

          {/* Battle Mode */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-red-500" />
                  Chế độ Battle
                </CardTitle>
                <CardDescription>Thách đấu trực tiếp với người chơi khác</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/multiplayer/lobby">
                  <Button className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600">
                    <Users className="h-4 w-4 mr-2" />
                    Tham gia phòng chơi
                  </Button>
                </Link>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-red-50 rounded-lg text-center">
                    <div className="text-lg font-bold text-red-600">1v1</div>
                    <div className="text-sm text-gray-600">Đối đầu trực tiếp</div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg text-center">
                    <div className="text-lg font-bold text-orange-600">4P</div>
                    <div className="text-sm text-gray-600">Phòng 4 người</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Trận thắng:</span>
                    <span className="font-medium">23</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tỷ lệ thắng:</span>
                    <span className="font-medium">68%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ranking:</span>
                    <Badge variant="secondary">#1,247</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Link href="/leaderboard">
            <Button variant="outline" className="w-full h-16 flex-col gap-1">
              <Trophy className="h-5 w-5" />
              <span className="text-xs">Bảng xếp hạng</span>
            </Button>
          </Link>

          <Link href="/progress">
            <Button variant="outline" className="w-full h-16 flex-col gap-1">
              <Target className="h-5 w-5" />
              <span className="text-xs">Tiến độ</span>
            </Button>
          </Link>

          <Link href="/settings">
            <Button variant="outline" className="w-full h-16 flex-col gap-1">
              <Settings className="h-5 w-5" />
              <span className="text-xs">Cài đặt</span>
            </Button>
          </Link>

          <Link href="/multiplayer/lobby">
            <Button variant="outline" className="w-full h-16 flex-col gap-1">
              <Users className="h-5 w-5" />
              <span className="text-xs">Multiplayer</span>
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
