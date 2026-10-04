const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
    return process.env.JWT_SECRET;
};

/**
 * Require authentication.
 * Expects: Authorization: Bearer <token>
 */
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({
            success: false,
            error: { message: 'Unauthorized' }
        });
    }

    try {
        const payload = jwt.verify(token, getJwtSecret());
        req.user = { id: payload.userId, email: payload.email };
        return next();
    } catch {
        return res.status(401).json({
            success: false,
            error: { message: 'Unauthorized' }
        });
    }
};

/**
 * Optional authentication.
 * If token is provided and valid, req.user will be set.
 */
const authenticateOptional = (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const payload = jwt.verify(token, getJwtSecret());
        req.user = { id: payload.userId, email: payload.email };
        return next();
    } catch {
        req.user = null;
        return next();
    }
};

module.exports = { authenticate, authenticateOptional };
