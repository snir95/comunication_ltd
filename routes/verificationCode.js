const express = require('express');
const router = express.Router();
const crypto = require('crypto');

router.get('/', function (req, res) {
    const hashedCode = req.session.hashedCode;
    if (!hashedCode) {
        return res.status(400).render('verificationCode.ejs', { errorMessage: 'No verification code found!' });
    }
    return res.status(200).render('verificationCode.ejs', { errorMessage: null });
});

router.post('/', async (req, res) => {
    const { code } = req.body;
    const hashedCode = req.session.hashedCode;

    const hashedInput = crypto.createHash('sha1').update(code).digest('hex');
    if (hashedInput === hashedCode) {
        req.session.hashedCode = null; // Clear the session code after use
        return res.redirect('/choosePassword');
    } else {
        return res.status(400).render('verificationCode.ejs', { errorMessage: 'Verification code is incorrect.' });
    }
});

module.exports = router;
