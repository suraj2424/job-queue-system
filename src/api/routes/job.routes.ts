import { Router } from "express";
import jobController from "../../controllers/job.controller";

const router = Router();

router.post("/", jobController.createJob);

export default router;