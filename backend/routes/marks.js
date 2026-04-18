const express = require('express');
const router = express.Router();
const Mark = require('../models/Mark');
const Student = require('../models/Student');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

// GET /api/marks/:studentId - Get marks for a student
router.get('/:studentId', async (req, res) => {
    try {
        const marks = await Mark.find({ studentId: req.params.studentId })
            .populate('studentId', 'name studentId')
            .sort({ subject: 1 });

        // Calculate total, percentage, and overall grade
        let totalObtained = 0;
        let totalMax = 0;

        marks.forEach(m => {
            totalObtained += m.marksObtained;
            totalMax += m.maxMarks;
        });

        const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) : 0;
        let overallGrade = 'N/A';
        if (totalMax > 0) {
            const pct = parseFloat(percentage);
            if (pct >= 90) overallGrade = 'A+';
            else if (pct >= 80) overallGrade = 'A';
            else if (pct >= 70) overallGrade = 'B+';
            else if (pct >= 60) overallGrade = 'B';
            else if (pct >= 50) overallGrade = 'C';
            else if (pct >= 40) overallGrade = 'D';
            else overallGrade = 'F';
        }

        res.json({
            success: true,
            data: {
                marks,
                summary: {
                    totalObtained,
                    totalMax,
                    percentage: parseFloat(percentage),
                    overallGrade,
                    subjectCount: marks.length
                }
            }
        });
    } catch (error) {
        console.error('Get marks error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/marks - Add or update marks
router.post('/', async (req, res) => {
    try {
        const { studentId, marks } = req.body;

        if (!studentId || !marks || !Array.isArray(marks) || marks.length === 0) {
            return res.status(400).json({ success: false, message: 'Student ID and marks array are required' });
        }

        // Verify student exists
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const results = [];
        for (const m of marks) {
            if (!m.subject || m.marksObtained === undefined) continue;

            const filter = {
                studentId,
                subject: m.subject,
                examType: m.examType || 'Final'
            };

            const update = {
                marksObtained: m.marksObtained,
                maxMarks: m.maxMarks || 100
            };

            const mark = await Mark.findOneAndUpdate(
                filter,
                { ...filter, ...update },
                { upsert: true, new: true, runValidators: true }
            );
            results.push(mark);
        }

        res.json({
            success: true,
            message: 'Marks saved successfully',
            data: results
        });
    } catch (error) {
        console.error('Save marks error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// DELETE /api/marks/:id - Delete a specific mark
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Mark.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Mark not found' });
        }
        res.json({ success: true, message: 'Mark deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
