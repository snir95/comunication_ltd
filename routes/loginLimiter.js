const rateLimit = require("express-rate-limit");
const loginAttempts = process.env.LOGIN_ATTEMPTS || 3;

const loginLimiter = rateLimit({
    windowMs: 30 * 1000, // 30 seconds
    max: loginAttempts, 
    keyGenerator: (req) => req.ip, // Use IP address as key
    handler: (req, res) => {
        console.log(`Too many login attempts from IP: ${req.ip}`);
        req.flash('error', 'Too many login attempts. Please try again later.');
        res.redirect('/');
    }
});

module.exports = loginLimiter;
