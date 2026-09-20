const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { authenticate, requireAnyPermission, requirePermission } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (e) {
    /* serverless may be read-only */
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

router.use(authenticate);

router.get('/', requireAnyPermission('documents.view', 'documents.manage', 'employees.view'), (req, res) => {
  const db = req.app.get('db');
  const { employee_id, category } = req.query;
  let query = `
    SELECT d.id, d.employee_id, d.name, d.category, d.file_name, d.file_type, d.file_size,
           d.description, d.created_at, d.uploaded_by,
           e.first_name || ' ' || e.last_name as employee_name
    FROM Documents d
    LEFT JOIN Employees e ON d.employee_id = e.id
    WHERE 1=1
  `;
  const params = [];

  const canManage = (req.permissions || []).includes('documents.manage');
  if (!canManage && req.user.employee_id) {
    query += ' AND d.employee_id = ?';
    params.push(req.user.employee_id);
  } else if (employee_id) {
    query += ' AND d.employee_id = ?';
    params.push(employee_id);
  }
  if (category) {
    query += ' AND d.category = ?';
    params.push(category);
  }
  query += ' ORDER BY d.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, data: rows });
  });
});

router.post('/', requirePermission('documents.manage'), upload.single('file'), (req, res) => {
  const db = req.app.get('db');
  const { employee_id, name, category, description } = req.body;
  if (!employee_id || !name) {
    return res.status(400).json({ success: false, message: 'employee_id and name are required' });
  }

  const file = req.file;
  let filePath = null;
  let fileData = null;
  if (file) {
    fileData = file.buffer.toString('base64');
    try {
      const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      filePath = path.join(uploadDir, safeName);
      fs.writeFileSync(filePath, file.buffer);
    } catch (e) {
      filePath = null;
    }
  }

  db.run(
    `INSERT INTO Documents (employee_id, name, category, file_name, file_type, file_size, file_data, file_path, description, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      employee_id,
      name,
      category || 'General',
      file?.originalname || null,
      file?.mimetype || null,
      file?.size || null,
      fileData,
      filePath || '',
      description || null,
      req.user.id,
    ],
    function (err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, data: { id: this.lastID } });
    }
  );
});

router.get('/:id/download', requireAnyPermission('documents.view', 'documents.manage'), (req, res) => {
  const db = req.app.get('db');
  db.get('SELECT * FROM Documents WHERE id = ?', [req.params.id], (err, doc) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    const canManage = (req.permissions || []).includes('documents.manage');
    if (!canManage && req.user.employee_id && doc.employee_id !== req.user.employee_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (doc.file_path && fs.existsSync(doc.file_path)) {
      return res.download(doc.file_path, doc.file_name || 'document');
    }
    if (doc.file_data) {
      const buf = Buffer.from(doc.file_data, 'base64');
      res.setHeader('Content-Type', doc.file_type || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${doc.file_name || 'document'}"`);
      return res.send(buf);
    }
    return res.status(404).json({ success: false, message: 'File content not available' });
  });
});

router.delete('/:id', requirePermission('documents.manage'), (req, res) => {
  const db = req.app.get('db');
  db.get('SELECT file_path FROM Documents WHERE id = ?', [req.params.id], (err, doc) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (doc?.file_path && fs.existsSync(doc.file_path)) {
      try {
        fs.unlinkSync(doc.file_path);
      } catch (e) {
        /* ignore */
      }
    }
    db.run('DELETE FROM Documents WHERE id = ?', [req.params.id], function (dErr) {
      if (dErr) return res.status(500).json({ success: false, message: dErr.message });
      res.json({ success: true, message: 'Document deleted' });
    });
  });
});

module.exports = router;
