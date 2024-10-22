const express = require('express');
const router = express.Router();
const crypto = require('crypto');

router.get('/', (req, res) => {
    res.render('verificationCode.ejs', { errorMessage: null });
});

router.post('/', (req, res) => {
    const { code } = req.body;
    const hashedCode = req.session.hashedCode;
    const resetEmail = req.session.resetEmail;

    if (!hashedCode || !resetEmail) {
        return res.render('verificationCode.ejs', { errorMessage: 'Session expired. Please try again.' });
    }

    const inputHashedCode = crypto.createHash('sha256').update(code).digest('hex');

    if (inputHashedCode === hashedCode) {
        // Code is correct, allow password reset
        req.session.allowReset = true;
        res.redirect('/choosePassword');
    } else {
        res.render('verificationCode.ejs', { errorMessage: 'Invalid code. Please try again.' });
    }
});

module.exports = router;