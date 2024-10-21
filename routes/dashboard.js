const express = require('express');
const router = express.Router();
const requireAuth = require('../auth');
const db = require('../config/db');

// Utility function to render the home view
function renderHome(res, user, messages = [], searchQueryResult = [], searchQuery = null) {
    res.render('home.ejs', {
        fullName: user.fullName,
        user,
        messages,
        searchQueryResult,
        searchQuery,
    });
}

// Search for a client
router.post('/search', requireAuth, (req, res) => {
    const { searchQuery } = req.body;
    const messages = req.flash('error'); // Retrieve flash messages

    if (searchQuery) {
        const searchTerm = `%${searchQuery}%`;
        const searchQuerySQL = `SELECT * FROM clients WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone_number LIKE ?`;

        db.clientDbConfig.query(searchQuerySQL, [searchTerm, searchTerm, searchTerm, searchTerm], (error, results) => {
            if (error) {
                req.flash('error', 'An error occurred while fetching clients. Please try again later.');
                return renderHome(res, req.session.user, req.flash('error'));
            }
            renderHome(res, req.session.user, [], results, searchQuery);
        });
    } else {
        renderHome(res, req.session.user);
    }
});

// Display dashboard
router.get('/', requireAuth, (req, res) => {
    renderHome(res, req.session.user);
});

// Add new client form
router.get('/addClient', requireAuth, (req, res) => {
    renderHome(res, req.session.user);
});

// Add new client (POST)
router.post('/addClient', requireAuth, (req, res) => {
    console.log(req.body);
    
    const { first_name, last_name, email, phone_number } = req.body;
    const messages = req.flash('error');

    if (!isValidphoneNumber(phone_number)) {
        req.flash('error', 'Invalid phone number. Please enter a valid international phone number.');
        return renderHome(res, req.session.user, messages);
    }

    const selectQuery = 'SELECT * FROM clients WHERE email = ?';
    db.clientDbConfig.query(selectQuery, [email], (error, results) => {
        if (error) {
            req.flash('error', 'Error checking email. Try again later.');
            return renderHome(res, req.session.user, messages);
        }
        if (results.length > 0) {
            req.flash('error', 'Email already registered.');
            return renderHome(res, req.session.user, messages);
        }

        const insertQuery = 'INSERT INTO clients (first_name, last_name, email, phone_number) VALUES (?, ?, ?, ?)';
        db.clientDbConfig.query(insertQuery, [first_name, last_name, email, phone_number], (error) => {
            if (error) {
                req.flash('error', 'Error adding client. Try again later.');
                return renderHome(res, req.session.user, messages);
            }
            req.flash('success', `${first_name} added successfully.`);
            return res.send('Client added successfully!');
        });
    });
});


// Helper function
function isValidphoneNumber(phone_number) {
    const phoneNumberRegex = /^\+972\d{8,9}$/;
    return phoneNumberRegex.test(phone_number);
}

module.exports = router;
