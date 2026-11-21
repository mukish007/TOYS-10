require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const frontendPath = path.resolve(__dirname, "..", "frontend");
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/contact", require("./routes/contact"));

app.use(express.static(frontendPath));
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use((error, req, res, next) => {
  if (error.status) return res.status(error.status).json({ error: error.message });
  if (error.code === 11000) return res.status(409).json({ error: "Duplicate value" });
  if (error.name === "ValidationError") return res.status(400).json({ error: error.message });
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT || 3000);
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(port, "0.0.0.0", () => console.log(`TOYS 10 running on port ${port}`));
  })
  .catch(error => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
