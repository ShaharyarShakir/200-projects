import loggers from '../utils/logger.util.js';
import jwt from 'jsonwebtoken';
const validateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
const token = authHeader && authHeader.split(' ')[1];
if(!token){
    loggers.warn('No token provided');
    return res.status(401).json({
        success: false,
         message: 'No token provided'
         });
}
jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
if(err){
    loggers.warn('Invalid token');
    return res.status(403).json({
        success: false,
         message: 'Invalid token'
         });
        }
req.user = user;
next();
})
}

export default validateToken;
