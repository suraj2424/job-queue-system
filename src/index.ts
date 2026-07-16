import express from "express";
import dotenv from "dotenv";

import jobRoutes  from "./api/routes/job.routes"

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Job Route
app.use("/jobs", jobRoutes);

// Health Route
app.get("/", (_req, res) => {
    res.json({
      message: "Job Queue System API is running",
      endpoints: {
        "POST /jobs": "Create a new job",
        "GET /": "Health check",
      }
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📌 POST /jobs - Create a new job`)
});