const express = require('express');
const router = express.Router();
const Section = require('../models/Section');
const Student = require('../models/Student');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

// GET /api/sections - Get all sections (optionally by classId)
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.classId) {
            filter.classId = req.query.classId;
        }
        const sections = await Section.find(filter)
            .populate('classId', 'name')
            .sort({ name: 1 });
        res.json({ success: true, data: sections });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/sections - Create section
router.post('/', async (req, res) => {
    try {
        const { name, classId } = req.body;
        if (!name || !classId) {
            return res.status(400).json({ success: false, message: 'Section name and class are required' });
        }

        const existing = await Section.findOne({ name, classId });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Section already exists in this class' });
        }

        const section = new Section({ name, classId });
        await section.save();

        const populated = await Section.findById(section._id).populate('classId', 'name');
        res.status(201).json({ success: true, message: 'Section created successfully', data: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// PUT /api/sections/:id - Update section
router.put('/:id', async (req, res) => {
    try {
        const { name, classId } = req.body;
        const updated = await Section.findByIdAndUpdate(
            req.params.id,
            { name, classId },
            { new: true, runValidators: true }
        ).populate('classId', 'name');

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }
        res.json({ success: true, message: 'Section updated successfully', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// DELETE /api/sections/:id - Delete section
router.delete('/:id', async (req, res) => {
    try {
        const studentCount = await Student.countDocuments({ sectionId: req.params.id });
        if (studentCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete section. ${studentCount} students are assigned to it.`
            });
        }

        const deleted = await Section.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }
        res.json({ success: true, message: 'Section deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
