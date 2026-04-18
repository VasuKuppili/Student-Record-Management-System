const mongoose = require('mongoose');

const markSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, 'Student is required']
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true
    },
    marksObtained: {
        type: Number,
        required: [true, 'Marks obtained is required'],
        min: [0, 'Marks cannot be negative'],
        max: [100, 'Marks cannot exceed 100']
    },
    maxMarks: {
        type: Number,
        default: 100,
        min: [1, 'Max marks must be at least 1']
    },
    examType: {
        type: String,
        enum: ['Midterm', 'Final', 'Quiz', 'Assignment', 'Practical'],
        default: 'Final'
    }
}, {
    timestamps: true
});

// Compound index: one mark per student per subject per exam type
markSchema.index({ studentId: 1, subject: 1, examType: 1 }, { unique: true });

// Virtual for grade calculation
markSchema.virtual('grade').get(function () {
    const percentage = (this.marksObtained / this.maxMarks) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
});

markSchema.set('toJSON', { virtuals: true });
markSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Mark', markSchema);
