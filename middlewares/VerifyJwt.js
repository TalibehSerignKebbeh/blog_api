const asyncHandler = require('express-async-handler')
const jwt = require("jsonwebtoken");
const { BlockedStatus } = require('../config/configValues');

const VerifyJwt = asyncHandler(async (req, res, next) => {
    const authHeader = req?.headers?.authorization || req?.headers?.Authorization;

    if (!authHeader?.startsWith("Bearer")) {
        return res.status(401).json({ message: `You are not authorized` })
    }
    const token = authHeader?.split(' ')[1];
    // jwt.TokenExpiredError()
    if (!token) {
        return res.status(401).json({ message: `Unauthorized no auth payload` })
        
    }

    jwt.verify(token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if (err) return res.status(403).json({ message: "Forbidden" })
            if (Object.values(BlockedStatus)?.includes(decoded?.AuthData?.status)) {
                return res.status(403).json({ message: "Forbidden user" })
            }
            req.role = decoded?.AuthData?.role;
            req.user = decoded.AuthData.user;
            next()
            
    })

    
})
const VerifySocketJwt =  (token) => {
   
    if (!token) return false;
    
    jwt.verify(token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if (err) return false
            return true
    })
}


module.exports = {VerifyJwt,VerifySocketJwt}