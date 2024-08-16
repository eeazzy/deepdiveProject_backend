const express = require('express');
const pool = require('./db');  // db.js에서 연결된 pool
const router = express.Router();

// 사용자 정보를 조회하는 엔드포인트
router.get('/user/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (rows.length > 0) {
            res.json({
                success: true,
                user: rows[0],
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
});

module.exports = router;
