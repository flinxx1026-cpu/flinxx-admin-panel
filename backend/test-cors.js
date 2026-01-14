import express from "express";
import cors from "cors";

const app = express();

// 🔥 CORS FIRST - BEFORE EVERYTHING
app.use(cors({
  origin: "https://flinxx-admin-panel.vercel.app",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", cors());

app.use(express.json());

// Test endpoint
app.post("/api/admin/login", (req, res) => {
  res.json({ message: "CORS working! Login would happen here" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ TEST CORS SERVER running on port ${PORT}`);
  console.log(`🔧 CORS enabled for: https://flinxx-admin-panel.vercel.app`);
});
