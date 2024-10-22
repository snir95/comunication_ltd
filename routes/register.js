const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');
const badPasswords = ["mypassword", "password1234", "1234567890", "0987654321"];
const validator = require('validator');

const minLength = parseInt(process.env.PASSWORD_LENGTH || 10);
const complexity = process.env.PASSWORD_COMPLEXITY || 'uppercase,lowercase,numbers,special_characters';

// GET route to render the registration form
router.get('/', (req, res) => {
    res.render('register.ejs', { messages: req.flash('error'), first_name: '', last_name: '', email: '' });
});

// POST route to handle registration logic
router.post('/', (req, res) => {
    const { first_name, last_name, email, password, confirmPassword } = req.body;
    console.log(req.body);

    // Validate the input
    if (badPasswords.includes(password)) {
        req.flash('error', 'Password too weak. Please choose a stronger one.');
        return res.status(400).render('register.ejs', { messages: req.flash('error'), first_name, last_name, email });
    }

    if (!validator.isStrongPassword(password, {
        minLength: minLength,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
    })) {
        req.flash('error', `Password must be at least ${minLength} characters long and include: ${complexity}.`);
        return res.status(400).render('register.ejs', { messages: req.flash('error'), first_name, last_name, email })
    }

    if (password !== confirmPassword) {
        req.flash('error', 'Passwords do not match.');
        return res.status(400).render('register.ejs', { messages: req.flash('error'), first_name, last_name, email });
    }

    // Check if the email is already registered
    const selectQuery = 'SELECT id FROM users WHERE email = ?';
    db.userDbConfig.query(selectQuery, [email], (error, results) => {
        if (error) {
            req.flash('error', 'Database error. Try again later.');
            return res.render('register.ejs', { messages: req.flash('error'), first_name, last_name, email });
        }

        if (results.length > 0) {
            req.flash('error', 'This email is already registered.');
            return res.render('register.ejs', { messages: req.flash('error'), first_name, last_name, email });
        }

        // Hash the password
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                req.flash('error', 'Error hashing the password. Try again.');
                return res.render('register.ejs', { messages: req.flash('error'), first_name, last_name, email });
            }

            // Insert the new user into the database
            const insertQuery = 'INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)';
            db.userDbConfig.query(insertQuery, [email, hash, first_name, last_name], (error) => {
                if (error) {
                    req.flash('error', 'Error registering user. Try again later.');
                    return res.render('register.ejs', { messages: req.flash('error'), first_name, last_name, email });
                }

                req.flash('success', 'Account created. You can now login.');
                res.redirect('/');
            });
        });
    });
});

module.exports = router;
