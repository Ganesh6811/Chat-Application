import User from "../models/user.models.js";
import Message from "../models/message.models.js";
import { v2 as cloudinary } from "cloudinary";
import { getReceiverSocketId , io} from "../lib/socket.js";

export const getUserForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

        res.status(200).json(filteredUsers);
    }
    catch (error) {
        console.log("Error in getUsrInSidebar", error.message);
        res.status(500).json({ message: "Internal server Error" });
    }
};


export const getMessage = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId }
            ]
        })


        res.status(200).json(messages);
    }
    catch (error) {
        console.log("Error in getMessages Controller:", error.message);
        res.status(500).json({ message: "Internal server Error" });
    }
}


export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body; 
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });

        await newMessage.save();

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(200).json(newMessage);
    }
    catch (error) {
        console.log("Error in sendMessage Controller:", error.message);
        res.status(500).json({ message: "Internal server Error" });
    }
}