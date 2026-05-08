import { validateRegistration, validateLogin } from "../utils/validate.util.js"
import logger from "../utils/logger.util.js"
import User from "../models/User.model.js"
import generrateToken from "../utils/token.util.js"
import RefreshToken from "../models/RefreshToken.model.js"
//user registeration

export const registerUser = async (req, res) => {
    logger.info("registerUser controller called")
    try {
        //validate schema
        const { error } = validateRegistration(req.body)
        if (error) {
            logger.warn("Validation error", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            })

        }
        const { username, email, password } = req.body
        let user = await User.findOne({ $or: [{ email }, { username }] })
        if (user) {
            logger.warn("User or  email  already exists")
            return res.status(400).json({
                success: false,
                message: "User already exists"
            })
        }
        user = new User({ username, email, password })
        await user.save()
        logger.warn("User registered successfully", user._id)
        const { accessToken, refreshToken } = await generrateToken(user)
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                accessToken,
                refreshToken
            }
        })
    } catch (e) {
        logger.error("Error in registerUser controller", e)
        res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

// user login
export const loginUser = async(req, res) => {
	logger.info("login endpoint")
	try {
        const { error } = validateLogin(req.body)
   if (error) {
            logger.warn("Validation error", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            })


	}
    const { email, password } = req.body
    const user = await User.findOne({ email})
    if(!user) {
        logger.warn("User not found")
        return res.status(400).json({
            success: false,
            message: "User not found"
        })
    }
    // validate user password
    const isValidPassword = await user.comparePassword(password)
    if(!isValidPassword) {
        logger.warn("Invalid password")
        return res.status(400).json({
            success: false,
            message: "Invalid password"
        })

    }
    const { accessToken, refreshToken } = await generrateToken(user)
    res.json({
        accessToken,
        refreshToken,
        userId: user._id
    })

}

    catch (e) {
        logger.error("Error in logging User controller", e)
        res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }

    }
// refresh token

export const refreshTokenController = async (req, res) => {
    logger.info("Refresh token endpoint called")
    try {
        const {refreshToken} = req.body
        if(!refreshToken) {
            logger.warn("Refresh token not provided")
            return res.status(400).json({
                success: false,
                message: "Refresh token not provided"
            })
        }
        const storedToken = await RefreshToken.findOne({ token: refreshToken })
        if(!storedToken || storedToken.expiryDate < new Date()) {
            logger.warn("Invalid refresh token")
            return res.status(400).json({
                success: false,
                message: "Invalid refresh token"
            })
        }
        const user = await User.findById(storedToken.user)
        if(!user) {
            logger.warn("User not found")
            return res.status(400).json({
                success: false,
                message: "User not found"
            })
        }
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generrateToken(user)
        // delete old refresh token
        await RefreshToken.deleteOne({ token: refreshToken })
        res.json({
            success: true,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        })
    } catch (e) {
        logger.error("Refresh token error", e)
        res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

//logout user
export const logoutUser = async (req, res) => {
    logger.info("Logout endpoint called")
  try {
    const {refreshToken} = req.body
        if(!refreshToken) {
            logger.warn("Refresh token not provided")
            return res.status(400).json({
                success: false,
                message: "Refresh token not provided"
            })
        }
    await RefreshToken.deleteOne({ token: refreshToken })
    logger.info("User logged out successfully")
    res.json({
      success: true,
      message: "User logged out successfully"
    })
  } catch (e) {
    logger.error("Logout error", e)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}
