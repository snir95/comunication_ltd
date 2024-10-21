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
        return res.redirect('/login'); // Redirect if not logged in
    }
    res.status(200).render('newPassword.ejs', { user: req.session.user, errorMessage: null });
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
    const userId = req.session.user.userid;

    if (newPassword !== newPasswordConfirm) {
        return res.status(400).render('newPassword.ejs', { errorMessage: 'Passwords do not match!' });
    }

    if (badPasswords.includes(newPassword)) {
        return res.status(400).render('newPassword.ejs', { errorMessage: 'Password is too weak!' });
    }

    if (!validator.isStrongPassword(newPassword, {
        minLength: minLength,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
    })) {
        return res.status(400).render('newPassword.ejs', {
            errorMessage: `Password must be at least ${minLength} characters long and include: ${complexity}`,
        });
    }

    const dbUser = await query('SELECT password, password_history FROM users WHERE id = ?', [userId]);
    if (!dbUser.length) {
        return res.status(404).render('newPassword.ejs', { errorMessage: 'User not found!' });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, dbUser[0].password);
    if (!passwordMatch) {
        return res.status(400).render('newPassword.ejs', { errorMessage: 'Current password is incorrect.' });
    }

    const passwordHistory = dbUser[0].password_history ? JSON.parse(dbUser[0].password_history) : [];

    // Check if new password was used in the past `historyLimit` passwords
    for (let oldPassword of passwordHistory.slice(0, historyLimit)) {
        if (await bcrypt.compare(newPassword, oldPassword)) {
            return res.status(400).render('newPassword.ejs', { errorMessage: `Password cannot be one of the last ${historyLimit} passwords.` });
        }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedPasswordHistory = [hashedPassword, ...passwordHistory.slice(0, historyLimit - 1)];

    await query('UPDATE users SET password = ?, password_history = ? WHERE id = ?', [
        hashedPassword,
        JSON.stringify(updatedPasswordHistory),
        userId,
    ]);

    res.redirect('/');
});

module.exports = router;
