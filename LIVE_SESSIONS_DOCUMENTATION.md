# Live Sessions Admin Panel Implementation

## 🎯 Overview
Complete implementation of a **Live Video Chat Monitoring System** for the admin panel. Admins can view active video sessions in real-time, monitor both users' video/audio streams, and end sessions remotely.

## 📋 Features Implemented

### 1. **Active Video Sessions Table** ✅
- **Session ID**: Unique identifier for each video chat
- **User 1 & User 2**: Usernames of both participants
- **Duration**: Live timer showing how long the session has been active (MM:SS format)
- **Started**: Date and time when the session began
- **Actions**: View and End buttons

### 2. **View Button (Admin Monitoring)** ✅
- Opens a modal/popup with live video feeds from both users
- Admin joins session as **spectator** (receive-only)
- Admin can see/hear both users but **cannot be seen or heard**
- Session information displayed (ID, usernames, duration, start time)
- Fullscreen toggle for better viewing
- Real-time duration timer

### 3. **End Button** ✅
- Admin can force-disconnect both users
- Session immediately removed from list
- Both users notified of admin disconnection
- WebRTC connections closed gracefully

### 4. **Real-Time Updates** ✅
- New sessions automatically appear in the table
- Sessions disappear when ended
- Live duration timer updates every second
- Socket.io events for session lifecycle

### 5. **WebRTC Spectator Implementation** ✅
- Admin joins as **third peer (spectator)**
- Receive-only SDP direction
- No local stream transmission from admin
- Dual stream handling (User1 + User2 videos)
- ICE candidate exchange for connectivity

## 🏗️ Architecture

### Backend Files
- **`sessions.js`** - Main API routes and handlers
  - `GET /sessions` - Get all active sessions
  - `GET /sessions/:sessionId` - Get specific session details
  - `POST /sessions/:sessionId/join` - Admin joins as spectator
  - `POST /sessions/:sessionId/end` - End session (admin action)

- **`server.js`** - Socket.io handlers for:
  - `session:admin_join` - Admin joins monitoring
  - `session:admin_leave` - Admin stops monitoring
  - `spectator:offer` - WebRTC offer for spectator
  - `spectator:answer` - WebRTC answer from spectator
  - `spectator:ice_candidate` - ICE candidate relay
  - `session:started` - New session notification
  - `session:completed` - Session end notification
  - `session:admin_ended` - Admin end broadcast

### Frontend Files
- **`LiveSessions.jsx`** - Main admin panel page
  - Fetches active sessions via API
  - Real-time Socket.io connection
  - Auto-refresh on new/ended sessions
  - Manual refresh button
  - View and End action buttons

- **`SessionMonitoring.jsx`** - Modal component for viewing
  - Dual video display (User1 + User2)
  - Real-time duration timer
  - Fullscreen toggle
  - Connection status indicator
  - Graceful error handling

## 🔌 Socket.io Events

### Admin → Server
```javascript
// Admin joins session as spectator
socket.emit('session:admin_join', { sessionId: 'session-123' })

// Admin leaves session
socket.emit('session:admin_leave', { sessionId: 'session-123' })

// Admin sends WebRTC answer
socket.emit('spectator:answer', {
  sessionId: 'session-123',
  answer: RTCSessionDescription,
  from: 'admin_spectator'
})

// Admin sends ICE candidate
socket.emit('spectator:ice_candidate', {
  sessionId: 'session-123',
  candidate: RTCIceCandidate,
  from: 'admin_spectator'
})
```

### Server → Admin
```javascript
// Join successful
socket.emit('session:join_success', { 
  sessionId: 'session-123',
  message: 'Successfully joined session for monitoring'
})

// WebRTC offer from participant
socket.emit('spectator:offer', {
  offer: RTCSessionDescription,
  from: userId
})

// WebRTC answer from participant
socket.emit('spectator:answer', {
  answer: RTCSessionDescription,
  from: userId
})

// ICE candidate from participant
socket.emit('spectator:ice_candidate', {
  candidate: RTCIceCandidate,
  from: userId
})

// Session ended
socket.emit('session:ended', {
  sessionId: 'session-123',
  endedBy: 'admin',
  endedAt: '2026-03-11T10:30:00Z'
})

// Session ended by admin
socket.emit('session:admin_ended', {
  reason: 'Session ended by administrator',
  sessionId: 'session-123'
})
```

## 📊 Database Integration

### Sessions Table
```sql
sessions {
  id: UUID (primary key)
  user1_id: UUID (foreign key → users)
  user2_id: UUID (foreign key → users)
  started_at: TIMESTAMP
  ended_at: TIMESTAMP (nullable)
  duration_seconds: INT
  quality: VARCHAR(50)
}
```

### API Response Format
```json
{
  "success": true,
  "sessions": [{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "sessionId": "SESSION550e8400",
    "user1": {
      "id": "user1-uuid",
      "username": "alice",
      "email": "alice@example.com",
      "picture": "url-to-picture"
    },
    "user2": {
      "id": "user2-uuid",
      "username": "bob",
      "email": "bob@example.com",
      "picture": "url-to-picture"
    },
    "duration": 245,
    "durationFormatted": "04:05",
    "startedAt": "11 Mar 2026, 02:18 PM",
    "startedAtISO": "2026-03-11T14:18:00.000Z"
  }],
  "count": 1
}
```

## 🎬 WebRTC Spectator Flow

### Step 1: Admin Clicks "View"
```
Frontend: API call to /admin/sessions/:sessionId/join
Backend: Verifies session exists and is active
Response: Returns session details + token for WebRTC
```

### Step 2: Admin Joins as Spectator
```
Frontend: Socket.emit('session:admin_join', { sessionId })
Backend: Broadcasts to participants
Response: socket.emit('session:join_success')
```

### Step 3: WebRTC Offer from Participant
```
Participant (User1) sends WebRTC offer
Backend: Relays offer via socket
Admin receives: spectator:offer event
Admin: Creates peer connection + sends answer
Backend: Relays answer back to participant
```

### Step 4: ICE Candidate Exchange
```
Both participant ↔ admin exchange ICE candidates
Backend: Relays candidates in both directions
Result: P2P connection established (receive-only for admin)
```

### Step 5: Close Connection
```
Admin closes modal
Backend: Removes admin from session listeners
Admin: Closes peer connections
Cleanup: All resources released
```

## 🔐 Security Features

### Receive-Only for Admin
```javascript
// SDP constraints for admin peer connection
const offer = await pc.createOffer({
  offerToReceiveVideo: true,
  offerToReceiveAudio: true,
  offerToReceiveAudio: true  // Explicitly receive only
});

// No local stream added to admin PC
// Admin can only RECEIVE, not SEND
```

### Session Verification
- Admin must be authenticated
- Session must be active (no ended sessions)
- Admin token validation on every request

### User Notification
- Users are notified when admin joins
- Users are notified when admin ends session
- No hidden monitoring

## 🚀 Performance Optimizations

### Real-Time Updates
- WebSocket connection for instant updates
- No polling/repeated API calls
- Efficient event broadcasting

### Duration Timer
- Client-side JavaScript interval
- No server calculation needed
- Accurate MM:SS format display

### Dual Stream Handling
- Separate RTCPeerConnection for admin
- Each stream handled independently
- No interference with user connection

## 🧪 Testing

### Test Scenarios

#### 1. View Active Session
```bash
1. Start video call between 2 users
2. Click "View" button on session
3. Verify modal opens with both video feeds
4. Verify duration timer updates
5. Verify fullscreen toggle works
```

#### 2. End Session
```bash
1. Start video call between 2 users
2. Click "End" button on session
3. Confirm dialog appears
4. Click confirm
5. Verify both users are disconnected
6. Verify session removed from table
```

#### 3. Real-Time Updates
```bash
1. Open Live Sessions page
2. Start new video call in another window
3. Verify new session appears automatically
4. End the call
5. Verify session disappears automatically
```

## 🔧 Configuration

### Environment Variables
No additional environment variables needed. Uses existing:
- `VITE_API_URL` - Admin API endpoint
- `VITE_SOCKET_URL` - Socket.io server URL

### WebRTC Configuration
```javascript
const iceServers = [
  {
    urls: [
      "stun:global.xirsys.net",
      "turn:global.xirsys.net:3478?transport=udp",
      "turn:global.xirsys.net:3478?transport=tcp"
    ],
    username: "nkhlydv",
    credential: "a8e244b8-cf5b-11f0-8771-0242ac140002"
  }
]
```

## 📝 API Documentation

### Get All Active Sessions
```
GET /api/admin/sessions
Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "sessions": [...],
  "count": 5
}
```

### Get Specific Session
```
GET /api/admin/sessions/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "session": {...}
}
```

### Join Session as Spectator
```
POST /api/admin/sessions/550e8400-e29b-41d4-a716-446655440000/join
Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "message": "Admin can join session",
  "session": {...}
}
```

### End Session
```
POST /api/admin/sessions/550e8400-e29b-41d4-a716-446655440000/end
Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "message": "Session ended successfully",
  "session": {
    "id": "...",
    "duration": 245,
    "endedAt": "2026-03-11T14:22:45.000Z"
  }
}
```

## 🎨 UI/UX Details

### Duration Format
- Display: `HH:MM:SS` (if hours > 0) or `MM:SS`
- Updates every 1 second
- Real-time calculation from started_at

### Session ID Format
- Display: `SESSION` + first 8 chars of UUID
- Example: `SESSION550e8400`
- Clickable for copying

### Connection Status
- Green dot: Connected
- Gray dot: Connecting
- Red dot: Connection failed

### Modal Features
- Dark theme matching admin panel
- Responsive grid (1 col mobile, 2 col desktop)
- Auto-aspect-ratio video containers
- User info below each video
- Header with session details
- Fullscreen button (top right)
- Close button (top right)
- Status bar at bottom

## 🐛 Error Handling

### Network Failures
- Automatic reconnection attempts
- User-friendly error messages
- Fallback UI for connection failures

### Disconnection Handling
- Graceful cleanup of resources
- Automatic modal close if session ends
- Clear messaging to admin

### WebRTC Errors
- Connection timeout (30 seconds)
- ICE failure detection
- Detailed console logging for debugging

## 📚 Related Files
- Backend: `/admin-panel/admin-panel/backend/src/routes/sessions.js`
- Backend Server: `/admin-panel/admin-panel/backend/src/server.js`
- Frontend Page: `/admin-panel/admin-panel/frontend/src/pages/LiveSessions.jsx`
- Frontend Component: `/admin-panel/admin-panel/frontend/src/components/SessionMonitoring.jsx`

## ✅ Checklist for Deployment

- [ ] Test with 2 simultaneous video calls
- [ ] Verify admin can view both sessions
- [ ] Verify admin can view each session individually
- [ ] Test ending session from admin side
- [ ] Verify users receive disconnect notification
- [ ] Test WebRTC over TURN (restrictive network)
- [ ] Test real-time updates with multiple admins
- [ ] Verify mobile responsiveness
- [ ] Test error scenarios (network failure, user disconnect)
- [ ] Security audit (token validation, session verification)

## 🚀 Future Enhancements

1. **Recording**: Record sessions for moderation review
2. **Analytics**: Track session duration, quality metrics
3. **Filtering**: Filter by duration, user, date range
4. **Export**: Export session logs/reports
5. **Call History**: Access ended sessions data
6. **Transcription**: AI-powered chat transcription
7. **Flagging**: Mark problematic sessions for review
