# Admin Spectator Mode Implementation

## 🎬 Overview

Admin Spectator Mode allows administrators to join live video sessions as **invisible observers**. Admins can:
- View both participants' video streams in real-time
- Hear audio from both participants
- Remain completely invisible to the participants (no camera, no mic, no data transmission)
- Ban users directly from the session monitoring interface

## 🔐 Security Features

✅ **Admin is invisible**: Participants never see or hear the admin
✅ **No broadcast**: Admin socket events are NOT broadcast to other users
✅ **Receive-only**: Admin WebRTC connection is receive-only (no local stream sent)
✅ **No peer list pollution**: Admin doesn't appear in participant peer lists
✅ **One-way monitoring**: Admin monitors, participants don't know they're being watched

## 📋 Requirements

Before implementing spectator mode, ensure:

1. **Backend**: Admin Panel Backend with Socket.io support
2. **Flinxx Integration**: Flinxx backend must be updated to support spectator mode (see "Flinxx Modifications" section)
3. **WebRTC Configuration**: STUN/TURN servers configured for NAT traversal

## 🔌 Socket Events

### Admin → Server

```javascript
// Admin joins session as spectator
socket.emit("adminJoinSession", {
  sessionId: "session-id-123"
})

// Admin sends WebRTC answer to participant
socket.emit("spectator:answer", {
  sessionId: "session-id-123",
  answer: RTCSessionDescription,
  to: "participantSocketId"
})

// Admin sends ICE candidate
socket.emit("spectator:ice_candidate", {
  sessionId: "session-id-123",
  candidate: RTCIceCandidate,
  to: "participantSocketId"
})
```

### Server → Admin

```javascript
// Admin spectator mode activated
socket.on("adminSpectatorMode", (data) => {
  // {
  //   message: "Admin joined as spectator",
  //   sessionId: "session-id-123",
  //   timestamp: "2026-03-13T10:30:00Z"
  // }
})

// WebRTC offer from participant
socket.on("spectator:offer", (data) => {
  // {
  //   offer: RTCSessionDescription,
  //   from: "participantSocketId",
  //   sessionId: "session-id-123"
  // }
})

// ICE candidate from participant
socket.on("spectator:ice_candidate", (data) => {
  // {
  //   candidate: RTCIceCandidate,
  //   from: "participantSocketId",
  //   sessionId: "session-id-123"
  // }
})

// Request for participant to send offer
socket.on("spectator:request_offer", (data) => {
  // {
  //   spectatorId: "adminSocketId",
  //   sessionId: "session-id-123",
  //   message: "A spectator has joined - please send your WebRTC offer"
  // }
})
```

### Server → Participants

```javascript
// Notification that spectator has joined (optional)
socket.on("spectator:request_offer", (data) => {
  // Participants should respond by creating and sending WebRTC offers
})
```

## 🔄 WebRTC Flow

### 1. Admin Joins Session
```
Admin sends: adminJoinSession event
↓
Backend: Joins admin to session room
Backend: Emits adminSpectatorMode to admin
Backend: Sends spectator:request_offer to participants
↓
Admin receives: adminSpectatorMode confirmation
```

### 2. Participants Send Offers
```
Participant receives: spectator:request_offer event
↓
Participant: Creates WebRTC offer (offerToReceiveVideo: false)
Participant: Sends offer via spectator:offer event
↓
Backend: Relays offer to admin
Admin: Receives spectator:offer in modal
```

### 3. Admin Sends Answer
```
Admin receives: spectator:offer event
↓
Admin: Creates RTCPeerConnection with receive-only configuration
Admin: Receives the offer
Admin: Creates answer with (offerToReceiveVideo: true, offerToReceiveAudio: true)
Admin: Sends answer via spectator:answer event
↓
Backend: Relays answer to participant
Participant: Receives answer
Participant: Streams flow to admin
```

### 4. ICE Candidate Exchange
```
Admin ↔ Backend ↔ Participant exchange ICE candidates
All events go through backend via spectator:ice_candidate
```

### 5. Streams Received
```
Admin videoElement1.srcObject = userStream1
Admin videoElement2.srcObject = userStream2
Admin can now see both participants
```

## 🛠️ Frontend Implementation

### SessionMonitoring Component Changes

1. **New State Variables**:
```javascript
const [isSpectating, setIsSpectating] = useState(false)
const [error, setError] = useState(null)
const user1VideoRef = useRef(null)
const user2VideoRef = useRef(null)
const peerConnectionRef = useRef(null)
const [bannedUsers, setBannedUsers] = useState(new Set())
```

2. **Join as Spectator**:
```javascript
socket.emit("adminJoinSession", {
  sessionId: session.id
})
```

3. **Listen for Events**:
```javascript
socket.on("adminSpectatorMode", (data) => {
  setIsSpectating(true)
})

socket.on("spectator:offer", async (data) => {
  // Create peer connection
  // Set remote description from offer
  // Create answer and send back
})

socket.on("spectator:ice_candidate", async (data) => {
  // Add ICE candidate to peer connection
})
```

4. **Video Grid**:
```html
<div class="admin-video-grid">
  <video ref={user1VideoRef} autoPlay playsinline></video>
  <video ref={user2VideoRef} autoPlay playsinline></video>
</div>
```

5. **Ban Buttons**:
```html
<button onClick={() => banUser(session.user1.id, session.user1.username)}>
  Ban {session.user1.username}
</button>
```

### CSS Styling

```css
.admin-video-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 20px;
}

.admin-video-grid video {
  width: 100%;
  border-radius: 12px;
  background: black;
  max-height: 400px;
  object-fit: cover;
}
```

## 🖥️ Backend Implementation

### Socket Handlers

1. **adminJoinSession Handler**:
   - Validates admin authentication
   - Joins admin to session room: `session-${sessionId}`
   - Emits `adminSpectatorMode` to admin ONLY
   - Broadcasts `spectator:request_offer` to participants

2. **spectator:offer Relay**:
   - Receives offer from participant
   - Sends to admin via `spectator:offer` event

3. **spectator:answer Relay**:
   - Receives answer from admin
   - Sends to participant via `spectator:answer` event

4. **spectator:ice_candidate Relay**:
   - Exchanges ICE candidates between admin and participants
   - Relays in both directions

### API Endpoints

**Ban User**:
```
POST /api/admin/users/{userId}/ban
Authorization: Bearer <admin-token>
Body: { reason: "Banned by admin" }

Response: {
  success: true,
  message: "User has been banned successfully",
  userId: "...",
  user: { ... }
}
```

## 📝 Flinxx Modifications Required

For spectator mode to work, Flinxx backend needs to:

1. **Listen to spectator:request_offer Event**:
```javascript
socket.on("spectator:request_offer", (data) => {
  const { spectatorId, sessionId } = data
  
  // Create WebRTC offer for spectator
  const offer = await peerConnection.createOffer({
    offerToReceiveVideo: false,
    offerToReceiveAudio: false
  })
  
  // Send offer to backend
  socket.emit("spectator:offer", {
    sessionId: sessionId,
    offer: offer,
    to: spectatorId
  })
})
```

2. **Listen to spectator:answer Event**:
```javascript
socket.on("spectator:answer", async (data) => {
  const { answer, sessionId } = data
  
  // Add answer to peer connection
  await peerConnection.addRemoteDescription(answer)
})
```

3. **Listen to spectator:ice_candidate Event**:
```javascript
socket.on("spectator:ice_candidate", async (data) => {
  const { candidate } = data
  
  // Add ICE candidate
  await peerConnection.addIceCandidate(candidate)
})
```

4. **Send ICE Candidates to Spectator**:
```javascript
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit("spectator:ice_candidate", {
      sessionId: sessionId,
      candidate: event.candidate
    })
  }
}
```

## 🔄 Socket Room Structure

```
Admin Panel Backend
├── session:room_name          (Existing monitoring room)
└── session-{sessionId}         (NEW: Spectator mode room)
    ├── Participant 1
    ├── Participant 2
    └── Admin (spectator)

Flinxx Backend
├── session:{sessionId}per-user
    ├── User 1
    └── User 2
```

## ✅ Testing Checklist

- [ ] Admin joins session → receives `adminSpectatorMode` event
- [ ] Participants receive `spectator:request_offer` event
- [ ] WebRTC offers are relayed correctly from participants
- [ ] Admin receives WebRTC offers
- [ ] Admin answers are relayed back to participants
- [ ] ICE candidates are exchanged properly
- [ ] Admin video grid displays both participant streams
- [ ] Admin cannot be seen/heard by participants
- [ ] Ban button works correctly
- [ ] Banned user is immediately disconnected
- [ ] No errors in browser console
- [ ] Works over TURN (restrictive networks)

## 🚨 Troubleshooting

### WebRTC Connection Failed
- Check STUN/TURN server configuration
- Verify ICE candidates are being exchanged
- Check browser console for detailed error messages
- Ensure Flinxx is modified to handle spectator events

### No Video from Participants
- Verify `peerConnection.ontrack` handler is implemented
- Check that streams are being added correctly
- Ensure receive-only SDP configuration

### Admin Visible to Participants
- Verify admin connection is receive-only
- Check that no local stream is added to admin peer connection
- Verify socket events are NOT broadcast to participants

### Ban Button Not Working
- Verify admin is authenticated
- Check admin token is valid
- Ensure `/api/admin/users/{userId}/ban` endpoint is accessible
- Review admin panel backend logs

## 📚 Related Documentation

- [Live Sessions Admin Panel](./LIVE_SESSIONS_DOCUMENTATION.md)
- [WebRTC Configuration](https://webrtc.org/)
- [Socket.io Documentation](https://socket.io/docs/)

## 🎯 Future Enhancements

1. **Recording**: Record spectator streams for review
2. **Transcription**: AI-powered chat transcription during spectator mode
3. **Multi-Admin Spectating**: Multiple admins can join same session
4. **Stream Quality Control**: Admin can adjust video quality
5. **Screen Sharing Access**: Admin can request screen shares from participants
6. **Session Bookmarks**: Mark important moments in spectator view
7. **Analytics Integration**: Track spectator engagement metrics

---

**Implementation Date**: March 13, 2026
**Status**: ✅ Complete and Ready for Integration
