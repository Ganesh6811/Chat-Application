import User from "../models/user.models.js"
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";
 
export const signup = async (req, res)=>{
    const {fullName, email, password} = req.body;
    try{
        if(!fullName || !email || !password)
            res.status(400).json({message:"All fields are requred"});

        if(password.length < 6){
            return res.status(400).json({message: "Password must be at least 6 characters"});
        }

        const user = await User.findOne({email});

        if(user)
            return res.status(400).json({message:"Email already exists"});

        //hashing the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName:fullName,
            email:email,
            password:hashedPassword,
        });

        await newUser.save();
        if(newUser){
            
            //Generate jwt Token
            generateToken(newUser._id, res);
            
            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
            });
        }
        else{
            res.statue(400).json({message:"Invalid user data"});
        }

    }
    catch(error){
        console.log("Error in signup controller:", error.message);
        res.status(500).json({message:"Internal server Error"});
    }
}


export const login = async (req, res)=>{
    const {email, password} = req.body;

    if(!email || !password){
        res.status(400).json({message:"All fields are required for login"});
        console.log("All fields must be filled for the login.");
    }

    try{
        const fetchedData = await User.findOne({email});
        if(!fetchedData){
            return res.status(400).json({message:"Invalid Credentials"});
        }

        const isPasswordCorrect = await bcrypt.compare(password, fetchedData.password);

        if(!isPasswordCorrect)
            return res.status(400).json({message:"Invalid Credentials"});

        generateToken(fetchedData._id, res)

        res.status(200).json({
            _id:fetchedData._id,
            fullName: fetchedData.fullName,
            email: fetchedData.email,
            profilePic: fetchedData.profilePic,
        })
    }

    catch(error){
        console.log("Error in login controller:", error.message);
        res.status(500).json({message:"Internal server error..."})
    }
}



export const logout = async (req, res)=>{
    try{
        res.cookie("jwt", "", {maxAge:0});
        res.status(200).json({message:"Logged out successfully"});
    }

    catch(error){
        console.log("Error in logout controller:", error.message);
        res.status(500).json({message:"Internal Server Error"})
    }
}


export const updataProfile = async (req,res) =>{
    try{
        const {profilePic} = req.body;
        const userId = req.user._id;

        if(!profilePic){
            return res.status(400).json({message:"profile pic is required"});
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        const updatedUser = await User.findByIdAndUpdate(userId, {profilePic:uploadResponse.secure_url0}, {new:true});

        res.status(200).json(updatedUser);
    }
    catch(error){
        console.log("Error in update controller:", error);
        res.status(500).json({message:"Internal server error"}); 
    }
};

export const checkAuth = async (req, res) =>{
    try{
        res.status(200).json(req.user);
    }
    catch(error){
        console.log("Error in checkAuth controller", error.message);
        res.status(500).json({message:"Internal server Error"});
    }
}
