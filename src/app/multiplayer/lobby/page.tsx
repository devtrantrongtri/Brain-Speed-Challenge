"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, Home, Settings, Crown, Wifi, WifiOff, MessageCircle, Play, UserPlus, Copy, Check } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { MultiplayerManager, Player, Room, ChatMessage } from "@/lib/multiplayer-manager"
import { audioManager } from "@/lib/audio-manager"

export default function MultiplayerLobby() {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null)
  const [availableRooms, setAvailableRooms] = useState<Room[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [playerName, setPlayerName] = useState("Player" + Math.floor(Math.random() * 1000))
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")
  const [roomIdInput, setRoomIdInput] = useState("")
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [newRoomName, setNewRoomName] = useState("")
  const [copiedRoomId, setCopiedRoomId] = useState(false)
  const [selectedGameMode, setSelectedGameMode] = useState("lightning-math")

  const multiplayerManager = useRef<MultiplayerManager>(new MultiplayerManager())
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize multiplayer callbacks
    multiplayerManager.current.setCallbacks({
      onRoomUpdate: (room) => {
        setCurrentRoom(room)
        setConnectionStatus("connected")
      },
      onGameMessage: (message) => {
        console.log("Game message received:", message)
        // Handle game-specific messages
      },
      onChatMessage: (message) => {
        setChatMessages((prev) => [...prev, message])
        audioManager.playSound('notification')
      }
    })

    // Load available rooms
    loadAvailableRooms()

    return () => {
      multiplayerManager.current.disconnect()
    }
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const loadAvailableRooms = async () => {
    try {
      const rooms = await multiplayerManager.current.getAvailableRooms()
      setAvailableRooms(rooms)
    } catch (error) {
      console.error("Failed to load rooms:", error)
    }
  }

  const addSystemMessage = (message: string) => {
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      playerId: "system",
      playerName: "System",
      message,
      timestamp: new Date(),
      type: "system",
    }
    setChatMessages((prev) => [...prev, systemMessage])
  }

  const createRoom = async () => {
    if (!newRoomName.trim()) return

    setConnectionStatus("connecting")
    try {
      const roomId = await multiplayerManager.current.createRoom(
        newRoomName,
        selectedGameMode,
        4
      )
      
      setNewRoomName("")
      setShowCreateRoom(false)
      addSystemMessage(`Phòng "${newRoomName}" đã được tạo với ID: ${roomId}`)
      audioManager.playSound('notification')
      
      // Auto-join the created room
      await joinRoomById(roomId)
    } catch (error) {
      console.error("Failed to create room:", error)
      setConnectionStatus("disconnected")
      addSystemMessage("Không thể tạo phòng. Vui lòng thử lại.")
    }
  }

  const joinRoom = async (room: Room) => {
    setConnectionStatus("connecting")
    try {
      const joinedRoom = await multiplayerManager.current.joinRoom(room.id, playerName)
      setCurrentRoom(joinedRoom)
      setConnectionStatus("connected")
      audioManager.playSound('opponent-joined')
      addSystemMessage(`Đã tham gia phòng "${room.name}"`)
    } catch (error) {
      console.error("Failed to join room:", error)
      setConnectionStatus("disconnected")
      addSystemMessage("Không thể tham gia phòng. Phòng có thể đã đầy.")
    }
  }

  const joinRoomById = async (roomId?: string) => {
    const targetRoomId = roomId || roomIdInput.trim().toUpperCase()
    if (!targetRoomId) return

    setConnectionStatus("connecting")
    try {
      const joinedRoom = await multiplayerManager.current.joinRoom(targetRoomId, playerName)
      setCurrentRoom(joinedRoom)
      setConnectionStatus("connected")
      setRoomIdInput("")
      audioManager.playSound('opponent-joined')
      addSystemMessage(`Đã tham gia phòng với ID: ${targetRoomId}`)
    } catch (error) {
      console.error("Failed to join room by ID:", error)
      setConnectionStatus("disconnected")
      addSystemMessage("Không tìm thấy phòng hoặc phòng đã đầy.")
    }
  }

  const leaveRoom = async () => {
    try {
      await multiplayerManager.current.leaveRoom()
      setCurrentRoom(null)
      setConnectionStatus("disconnected")
      setChatMessages([])
      addSystemMessage("Đã rời khỏi phòng")
      await loadAvailableRooms()
    } catch (error) {
      console.error("Failed to leave room:", error)
    }
  }

  const toggleReady = () => {
    if (!currentRoom) return
    
    multiplayerManager.current.toggleReady()
    const localPlayer = multiplayerManager.current.getLocalPlayer()
    
    if (localPlayer?.isReady) {
      audioManager.playSound('button-click')
      addSystemMessage("Bạn đã sẵn sàng!")
    } else {
      addSystemMessage("Bạn chưa sẵn sàng")
    }
  }

  const startGame = () => {
    if (!currentRoom) return
    
    const localPlayer = multiplayerManager.current.getLocalPlayer()
    if (!localPlayer?.isHost) return
    
    // Check if all players are ready
    const allReady = currentRoom.players.every(player => player.isReady)
    if (!allReady) {
      addSystemMessage("Tất cả người chơi phải sẵn sàng trước khi bắt đầu!")
      return
    }

    multiplayerManager.current.startGame()
    audioManager.playSound('countdown')
    addSystemMessage("Trò chơi bắt đầu!")
    
    // Redirect to game
    window.location.href = `/games/${currentRoom.gameMode.toLowerCase().replace(' ', '-')}`
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !currentRoom) return

    multiplayerManager.current.sendChatMessage(newMessage)
    setNewMessage("")
  }

  const copyRoomId = () => {
    if (!currentRoom) return
    
    navigator.clipboard.writeText(currentRoom.id)
    setCopiedRoomId(true)
    audioManager.playSound('button-click')
    
    setTimeout(() => setCopiedRoomId(false), 2000)
  }

  const getGameModeOptions = () => [
    { value: "lightning-math", label: "Lightning Math", description: "Giải toán nhanh" },
    { value: "memory-flash", label: "Memory Flash", description: "Trí nhớ hình ảnh" },
    { value: "word-storm", label: "Word Storm", description: "Liên tưởng từ" },
    { value: "pattern-break", label: "Pattern Break", description: "Phá vỡ quy luật" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
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
                <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Multiplayer Lobby</h1>
                  <p className="text-sm text-gray-500">Thách đấu với bạn bè</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {connectionStatus === "connected" ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm font-medium capitalize">{connectionStatus}</span>
              </div>
              
              {currentRoom && (
                <Button onClick={leaveRoom} variant="outline" size="sm">
                  Rời phòng
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {!currentRoom ? (
          // Lobby Screen
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Player Setup */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin người chơi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{playerName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <Input
                    placeholder="Tên người chơi"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Create Room */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Tạo phòng mới
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!showCreateRoom ? (
                    <Button
                      onClick={() => setShowCreateRoom(true)}
                      className="w-full bg-purple-500 hover:bg-purple-600"
                    >
                      Tạo phòng
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <Input
                        placeholder="Tên phòng"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                      />
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Game Mode:</label>
                        <select
                          value={selectedGameMode}
                          onChange={(e) => setSelectedGameMode(e.target.value)}
                          className="w-full p-2 border rounded-md"
                        >
                          {getGameModeOptions().map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label} - {option.description}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={createRoom}
                          disabled={!newRoomName.trim() || connectionStatus === "connecting"}
                          className="flex-1"
                        >
                          {connectionStatus === "connecting" ? "Đang tạo..." : "Tạo"}
                        </Button>
                        <Button
                          onClick={() => setShowCreateRoom(false)}
                          variant="outline"
                        >
                          Hủy
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Join by ID */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Tham gia bằng ID
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Nhập Room ID"
                    value={roomIdInput}
                    onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                  <Button
                    onClick={() => joinRoomById()}
                    disabled={!roomIdInput.trim() || connectionStatus === "connecting"}
                    className="w-full bg-blue-500 hover:bg-blue-600"
                  >
                    {connectionStatus === "connecting" ? "Đang tham gia..." : "Tham gia"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Available Rooms */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Phòng có sẵn</CardTitle>
                <Button onClick={loadAvailableRooms} variant="outline" size="sm">
                  Làm mới
                </Button>
              </CardHeader>
              <CardContent>
                {availableRooms.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Không có phòng nào. Hãy tạo phòng mới!
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {availableRooms.map((room) => (
                      <motion.div
                        key={room.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{room.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>{room.gameMode}</span>
                              <span>{room.players.length}/{room.maxPlayers} người chơi</span>
                              <Badge variant={room.gameState === "waiting" ? "secondary" : "outline"}>
                                {room.gameState === "waiting" ? "Đang chờ" : "Đang chơi"}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            onClick={() => joinRoom(room)}
                            disabled={room.players.length >= room.maxPlayers || room.gameState !== "waiting"}
                          >
                            Tham gia
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          // Room Screen
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Room Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {currentRoom.name}
                      <Badge variant="outline" className="font-mono">
                        {currentRoom.id}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {currentRoom.gameMode} • {currentRoom.players.length}/{currentRoom.maxPlayers} người chơi
                    </p>
                  </div>
                  <Button
                    onClick={copyRoomId}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {copiedRoomId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copiedRoomId ? "Đã copy!" : "Copy ID"}
                  </Button>
                </div>
              </CardHeader>
            </Card>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Players List */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Người chơi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentRoom.players.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{player.name}</span>
                              {player.isHost && <Crown className="h-4 w-4 text-yellow-500" />}
                            </div>
                            <div className="text-sm text-gray-600">
                              Ping: {player.ping}ms
                            </div>
                          </div>
                        </div>
                        <Badge variant={player.isReady ? "default" : "secondary"}>
                          {player.isReady ? "Sẵn sàng" : "Chưa sẵn sàng"}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex gap-3">
                    <Button
                      onClick={toggleReady}
                      variant={multiplayerManager.current.getLocalPlayer()?.isReady ? "secondary" : "default"}
                      className="flex-1"
                    >
                      {multiplayerManager.current.getLocalPlayer()?.isReady ? "Chưa sẵn sàng" : "Sẵn sàng"}
                    </Button>
                    
                    {multiplayerManager.current.getLocalPlayer()?.isHost && (
                      <Button
                        onClick={startGame}
                        disabled={!currentRoom.players.every(p => p.isReady)}
                        className="flex-1 bg-green-500 hover:bg-green-600"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Bắt đầu
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Chat */}
              <Card>
                <CardHeader>
                  <CardTitle>Chat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-64 overflow-y-auto space-y-2 p-3 bg-gray-50 rounded-lg">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`text-sm ${
                          message.type === "system" ? "text-gray-500 italic" : ""
                        }`}
                      >
                        {message.type === "system" ? (
                          message.message
                        ) : (
                          <div>
                            <span className="font-medium">{message.playerName}:</span>{" "}
                            {message.message}
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Nhập tin nhắn..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} size="sm">
                      Gửi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
