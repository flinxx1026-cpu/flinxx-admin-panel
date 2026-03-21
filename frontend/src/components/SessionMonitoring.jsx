import { useState, useEffect, useRef } from "react"
import { X, Maximize2, Minimize2, Copy, Check, Ban, Eye, EyeOff, Volume2, VolumeX, Wifi, WifiOff } from "lucide-react"
import api from "../services/api"
import ioClient from "socket.io-client"

/**
 * SessionMonitoring — Admin Hidden Spectator Mode
 * 
 * ARCHITECTURE:
 * - Connects to MAIN BACKEND (port 5000) via Socket.io for WebRTC signaling
 * - Admin emits 'admin:spectate' → main backend tells both users to create
 *   send-only PeerConnections → users send offers → admin creates answers
 * - Admin receives video+audio from both users as a hidden 3rd peer
 * - Users have NO indication that admin is watching
 */
export default function SessionMonitoring({ session, onClose }) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [durationTimer, setDurationTimer] = useState(0)
  const [copiedField, setCopiedField] = useState(null)
  const [spectatorStatus, setSpectatorStatus] = useState('connecting')
  const [error, setError] = useState(null)
  const [isMuted, setIsMuted] = useState(true)
  const [bannedUsers, setBannedUsers] = useState(new Set())
  const [sessionEnded, setSessionEnded] = useState(false)
  const [user1StreamReady, setUser1StreamReady] = useState(false)
  const [user2StreamReady, setUser2StreamReady] = useState(false)

  const user1VideoRef = useRef(null)
  const user2VideoRef = useRef(null)
  const peerConnectionsRef = useRef({}) // { user1: RTCPeerConnection, user2: RTCPeerConnection }
  const fromSocketToLabelRef = useRef({}) // { socketId: 'user1' | 'user2' }
  const iceCandidateBuffersRef = useRef({}) // { user1: [], user2: [] }
  const mainSocketRef = useRef(null)
  const userStreamsRef = useRef({}) // { user1: MediaStream, user2: MediaStream } — accumulates tracks

  // ===== LIVE DURATION TIMER =====
  useEffect(() => {
    const startTime = new Date(session.startedAtISO)
    const interval = setInterval(() => {
      const now = new Date()
      setDurationTimer(Math.floor((now - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [session])

  // ===== CONNECT TO MAIN BACKEND + START SPECTATING =====
  useEffect(() => {
    if (!session?.id) return

    const mainBackendUrl = import.meta.env.VITE_MAIN_BACKEND_URL || 'http://localhost:5000'
    console.log('👁️ [SPECTATOR] Connecting to main backend:', mainBackendUrl)

    // Connect to the MAIN backend (where WebRTC streams live)
    const mainSocket = ioClient(mainBackendUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    })

    mainSocketRef.current = mainSocket

    mainSocket.on('connect', () => {
      console.log('✅ [SPECTATOR] Connected to main backend, socket ID:', mainSocket.id)
      setSpectatorStatus('requesting')

      // Ask the main backend to tell both users to send their streams to us
      mainSocket.emit('admin:spectate', {
        sessionId: session.id
      })
      console.log('👁️ [SPECTATOR] Sent admin:spectate for session:', session.id)
    })

    // Server confirms spectator mode is initiated
    mainSocket.on('spectator:ready', (data) => {
      console.log('✅ [SPECTATOR] Spectator mode ready:', data)
      setSpectatorStatus('waiting_for_streams')
    })

    // Server reports error (session not found, users disconnected)
    mainSocket.on('spectator:error', (data) => {
      console.error('❌ [SPECTATOR] Error:', data.message)
      setError(data.message)
      setSpectatorStatus('failed')
    })

    // ===== RECEIVE OFFERS FROM USERS =====
    // Each user creates a send-only PeerConnection and sends us an offer
    mainSocket.on('spectator:offer', async (data) => {
      try {
        const { offer, from, sessionId, participantLabel } = data
        console.log(`📹 [SPECTATOR] Received offer from ${participantLabel} (socket: ${from})`)

        // Close any existing PC for this participant (reconnection)
        if (peerConnectionsRef.current[participantLabel]) {
          try { peerConnectionsRef.current[participantLabel].close() } catch(e) {}
        }
        
        // CRITICAL: Clean up the old MediaStream so we don't hold 'ended' tracks
        // from the previous PeerConnection! (This caused the black screen bug)
        if (userStreamsRef.current[participantLabel]) {
          delete userStreamsRef.current[participantLabel]
        }

        // Create a receive-only PeerConnection for this user
        // Record socket→label mapping for ICE routing
        fromSocketToLabelRef.current[from] = participantLabel

        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
          ]
        })

        // Store the PC by participant label
        peerConnectionsRef.current[participantLabel] = pc

        // ✅ Helper: Aggressively try to play video with retries
        const tryPlayVideo = (videoRef, label, attempt = 0) => {
          if (!videoRef.current) return
          const vid = videoRef.current
          vid.muted = true // Required for autoplay
          
          vid.play().then(() => {
            console.log(`▶️ [SPECTATOR] ${label} video play() succeeded (attempt ${attempt + 1})`)
          }).catch(err => {
            console.warn(`⚠️ [SPECTATOR] ${label} video play() failed (attempt ${attempt + 1}):`, err.message)
            // Retry with increasing delay (up to 5 attempts)
            if (attempt < 5) {
              setTimeout(() => tryPlayVideo(videoRef, label, attempt + 1), 500 * (attempt + 1))
            }
          })
        }

        // Handle incoming media tracks (video + audio)
        // NOTE: ontrack fires ONCE PER TRACK (video then audio)
        // We accumulate all tracks into a single MediaStream per user
        pc.ontrack = (event) => {
          const track = event.track
          console.log(`📹 [SPECTATOR] Received ${track.kind} track from ${participantLabel}`)
          console.log(`   Track details: id=${track.id}, readyState=${track.readyState}, enabled=${track.enabled}, muted=${track.muted}`)

          // Get or create a single accumulated MediaStream for this user
          if (!userStreamsRef.current[participantLabel]) {
            userStreamsRef.current[participantLabel] = new MediaStream()
          }
          const accumulatedStream = userStreamsRef.current[participantLabel]

          // Add this track to the accumulated stream (avoid duplicates)
          const existingTrack = accumulatedStream.getTracks().find(t => t.id === track.id)
          if (!existingTrack) {
            accumulatedStream.addTrack(track)
          }

          console.log(`   Accumulated stream now has ${accumulatedStream.getTracks().length} tracks:`,
            accumulatedStream.getTracks().map(t => `${t.kind}(${t.readyState}, muted=${t.muted})`).join(', '))

          // Attach stream to the correct video element
          const videoRef = participantLabel === 'user1' ? user1VideoRef : user2VideoRef
          const setReady = participantLabel === 'user1' ? setUser1StreamReady : setUser2StreamReady

          if (videoRef.current) {
            // Always set srcObject (even if same stream, track list may have changed)
            videoRef.current.srcObject = accumulatedStream
            console.log(`✅ [SPECTATOR] ${participantLabel} stream attached to video element`)
            
            // ✅ FIX: Add loadedmetadata listener for when video has enough data to play
            videoRef.current.onloadedmetadata = () => {
              console.log(`📺 [SPECTATOR] ${participantLabel} video has metadata — playing`)
              tryPlayVideo(videoRef, participantLabel)
            }
            
            // Try play immediately too
            tryPlayVideo(videoRef, participantLabel)
            setReady(true)
          }

          // ✅ CRITICAL FIX: When track unmutes, that's when actual frames arrive
          // We must re-trigger play() because the video might have been waiting for data
          track.onunmute = () => {
            console.log(`🔊 [SPECTATOR] ${participantLabel} ${track.kind} track UNMUTED (frames arriving!)`)
            if (videoRef.current) {
              // Re-set srcObject and try playing again
              videoRef.current.srcObject = accumulatedStream
              tryPlayVideo(videoRef, participantLabel)
            }
            setSpectatorStatus('active')
          }
          track.onended = () => {
            console.log(`⏹️ [SPECTATOR] ${participantLabel} ${track.kind} track ENDED`)
          }
        }

        // Send ICE candidates to the user
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            mainSocket.emit('spectator:ice_candidate', {
              candidate: event.candidate,
              to: from,
              sessionId
            })
          }
        }

        // Monitor connection state
        pc.onconnectionstatechange = () => {
          console.log(`🔌 [SPECTATOR] ${participantLabel} connection: ${pc.connectionState}`)
          if (pc.connectionState === 'connected') {
            console.log(`✅ [SPECTATOR] ${participantLabel} CONNECTED — media should flow now`)
            setSpectatorStatus('active')
            // ✅ FIX: Force video play when connection is established
            const videoRef = participantLabel === 'user1' ? user1VideoRef : user2VideoRef
            if (videoRef.current && userStreamsRef.current[participantLabel]) {
              videoRef.current.srcObject = userStreamsRef.current[participantLabel]
              tryPlayVideo(videoRef, participantLabel)
            }
          } else if (pc.connectionState === 'failed') {
            console.error(`❌ [SPECTATOR] ${participantLabel} connection FAILED`)
          } else if (pc.connectionState === 'disconnected') {
            console.warn(`⚠️ [SPECTATOR] ${participantLabel} connection DISCONNECTED`)
          }
        }

        pc.oniceconnectionstatechange = () => {
          console.log(`🧊 [SPECTATOR] ${participantLabel} ICE: ${pc.iceConnectionState}`)
          if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
            setSpectatorStatus('active')
            // ✅ FIX: Force video play on ICE connect too
            const videoRef = participantLabel === 'user1' ? user1VideoRef : user2VideoRef
            if (videoRef.current && userStreamsRef.current[participantLabel]) {
              tryPlayVideo(videoRef, participantLabel)
            }
          }
        }

        // Set the remote offer from the user
        await pc.setRemoteDescription(new RTCSessionDescription(offer))
        console.log(`✅ [SPECTATOR] Remote description set for ${participantLabel}`)

        // Flush any ICE candidates that arrived before remote description was set
        const buffered = iceCandidateBuffersRef.current[participantLabel] || []
        console.log(`🧊 [SPECTATOR] Flushing ${buffered.length} buffered ICE candidates for ${participantLabel}`)
        for (const c of buffered) {
          try { await pc.addIceCandidate(new RTCIceCandidate(c)) } catch(e) {}
        }
        iceCandidateBuffersRef.current[participantLabel] = []

        // Create and send answer (receive-only — we don't add any tracks)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        mainSocket.emit('spectator:answer', {
          answer: pc.localDescription,
          to: from,
          sessionId
        })

        console.log(`✅ [SPECTATOR] Answer sent to ${participantLabel}`)
      } catch (err) {
        console.error('❌ [SPECTATOR] Error handling offer:', err)
        setError('Failed to establish spectator connection: ' + err.message)
      }
    })

    // ===== ICE CANDIDATES FROM USERS =====
    mainSocket.on('spectator:ice_candidate', async (data) => {
      try {
        const { candidate, from } = data
        // Route ICE candidate to the correct PC using socket→label mapping
        const label = fromSocketToLabelRef.current[from]
        const pc = label ? peerConnectionsRef.current[label] : null
        if (pc && candidate) {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate))
          } else {
            // Buffer until remote description is set
            if (!iceCandidateBuffersRef.current[label]) iceCandidateBuffersRef.current[label] = []
            iceCandidateBuffersRef.current[label].push(candidate)
          }
        }
      } catch (err) {
        console.debug('[SPECTATOR] ICE candidate error:', err.message)
      }
    })

    // ===== SESSION END DETECTION =====
    mainSocket.on('user_skipped', () => {
      setSessionEnded(true)
      setSpectatorStatus('ended')
    })

    mainSocket.on('partner_disconnected', () => {
      setSessionEnded(true)
      setSpectatorStatus('ended')
    })

    mainSocket.on('disconnect', () => {
      console.log('❌ [SPECTATOR] Disconnected from main backend')
    })

    mainSocket.on('connect_error', (err) => {
      console.error('❌ [SPECTATOR] Connection error:', err.message)
      setError('Cannot connect to main server: ' + err.message)
      setSpectatorStatus('failed')
    })

    // ===== CLEANUP =====
    return () => {
      console.log('🧹 [SPECTATOR] Cleaning up spectator connections')
      // Close all peer connections
      for (const pc of Object.values(peerConnectionsRef.current)) {
        try { pc.close() } catch (e) {}
      }
      peerConnectionsRef.current = {}
      fromSocketToLabelRef.current = {}
      iceCandidateBuffersRef.current = {}
      userStreamsRef.current = {}
      // Disconnect from main backend
      mainSocket.disconnect()
      mainSocketRef.current = null
    }
  }, [session])

  // ===== MUTE/UNMUTE =====
  const toggleMute = () => {
    const newMuted = !isMuted
    setIsMuted(newMuted)
    // Toggle audio by changing the VIDEO ELEMENT's muted property
    // track.enabled alone doesn't work because <video muted> suppresses ALL audio output
    if (user1VideoRef.current) {
      user1VideoRef.current.muted = newMuted
      console.log(`🔊 [SPECTATOR] User 1 video element muted=${newMuted}`)
      // If unmuting, need to call play() again (autoplay policy)
      if (!newMuted) {
        user1VideoRef.current.play().catch(() => {})
      }
    }
    if (user2VideoRef.current) {
      user2VideoRef.current.muted = newMuted
      console.log(`🔊 [SPECTATOR] User 2 video element muted=${newMuted}`)
      if (!newMuted) {
        user2VideoRef.current.play().catch(() => {})
      }
    }
  }

  // ===== FORMATTERS =====
  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const getInitials = (name) => name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?"

  const banUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to ban ${userName}?`)) {
      try {
        await api.post(`/admin/users/${userId}/ban`,
          { reason: 'Banned during live session monitoring' },
          { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
        )
        setBannedUsers(prev => new Set([...prev, userId]))
      } catch (err) {
        alert('Error banning user: ' + (err.response?.data?.message || err.message))
      }
    }
  }

  const statusConfig = {
    connecting:         { color: 'yellow', text: 'Connecting to server...' },
    requesting:         { color: 'yellow', text: 'Requesting spectator access...' },
    waiting_for_streams: { color: 'yellow', text: 'Waiting for video streams...' },
    active:             { color: 'green',  text: 'Spectator Mode Active' },
    failed:             { color: 'red',    text: 'Connection Failed' },
    ended:              { color: 'red',    text: 'Session Ended' }
  }

  const status = statusConfig[spectatorStatus] || statusConfig.connecting

  return (
    <div className={`fixed inset-0 bg-black/80 z-50 flex items-center justify-center ${isFullscreen ? "p-0" : "p-4"}`}>
      <div className={`bg-dark-800 rounded-lg overflow-hidden flex flex-col ${isFullscreen ? "w-screen h-screen" : "w-full max-w-4xl max-h-[90vh]"}`}>
        {/* Header */}
        <div className="bg-dark-700 border-b border-dark-600 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-dark-100">Session Monitor</h2>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-${status.color}-900/30 text-${status.color}-400 border border-${status.color}-700/30`}
                style={{
                  backgroundColor: status.color === 'green' ? 'rgba(22,163,74,0.15)' : status.color === 'yellow' ? 'rgba(202,138,4,0.15)' : 'rgba(220,38,38,0.15)',
                  color: status.color === 'green' ? '#4ade80' : status.color === 'yellow' ? '#facc15' : '#f87171',
                  borderColor: status.color === 'green' ? 'rgba(22,163,74,0.3)' : status.color === 'yellow' ? 'rgba(202,138,4,0.3)' : 'rgba(220,38,38,0.3)'
                }}
              >
                <Eye size={10} />
                {status.text}
              </span>
            </div>
            <p className="text-sm text-dark-400 mt-1">
              Duration: <span className="font-mono font-bold text-dark-200">{formatDuration(durationTimer)}</span>
              {' '} • Hidden from users
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleMute}
              className={`p-2 rounded transition-colors ${isMuted ? 'bg-red-900/20 text-red-400' : 'hover:bg-dark-600 text-dark-300'}`}
              title={isMuted ? "Unmute" : "Mute"}>
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <button onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-dark-600 rounded transition-colors text-dark-300">
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button onClick={onClose}
              className="p-2 hover:bg-red-900/20 rounded transition-colors text-red-400">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-dark-900">
          {/* Error Banner */}
          {error && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 mb-6 flex items-center gap-3">
              <WifiOff size={20} className="text-red-400" />
              <div>
                <p className="text-red-300 font-medium">Connection Error</p>
                <p className="text-sm text-red-400/70">{error}</p>
              </div>
            </div>
          )}

          {sessionEnded && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 mb-6 flex items-center gap-3">
              <WifiOff size={20} className="text-red-400" />
              <div>
                <p className="text-red-300 font-medium">Session has ended</p>
                <p className="text-sm text-red-400/70">The video call between these users has been disconnected.</p>
              </div>
            </div>
          )}

          {/* Live Video Grid */}
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-100 flex items-center gap-2">
                <Eye size={18} />
                Live Video Feed
                <span className="text-xs font-normal text-dark-500">(Hidden Spectator Mode)</span>
              </h3>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: status.color === 'green' ? '#4ade80' : status.color === 'yellow' ? '#facc15' : '#f87171' }}>
                {spectatorStatus === 'active' ? <Wifi size={12} /> : <WifiOff size={12} />}
                {status.text}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* User 1 Video */}
              <div className="relative">
                <div className="bg-dark-900 rounded-lg overflow-hidden border border-dark-700">
                  <video
                    ref={user1VideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', aspectRatio: '16/9', background: '#000', objectFit: 'cover' }}
                  />
                </div>
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${user1StreamReady ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                  <span className="text-xs text-white font-medium">{session.user1.username}</span>
                </div>
              </div>

              {/* User 2 Video */}
              <div className="relative">
                <div className="bg-dark-900 rounded-lg overflow-hidden border border-dark-700">
                  <video
                    ref={user2VideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', aspectRatio: '16/9', background: '#000', objectFit: 'cover' }}
                  />
                </div>
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${user2StreamReady ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                  <span className="text-xs text-white font-medium">{session.user2.username}</span>
                </div>
              </div>
            </div>

            {spectatorStatus === 'waiting_for_streams' && (
              <div className="mt-4 text-center">
                <p className="text-dark-400 text-sm animate-pulse">
                  ⏳ Waiting for video streams from both users...
                </p>
              </div>
            )}
          </div>

          {/* Session Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-dark-800 border border-dark-700 rounded-lg p-5">
              <h3 className="text-base font-semibold text-dark-100 mb-3">Participants</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-dark-700 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {getInitials(session.user1.username)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark-100 truncate">{session.user1.username}</p>
                    <p className="text-xs text-dark-400 truncate">{session.user1.email}</p>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${user1StreamReady ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                </div>
                <div className="flex items-center gap-3 p-3 bg-dark-700 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {getInitials(session.user2.username)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark-100 truncate">{session.user2.username}</p>
                    <p className="text-xs text-dark-400 truncate">{session.user2.email}</p>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${user2StreamReady ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                </div>
              </div>
            </div>

            <div className="bg-dark-800 border border-dark-700 rounded-lg p-5">
              <h3 className="text-base font-semibold text-dark-100 mb-3">Session Info</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                  <span className="text-dark-400 text-sm">Duration</span>
                  <span className="text-xl font-bold font-mono text-blue-400">{formatDuration(durationTimer)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                  <span className="text-dark-400 text-sm">Session ID</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-dark-200">{session.sessionId}</span>
                    <button onClick={() => copyToClipboard(session.id, "sessionId")}
                      className="text-dark-400 hover:text-blue-400 transition-colors">
                      {copiedField === "sessionId" ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                  <span className="text-dark-400 text-sm">Started</span>
                  <span className="text-sm text-dark-200">{session.startedAt}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-5">
            <h3 className="text-base font-semibold text-dark-100 mb-3">Admin Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => banUser(session.user1.id, session.user1.username)}
                disabled={bannedUsers.has(session.user1.id)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors text-sm ${
                  bannedUsers.has(session.user1.id)
                    ? 'bg-gray-600/50 text-dark-400 cursor-not-allowed'
                    : 'bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-700/30'
                }`}>
                <Ban size={16} />
                <span>{bannedUsers.has(session.user1.id) ? 'Banned' : `Ban ${session.user1.username}`}</span>
              </button>
              <button onClick={() => banUser(session.user2.id, session.user2.username)}
                disabled={bannedUsers.has(session.user2.id)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors text-sm ${
                  bannedUsers.has(session.user2.id)
                    ? 'bg-gray-600/50 text-dark-400 cursor-not-allowed'
                    : 'bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-700/30'
                }`}>
                <Ban size={16} />
                <span>{bannedUsers.has(session.user2.id) ? 'Banned' : `Ban ${session.user2.username}`}</span>
              </button>
            </div>
          </div>

          {/* Hidden Spectator Info */}
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg flex items-center gap-3">
            <EyeOff size={18} className="text-blue-400 flex-shrink-0" />
            <p className="text-sm text-blue-300">
              You are in <strong>hidden spectator mode</strong>. Users cannot see or hear you, and there is no UI indication of admin monitoring on their end.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-dark-700 border-t border-dark-600 px-6 py-3 flex justify-end">
          <button onClick={onClose}
            className="px-4 py-2 bg-dark-600 hover:bg-dark-500 text-dark-100 rounded-lg transition-colors text-sm">
            Stop Monitoring
          </button>
        </div>
      </div>
    </div>
  )
}
