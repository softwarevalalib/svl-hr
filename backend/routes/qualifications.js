const express = require('express');
const router = express.Router();

// ============= SKILLS =============
// Get all skills
router.get('/skills', (req, res) => {
    const db = req.app.get('db');
    db.all('SELECT * FROM Skills ORDER BY name', (err, skills) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, data: skills });
    });
});

// Get employee skills
router.get('/employees/:id/skills', (req, res) => {
    const db = req.app.get('db');
    db.all(
        `SELECT es.*, s.name as skill_name 
         FROM EmployeeSkills es
         LEFT JOIN Skills s ON es.skill_id = s.id
         WHERE es.employee_id = ?`,
        [req.params.id],
        (err, skills) => {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true, data: skills });
        }
    );
});

// Add skill to employee
router.post('/employees/:id/skills', (req, res) => {
    const db = req.app.get('db');
    const { skill_id, skill_name, details } = req.body;
    
    db.run(
        `INSERT INTO EmployeeSkills (employee_id, skill_id, skill_name, details) 
         VALUES (?, ?, ?, ?)`,
        [req.params.id, skill_id, skill_name, details],
        function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true, data: { id: this.lastID } });
        }
    );
});

// ============= EDUCATION =============
// Get all educations
router.get('/educations', (req, res) => {
    const db = req.app.get('db');
    db.all('SELECT * FROM Educations ORDER BY name', (err, educations) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, data: educations });
    });
});

// Get employee educations
router.get('/employees/:id/educations', (req, res) => {
    const db = req.app.get('db');
    db.all(
        `SELECT ee.*, e.name as education_name 
         FROM EmployeeEducations ee
         LEFT JOIN Educations e ON ee.education_id = e.id
         WHERE ee.employee_id = ?`,
        [req.params.id],
        (err, educations) => {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true, data: educations });
        }
    );
});

// Add education to employee
router.post('/employees/:id/educations', (req, res) => {
    const db = req.app.get('db');
    const { education_id, education_name, institute, date_start, date_end } = req.body;
    
    db.run(
        `INSERT INTO EmployeeEducations (employee_id, education_id, education_name, institute, date_start, date_end) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [req.params.id, education_id, education_name, institute, date_start, date_end],
        function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true, data: { id: this.lastID } });
        }
    );
});

// ============= CERTIFICATIONS =============
// Get all certifications
router.get('/certifications', (req, res) => {
    const db = req.app.get('db');
    db.all('SELECT * FROM Certifications ORDER BY name', (err, certifications) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, data: certifications });
    });
});

// Get employee certifications
router.get('/employees/:id/certifications', (req, res) => {
    const db = req.app.get('db');
    db.all(
        `SELECT ec.*, c.name as certification_name 
         FROM EmployeeCertifications ec
         LEFT JOIN Certifications c ON ec.certification_id = c.id
         WHERE ec.employee_id = ?`,
        [req.params.id],
        (err, certifications) => {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true, data: certifications });
        }
    );
});

// Add certification to employee
router.post('/employees/:id/certifications', (req, res) => {
    const db = req.app.get('db');
    const { certification_id, certification_name, institute, date_start, date_end } = req.body;
    
    db.run(
        `INSERT INTO EmployeeCertifications (employee_id, certification_id, certification_name, institute, date_start, date_end) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [req.params.id, certification_id, certification_name, institute, date_start, date_end],
        function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true, data: { id: this.lastID } });
        }
    );
});

// ============= LANGUAGES =============
// Get all languages
router.get('/languages', (req, res) => {
    const db = req.app.get('db');
    db.all('SELECT * FROM Languages ORDER BY name', (err, languages) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, data: languages });
    });
});

// Get employee languages
router.get('/employees/:id/languages', (req, res) => {
    const db = req.app.get('db');
    db.all(
        `SELECT el.*, l.name as language_name 
         FROM EmployeeLanguages el
         LEFT JOIN Languages l ON el.language_id = l.id
         WHERE el.employee_id = ?`,
        [req.params.id],
        (err, languages) => {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true, data: languages });
        }
    );
});

// Add language to employee
router.post('/employees/:id/languages', (req, res) => {
    const db = req.app.get('db');
    const { language_id, language_name, reading, speaking, writing, understanding } = req.body;
    
    db.run(
        `INSERT INTO EmployeeLanguages (employee_id, language_id, language_name, reading, speaking, writing, understanding) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.params.id, language_id, language_name, reading, speaking, writing, understanding],
        function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true, data: { id: this.lastID } });
        }
    );
});

// ============= EMERGENCY CONTACTS =============
// Get employee emergency contacts
router.get('/employees/:id/emergency-contacts', (req, res) => {
    const db = req.app.get('db');
    db.all(
        'SELECT * FROM EmergencyContacts WHERE employee_id = ?',
        [req.params.id],
        (err, contacts) => {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true, data: contacts });
        }
    );
});

// Add emergency contact
router.post('/employees/:id/emergency-contacts', (req, res) => {
    const db = req.app.get('db');
    const { name, relationship, home_phone, work_phone, mobile_phone } = req.body;
    
    db.run(
        `INSERT INTO EmergencyContacts (employee_id, name, relationship, home_phone, work_phone, mobile_phone) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [req.params.id, name, relationship, home_phone, work_phone, mobile_phone],
        function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true, data: { id: this.lastID } });
        }
    );
});

// ============= DEPENDENTS =============
// Get employee dependents
router.get('/employees/:id/dependents', (req, res) => {
    const db = req.app.get('db');
    db.all(
        'SELECT * FROM EmployeeDependents WHERE employee_id = ?',
        [req.params.id],
        (err, dependents) => {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true, data: dependents });
        }
    );
});

// Add dependent
router.post('/employees/:id/dependents', (req, res) => {
    const db = req.app.get('db');
    const { name, relationship, date_of_birth, id_number } = req.body;
    
    db.run(
        `INSERT INTO EmployeeDependents (employee_id, name, relationship, date_of_birth, id_number) 
         VALUES (?, ?, ?, ?, ?)`,
        [req.params.id, name, relationship, date_of_birth, id_number],
        function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true, data: { id: this.lastID } });
        }
    );
});

module.exports = router;
