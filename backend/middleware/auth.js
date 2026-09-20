const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function getUserPermissions(db, userId) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT DISTINCT p.code
             FROM Permissions p
             JOIN RolePermissions rp ON rp.permission_id = p.id
             JOIN UserRoles ur ON ur.role_id = rp.role_id
             WHERE ur.user_id = ?`,
            [userId],
            (err, rows) => {
                if (err) return reject(err);
                resolve((rows || []).map((r) => r.code));
            }
        );
    });
}

function getUserRoles(db, userId) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT r.id, r.name, r.description
             FROM Roles r
             JOIN UserRoles ur ON ur.role_id = r.id
             WHERE ur.user_id = ?`,
            [userId],
            (err, rows) => {
                if (err) return reject(err);
                resolve(rows || []);
            }
        );
    });
}

function getUserProfile(db, userId) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT id, username, email, user_level, employee_id, is_active, created_at
             FROM Users WHERE id = ?`,
            [userId],
            (err, user) => {
                if (err) return reject(err);
                if (!user) return resolve(null);
                if (!user.employee_id) {
                    return resolve({ ...user, employee: null });
                }
                db.get('SELECT * FROM Employees WHERE id = ?', [user.employee_id], (eErr, employee) => {
                    if (eErr) return reject(eErr);
                    resolve({ ...user, employee: employee || null });
                });
            }
        );
    });
}

async function buildAuthPayload(db, userId) {
    const [user, roles, permissions] = await Promise.all([
        getUserProfile(db, userId),
        getUserRoles(db, userId),
        getUserPermissions(db, userId),
    ]);
    return { user, roles, permissions };
}

function authenticate(req, res, next) {
    const header = req.headers.authorization;
    const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }

        const db = req.app.get('db');
        try {
            const payload = await buildAuthPayload(db, decoded.id);
            if (!payload.user || payload.user.is_active === 0) {
                return res.status(401).json({ success: false, message: 'User account is inactive' });
            }
            req.user = payload.user;
            req.roles = payload.roles;
            req.permissions = payload.permissions;
            next();
        } catch (e) {
            console.error('Auth middleware error:', e);
            return res.status(500).json({ success: false, message: 'Authentication error' });
        }
    });
}

function requirePermission(...codes) {
    return (req, res, next) => {
        const perms = req.permissions || [];
        const ok = codes.every((c) => perms.includes(c));
        if (!ok) {
            return res.status(403).json({ success: false, message: 'Insufficient permissions' });
        }
        next();
    };
}

function requireAnyPermission(...codes) {
    return (req, res, next) => {
        const perms = req.permissions || [];
        const ok = codes.some((c) => perms.includes(c));
        if (!ok) {
            return res.status(403).json({ success: false, message: 'Insufficient permissions' });
        }
        next();
    };
}

module.exports = {
    JWT_SECRET,
    authenticate,
    requirePermission,
    requireAnyPermission,
    getUserPermissions,
    getUserRoles,
    getUserProfile,
    buildAuthPayload,
};
