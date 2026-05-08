import Router from 'express'
import { loginUser, registerUser, refreshTokenController, logoutUser } from '../controllers/identity.controller.js'
const router = Router()
router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/refresh-token', refreshTokenController)
router.post('/logout', logoutUser)

export default router
