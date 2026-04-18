// Authentication middleware - checks if user is logged in via session
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    return res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });
};

module.exports = { isAuthenticated };
