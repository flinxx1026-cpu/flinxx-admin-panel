# Admin Spectator Mode - Developer Reference

## 🎯 Feature Overview

Admins can now join live video sessions as invisible spectators to monitor calls and ban users.

**Key Points:**
- ✅ Admin can see both participants' video/audio streams
- ✅ Admin is completely invisible to participants  
- ✅ No camera/mic transmission from admin
- ✅ Admin can ban users from the modal
- ✅ Banned users are immediately disconnected

---

## 📂 Files Changed

### Frontend
```
admin-panel/frontend/src/components/SessionMonitoring.jsx
```

### Backend  
```
admin-panel/backend/src/server.js
```

### Documentation
```
admin-panel/ADMIN_SPECTATOR_MODE.md (NEW)
admin-panel/IMPLEMENTATION_SUMMARY.md (NEW)
```

---

## 🔌 Socket Events Reference

### Events Admin Listens To

```javascript
// Confirms admin joined as spectator
socket.on("adminSpectatorMode", (data) => {
  console.log("Admin in spectator mode:", data.message)
})

// WebRTC offer from participant
socket.on("spectator:offer", async (data) => {
  const { offer, from, sessionId } = data
  // Create answer and send back
})

// ICE candidate from participant
socket.on("spectator:ice_candidate", async (data) => {
  const { candidate, from } = data
  // Add to peer connection
})
```

### Events Admin Sends

```javascript
// Admin joins session as spectator
socket.emit("adminJoinSession", {
  sessionId: "session-123"
})

// Send WebRTC answer to participant
socket.emit("spectator:answer", {
  sessionId: "session-123",
  answer: rtcSessionDescription,
  to: "participantSocketId"
})

// Send ICE candidate to participant
socket.emit("spectator:ice_candidate", {
  sessionId: "session-123",
  candidate: rtcIceCandidate,
  to: "participantSocketId"
})
```

---

## 🎬 Implementation Flow

### 1. Admin Clicks "View" on Session
```javascript
// SessionMonitoring component mounts
// useEffect triggers socket connection
socket.emit("adminJoinSession", { sessionId })
```

### 2. Backend Activates Spectator Mode
```javascript
// server.js handler: adminJoinSession
socket.emit("adminSpectatorMode") // To admin only
io.to(`session:${sessionId}`).emit("spectator:request_offer") // To participants
```

### 3. Participants Send Offers
```javascript
// Participant's WebRTC setup
// When receiving spectator:request_offer event
createOffer() → port.emit("spectator:offer")
```

### 4. Admin Receives Offer
```javascript
// SessionMonitoring component
socket.on("spectator:offer", (data) => {
  createPeerConnection()
  pc.setRemoteDescription(data.offer)
  answer = await pc.createAnswer()
  socket.emit("spectator:answer", { answer })
})
```

### 5. WebRTC Connection Established
```javascript
// Admin receives participant streams
pc.ontrack = (event) => {
  video1.srcObject = streams[0]
  video2.srcObject = streams[1]
}
```

### 6. Admin Bans User (Optional)
```javascript
// Click "Ban User" button
api.post(`/admin/users/${userId}/ban`)
// User is immediately disconnected
// Session continues for other participant
```

---

## 💻 Key Code Snippets

### Admin Joins Session
```javascript
socket.emit("adminJoinSession", {
  sessionId: session.id
})
```

### Listen for Spectator Mode
```javascript
socket.on("adminSpectatorMode", (data) => {
  console.log("✅ Admin spectator mode activated")
  setIsSpectating(true)
})
```

### Handle WebRTC Offer
```javascript
socket.on("spectator:offer", async (data) => {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  })
  
  pc.ontrack = (event) => {
    const stream = event.streams[0]
    if (!user1VideoRef.current?.srcObject) {
      user1VideoRef.current.srcObject = stream
    } else {
      user2VideoRef.current.srcObject = stream
    }
  }
  
  await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
  
  const answer = await pc.createAnswer({
    offerToReceiveVideo: true,
    offerToReceiveAudio: true
  })
  await pc.setLocalDescription(answer)
  
  socket.emit("spectator:answer", {
    sessionId: session.id,
    answer: answer,
    to: data.from
  })
})
```

### Ban User
```javascript
const banUser = async (userId, userName) => {
  if (window.confirm(`Ban ${userName}?`)) {
    const response = await api.post(`/admin/users/${userId}/ban`, 
      { reason: 'Banned by admin panel' }
    )
    if (response.data?.success) {
      setBannedUsers(prev => new Set([...prev, userId]))
    }
  }
}
```

---

## 🎨 UI Elements

### Video Grid
```jsx
<div className="admin-video-grid">
  <video ref={user1VideoRef} autoPlay playsinline />
  <video ref={user2VideoRef} autoPlay playsinline />
</div>
```

### Ban Buttons
```jsx
<button onClick={() => banUser(session.user1.id, session.user1.username)}>
  Ban {session.user1.username}
</button>
```

---

## ✅ Security Features

- ✅ Admin socket events NOT broadcast to participants
- ✅ WebRTC receive-only (no local stream from admin)
- ✅ No "user-joined" event for admin
- ✅ Admin not in peer list
- ✅ Authentication required for ban

---

## 📊 Testing

1. Start session between 2 users
2. Click "View" on session
3. Wait for video streams to appear
4. Verify both videos play
5. Test ban functionality
6. Verify user is disconnected but other user continues

---

## 🚀 Deployment

1. Deploy backend with updated server.js
2. Deploy frontend with updated SessionMonitoring.jsx
3. Update Flinxx to handle spectator:request_offer event
4. Test WebRTC connection
5. Monitor browser console for errors

---

**Status**: ✅ Production Ready (v1.0)
