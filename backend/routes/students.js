const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Mark = require('../models/Mark');
const { isAuthenticated } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(isAuthenticated);

// GET /api/students - Get all students with pagination, search, and filter
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const classId = req.query.classId || '';
        const sectionId = req.query.sectionId || '';

        let filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { studentId: { $regex: search, $options: 'i' } }
            ];
        }

        if (classId) filter.classId = classId;
        if (sectionId) filter.sectionId = sectionId;

        const total = await Student.countDocuments(filter);
        const students = await Student.find(filter)
            .populate('classId', 'name')
            .populate('sectionId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            data: students,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
                limit
            }
        });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/students/all - Get all students without pagination (for export)
router.get('/all', async (req, res) => {
    try {
        const students = await Student.find()
            .populate('classId', 'name')
            .populate('sectionId', 'name')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: students });
    } catch (error) {
        console.error('Get all students error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/students/stats - Get dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();
        const maleStudents = await Student.countDocuments({ gender: 'Male' });
        const femaleStudents = await Student.countDocuments({ gender: 'Female' });

        // Class-wise distribution
        const classDistribution = await Student.aggregate([
            {
                $lookup: {
                    from: 'classes',
                    localField: 'classId',
                    foreignField: '_id',
                    as: 'class'
                }
            },
            { $unwind: '$class' },
            {
                $group: {
                    _id: '$class.name',
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            data: {
                totalStudents,
                maleStudents,
                femaleStudents,
                classDistribution
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/students/:id - Get single student
router.get('/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
            .populate('classId', 'name')
            .populate('sectionId', 'name');

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Get marks for this student
        const marks = await Mark.find({ studentId: student._id });

        res.json({ success: true, data: { student, marks } });
    } catch (error) {
        console.error('Get student error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/students - Create new student
router.post('/', async (req, res) => {
    try {
        const {
            studentId, name, classId, sectionId, gender,
            dateOfBirth, parentName, contactNumber, address,
            email, subjects, marks
        } = req.body;

        // Validation
        if (!studentId || !name || !classId || !sectionId || !gender || !dateOfBirth || !parentName || !contactNumber || !address) {
            return res.status(400).json({ success: false, message: 'All required fields must be filled' });
        }

        // Check if studentId already exists
        const existingStudent = await Student.findOne({ studentId });
        if (existingStudent) {
            return res.status(400).json({ success: false, message: 'Student ID already exists' });
        }

        const student = new Student({
            studentId, name, classId, sectionId, gender,
            dateOfBirth, parentName, contactNumber, address,
            email, subjects: subjects || []
        });

        await student.save();

        // Save marks if provided
        if (marks && marks.length > 0) {
            const markDocs = marks.map(m => ({
                studentId: student._id,
                subject: m.subject,
                marksObtained: m.marksObtained,
                maxMarks: m.maxMarks || 100,
                examType: m.examType || 'Final'
            }));
            await Mark.insertMany(markDocs);
        }

        const populatedStudent = await Student.findById(student._id)
            .populate('classId', 'name')
            .populate('sectionId', 'name');

        res.status(201).json({
            success: true,
            message: 'Student added successfully',
            data: populatedStudent
        });
    } catch (error) {
        console.error('Create student error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Student ID already exists' });
        }
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// PUT /api/students/:id - Update student
router.put('/:id', async (req, res) => {
    try {
        const {
            studentId, name, classId, sectionId, gender,
            dateOfBirth, parentName, contactNumber, address,
            email, subjects
        } = req.body;

        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Check if new studentId conflicts with another student
        if (studentId && studentId !== student.studentId) {
            const existing = await Student.findOne({ studentId });
            if (existing) {
                return res.status(400).json({ success: false, message: 'Student ID already in use' });
            }
        }

        const updated = await Student.findByIdAndUpdate(
            req.params.id,
            {
                studentId, name, classId, sectionId, gender,
                dateOfBirth, parentName, contactNumber, address,
                email, subjects: subjects || []
            },
            { new: true, runValidators: true }
        ).populate('classId', 'name').populate('sectionId', 'name');

        res.json({
            success: true,
            message: 'Student updated successfully',
            data: updated
        });
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// DELETE /api/students/:id - Delete student
router.delete('/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Delete associated marks
        await Mark.deleteMany({ studentId: student._id });
        await Student.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
