const express = require('express');
const router = express.Router();
const db = require("../config/db");
const crypto = require('crypto');
const nodemailer = require('nodemailer');

router.get('/', function (req, res) {
    res.status(200).render('passwordReset.ejs', { errorMessage: null });
});

function generateVerificationCode() {
    return crypto.randomBytes(3).toString('hex');
}

router.post('/', async (req, res) => {
    const { email } = req.body;

    try {
        // Check if the email exists in the database
        const results = await new Promise((resolve, reject) => {
            db.userDbConfig.query('SELECT * FROM users WHERE email = ?', [email], (error, results) => {
                if (error) reject(error);
                else resolve(results);
            });
        });

        if (results.length === 0) {
            return res.render('passwordReset.ejs', { errorMessage: 'Email not found.' });
        }

        // Generate a random verification code
        const verificationCode = generateVerificationCode();
        const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');
        
        // Store the hashed code and email in the session
        req.session.hashedCode = hashedCode;
        req.session.resetEmail = email;

        // Create a transporter for sending the email
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.GMAIL_USER || 'donotreplycommuniproject@gmail.com',
                pass: process.env.GMAIL_PASS || 'cgqofhzmtqtneeay'
            }
        });

        // Create the email options
        const mailOptions = {
            from: process.env.GMAIL_USER || 'donotreplycommuniproject@gmail.com',
            to: email,
            subject: 'Password Reset Code',
            text: `Your verification code is: ${verificationCode}`
        };

        // Send the email
        await transporter.sendMail(mailOptions);
        res.redirect('/verificationCode');
    } catch (error) {
        console.error('Error in password reset process:', error);
        res.render('passwordReset.ejs', { errorMessage: 'Failed to process your request. Please try again later.' });
    }
});

module.exports = router;