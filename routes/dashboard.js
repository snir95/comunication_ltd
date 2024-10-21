const express = require('express');
const router = express.Router();
const requireAuth = require('../auth');
const db = require('../config/db');

// Search for a client
router.post('/search', requireAuth, (req, res) => {
    const { searchQuery } = req.body;
    if (searchQuery) {
        const searchTerm = `%${searchQuery}%`;
        const searchQueryResult = `SELECT * FROM clients WHERE firstname LIKE ? OR lastname LIKE ? OR email LIKE ? OR phoneNumber LIKE ?`;

        db.clientDbConfig.query(searchQueryResult, [searchTerm, searchTerm, searchTerm, searchTerm], (error, results) => {
            if (error) {
                console.error("Database error:", error);
                req.flash('error', 'An error occurred while fetching clients. Please try again later.');
                return res.render('home.ejs', { 
                    messages: req.flash('error'), 
                    fullName: req.session.user.fullName, 
                    user: req.session.user, 
                    searchQuery 
                });
            }
            res.render('home.ejs', { 
                fullName: req.session.user.fullName, 
                user: req.session.user, 
                searchQueryResult: results, 
                searchQuery 
            });
        });
    } else {
        res.render('home.ejs', { 
            fullName: req.session.user.fullName, 
            user: req.session.user, 
            searchQueryResult: [], 
            searchQuery: null 
        });
    }
});

// Display dashboard
router.get('/', requireAuth, (req, res) => {
    if (req.session.user) {
        return res.render('home.ejs', {
            fullName: req.session.user.fullName,
            user: req.session.user,
            searchQueryResult: [],
            searchQuery: null
        });
    }
    res.redirect('/login');
});

// Add new client form
router.get('/addClient', requireAuth, (req, res) => {
    res.render('addclient.ejs', { fullName: req.session.user.fullName });
});

// Add new client (POST)
router.post('/addClient', requireAuth, (req, res) => {
    const { firstname, lastname, email, phoneNumber } = req.body;

    if (!isValidPhoneNumber(phoneNumber)) {
        req.flash('error', 'Invalid phone number. Please enter a valid international phone number.');
        return res.render('home.ejs', { messages: req.flash('error'), fullName: req.session.user.fullName });
    }

    const selectQuery = 'SELECT * FROM clients WHERE email = ?';
    db.clientDbConfig.query(selectQuery, [email], (error, results) => {
        if (error) {
            req.flash('error', 'Error checking email. Try again later.');
            return res.render('home.ejs', { messages: req.flash('error'), fullName: req.session.user.fullName });
        }
        if (results.length > 0) {
            req.flash('error', 'Email already registered.');
            return res.render('home.ejs', { messages: req.flash('error'), fullName: req.session.user.fullName });
        }

        const insertQuery = 'INSERT INTO clients (firstname, lastname, email, phoneNumber) VALUES (?, ?, ?, ?)';
        db.clientDbConfig.query(insertQuery, [firstname, lastname, email, phoneNumber], (error) => {
            if (error) {
                req.flash('error', 'Error adding client. Try again later.');
                return res.render('home.ejs', { messages: req.flash('error'), fullName: req.session.user.fullName });
            }
            req.flash('success', `${firstname} added successfully.`);
            res.render('home.ejs', { messages: req.flash('success'), fullName: req.session.user.fullName });
        });
    });
});

// Helper function
function isValidPhoneNumber(phoneNumber) {
    const phoneNumberRegex = /^\+972\d{8,9}$/;
    return phoneNumberRegex.test(phoneNumber);
}

module.exports = router;
