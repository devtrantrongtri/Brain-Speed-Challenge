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

interface Player {
  id: string
  name: string
  isHost: boolean
  isReady: boolean
  avatar: string
  ping: number
}

interface Room {
  id: string
  name: string
  players: Player[]
  maxPlayers: number
  gameMode: string
  isPrivate: boolean
}

interface ChatMessage {
  id: string
  playerId: string
  playerName: string
  message: string
  timestamp: Date
  type: "message" | "system"
}

// Mock WebRTC P2P connection manager
class P2PManager {
  private connections: Map<string, RTCPeerConnection> = new Map()
  private localStream: MediaStream | null = null
  private onPlayerJoined?: (player: Player) => void
  private onPlayerLeft?: (playerId: string) => void
  private onMessageReceived?: (message: ChatMessage) => void

  constructor() {
    this.initializeLocalStream()
  }

  private async initializeLocalStream() {
    // In a real implementation, this would set up audio/video if needed
    console.log("P2P Manager initialized")
  }

  setCallbacks(callbacks: {
    onPlayerJoined?: (player: Player) => void
    onPlayerLeft?: (playerId: string) => void
    onMessageReceived?: (message: ChatMessage) => void
  }) {
    this.onPlayerJoined = callbacks.onPlayerJoined
    this.onPlayerLeft = callbacks.onPlayerLeft
    this.onMessageReceived = callbacks.onMessageReceived
  }

  async createRoom(roomName: string): Promise<string> {
    // Mock room creation
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase()
    console.log(`Created room: ${roomId}`)
    return roomId
  }

  async joinRoom(roomId: string): Promise<boolean> {
    // Mock room joining
    console.log(`Joining room: ${roomId}`)
    return true
  }

  sendMessage(message: string) {
    // Mock message sending
    console.log(`Sending message: ${message}`)
  }

  disconnect() {
    this.connections.forEach((connection) => connection.close())
    this.connections.clear()
  }
}

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

  const p2pManager = useRef<P2PManager>(new P2PManager())
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize P2P callbacks
    p2pManager.current.setCallbacks({
      onPlayerJoined: (player) => {
        if (currentRoom) {
          setCurrentRoom((prev) =>
            prev
              ? {
                  ...prev,
                  players: [...prev.players, player],
                }
              : null,
          )
        }
        addSystemMessage(`${player.name} đã tham gia phòng`)
      },
      onPlayerLeft: (playerId) => {
        if (currentRoom) {
          const player = currentRoom.players.find((p) => p.id === playerId)
          setCurrentRoom((prev) =>
            prev
              ? {
                  ...prev,
                  players: prev.players.filter((p) => p.id !== playerId),
                }
              : null,
          )
          if (player) {
            addSystemMessage(`${player.name} đã rời phòng`)
          }
        }
      },
      onMessageReceived: (message) => {
        setChatMessages((prev) => [...prev, message])
      },
    })

    // Mock available rooms
    setAvailableRooms([
      {
        id: "ROOM01",
        name: "Lightning Math Battle",
        players: [
          { id: "1", name: "MathMaster", isHost: true, isReady: true, avatar: "MM", ping: 45 },
          { id: "2", name: "QuickCalc", isHost: false, isReady: false, avatar: "QC", ping: 67 },
        ],
        maxPlayers: 4,
        gameMode: "Lightning Math",
        isPrivate: false,
      },
      {
        id: "ROOM02",
        name: "Memory Champions",
        players: [{ id: "3", name: "BrainPower", isHost: true, isReady: true, avatar: "BP", ping: 23 }],
        maxPlayers: 2,
        gameMode: "Memory Flash",
        isPrivate: false,
      },
    ])

    return () => {
      p2pManager.current.disconnect()
    }
  }, [currentRoom])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

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
      const roomId = await p2pManager.current.createRoom(newRoomName)
      const newRoom: Room = {
        id: roomId,
        name: newRoomName,
        players: [
          {
            id: "me",
            name: playerName,
            isHost: true,
            isReady: false,
            avatar: playerName.substring(0, 2).toUpperCase(),
            ping: 0,
          },
        ],
        maxPlayers: 4,
        gameMode: "Lightning Math",
        isPrivate: false,
      }

      setCurrentRoom(newRoom)
      setConnectionStatus("connected")
      setShowCreateRoom(false)
      setNewRoomName("")
      addSystemMessage(`Phòng "${newRoomName}" đã được tạo`)
    } catch (error) {
      setConnectionStatus("disconnected")
      console.error("Failed to create room:", error)
    }
  }

  const joinRoom = async (room: Room) => {
    setConnectionStatus("connecting")
    try {
      await p2pManager.current.joinRoom(room.id)
      const updatedRoom: Room = {
        ...room,
        players: [
          ...room.players,
          {
            id: "me",
            name: playerName,
            isHost: false,
            isReady: false,
            avatar: playerName.substring(0, 2).toUpperCase(),
            ping: 0,
          },
        ],
      }

      setCurrentRoom(updatedRoom)
      setConnectionStatus("connected")
      addSystemMessage(`Đã tham gia phòng "${room.name}"`)
    } catch (error) {
      setConnectionStatus("disconnected")
      console.error("Failed to join room:", error)
    }
  }

  const joinRoomById = async () => {
    if (!roomIdInput.trim()) return

    setConnectionStatus("connecting")
    try {
      await p2pManager.current.joinRoom(roomIdInput)
      // Mock room data
      const room: Room = {
        id: roomIdInput,
        name: "Private Room",
        players: [
          {
            id: "me",
            name: playerName,
            isHost: false,
            isReady: false,
            avatar: playerName.substring(0, 2).toUpperCase(),
            ping: 0,
          },
        ],
        maxPlayers: 4,
        gameMode: "Mixed Games",
        isPrivate: true,
      }

      setCurrentRoom(room)
      setConnectionStatus("connected")
      setRoomIdInput("")
      addSystemMessage(`Đã tham gia phòng ${roomIdInput}`)
    } catch (error) {
      setConnectionStatus("disconnected")
      console.error("Failed to join room:", error)
    }
  }

  const leaveRoom = () => {
    if (currentRoom) {
      addSystemMessage(`Đã rời phòng "${currentRoom.name}"`)
      setCurrentRoom(null)
      setConnectionStatus("disconnected")
      setChatMessages([])
    }
  }

  const toggleReady = () => {
    if (!currentRoom) return

    setCurrentRoom((prev) =>
      prev
        ? {
            ...prev,
            players: prev.players.map((player) =>
              player.id === "me" ? { ...player, isReady: !player.isReady } : player,
            ),
          }
        : null,
    )
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !currentRoom) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      playerId: "me",
      playerName: playerName,
      message: newMessage,
      timestamp: new Date(),
      type: "message",
    }

    setChatMessages((prev) => [...prev, message])
    p2pManager.current.sendMessage(newMessage)
    setNewMessage("")
  }

  const copyRoomId = () => {
    if (currentRoom) {
      navigator.clipboard.writeText(currentRoom.id)
      setCopiedRoomId(true)
      setTimeout(() => setCopiedRoomId(false), 2000)
    }
  }

  const allPlayersReady = currentRoom?.players.every((p) => p.isReady) && currentRoom.players.length >= 2

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50">
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
                <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Multiplayer Lobby</h1>
                  <p className="text-sm text-gray-500">Thách đấu trực tiếp</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {connectionStatus === "connected" ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm capitalize">{connectionStatus}</span>
              </div>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {!currentRoom ? (
          // Lobby Screen
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Available Rooms */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Phòng chơi công khai</span>
                    <Button
                      onClick={() => setShowCreateRoom(true)}
                      className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Tạo phòng
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AnimatePresence>
                    {availableRooms.map((room, index) => (
                      <motion.div
                        key={room.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold">{room.name}</h3>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Badge variant="outline">{room.gameMode}</Badge>
                                <span>
                                  {room.players.length}/{room.maxPlayers} người chơi
                                </span>
                              </div>
                            </div>
                            <Button
                              onClick={() => joinRoom(room)}
                              disabled={room.players.length >= room.maxPlayers || connectionStatus === "connecting"}
                              size="sm"
                            >
                              {connectionStatus === "connecting" ? "Đang kết nối..." : "Tham gia"}
                            </Button>
                          </div>

                          <div className="flex items-center gap-2">
                            {room.players.map((player) => (
                              <div key={player.id} className="flex items-center gap-1">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">{player.avatar}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs">{player.name}</span>
                                {player.isHost && <Crown className="h-3 w-3 text-yellow-500" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tham gia bằng mã phòng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Nhập mã phòng..."
                    value={roomIdInput}
                    onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                  <Button
                    onClick={joinRoomById}
                    disabled={!roomIdInput.trim() || connectionStatus === "connecting"}
                    className="w-full"
                  >
                    Tham gia phòng
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Thông tin người chơi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Tên hiển thị</label>
                    <Input
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Nhập tên của bạn..."
                    />
                  </div>
                  <div className="flex items-center justify-center">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-lg">{playerName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // Room Screen
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Room Info & Players */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {currentRoom.name}
                        {currentRoom.isPrivate && <Badge variant="secondary">Private</Badge>}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                        <span>Mã phòng: {currentRoom.id}</span>
                        <Button variant="ghost" size="sm" onClick={copyRoomId} className="h-6 px-2">
                          {copiedRoomId ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                    <Button variant="outline" onClick={leaveRoom}>
                      Rời phòng
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: currentRoom.maxPlayers }).map((_, index) => {
                      const player = currentRoom.players[index]
                      return (
                        <div
                          key={index}
                          className={`p-4 border-2 rounded-lg ${
                            player
                              ? player.isReady
                                ? "border-green-500 bg-green-50"
                                : "border-gray-300 bg-white"
                              : "border-dashed border-gray-300 bg-gray-50"
                          }`}
                        >
                          {player ? (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback>{player.avatar}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">{player.name}</span>
                                    {player.isHost && <Crown className="h-4 w-4 text-yellow-500" />}
                                  </div>
                                  <div className="text-xs text-gray-500">Ping: {player.ping}ms</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant={player.isReady ? "default" : "secondary"}>
                                  {player.isReady ? "Sẵn sàng" : "Chưa sẵn sàng"}
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-gray-400">
                              <Users className="h-8 w-8 mx-auto mb-2" />
                              <span className="text-sm">Đang chờ người chơi...</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex gap-4 mt-6">
                    <Button
                      onClick={toggleReady}
                      variant={currentRoom.players.find((p) => p.id === "me")?.isReady ? "default" : "outline"}
                      className="flex-1"
                    >
                      {currentRoom.players.find((p) => p.id === "me")?.isReady ? "Hủy sẵn sàng" : "Sẵn sàng"}
                    </Button>

                    {currentRoom.players.find((p) => p.id === "me")?.isHost && (
                      <Button
                        disabled={!allPlayersReady}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Bắt đầu game
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat */}
            <div>
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Chat
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-2 rounded-lg ${
                          message.type === "system"
                            ? "bg-gray-100 text-gray-600 text-center text-sm"
                            : message.playerId === "me"
                              ? "bg-blue-500 text-white ml-8"
                              : "bg-gray-200 mr-8"
                        }`}
                      >
                        {message.type === "message" && (
                          <div className="text-xs opacity-75 mb-1">{message.playerName}</div>
                        )}
                        <div>{message.message}</div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Nhập tin nhắn..."
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                      Gửi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Create Room Modal */}
        <AnimatePresence>
          {showCreateRoom && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setShowCreateRoom(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
              >
                <h2 className="text-xl font-bold mb-4">Tạo phòng mới</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Tên phòng</label>
                    <Input
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      placeholder="Nhập tên phòng..."
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button onClick={() => setShowCreateRoom(false)} variant="outline" className="flex-1">
                      Hủy
                    </Button>
                    <Button
                      onClick={createRoom}
                      disabled={!newRoomName.trim() || connectionStatus === "connecting"}
                      className="flex-1"
                    >
                      {connectionStatus === "connecting" ? "Đang tạo..." : "Tạo phòng"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
