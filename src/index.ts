import express from "express";
import jobRoutes from "./api/routes/job.routes"
import "./workers/worker.manager";
import { config } from "./config/env";

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

app.listen(config.app.port, () => {
  console.log(`✅ Server running on port ${config.app.port}`);
  console.log(`📌 POST /jobs - Create a new job`)
});