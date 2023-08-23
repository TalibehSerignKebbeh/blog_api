const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const User = require("../models/user")
const asyncHandler = require("express-async-handler")


const Login = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: `all fields are required` })

    const user = await User.findOne({ username: username, }, {}, {collation:{strength:1, locale:'en'}}).exec();

    if (!user) return res.status(400).json({ message: `invalid credentials` })
    const password_match = bcrypt.compareSync(password, user.password)

    if (!password_match) return res.status(400).json({ message: `invalid credentials` })
    const token = jwt.sign(
        
        {
            "AuthData": {
                user: user.username,
                role: user.role,
                name: user.public_name,
                id: user?.id
            }
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: '2h',
        }

    )
    const refreshToken = jwt.sign({
        "username": user.username
    },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '1w', })

    res.cookie("jwt", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000
    })
    delete user.password;

    return res.json({ token })
})

const getRefreshToken = asyncHandler(async (req, res) => {
    const cookie = req.cookies
    // console.log(cookie);
    if (!cookie?.jwt) return res.status(400).json({ message: `Unauthorized` })
    const refresh_token = cookie.jwt;

    jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET,
        asyncHandler(async (err, data) => {
            if (err) return res.status(403).json({ message: "Forbidden" })
            const user = await User.findOne({ username: data?.username }).lean().exec();
            if (!user) return res.status(400).json({ message: "Unauthorized" })
            const token = jwt.sign(
                {
                    "AuthData": {
                        user: user.username,
                        role: user.role,
                        name: user?.public_name,
                        id: user?.id
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '2h', }
            )
            return res.json({ token })
        })
    )
})

const Logout = asyncHandler(async (req, res) => {
    const cookies = req.cookies
    if (!cookies?.jwt) return res.sendStatus(204) //No content
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true })
    res.json({ message: 'Cookie cleared' })})


module.exports = { Login, Logout, getRefreshToken }