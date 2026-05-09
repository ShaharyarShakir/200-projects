import logger from '../utils/logger.util.js';


export const authenticateRequest = (req, res, next) => {
    const userId = req.header('x-user-id');
    if(!userId) {
        logger.warn('Unauthorized access attempt detected.');
        return res.status(401).json({
            success: false,
            message: 'Unauthorized ! Please login to access this resource.'
        });
    }
    req.user = { userId };
    next();
}
