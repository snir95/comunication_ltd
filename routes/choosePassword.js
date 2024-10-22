const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require("../config/db");
const validator = require('validator');

const badPasswords = ["mypassword", "password1324", "0987654321", "1234567890"];
const history = process.env.PASSWORD_HISTORY || 3;

router.get('/', (req, res) => {
    return res.status(200).render('choosePassword.ejs', { messages: [] });
});

async function query(sql, args) {
    return new Promise((resolve, reject) => {
        db.userDbConfig.query(sql, args, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

router.post('/', async (req, res) => {
    if (!req.session || !req.session.email) {
        return res.redirect('/login');
    }
    const email = req.session.email;
    const { newPassword, newPasswordConfirm } = req.body;

    // Validate new password
    if (badPasswords.includes(newPassword)) {
        return res.status(400).render('choosePassword.ejs', { messages: ['Password is weak'] });
    }
    if (!validator.isStrongPassword(newPassword, { minLength: 10 })) {
        return res.status(400).render('choosePassword.ejs', { messages: ['Password must be at least 10 characters long and must include lowercase, number, uppercase, and special characters.'] });
    }
    if (newPassword !== newPasswordConfirm) {
        return res.status(400).render('choosePassword.ejs', { messages: ['Passwords do not match'] });
    }

    try {
        // Fetch password history
        const getUserPasswordHistoryQuery = 'SELECT password_history FROM users WHERE email = ?';
        const historyResults = await query(getUserPasswordHistoryQuery, [email]);
        const passwordHistory = historyResults[0]?.password_history ? JSON.parse(historyResults[0].password_history) : [];

        // Check if the new password matches any of the last three passwords
        for (let previousPassword of passwordHistory.slice(0, history)) {
            const match = await bcrypt.compare(newPassword, previousPassword);
            if (match) {
                return res.status(400).render('choosePassword.ejs', { messages: ['New password must not match any of the last three passwords.'] });
            }
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password history
        const updatedPasswordHistory = [hashedPassword, ...passwordHistory.slice(0, history - 1)];

        // Update user's current password and password history
        const updateQuery = 'UPDATE users SET password = ?, password_history = ? WHERE email = ?';
        await query(updateQuery, [hashedPassword, JSON.stringify(updatedPasswordHistory), email]);

        // Clear the session
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
            }
            res.redirect('/login');
        });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).render('choosePassword.ejs', { messages: ['An error occurred while updating the password. Please try again later.'] });
    }
});

module.exports = router;