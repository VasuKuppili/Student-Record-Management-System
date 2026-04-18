const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const Section = require('../models/Section');
const Student = require('../models/Student');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

// GET /api/classes - Get all classes
router.get('/', async (req, res) => {
    try {
        const classes = await Class.find().sort({ name: 1 });
        res.json({ success: true, data: classes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/classes - Create class
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Class name is required' });
        }

        const existing = await Class.findOne({ name });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Class already exists' });
        }

        const newClass = new Class({ name, description });
        await newClass.save();

        res.status(201).json({ success: true, message: 'Class created successfully', data: newClass });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// PUT /api/classes/:id - Update class
router.put('/:id', async (req, res) => {
    try {
        const { name, description } = req.body;
        const updated = await Class.findByIdAndUpdate(
            req.params.id,
            { name, description },
            { new: true, runValidators: true }
        );
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Class not found' });
        }
        res.json({ success: true, message: 'Class updated successfully', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// DELETE /api/classes/:id - Delete class
router.delete('/:id', async (req, res) => {
    try {
        // Check if students are assigned to this class
        const studentCount = await Student.countDocuments({ classId: req.params.id });
        if (studentCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete class. ${studentCount} students are assigned to it.`
            });
        }

        // Delete associated sections
        await Section.deleteMany({ classId: req.params.id });

        const deleted = await Class.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Class not found' });
        }

        res.json({ success: true, message: 'Class and its sections deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
