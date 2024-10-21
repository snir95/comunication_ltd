const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');
const loginLimiter = require('./loginLimiter');

router.get('/', (req, res) => {
    if (req.session.user) {
        return res.render('home.ejs', { fullName: req.session.user.fullName, user: req.session.user });
    }
    res.status(200).render('login.ejs', { messages: req.flash('error') });
});

router.post('/', loginLimiter, (req, res) => {
    const { email, password } = req.body;

    db.userDbConfig.query('SELECT * FROM users WHERE email = ?', [email], (error, results) => {
        if (error) {
            req.flash('error', 'Database error. Please try again later.');
            return res.render('login.ejs');
        }

        if (results.length === 0) {
            req.flash('error', 'User not found. Check your email or password.');
            return res.render('login.ejs', { messages: req.flash('error') });
        }

        const user = results[0];
        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                req.flash('error', 'Error validating password. Try again later.');
                return res.render('login.ejs', { messages: req.flash('error') });
            }

            if (!result) {
                req.flash('error', 'Incorrect password. Try again.');
                return res.render('login.ejs', { messages: req.flash('error') });
            }

            req.session.user = { userid: user.id, fullName: user.fullname, isLoggedIn: true };
            res.render('home.ejs', { fullName: req.session.user.fullName });
        });
    });
});

module.exports = router;
