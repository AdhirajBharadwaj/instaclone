import express from "express";
import { sendMessage, getMessages } from "../controllers/message.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated";
const router = express.Router();

router.post("/send/:id", isAuthenticated, sendMessage);
router.get("/all/:id", isAuthenticated, getMessages);
export default router;
