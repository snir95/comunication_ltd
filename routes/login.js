const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');
const loginLimiter = require('./loginLimiter');

router.get('/', (req, res) => {
    if (req.session.user) {
        const searchQueryResult = []; // Initialize as empty array
        return res.render('home.ejs', { 
            fullName: req.session.user.fullName, 
            user: req.session.user,
            searchQueryResult 
        });
    }
    res.status(200).render('login.ejs', { messages: req.flash('error') });
});

router.post('/', loginLimiter, (req, res) => {
    const { email, password } = req.body;

    db.userDbConfig.query('SELECT * FROM users WHERE email = ?', [email], (error, results) => {
        if (error) {
            req.flash('error', 'Database error. Please try again later.');
            return res.redirect('/');
        }
        if (results.length === 0) {
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/');
        }
        
        const user = results[0];
        bcrypt.compare(password, user.password, (err, match) => {
            if (err) {
                req.flash('error', 'Error during password comparison.');
                return res.redirect('/');
            }
            if (!match) {
                req.flash('error', 'Invalid email or password.');
                return res.redirect('/');
            }
            req.session.user = { 
                id: user.id, 
                fullName: `${user.first_name} ${user.last_name}`,
                email: user.email
            };
            res.redirect('/dashboard'); // Redirect to the dashboard after login
        });
    });
});

module.exports = router;
