const asyncHandler = require('express-async-handler')
const jwt = require("jsonwebtoken")

const VerifyJwt = asyncHandler(async (req, res, next) => {
    const authHeader = req?.headers?.authorization || req?.headers?.Authorization;

    if (!authHeader?.startsWith("Bearer")) {
        return res.status(401).json({ message: `Unauthorized` })
    }
    const token = authHeader?.split(' ')[1];
    
    jwt.verify(token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if (err) return res.status(403).json({ message: "Forbidden" })
            req.role = decoded.AuthData.role;
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