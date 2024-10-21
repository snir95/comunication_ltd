const express = require('express');
const router = express.Router();
const requireAuth = require('../auth');

router.get('/', requireAuth, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destruction error:', err);
            return res.status(500).redirect('/'); // Redirect or show error page
        }
        req.flash('success', 'Successfully logged out.');
        res.redirect('/');
    });
});

module.exports = router;
