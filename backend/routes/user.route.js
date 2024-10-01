import express from "express";
import { register, login,logout,editProfile, followOrUnfollow, getSuggestedUsers, getProfile } from "../controllers/user.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";


const router= express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/:id/profile", isAuthenticated, getProfile);
router.post("/profile/edit",isAuthenticated, upload.single("file"), editProfile);
router.get("/suggested",isAuthenticated, getSuggestedUsers);
router.get("/followorunfollow/:id",isAuthenticated, followOrUnfollow);

export default router;
