require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://jeevanrakshakai.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => {
  res.json({
    name: "Jeevan Rakshak AI API",
    status: "running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const patientHealthRoutes = require("./routes/patientHealth");

app.use("/api/auth", require("./routes/auth"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/medical-reports", require("./routes/medicalReports"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/health", patientHealthRoutes);
app.use("/api/doctor/health", require("./routes/doctorHealth"));
app.use("/api/appointments", require("./routes/appointments"));





app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

async function startServer() {
  if (!process.env.JWT_SECRET ||
      process.env.JWT_SECRET === "replace_with_a_long_random_secret") {
    throw new Error("Set a unique JWT_SECRET in server/.env");
  }

  await connectDB();

  const port = process.env.PORT || 5000;

  app.listen(port, () => {
    console.log(`Jeevan Rakshak API running at http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exit(1);
});