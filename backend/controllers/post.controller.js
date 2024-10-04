import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";

export const addNewPost= async(req,res)=>
{
    try{
        const {caption}= req.body;
        const image= req.file;
        const authorId= req.id;
        if(!image)
        {
            return res.status(400).json({
                message: "Image is required",
                success: false,
            });
        }
        const optimizedImage= await sharp(image.buffer)
        .resize({width:800,height:800,fit:"inside"}).toFormat("jpeg",{quality:80}).toBuffer();

        const fileUri= `data:image/jpeg;base64,${optimizedImage.toString("base64")}`;
        const cloudResponse= await cloudinary.uploader.upload(fileUri);
        const post= await Post.create({
            caption,
            image: cloudResponse.secure_url,
            author: authorId,
        });
        const user= await User.findById(authorId);
        user.posts.push(post._id);
        await user.save();

        await post.populate({path:"author",select:"-password"});

        res.status(201).json({
            message: "Post created successfully",
            post,
        });


    }
    catch(error)
    {
        res.status(500).json({
            message: error.message,
            success: false,
        });
    }
}


export const getAllPosts= async(req,res)=>
{
    try{
        const posts= await Post.find().sort({createdAt:-1}).populate({path:"author",select:"username profilePicture"}).populate({
            path:"comments",
            sort:{createdAt:-1},
            populate:{
                path:"author",
                select:"username profilePicture",
            },
        });
        res.status(200).json({
            posts,
            success: true,
        });
    }
    catch(error)
    {
        res.status(500).json({
            message: error.message,
            success: false,
        });
    }
}

export const getUserPosts= async(req,res)=>
{
    try{
        const userId= req.id;
        const posts= await Post.find({author:userId}).sort({createdAt:-1}).populate({path:"author",select:"username profilePicture"}).populate({path:"comments",sort:{createdAt:-1},populate:{path:"author",select:"username profilePicture"}});
        res.status(200).json({
            posts,
            success: true,
        });
    }
    catch(error)
    {
        res.status(500).json({
            message: error.message,
            success: false,
        });
    }
}

export const likePost= async(req,res)=>
{
    try{
        const userId= req.id;
        const postId= req.params.id;
        const post= await Post.findById(postId);
        if(!post)
        {
            return res.status(404).json({
                message: "Post not found",
                success: false,
            });
        }
        // if(post.likes.includes(userId))
        // {
        //     return res.status(400).json({
        //         message: "Post already liked",
        //         success: false,
        //     });
        // }
        // post.likes.push(userId);
        // await post.save();
        
        await post.updateOne({$addToSet:{likes:userId}});
        await post.save();


        return res.status(200).json({
            message: "Post liked successfully",
            success: true,
        });
    }
    catch(error)
    {
        return res.status(500).json({
            message: error.message,
            success: false,
        });
    }

}

export const dislikePost= async(req,res)=>
{
    try{
        const userId= req.id;
        const postId= req.params.id;
        const post= await Post.findById(postId);
        if(!post)
        {
            return res.status(404).json({
                message: "Post not found",
                success: false,
            });
        }
        await post.updateOne({$pull:{likes:userId}});
        await post.save();
        return res.status(200).json({
            message: "Post disliked successfully",
            success: true,
        });
        
    }
    catch(error)
    {
        return res.status(500).json({
            message: error.message,
            success: false,
        });
    }
}
export const addComment= async(req,res)=>
{
    try{
        const userId= req.id;
        const postId= req.params.id;
        const {text}= req.body;
        if(!text)
        {
            return res.status(400).json({
                message: "Comment is required",
                success: false,
            });
        }
        const post= await Post.findById(postId);
        if(!post)
        {
            return res.status(404).json({
                message: "Post not found",
                success: false,
            });
        }
        const comment= await Comment.create({
            text,
            author: userId,
            post: postId,
        }).populate({path:"author",select:"username profilePicture"});

        await post.updateOne({$push:{comments:comment._id}});
        await post.save();
        
        return res.status(201).json({
            message: "Comment added successfully",
            success: true,
            comment,
        });
        

    }
    catch(error)
    {
        return res.status(500).json({
            message: error.message,
            success: false,
        });
    }
}

export const getAllComments= async(req,res)=>
{
    try{
        const postId= req.params.id;
        const post= await Post.findById(postId);
        if(!post)
        {
            return res.status(404).json({
                message: "Post not found",
                success: false,
            });
        }
        const comments= await Comment.find({post:postId}).populate({path:"author",select:"username profilePicture"});
        if(!comments)
        {
            return res.status(404).json({
                message: "No comments found",
                success: false,
            });
        }
        return res.status(200).json({
            comments,
            success: true,  
        });
    }
    catch(error)
    {
        return res.status(500).json({
            message: error.message,
            success: false,
        });
    }
}
export const deletePost= async(req,res)=>
{
    try{
        const postId= req.params.id;
        const userId= req.id;
        const post= await Post.findById(postId);
        if(!post)
        {
            return res.status(404).json({
                message: "Post not found",
                success: false,
            });
        }
        if(post.author.toString() !== userId)
        {
            return res.status(403).json({
                message: "You are not authorized to delete this post",
                success: false,
            });
        }
        await Post.findByIdAndDelete(postId);
        await Comment.deleteMany({post:postId});
        await User.updateMany({posts:postId},{$pull:{posts:postId}});

        return res.status(200).json({
            message: "Post deleted successfully",
            success: true,
        });
    }
    catch(error)
    {
        return res.status(500).json({
            message: error.message,
            success: false,
        });
    }
}   
export const bookmarkPost= async(req,res)=>
{
    try{
        const userId= req.id;
        const postId= req.params.id;
        const post= await Post.findById(postId);
        if(!post)
        {
            return res.status(404).json({
                message: "Post not found",
                success: false,
            });
        }

        const user= await User.findById(userId);

        if(user.bookmarks.includes(postId)) 
        {
            await user.updateOne({$pull:{bookmarks:postId}});
            await user.save();
            return res.status(200).json({
                type:"unsaved",
                message: "Post unbookmarked successfully",
                success: true,
            });
        }
        else
        {
            await user.updateOne({$addToSet:{bookmarks:postId}});
            await user.save();
            return res.status(200).json({
                type:"saved",
                message: "Post bookmarked successfully",
                success: true,
            });
        }
    }
    catch(error)
    {
        return res.status(500).json({
            message: error.message,
            success: false,
        });
    }
}
