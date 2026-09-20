const express = require('express');
const router = express.Router();
const { authenticate, requirePermission } = require('../middleware/auth');

router.use(authenticate);

router.get('/permissions', requirePermission('roles.manage'), (req, res) => {
    const db = req.app.get('db');
    db.all('SELECT * FROM Permissions ORDER BY module, code', (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: rows });
    });
});

router.get('/', requirePermission('roles.manage'), (req, res) => {
    const db = req.app.get('db');
    db.all('SELECT * FROM Roles ORDER BY name', (err, roles) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: roles });
    });
});

router.get('/:id', requirePermission('roles.manage'), (req, res) => {
    const db = req.app.get('db');
    db.get('SELECT * FROM Roles WHERE id = ?', [req.params.id], (err, role) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
        db.all(
            `SELECT p.id, p.code, p.name, p.module
             FROM Permissions p
             JOIN RolePermissions rp ON rp.permission_id = p.id
             WHERE rp.role_id = ?
             ORDER BY p.module, p.code`,
            [role.id],
            (pErr, permissions) => {
                if (pErr) return res.status(500).json({ success: false, message: pErr.message });
                res.json({ success: true, data: { ...role, permissions } });
            }
        );
    });
});

router.post('/', requirePermission('roles.manage'), (req, res) => {
    const db = req.app.get('db');
    const { name, description, permission_ids } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    db.run(
        'INSERT INTO Roles (name, description, is_system) VALUES (?, ?, 0)',
        [name, description || null],
        function (err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            const roleId = this.lastID;
            const perms = Array.isArray(permission_ids) ? permission_ids : [];
            if (!perms.length) return res.json({ success: true, data: { id: roleId } });
            let done = 0;
            perms.forEach((pid) => {
                db.run('INSERT OR IGNORE INTO RolePermissions (role_id, permission_id) VALUES (?, ?)', [roleId, pid], () => {
                    done++;
                    if (done === perms.length) res.json({ success: true, data: { id: roleId } });
                });
            });
        }
    );
});

router.put('/:id', requirePermission('roles.manage'), (req, res) => {
    const db = req.app.get('db');
    const { name, description, permission_ids } = req.body;
    const roleId = req.params.id;

    db.run(
        `UPDATE Roles SET name = COALESCE(?, name), description = COALESCE(?, description), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [name, description, roleId],
        function (err) {
            if (err) return res.status(500).json({ success: false, message: err.message });

            if (!Array.isArray(permission_ids)) {
                return res.json({ success: true, message: 'Role updated' });
            }

            db.run('DELETE FROM RolePermissions WHERE role_id = ?', [roleId], () => {
                if (!permission_ids.length) {
                    return res.json({ success: true, message: 'Role updated' });
                }
                let done = 0;
                permission_ids.forEach((pid) => {
                    db.run('INSERT INTO RolePermissions (role_id, permission_id) VALUES (?, ?)', [roleId, pid], () => {
                        done++;
                        if (done === permission_ids.length) {
                            res.json({ success: true, message: 'Role updated' });
                        }
                    });
                });
            });
        }
    );
});

router.delete('/:id', requirePermission('roles.manage'), (req, res) => {
    const db = req.app.get('db');
    db.get('SELECT is_system FROM Roles WHERE id = ?', [req.params.id], (err, role) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
        if (role.is_system) {
            return res.status(400).json({ success: false, message: 'Cannot delete system roles' });
        }
        db.run('DELETE FROM Roles WHERE id = ?', [req.params.id], function (dErr) {
            if (dErr) return res.status(500).json({ success: false, message: dErr.message });
            res.json({ success: true, message: 'Role deleted' });
        });
    });
});

module.exports = router;
