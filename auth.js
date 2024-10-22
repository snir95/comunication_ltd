module.exports = function requireAuth(req, res, next) {
    debugger
    if (req.session.user) {
    debugger

        return next();
    } else {
        res.redirect('/');
    }
} 