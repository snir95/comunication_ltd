const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');
const validator = require('validator');
const badPasswords = ["mypassword", "password1234", "1234567890", "0987654321"];

const minLength = process.env.PASSWORD_LENGTH || 10;
const complexity = process.env.PASSWORD_COMPLEXITY || 'uppercase,lowercase,numbers,special_characters';

router.get('/', (req, res) => {
    res.render('register.ejs', { messages: req.flash('error'), ...req.flash() });
});

router.post('/', (req, res) => {
    const { firstname, lastname, email, password, confirmPassword } = req.body;

    if (badPasswords.includes(password)) {
        req.flash('error', 'Password too weak. Please choose a stronger one.');
        return res.status(400).render('register.ejs', { messages: req.flash('error') });
    }

    if (password !== confirmPassword) {
        req.flash('error', 'Passwords do not match.');
        return res.status(400).render('register.ejs', { messages: req.flash('error') });
    }

    const selectQuery = 'SELECT id FROM users WHERE email = ?';
    db.userDbConfig.query(selectQuery, [email], (error, results) => {
        if (error) {
            req.flash('error', 'Database error. Try again later.');
            return res.render('register.ejs', { messages: req.flash('error') });
        }

        if (results.length > 0) {
            req.flash('error', 'This email is already registered.');
            return res.render('register.ejs', { messages: req.flash('error') });
        }

        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                req.flash('error', 'Error hashing the password. Try again.');
                return res.render('register.ejs', { messages: req.flash('error') });
            }

            const fullname = `${firstname} ${lastname}`;
            const insertQuery = 'INSERT INTO users (email, password, fullname) VALUES (?, ?, ?)';
            db.userDbConfig.query(insertQuery, [email, hash, fullname], (error) => {
                if (error) {
                    req.flash('error', 'Error registering user. Try again later.');
                    return res.render('register.ejs', { messages: req.flash('error') });
                }

                req.flash('success', 'Account created. You can now login.');
                res.redirect('/login');
            });
        });
    });
});

module.exports = router;
