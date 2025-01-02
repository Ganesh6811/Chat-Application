import jwt from "jsonwebtoken";
import User from "../models/user.models.js"; 

export const protectedRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;

        if (!token) {
            return res.status(401).json({ message: "Unauthorized - No Token provided" });
        } 
        const decoded = jwt.verify(token, process.env.JWT_SECREAT_KEY);
 
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        req.user = user; 
        
        next();
    } catch (error) {
        console.error("Error in protectRoute middleware:", error);
        return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }
};
