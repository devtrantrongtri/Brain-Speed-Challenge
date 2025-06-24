"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Settings,
  Home,
  Volume2,
  VolumeX,
  Monitor,
  Gamepad2,
  User,
  Bell,
  Shield,
  Zap,
  Eye,
  MessageSquare,
  Puzzle,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

interface GameSettings {
  lightningMath: {
    timePerProblem: number
    maxProblems: number
    difficulty: "auto" | "easy" | "medium" | "hard"
    showHints: boolean
  }
  memoryFlash: {
    showTime: number
    maxItems: number
    itemType: "numbers" | "colors" | "shapes" | "mixed"
    enableSound: boolean
  }
  wordStorm: {
    timeLimit: number
    minWords: number
    language: "vi" | "en"
    allowRepeats: boolean
  }
  patternBreak: {
    timeLimit: number
    complexity: "simple" | "medium" | "complex"
    showProgress: boolean
  }
}

interface AppSettings {
  audio: {
    masterVolume: number
    soundEffects: boolean
    backgroundMusic: boolean
    voiceChat: boolean
  }
  display: {
    theme: "light" | "dark" | "auto"
    animations: boolean
    reducedMotion: boolean
    fontSize: "small" | "medium" | "large"
  }
  gameplay: {
    autoSave: boolean
    showTips: boolean
    pauseOnFocusLoss: boolean
    confirmExit: boolean
  }
  notifications: {
    dailyReminder: boolean
    achievementAlerts: boolean
    friendRequests: boolean
    gameInvites: boolean
  }
  privacy: {
    shareStats: boolean
    allowFriendRequests: boolean
    showOnlineStatus: boolean
    dataCollection: boolean
  }
}

export default function SettingsPage() {
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    lightningMath: {
      timePerProblem: 5,
      maxProblems: 20,
      difficulty: "auto",
      showHints: true,
    },
    memoryFlash: {
      showTime: 3,
      maxItems: 8,
      itemType: "mixed",
      enableSound: true,
    },
    wordStorm: {
      timeLimit: 10,
      minWords: 5,
      language: "vi",
      allowRepeats: false,
    },
    patternBreak: {
      timeLimit: 15,
      complexity: "medium",
      showProgress: true,
    },
  })

  const [appSettings, setAppSettings] = useState<AppSettings>({
    audio: {
      masterVolume: 75,
      soundEffects: true,
      backgroundMusic: true,
      voiceChat: false,
    },
    display: {
      theme: "light",
      animations: true,
      reducedMotion: false,
      fontSize: "medium",
    },
    gameplay: {
      autoSave: true,
      showTips: true,
      pauseOnFocusLoss: true,
      confirmExit: true,
    },
    notifications: {
      dailyReminder: true,
      achievementAlerts: true,
      friendRequests: true,
      gameInvites: true,
    },
    privacy: {
      shareStats: true,
      allowFriendRequests: true,
      showOnlineStatus: true,
      dataCollection: false,
    },
  })

  const [playerProfile, setPlayerProfile] = useState({
    displayName: "Player123",
    email: "player@example.com",
    avatar: "PL",
  })

  const updateGameSetting = (game: keyof GameSettings, setting: string, value: any) => {
    setGameSettings((prev) => ({
      ...prev,
      [game]: {
        ...prev[game],
        [setting]: value,
      },
    }))
  }

  const updateAppSetting = (category: keyof AppSettings, setting: string, value: any) => {
    setAppSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value,
      },
    }))
  }

  const resetToDefaults = () => {
    // Reset all settings to default values
    console.log("Resetting to defaults...")
  }

  const exportSettings = () => {
    const allSettings = { gameSettings, appSettings, playerProfile }
    const dataStr = JSON.stringify(allSettings, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "brain-speed-settings.json"
    link.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
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
                <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Cài đặt</h1>
                  <p className="text-sm text-gray-500">Tùy chỉnh trải nghiệm game</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={exportSettings}>
                Xuất cài đặt
              </Button>
              <Button variant="outline" onClick={resetToDefaults}>
                Khôi phục mặc định
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="games" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="games" className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              <span className="hidden sm:inline">Trò chơi</span>
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <span className="hidden sm:inline">Âm thanh</span>
            </TabsTrigger>
            <TabsTrigger value="display" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Hiển thị</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Hồ sơ</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Riêng tư</span>
            </TabsTrigger>
          </TabsList>

          {/* Game Settings */}
          <TabsContent value="games" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Lightning Math */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Lightning Math
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Thời gian mỗi câu (giây)</Label>
                    <Slider
                      value={[gameSettings.lightningMath.timePerProblem]}
                      onValueChange={([value]) => updateGameSetting("lightningMath", "timePerProblem", value)}
                      min={3}
                      max={10}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-sm text-gray-500 mt-1">{gameSettings.lightningMath.timePerProblem} giây</div>
                  </div>

                  <div>
                    <Label>Số câu hỏi tối đa</Label>
                    <Slider
                      value={[gameSettings.lightningMath.maxProblems]}
                      onValueChange={([value]) => updateGameSetting("lightningMath", "maxProblems", value)}
                      min={10}
                      max={50}
                      step={5}
                      className="mt-2"
                    />
                    <div className="text-sm text-gray-500 mt-1">{gameSettings.lightningMath.maxProblems} câu</div>
                  </div>

                  <div>
                    <Label>Độ khó</Label>
                    <Select
                      value={gameSettings.lightningMath.difficulty}
                      onValueChange={(value) => updateGameSetting("lightningMath", "difficulty", value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Tự động</SelectItem>
                        <SelectItem value="easy">Dễ</SelectItem>
                        <SelectItem value="medium">Trung bình</SelectItem>
                        <SelectItem value="hard">Khó</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Hiển thị gợi ý</Label>
                    <Switch
                      checked={gameSettings.lightningMath.showHints}
                      onCheckedChange={(checked) => updateGameSetting("lightningMath", "showHints", checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Memory Flash */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-blue-500" />
                    Memory Flash
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Thời gian hiển thị (giây)</Label>
                    <Slider
                      value={[gameSettings.memoryFlash.showTime]}
                      onValueChange={([value]) => updateGameSetting("memoryFlash", "showTime", value)}
                      min={1}
                      max={5}
                      step={0.5}
                      className="mt-2"
                    />
                    <div className="text-sm text-gray-500 mt-1">{gameSettings.memoryFlash.showTime} giây</div>
                  </div>

                  <div>
                    <Label>Số items tối đa</Label>
                    <Slider
                      value={[gameSettings.memoryFlash.maxItems]}
                      onValueChange={([value]) => updateGameSetting("memoryFlash", "maxItems", value)}
                      min={4}
                      max={12}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-sm text-gray-500 mt-1">{gameSettings.memoryFlash.maxItems} items</div>
                  </div>

                  <div>
                    <Label>Loại items</Label>
                    <Select
                      value={gameSettings.memoryFlash.itemType}
                      onValueChange={(value) => updateGameSetting("memoryFlash", "itemType", value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="numbers">Số</SelectItem>
                        <SelectItem value="colors">Màu sắc</SelectItem>
                        <SelectItem value="shapes">Hình dạng</SelectItem>
                        <SelectItem value="mixed">Hỗn hợp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Âm thanh</Label>
                    <Switch
                      checked={gameSettings.memoryFlash.enableSound}
                      onCheckedChange={(checked) => updateGameSetting("memoryFlash", "enableSound", checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Word Storm */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-green-500" />
                    Word Storm
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Thời gian giới hạn (giây)</Label>
                    <Slider
                      value={[gameSettings.wordStorm.timeLimit]}
                      onValueChange={([value]) => updateGameSetting("wordStorm", "timeLimit", value)}
                      min={5}
                      max={30}
                      step={5}
                      className="mt-2"
                    />
                    <div className="text-sm text-gray-500 mt-1">{gameSettings.wordStorm.timeLimit} giây</div>
                  </div>

                  <div>
                    <Label>Số từ tối thiểu</Label>
                    <Slider
                      value={[gameSettings.wordStorm.minWords]}
                      onValueChange={([value]) => updateGameSetting("wordStorm", "minWords", value)}
                      min={3}
                      max={10}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-sm text-gray-500 mt-1">{gameSettings.wordStorm.minWords} từ</div>
                  </div>

                  <div>
                    <Label>Ngôn ngữ</Label>
                    <Select
                      value={gameSettings.wordStorm.language}
                      onValueChange={(value) => updateGameSetting("wordStorm", "language", value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vi">Tiếng Việt</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Cho phép lặp từ</Label>
                    <Switch
                      checked={gameSettings.wordStorm.allowRepeats}
                      onCheckedChange={(checked) => updateGameSetting("wordStorm", "allowRepeats", checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Pattern Break */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Puzzle className="h-5 w-5 text-purple-500" />
                    Pattern Break
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Thời gian giới hạn (giây)</Label>
                    <Slider
                      value={[gameSettings.patternBreak.timeLimit]}
                      onValueChange={([value]) => updateGameSetting("patternBreak", "timeLimit", value)}
                      min={10}
                      max={60}
                      step={5}
                      className="mt-2"
                    />
                    <div className="text-sm text-gray-500 mt-1">{gameSettings.patternBreak.timeLimit} giây</div>
                  </div>

                  <div>
                    <Label>Độ phức tạp</Label>
                    <Select
                      value={gameSettings.patternBreak.complexity}
                      onValueChange={(value) => updateGameSetting("patternBreak", "complexity", value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Đơn giản</SelectItem>
                        <SelectItem value="medium">Trung bình</SelectItem>
                        <SelectItem value="complex">Phức tạp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Hiển thị tiến độ</Label>
                    <Switch
                      checked={gameSettings.patternBreak.showProgress}
                      onCheckedChange={(checked) => updateGameSetting("patternBreak", "showProgress", checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Audio Settings */}
          <TabsContent value="audio" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5" />
                    Cài đặt âm thanh
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Âm lượng chính</Label>
                      <div className="flex items-center gap-2">
                        {appSettings.audio.masterVolume === 0 ? (
                          <VolumeX className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Volume2 className="h-4 w-4 text-gray-600" />
                        )}
                        <span className="text-sm font-medium w-8">{appSettings.audio.masterVolume}%</span>
                      </div>
                    </div>
                    <Slider
                      value={[appSettings.audio.masterVolume]}
                      onValueChange={([value]) => updateAppSetting("audio", "masterVolume", value)}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between">
                      <Label>Hiệu ứng âm thanh</Label>
                      <Switch
                        checked={appSettings.audio.soundEffects}
                        onCheckedChange={(checked) => updateAppSetting("audio", "soundEffects", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Nhạc nền</Label>
                      <Switch
                        checked={appSettings.audio.backgroundMusic}
                        onCheckedChange={(checked) => updateAppSetting("audio", "backgroundMusic", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Voice chat</Label>
                      <Switch
                        checked={appSettings.audio.voiceChat}
                        onCheckedChange={(checked) => updateAppSetting("audio", "voiceChat", checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Display Settings */}
          <TabsContent value="display" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Cài đặt hiển thị
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Giao diện</Label>
                      <Select
                        value={appSettings.display.theme}
                        onValueChange={(value) => updateAppSetting("display", "theme", value)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Sáng</SelectItem>
                          <SelectItem value="dark">Tối</SelectItem>
                          <SelectItem value="auto">Tự động</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Kích thước chữ</Label>
                      <Select
                        value={appSettings.display.fontSize}
                        onValueChange={(value) => updateAppSetting("display", "fontSize", value)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Nhỏ</SelectItem>
                          <SelectItem value="medium">Trung bình</SelectItem>
                          <SelectItem value="large">Lớn</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between">
                      <Label>Hiệu ứng chuyển động</Label>
                      <Switch
                        checked={appSettings.display.animations}
                        onCheckedChange={(checked) => updateAppSetting("display", "animations", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Giảm chuyển động</Label>
                      <Switch
                        checked={appSettings.display.reducedMotion}
                        onCheckedChange={(checked) => updateAppSetting("display", "reducedMotion", checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Thông tin cá nhân
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {playerProfile.avatar}
                    </div>
                    <Button variant="outline">Thay đổi avatar</Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Tên hiển thị</Label>
                      <Input
                        value={playerProfile.displayName}
                        onChange={(e) => setPlayerProfile((prev) => ({ ...prev, displayName: e.target.value }))}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Email</Label>
                      <Input
                        value={playerProfile.email}
                        onChange={(e) => setPlayerProfile((prev) => ({ ...prev, email: e.target.value }))}
                        type="email"
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between">
                      <Label>Tự động lưu</Label>
                      <Switch
                        checked={appSettings.gameplay.autoSave}
                        onCheckedChange={(checked) => updateAppSetting("gameplay", "autoSave", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Hiển thị tips</Label>
                      <Switch
                        checked={appSettings.gameplay.showTips}
                        onCheckedChange={(checked) => updateAppSetting("gameplay", "showTips", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Tạm dừng khi mất focus</Label>
                      <Switch
                        checked={appSettings.gameplay.pauseOnFocusLoss}
                        onCheckedChange={(checked) => updateAppSetting("gameplay", "pauseOnFocusLoss", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Xác nhận khi thoát</Label>
                      <Switch
                        checked={appSettings.gameplay.confirmExit}
                        onCheckedChange={(checked) => updateAppSetting("gameplay", "confirmExit", checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Thông báo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between">
                      <Label>Nhắc nhở hàng ngày</Label>
                      <Switch
                        checked={appSettings.notifications.dailyReminder}
                        onCheckedChange={(checked) => updateAppSetting("notifications", "dailyReminder", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Thông báo thành tích</Label>
                      <Switch
                        checked={appSettings.notifications.achievementAlerts}
                        onCheckedChange={(checked) => updateAppSetting("notifications", "achievementAlerts", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Lời mời kết bạn</Label>
                      <Switch
                        checked={appSettings.notifications.friendRequests}
                        onCheckedChange={(checked) => updateAppSetting("notifications", "friendRequests", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Lời mời chơi game</Label>
                      <Switch
                        checked={appSettings.notifications.gameInvites}
                        onCheckedChange={(checked) => updateAppSetting("notifications", "gameInvites", checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Quyền riêng tư
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between">
                      <Label>Chia sẻ thống kê</Label>
                      <Switch
                        checked={appSettings.privacy.shareStats}
                        onCheckedChange={(checked) => updateAppSetting("privacy", "shareStats", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Cho phép lời mời kết bạn</Label>
                      <Switch
                        checked={appSettings.privacy.allowFriendRequests}
                        onCheckedChange={(checked) => updateAppSetting("privacy", "allowFriendRequests", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Hiển thị trạng thái online</Label>
                      <Switch
                        checked={appSettings.privacy.showOnlineStatus}
                        onCheckedChange={(checked) => updateAppSetting("privacy", "showOnlineStatus", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Thu thập dữ liệu</Label>
                      <Switch
                        checked={appSettings.privacy.dataCollection}
                        onCheckedChange={(checked) => updateAppSetting("privacy", "dataCollection", checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
