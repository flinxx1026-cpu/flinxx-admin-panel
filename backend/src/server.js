import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './config/database.js'
import adminRoutes from './routes/admin.js'
import dashboardRoutes from './routes/dashboard.js'
import usersRoutes from './routes/users.js'
import reportsRoutes from './routes/reports.js'
import settingsRoutes from './routes/settings.js'
import { errorHandler } from './middleware/errorHandler.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: [
    "https://flinxx-admin-panel.vercel.app",
    "http://localhost:5173",
    process.env.FRONTEND_URL
  ],
  credentials: true
}))
app.use(express.json())

// Connect Database
connectDB()

// Routes
app.use('/api/admin', adminRoutes)
app.use('/api/admin/dashboard', dashboardRoutes)
app.use('/api/admin/users', usersRoutes)
app.use('/api/admin/reports', reportsRoutes)
app.use('/api/admin/settings', settingsRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Admin Panel API is running' })
})

// Error handling
app.use(errorHandler)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`Admin Panel API running on port ${PORT}`)
})

export default app
