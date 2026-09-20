const express = require('express');
const router = express.Router();

// ============= VENDORS =============
// Get all vendors
router.get('/vendors', (req, res) => {
    const db = req.app.get('db');
    const { status } = req.query;
    let query = 'SELECT * FROM Vendors WHERE 1=1';
    const params = [];
    
    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }
    
    query += ' ORDER BY name';
    
    db.all(query, params, (err, vendors) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: vendors });
    });
});

// Create vendor
router.post('/vendors', (req, res) => {
    const db = req.app.get('db');
    const { vendor_code, name, contact_person, email, phone, address, city, country, tax_id, payment_terms } = req.body;
    db.run(
        `INSERT INTO Vendors (vendor_code, name, contact_person, email, phone, address, city, country, tax_id, payment_terms)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [vendor_code, name, contact_person, email, phone, address, city, country, tax_id, payment_terms],
        function(err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, data: { id: this.lastID } });
        }
    );
});

// ============= ITEMS =============
// Get all items
router.get('/items', (req, res) => {
    const db = req.app.get('db');
    db.all(
        `SELECT i.*, ic.name as category_name
         FROM Items i
         LEFT JOIN ItemCategories ic ON i.category_id = ic.id
         ORDER BY i.name`,
        (err, items) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, data: items });
        }
    );
});

// ============= PURCHASE REQUESTS =============
// Get all purchase requests
router.get('/requests', (req, res) => {
    const db = req.app.get('db');
    const { status, requested_by } = req.query;
    let query = `
        SELECT pr.*, 
               e.first_name || ' ' || e.last_name as requester_name,
               d.name as department_name
        FROM PurchaseRequests pr
        LEFT JOIN Employees e ON pr.requested_by = e.id
        LEFT JOIN Departments d ON pr.department_id = d.id
        WHERE 1=1
    `;
    const params = [];
    
    if (status) {
        query += ' AND pr.status = ?';
        params.push(status);
    }
    if (requested_by) {
        query += ' AND pr.requested_by = ?';
        params.push(requested_by);
    }
    
    query += ' ORDER BY pr.created_at DESC';
    
    db.all(query, params, (err, requests) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: requests });
    });
});

// Create purchase request
router.post('/requests', (req, res) => {
    const db = req.app.get('db');
    const { requested_by, department_id, request_date, required_date, priority, purpose, items } = req.body;
    
    const request_number = `PR-${Date.now()}`;
    const total_estimated_cost = items.reduce((sum, item) => sum + (item.estimated_total || 0), 0);
    
    db.run(
        `INSERT INTO PurchaseRequests (request_number, requested_by, department_id, request_date, required_date, priority, purpose, total_estimated_cost)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [request_number, requested_by, department_id, request_date, required_date, priority || 'Medium', purpose, total_estimated_cost],
        function(err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            const requestId = this.lastID;
            
            // Insert items
            let completed = 0;
            items.forEach(item => {
                db.run(
                    `INSERT INTO PurchaseRequestItems (purchase_request_id, item_id, item_name, description, quantity, unit, estimated_unit_price, estimated_total, notes)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [requestId, item.item_id, item.item_name, item.description, item.quantity, item.unit, item.estimated_unit_price, item.estimated_total, item.notes],
                    () => {
                        completed++;
                        if (completed === items.length) {
                            res.json({ success: true, data: { id: requestId, request_number } });
                        }
                    }
                );
            });
            
            if (items.length === 0) {
                res.json({ success: true, data: { id: requestId, request_number } });
            }
        }
    );
});

// ============= BID OPPORTUNITIES =============
// Get all bid opportunities
router.get('/bids/opportunities', (req, res) => {
    const db = req.app.get('db');
    const { status } = req.query;
    let query = `
        SELECT bo.*, pr.request_number
        FROM BidOpportunities bo
        LEFT JOIN PurchaseRequests pr ON bo.purchase_request_id = pr.id
        WHERE 1=1
    `;
    const params = [];
    
    if (status) {
        query += ' AND bo.status = ?';
        params.push(status);
    }
    
    query += ' ORDER BY bo.bid_closing_date DESC';
    
    db.all(query, params, (err, opportunities) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: opportunities });
    });
});

// Create bid opportunity
router.post('/bids/opportunities', (req, res) => {
    const db = req.app.get('db');
    const { purchase_request_id, title, description, bid_opening_date, bid_closing_date, estimated_value } = req.body;
    
    const opportunity_number = `BO-${Date.now()}`;
    
    db.run(
        `INSERT INTO BidOpportunities (opportunity_number, purchase_request_id, title, description, bid_opening_date, bid_closing_date, estimated_value)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [opportunity_number, purchase_request_id, title, description, bid_opening_date, bid_closing_date, estimated_value],
        function(err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, data: { id: this.lastID, opportunity_number } });
        }
    );
});

// Get bids for opportunity
router.get('/bids/opportunities/:id/bids', (req, res) => {
    const db = req.app.get('db');
    db.all(
        `SELECT b.*, v.name as vendor_name
         FROM Bids b
         LEFT JOIN Vendors v ON b.vendor_id = v.id
         WHERE b.bid_opportunity_id = ?
         ORDER BY b.total_amount ASC`,
        [req.params.id],
        (err, bids) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, data: bids });
        }
    );
});

// Submit bid
router.post('/bids', (req, res) => {
    const db = req.app.get('db');
    const { bid_opportunity_id, vendor_id, total_amount, validity_period, delivery_time, terms, items } = req.body;
    
    const bid_number = `BID-${Date.now()}`;
    
    db.run(
        `INSERT INTO Bids (bid_opportunity_id, vendor_id, bid_number, total_amount, validity_period, delivery_time, terms)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [bid_opportunity_id, vendor_id, bid_number, total_amount, validity_period, delivery_time, terms],
        function(err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            const bidId = this.lastID;
            
            // Insert bid items
            let completed = 0;
            items.forEach(item => {
                const totalPrice = item.quantity * item.unit_price;
                db.run(
                    `INSERT INTO BidItems (bid_id, item_id, item_name, description, quantity, unit, unit_price, total_price)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [bidId, item.item_id, item.item_name, item.description, item.quantity, item.unit, item.unit_price, totalPrice],
                    () => {
                        completed++;
                        if (completed === items.length) {
                            res.json({ success: true, data: { id: bidId, bid_number } });
                        }
                    }
                );
            });
            
            if (items.length === 0) {
                res.json({ success: true, data: { id: bidId, bid_number } });
            }
        }
    );
});

// ============= PURCHASE ORDERS =============
// Get all purchase orders
router.get('/orders', (req, res) => {
    const db = req.app.get('db');
    const { status } = req.query;
    let query = `
        SELECT po.*, v.name as vendor_name, pr.request_number
        FROM PurchaseOrders po
        LEFT JOIN Vendors v ON po.vendor_id = v.id
        LEFT JOIN PurchaseRequests pr ON po.purchase_request_id = pr.id
        WHERE 1=1
    `;
    const params = [];
    
    if (status) {
        query += ' AND po.status = ?';
        params.push(status);
    }
    
    query += ' ORDER BY po.created_at DESC';
    
    db.all(query, params, (err, orders) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: orders });
    });
});

// Create purchase order
router.post('/orders', (req, res) => {
    const db = req.app.get('db');
    const { bid_id, purchase_request_id, vendor_id, po_date, expected_delivery_date, payment_terms, shipping_address, items, created_by } = req.body;
    
    const po_number = `PO-${Date.now()}`;
    const total_amount = items.reduce((sum, item) => sum + (item.total_price || 0), 0);
    
    db.run(
        `INSERT INTO PurchaseOrders (po_number, bid_id, purchase_request_id, vendor_id, po_date, expected_delivery_date, total_amount, payment_terms, shipping_address, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [po_number, bid_id, purchase_request_id, vendor_id, po_date, expected_delivery_date, total_amount, payment_terms, shipping_address, created_by],
        function(err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            const orderId = this.lastID;
            
            // Insert items
            let completed = 0;
            items.forEach(item => {
                db.run(
                    `INSERT INTO PurchaseOrderItems (purchase_order_id, item_id, item_name, description, quantity, unit, unit_price, total_price)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [orderId, item.item_id, item.item_name, item.description, item.quantity, item.unit, item.unit_price, item.total_price],
                    () => {
                        completed++;
                        if (completed === items.length) {
                            res.json({ success: true, data: { id: orderId, po_number } });
                        }
                    }
                );
            });
            
            if (items.length === 0) {
                res.json({ success: true, data: { id: orderId, po_number } });
            }
        }
    );
});

module.exports = router;
