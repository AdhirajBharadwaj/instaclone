import express from "express";
import { addNewPost, deletePost, getAllPosts,getUserPosts, likePost, updatePost, bookmarkPost, addComment, getAllComments, dislikePost } from "../controllers/post.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { upload } from "../utils/multer";
const router = express.Router();

router.post("/addpost", isAuthenticated, upload.single("image"), addNewPost);
router.get("/all", isAuthenticated, getAllPosts);
router.get("/userposts/all", isAuthenticated, getUserPosts);
router.put("/:id/like", isAuthenticated, likePost);
router.put("/:id/dislike", isAuthenticated, dislikePost);
router.put("/:id/bookmark", isAuthenticated, bookmarkPost);
router.post("/:id/comment", isAuthenticated, addComment);
router.get("/:id/comment/all", isAuthenticated, getAllComments);
router.delete("/delete/:id", isAuthenticated, deletePost);

export default router;
