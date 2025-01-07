const jwt = require("jsonwebtoken");
const User = require("../models/User.js");

const protectRoute = async (req, res, next) => {

    // try{
    //     const token = req.cookies.jwt;
    //     if(!token){
    //         return res.status(401).json({error: "Unauthorized: No token provided"})
    //     }

    //     const decoded = jwt.verify(token, process.env.JWT_SECRET)

    //     if(!decoded){
    //         return res.status(401).json({error: "Unauthorized: Invalid token"})
    //     }

    //     const user = await User.findById(decoded.userId).select("-password");

    //     if(!user){
    //         return res.status(404).json({error: "user not found"});
    //     }

    //     req.user = user;
    //     next();
    //   } catch (error){
    //     console.log("Error in protectRoute middleware", error.message);
    //     return res.status(500).json({error: "Internal server error"})
    // }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication token missing or invalid' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decodedToken.id);

        if (!user) {
        return res.status(401).json({ error: 'User not found' });
        }

        req.user = user; 
        next();
    } catch (error) {
        console.error('Error in authentication middleware:', error);
        res.status(401).json({ error: 'Invalid or expired token' });
    }

};

module.exports = { protectRoute };
