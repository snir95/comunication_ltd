const express = require('express');
const router = express.Router();
const requireAuth = require('../auth');

router.get('/', requireAuth, (req, res) => {
    const logoutMessage = 'Successfully logged out.';

    req.session.destroy((err) => {
        if (err) {
            console.error('Session destruction error:', err);
            return res.status(500).send('An error occurred during logout');
        }
        
        // Clear the session cookie
        res.clearCookie('LTDsession');
        
        // Redirect to the login page with a query parameter for the message
        res.redirect('/?message=' + encodeURIComponent(logoutMessage));
    });
});

module.exports = router;