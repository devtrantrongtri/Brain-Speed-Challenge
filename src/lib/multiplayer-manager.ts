import { audioManager } from './audio-manager'

export interface Player {
  id: string
  name: string
  isHost: boolean
  isReady: boolean
  avatar: string
  ping: number
  score?: number
  position?: number
}

export interface Room {
  id: string
  name: string
  players: Player[]
  maxPlayers: number
  gameMode: string
  gameState: 'waiting' | 'starting' | 'playing' | 'finished'
  currentRound?: number
  hostId: string
}

export interface GameMessage {
  type: 'answer' | 'ready' | 'start-game' | 'end-game' | 'chat' | 'sync' | 'player-update'
  playerId: string
  data: any
  timestamp: number
}

export interface ChatMessage {
  id: string
  playerId: string
  playerName: string
  message: string
  timestamp: Date
  type: 'message' | 'system'
}

// WebRTC Peer Connection Manager
class PeerConnection {
  private pc: RTCPeerConnection
  private dataChannel: RTCDataChannel | null = null
  private onMessage: (message: GameMessage) => void
  private onStateChange: (state: RTCPeerConnectionState) => void

  constructor(
    isInitiator: boolean,
    onMessage: (message: GameMessage) => void,
    onStateChange: (state: RTCPeerConnectionState) => void
  ) {
    this.onMessage = onMessage
    this.onStateChange = onStateChange

    // Create RTCPeerConnection with STUN servers
    this.pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    })

    // Set up connection state monitoring
    this.pc.onconnectionstatechange = () => {
      this.onStateChange(this.pc.connectionState)
    }

    if (isInitiator) {
      this.createDataChannel()
    } else {
      this.pc.ondatachannel = (event) => {
        this.dataChannel = event.channel
        this.setupDataChannel()
      }
    }
  }

  private createDataChannel(): void {
    this.dataChannel = this.pc.createDataChannel('game', {
      ordered: true
    })
    this.setupDataChannel()
  }

  private setupDataChannel(): void {
    if (!this.dataChannel) return

    this.dataChannel.onopen = () => {
      console.log('Data channel opened')
    }

    this.dataChannel.onmessage = (event) => {
      try {
        const message: GameMessage = JSON.parse(event.data)
        this.onMessage(message)
      } catch (error) {
        console.error('Failed to parse message:', error)
      }
    }

    this.dataChannel.onclose = () => {
      console.log('Data channel closed')
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(offer)
    return offer
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    const answer = await this.pc.createAnswer()
    await this.pc.setLocalDescription(answer)
    return answer
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    await this.pc.setRemoteDescription(description)
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    await this.pc.addIceCandidate(candidate)
  }

  sendMessage(message: GameMessage): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(message))
    }
  }

  close(): void {
    if (this.dataChannel) {
      this.dataChannel.close()
    }
    this.pc.close()
  }

  get connectionState(): RTCPeerConnectionState {
    return this.pc.connectionState
  }
}

// Signaling Server Mock (In production, use Socket.io or similar)
class SignalingService {
  private static instance: SignalingService
  private rooms: Map<string, any> = new Map()
  private callbacks: Map<string, Function> = new Map()

  static getInstance(): SignalingService {
    if (!SignalingService.instance) {
      SignalingService.instance = new SignalingService()
    }
    return SignalingService.instance
  }

  // Mock methods - in production, these would communicate with a real server
  async createRoom(roomData: Partial<Room>): Promise<string> {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase()
    const room: Room = {
      id: roomId,
      name: roomData.name || `Room ${roomId}`,
      players: [],
      maxPlayers: roomData.maxPlayers || 4,
      gameMode: roomData.gameMode || 'lightning-math',
      gameState: 'waiting',
      hostId: ''
    }
    
    this.rooms.set(roomId, room)
    return roomId
  }

  async joinRoom(roomId: string, player: Player): Promise<Room | null> {
    const room = this.rooms.get(roomId)
    if (!room || room.players.length >= room.maxPlayers) {
      return null
    }

    if (room.players.length === 0) {
      room.hostId = player.id
      player.isHost = true
    }

    room.players.push(player)
    this.rooms.set(roomId, room)
    
    // Notify other players
    this.broadcast(roomId, {
      type: 'player-update',
      playerId: 'system',
      data: { action: 'joined', player, room },
      timestamp: Date.now()
    })

    return room
  }

  async leaveRoom(roomId: string, playerId: string): Promise<void> {
    const room = this.rooms.get(roomId)
    if (!room) return

    room.players = room.players.filter(p => p.id !== playerId)
    
    // If host left, assign new host
    if (room.hostId === playerId && room.players.length > 0) {
      room.hostId = room.players[0].id
      room.players[0].isHost = true
    }

    // If room is empty, delete it
    if (room.players.length === 0) {
      this.rooms.delete(roomId)
    } else {
      this.rooms.set(roomId, room)
      this.broadcast(roomId, {
        type: 'player-update',
        playerId: 'system',
        data: { action: 'left', playerId, room },
        timestamp: Date.now()
      })
    }
  }

  async getRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values()).filter(room => 
      room.gameState === 'waiting' && room.players.length < room.maxPlayers
    )
  }

  onMessage(roomId: string, callback: (message: GameMessage) => void): void {
    this.callbacks.set(`${roomId}-message`, callback)
  }

  broadcast(roomId: string, message: GameMessage): void {
    const callback = this.callbacks.get(`${roomId}-message`)
    if (callback) {
      // Simulate network delay
      setTimeout(() => callback(message), 50 + Math.random() * 100)
    }
  }

  // WebRTC signaling methods
  async sendOffer(roomId: string, targetPlayerId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    // In production, send to specific player
    console.log('Sending offer to', targetPlayerId)
  }

  async sendAnswer(roomId: string, targetPlayerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    // In production, send to specific player
    console.log('Sending answer to', targetPlayerId)
  }

  async sendIceCandidate(roomId: string, targetPlayerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    // In production, send to specific player
    console.log('Sending ICE candidate to', targetPlayerId)
  }
}

// Main Multiplayer Manager
export class MultiplayerManager {
  private currentRoom: Room | null = null
  private localPlayer: Player | null = null
  private peerConnections: Map<string, PeerConnection> = new Map()
  private signalingService: SignalingService
  private onRoomUpdate?: (room: Room) => void
  private onGameMessage?: (message: GameMessage) => void
  private onChatMessage?: (message: ChatMessage) => void
  private connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected'

  constructor() {
    this.signalingService = SignalingService.getInstance()
  }

  setCallbacks(callbacks: {
    onRoomUpdate?: (room: Room) => void
    onGameMessage?: (message: GameMessage) => void
    onChatMessage?: (message: ChatMessage) => void
  }): void {
    this.onRoomUpdate = callbacks.onRoomUpdate
    this.onGameMessage = callbacks.onGameMessage
    this.onChatMessage = callbacks.onChatMessage
  }

  async createRoom(roomName: string, gameMode: string, maxPlayers: number = 4): Promise<string> {
    try {
      this.connectionState = 'connecting'
      
      const roomId = await this.signalingService.createRoom({
        name: roomName,
        gameMode,
        maxPlayers
      })

      audioManager.playSound('notification')
      this.connectionState = 'connected'
      return roomId
    } catch (error) {
      this.connectionState = 'disconnected'
      throw error
    }
  }

  async joinRoom(roomId: string, playerName: string): Promise<Room> {
    try {
      this.connectionState = 'connecting'

      this.localPlayer = {
        id: this.generatePlayerId(),
        name: playerName,
        isHost: false,
        isReady: false,
        avatar: playerName.substring(0, 2).toUpperCase(),
        ping: 0
      }

      const room = await this.signalingService.joinRoom(roomId, this.localPlayer)
      if (!room) {
        throw new Error('Failed to join room')
      }

      this.currentRoom = room
      this.setupRoomListeners(roomId)
      
      // Connect to existing players via WebRTC
      await this.connectToExistingPlayers()

      audioManager.playSound('opponent-joined')
      this.connectionState = 'connected'
      
      return room
    } catch (error) {
      this.connectionState = 'disconnected'
      throw error
    }
  }

  async leaveRoom(): Promise<void> {
    if (!this.currentRoom || !this.localPlayer) return

    // Close all peer connections
    this.peerConnections.forEach(pc => pc.close())
    this.peerConnections.clear()

    await this.signalingService.leaveRoom(this.currentRoom.id, this.localPlayer.id)
    
    this.currentRoom = null
    this.localPlayer = null
    this.connectionState = 'disconnected'
  }

  async getAvailableRooms(): Promise<Room[]> {
    return await this.signalingService.getRooms()
  }

  toggleReady(): void {
    if (!this.localPlayer || !this.currentRoom) return

    this.localPlayer.isReady = !this.localPlayer.isReady
    
    this.broadcastMessage({
      type: 'ready',
      playerId: this.localPlayer.id,
      data: { isReady: this.localPlayer.isReady },
      timestamp: Date.now()
    })

    audioManager.playButtonClick()
  }

  startGame(): void {
    if (!this.localPlayer?.isHost || !this.currentRoom) return

    // Check if all players are ready
    const allReady = this.currentRoom.players.every(p => p.isReady)
    if (!allReady) {
      throw new Error('Not all players are ready')
    }

    this.currentRoom.gameState = 'starting'
    
    this.broadcastMessage({
      type: 'start-game',
      playerId: this.localPlayer.id,
      data: { gameMode: this.currentRoom.gameMode },
      timestamp: Date.now()
    })

    audioManager.playCountdown()
  }

  sendGameAnswer(answer: any): void {
    if (!this.localPlayer) return

    this.broadcastMessage({
      type: 'answer',
      playerId: this.localPlayer.id,
      data: { answer, timestamp: Date.now() },
      timestamp: Date.now()
    })
  }

  sendChatMessage(message: string): void {
    if (!this.localPlayer) return

    const chatMessage: ChatMessage = {
      id: Date.now().toString(),
      playerId: this.localPlayer.id,
      playerName: this.localPlayer.name,
      message,
      timestamp: new Date(),
      type: 'message'
    }

    this.broadcastMessage({
      type: 'chat',
      playerId: this.localPlayer.id,
      data: chatMessage,
      timestamp: Date.now()
    })

    this.onChatMessage?.(chatMessage)
  }

  updatePlayerScore(score: number): void {
    if (!this.localPlayer) return

    this.localPlayer.score = score
    
    this.broadcastMessage({
      type: 'player-update',
      playerId: this.localPlayer.id,
      data: { score },
      timestamp: Date.now()
    })
  }

  getCurrentRoom(): Room | null {
    return this.currentRoom
  }

  getLocalPlayer(): Player | null {
    return this.localPlayer
  }

  getConnectionState(): string {
    return this.connectionState
  }

  private async connectToExistingPlayers(): Promise<void> {
    if (!this.currentRoom || !this.localPlayer) return

    const otherPlayers = this.currentRoom.players.filter(p => p.id !== this.localPlayer!.id)
    
    for (const player of otherPlayers) {
      await this.createPeerConnection(player.id, true)
    }
  }

  private async createPeerConnection(playerId: string, isInitiator: boolean): Promise<void> {
    const pc = new PeerConnection(
      isInitiator,
      (message) => this.handlePeerMessage(playerId, message),
      (state) => this.handlePeerStateChange(playerId, state)
    )

    this.peerConnections.set(playerId, pc)

    if (isInitiator) {
      try {
        const offer = await pc.createOffer()
        await this.signalingService.sendOffer(this.currentRoom!.id, playerId, offer)
      } catch (error) {
        console.error('Failed to create offer:', error)
      }
    }
  }

  private setupRoomListeners(roomId: string): void {
    this.signalingService.onMessage(roomId, (message: GameMessage) => {
      this.handleGameMessage(message)
    })
  }

  private handleGameMessage(message: GameMessage): void {
    switch (message.type) {
      case 'player-update':
        this.handlePlayerUpdate(message)
        break
      case 'ready':
        this.handlePlayerReady(message)
        break
      case 'start-game':
        this.handleGameStart(message)
        break
      case 'chat':
        this.onChatMessage?.(message.data)
        break
      default:
        this.onGameMessage?.(message)
    }
  }

  private handlePlayerUpdate(message: GameMessage): void {
    if (!this.currentRoom) return

    const { action, player, playerId, score } = message.data

    if (action === 'joined' && player) {
      this.currentRoom.players.push(player)
      this.createPeerConnection(player.id, false)
      audioManager.playSound('opponent-joined')
    } else if (action === 'left' && playerId) {
      this.currentRoom.players = this.currentRoom.players.filter(p => p.id !== playerId)
      const pc = this.peerConnections.get(playerId)
      if (pc) {
        pc.close()
        this.peerConnections.delete(playerId)
      }
    } else if (score !== undefined) {
      const player = this.currentRoom.players.find(p => p.id === message.playerId)
      if (player) {
        player.score = score
      }
    }

    this.onRoomUpdate?.(this.currentRoom)
  }

  private handlePlayerReady(message: GameMessage): void {
    if (!this.currentRoom) return

    const player = this.currentRoom.players.find(p => p.id === message.playerId)
    if (player) {
      player.isReady = message.data.isReady
      this.onRoomUpdate?.(this.currentRoom)
    }
  }

  private handleGameStart(message: GameMessage): void {
    if (!this.currentRoom) return

    this.currentRoom.gameState = 'playing'
    this.onRoomUpdate?.(this.currentRoom)
    this.onGameMessage?.(message)
  }

  private handlePeerMessage(playerId: string, message: GameMessage): void {
    // Handle direct peer-to-peer messages
    this.onGameMessage?.(message)
  }

  private handlePeerStateChange(playerId: string, state: RTCPeerConnectionState): void {
    console.log(`Peer ${playerId} connection state:`, state)
    
    if (state === 'disconnected' || state === 'failed') {
      // Handle player disconnection
      this.peerConnections.delete(playerId)
    }
  }

  private broadcastMessage(message: GameMessage): void {
    // Send via signaling server (fallback)
    if (this.currentRoom) {
      this.signalingService.broadcast(this.currentRoom.id, message)
    }

    // Send via direct peer connections (primary)
    this.peerConnections.forEach(pc => {
      pc.sendMessage(message)
    })
  }

  private generatePlayerId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  // Cleanup method
  disconnect(): void {
    this.leaveRoom()
  }
}

// Global multiplayer instance
export const multiplayerManager = new MultiplayerManager() 