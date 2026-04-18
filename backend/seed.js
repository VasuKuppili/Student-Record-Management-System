require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Class = require('./models/Class');
const Section = require('./models/Section');

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Create default admin user
        const existingUser = await User.findOne({ username: 'admin' });
        if (!existingUser) {
            const admin = new User({
                username: 'admin',
                password: 'admin123',
                fullName: 'System Administrator',
                role: 'admin'
            });
            await admin.save();
            console.log('✅ Default admin user created');
            console.log('   Username: admin');
            console.log('   Password: admin123');
        } else {
            console.log('ℹ️  Admin user already exists');
        }

        // Create default classes
        const defaultClasses = [
            { name: 'Class 1', description: 'First Year' },
            { name: 'Class 2', description: 'Second Year' },
            { name: 'Class 3', description: 'Third Year' },
            { name: 'Class 4', description: 'Fourth Year' },
            { name: 'Class 5', description: 'Fifth Year' },
            { name: 'Class 6', description: 'Sixth Year' },
            { name: 'Class 7', description: 'Seventh Year' },
            { name: 'Class 8', description: 'Eighth Year' },
            { name: 'Class 9', description: 'Ninth Year' },
            { name: 'Class 10', description: 'Tenth Year' }
        ];

        for (const cls of defaultClasses) {
            const existing = await Class.findOne({ name: cls.name });
            if (!existing) {
                await Class.create(cls);
            }
        }
        console.log('✅ Default classes created');

        // Create default sections for each class
        const classes = await Class.find();
        const defaultSections = ['A', 'B', 'C'];

        for (const cls of classes) {
            for (const secName of defaultSections) {
                const existing = await Section.findOne({ name: secName, classId: cls._id });
                if (!existing) {
                    await Section.create({ name: secName, classId: cls._id });
                }
            }
        }
        console.log('✅ Default sections created');

        console.log('\n🚀 Seed completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
}

seed();
