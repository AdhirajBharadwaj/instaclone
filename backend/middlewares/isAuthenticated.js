import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const isAuthenticated= async (req,res,next)=>
{
    const {token}= req.cookies;
    if(!token)
    {
        return res.status(401).json({message: "Unauthorized",
            success: false,
        });
    }
    const decoded=await jwt.verify(token,process.env.JWT_SECRET);
    if(!decoded)
    {
        return res.status(401).json({message: "Unauthorized",
            success: false,
        });
    }
    req.id=decoded.userId;
    next();
}