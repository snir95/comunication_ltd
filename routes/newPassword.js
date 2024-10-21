const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');
const validator = require('validator');
const badPasswords = ["mypassword", "password1234", "1234567890", "0987654321"];

const minLength = parseInt(process.env.PASSWORD_LENGTH || 10);
const historyLimit = parseInt(process.env.PASSWORD_HISTORY || 3);
const complexity = process.env.PASSWORD_COMPLEXITY || 'uppercase,lowercase,numbers,special_characters';

router.get('/', function (req, res) {
    if (!req.session?.user) {
        return res.redirect('/login');
    }
    res.status(200).render('newPassword.ejs', { user: req.session.user, errorMessage: req.flash('error'), errorMessage1: req.flash('info') });
});

function query(sql, args) {
    return new Promise((resolve, reject) => {
        db.userDbConfig.query(sql, args, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

router.post('/', async function (req, res) {
    if (!req.session?.user) {
        return res.redirect('/login');
    }
    const { currentPassword, newPassword, newPasswordConfirm } = req.body;
    const userId = req.session.user.id;

    // Check if passwords match
    if (newPassword !== newPasswordConfirm) {
        req.flash('error', 'Passwords do not match!');
        return res.redirect('/newPassword');
    }

    // Check if password is in the list of weak passwords
    if (badPasswords.includes(newPassword)) {
        req.flash('error', 'Password is too weak!');
        return res.redirect('/newPassword');
    }

    // Validate password strength
    if (!validator.isStrongPassword(newPassword, {
        minLength: minLength,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
    })) {
        req.flash('error', `Password must be at least ${minLength} characters long and include: ${complexity}`);
        return res.redirect('/newPassword');
    }

    const dbUser = await query('SELECT password, password_history FROM users WHERE id = ?', [userId]);
    if (!dbUser.length) {
        req.flash('error', 'User not found!');
        return res.redirect('/newPassword');
    }

    // Compare current password with the stored password
    const passwordMatch = await bcrypt.compare(currentPassword, dbUser[0].password);
    if (!passwordMatch) {
        req.flash('error', 'Current password is incorrect.');
        return res.redirect('/newPassword');
    }

    const passwordHistory = dbUser[0].password_history ? JSON.parse(dbUser[0].password_history) : [];

    // Check if the new password matches any of the recent passwords
    for (let oldPassword of passwordHistory.slice(0, historyLimit)) {
        if (await bcrypt.compare(newPassword, oldPassword)) {
            req.flash('error', `Password cannot be one of the last ${historyLimit} passwords.`);
            return res.redirect('/newPassword');
        }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedPasswordHistory = [hashedPassword, ...passwordHistory.slice(0, historyLimit - 1)];

    await query('UPDATE users SET password = ?, password_history = ? WHERE id = ?', [
        hashedPassword,
        JSON.stringify(updatedPasswordHistory),
        userId,
    ]);

    req.flash('info', 'Password changed successfully!');
    res.redirect('/'); // Redirect to home page
});

module.exports = router;
