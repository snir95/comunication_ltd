const express = require('express');
const router = express.Router();
const db = require("../config/db.js");
const crypto = require('crypto');
const nodemailer = require('nodemailer');

router.get('/', function (req, res) {
    res.status(200).render('passwordReset.ejs', { errorMessage: null });
});

router.post('/', async (req, res) => {
    const { email } = req.body;

    try {
        // Check if the email exists in the database
        const results = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (results.length === 0) {
            return res.render('passwordReset.ejs', { errorMessage: 'Email not found.' });
        }

        // Generate a random verification code
        const randomCode = Math.random().toString().slice(2, 7);
        const hashedCode = crypto.createHash('sha1').update(randomCode).digest('hex');
        req.session.hashedCode = hashedCode;
        req.session.email = email;

        // Create a transporter for sending the email
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 465,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Create the email options
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Password Reset Code',
            text: `Your verification code is: ${randomCode}`,
        };

        // Send the email
        await transporter.sendMail(mailOptions);
        res.redirect('/verificationCode'); // Redirect to the verification code page
    } catch (error) {
        console.error('Error in password reset process:', error);
        res.render('passwordReset.ejs', { errorMessage: 'Failed to process your request. Please try again later.' });
    }
});

module.exports = router;
