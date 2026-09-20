const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, authenticate, buildAuthPayload } = require('../middleware/auth');

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Username and password are required',
        });
    }

    const db = req.app.get('db');

    db.get(
        'SELECT * FROM Users WHERE username = ? OR email = ?',
        [username, username],
        (err, user) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid username or password' });
            }
            if (user.is_active === 0) {
                return res.status(401).json({ success: false, message: 'User account is inactive' });
            }

            bcrypt.compare(password, user.password, async (bErr, isMatch) => {
                if (bErr) {
                    return res.status(500).json({ success: false, message: 'Error verifying password' });
                }
                if (!isMatch) {
                    return res.status(401).json({ success: false, message: 'Invalid username or password' });
                }

                try {
                    const payload = await buildAuthPayload(db, user.id);
                    const token = jwt.sign(
                        {
                            id: user.id,
                            username: user.username,
                            user_level: user.user_level,
                            employee_id: user.employee_id || null,
                        },
                        JWT_SECRET,
                        { expiresIn: '24h' }
                    );

                    res.json({
                        success: true,
                        token,
                        user: {
                            id: payload.user.id,
                            username: payload.user.username,
                            email: payload.user.email,
                            user_level: payload.user.user_level,
                            employee_id: payload.user.employee_id,
                            employee: payload.user.employee,
                        },
                        roles: payload.roles,
                        permissions: payload.permissions,
                    });
                } catch (e) {
                    console.error(e);
                    return res.status(500).json({ success: false, message: 'Login error' });
                }
            });
        }
    );
});

router.get('/verify', authenticate, (req, res) => {
    res.json({
        success: true,
        user: req.user,
        roles: req.roles,
        permissions: req.permissions,
    });
});

router.get('/me', authenticate, (req, res) => {
    res.json({
        success: true,
        user: req.user,
        roles: req.roles,
        permissions: req.permissions,
    });
});

module.exports = router;
