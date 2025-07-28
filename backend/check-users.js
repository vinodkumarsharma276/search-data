const mongoose = require('mongoose');
const UserModel = require('./models/User');

// Load environment variables
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function checkUsers() {
    try {
        console.log('🔍 Checking existing users...');
        
        // Check if any users exist
        const userCount = await UserModel.countDocuments();
        console.log('📊 Total users in database:', userCount);
        
        if (userCount === 0) {
            console.log('👤 No users found. Creating test admin user...');
            
            // Create test admin user
            const testUser = await UserModel.createUser({
                username: 'admin',
                email: 'admin@example.com',
                password: 'admin123',
                role: 'admin'
            });
            
            console.log('✅ Test admin user created:', testUser.username);
        } else {
            // List existing users
            const users = await UserModel.find({}, 'username email role isActive').limit(5);
            console.log('👥 Existing users:');
            users.forEach(user => {
                console.log(`   - ${user.username} (${user.email}) - ${user.role} - ${user.isActive ? 'Active' : 'Inactive'}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error checking users:', error.message);
    } finally {
        mongoose.connection.close();
        console.log('🔚 Database connection closed.');
    }
}

checkUsers();
