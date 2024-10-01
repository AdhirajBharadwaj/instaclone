import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const register= async (req,res)=>
{
    try{
        const {username, email, password}= req.body;
        if(!username || !email || !password)
        {
            return res.status(400).json({message: "Some fields are missing",
                success: false,
            });
        }
        const user= await User.findOne({email});
        if(user)
        {
            return res.status(400).json({message: "User already exists",
                success: false,
            });
        }
        const hashedPassword= await bcrypt.hash(password, 10);
        const newUser= new User({username, email, password: hashedPassword});
        await newUser.save();
        return res.status(201).json({message: "User created successfully",
            success: true,
        });
    }
    catch(error)
    {
        return res.status(500).json({message: error.message,
            success: false,
        });
    }
}

export const login= async (req,res)=>
{
    try{
        const {email, password}= req.body;
        if(!email || !password)
        {
            return res.status(400).json({message: "Some fields are missing",
                success: false,
            });
        }
        let user= await User.findOne({email});
        if(!user)
        {
            return res.status(400).json({message: "Incorrect email or password",
                success: false,
            });
        }
        const isMatch= await bcrypt.compare(password, user.password);
        if(!isMatch)
        {
            return res.status(400).json({message: "Incorrect email or password",
                success: false,
            });
        }

        user={
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            bio: user.bio,
            followers: user.followers,
            following: user.following,
            posts: user.posts,
        }


        const token=jwt.sign({userId: user._id}, process.env.JWT_SECRET,{expiresIn: "1d"});
        return res.cookie("token", token,{httpOnly: true,sameSite: "strict",maxAge: 1000*60*60*24}).status(200).json({message: "User logged in successfully",
            success: true,
            user,
        });
    }
    catch(error)
    {
        return res.status(500).json({message: error.message,
            success: false,
        });
    }
}

export const logout= async (req,res)=>
{
    try{
        return res.cookie("token", "",{httpOnly: true,sameSite: "strict",maxAge: 0}).status(200).json({message: "User logged out successfully",
            success: true,
        });
    }
    catch(error)
    {
        return res.status(500).json({message: error.message,
            success: false,
        });
    }
}

export const getProfile= async (req,res)=>
{
    try{
        const user= await User.findById(req.params.id);
        return res.status(200).json({message: "User fetched successfully",
            success: true,
            user,
        });
    }
    catch(error)
    {
        return res.status(500).json({message: error.message,
            success: false,
        });
    }
}

export const editProfile= async (req,res)=>
{
    try{
        const userId= req.id;   
        let cloudResponse;
        const {bio,gender}= req.body;
        const profilePicture= req.file;

        if(profilePicture)
        {
            const fileuri= getDataUri(profilePicture);
            cloudResponse= await cloudinary.uploader.upload(fileuri);
        }
        const user= await User.findById(userId);
        if(gender)
        {
            user.gender= gender;
        }
        if(bio)
        {
            user.bio= bio;
        }
        if(profilePicture)
        {
            user.profilePicture= cloudResponse.secure_url;
        }
        await user.save();
            return res.status(200).json({message: "User updated successfully",
            success: true,
            user,
        });
    }
    catch(error)
    {
        return res.status(500).json({message: error.message,
            success: false,
        });
    }
}

export const getSuggestedUsers= async (req,res)=>
{
    try{
        const suggestedUsers= await User.find({_id: {$ne: req.id}}).select("-password").limit(5);
        if(!suggestedUsers)
        {
            return res.status(400).json({message: "No users found",
                success: false,
            });
        }
        return res.status(200).json({message: "Suggested users fetched successfully",
            success: true,
            users: suggestedUsers,
        });
    }
    catch(error)
    {
        return res.status(500).json({message: error.message,
            success: false,
        });
    }
}

export const followOrUnfollow= async (req,res)=>
{
    try{
        const userId= req.id;
        const userToFollowId= req.params.id;
        if(userId===userToFollowId )
        {
            return res.status(400).json({message: "You cant follow or unfollow yourself",
                success: false,
            });
        }
        const user= await User.findById(userId);
        const userToFollow= await User.findById(userToFollowId );
        if(!user || !userToFollow)
        {
            return res.status(400).json({message: "User not found",
                success: false,
            });
        }
        const isFollowing= user.following.includes(userToFollowId);
        if(isFollowing)
        {
            user.following= user.following.filter((id)=>id!==userToFollowId);
            userToFollow.followers= userToFollow.followers.filter((id)=>id!==userId);
            await user.save();
            await userToFollow.save();
            return res.status(200).json({message: "User unfollowed successfully",
                success: true,
            });
        }
        else
        {
            user.following.push(userToFollowId);
            userToFollow.followers.push(userId);
            await user.save();
            await userToFollow.save();
            return res.status(200).json({message: "User followed successfully",
                success: true,
            });
        }
    }
    catch(error)
    {
        return res.status(500).json({message: error.message,
            success: false,
        });
    }
}
