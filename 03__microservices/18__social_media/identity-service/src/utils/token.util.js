import jwt from "jsonwebtoken"
import crypto from "crypto"
import RefreshToken from "../models/RefreshToken.model.js"

const generateToken = async (user) => {
    const accessToken = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "5m" })
    const refreshToken = crypto.randomBytes(64).toString("hex")
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 5) // expires in 5 days
    await RefreshToken.create({
        token: refreshToken,
        user: user._id,
        expiresAt
    })
    return { accessToken, refreshToken }
}
export default generateToken
