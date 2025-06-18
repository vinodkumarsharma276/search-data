import bcrypt from 'bcryptjs';

// In a real application, this would be stored in a database
const users = [
    {
        id: 1,
        username: 'jagdishsharma',
        password: '$2a$10$gkfJ80O869WVos7hYbkGA.VfXOIIVTEQCcXFXfJupFUXn6BmitSCq', // jagdish123
        role: 'admin',
        permissions: ['read', 'write', 'delete'],
        isActive: true
    },
    {
        id: 2,
        username: 'vinodsharma',
        password: '$2a$10$mD9s43jF5RxdfiqiT6xiCOa0jtnedO/zxRyqNKEjuFiTX2p3e0cWi', // vinod123
        role: 'manager',
        permissions: ['read', 'write'],
        isActive: true
    },    {
        id: 3,
        username: 'emp',
        password: '$2a$10$apud1FwbIe59P.lloycNSurKR70EgIZwEJ2Oqk7Oilq3cWUZW5xFi', // emp123
        role: 'employee',
        permissions: ['read', 'write'],
        isActive: true
    }
];

class UserModel {
    static async findByUsername(username) {
        return users.find(user => user.username === username);
    }

    static async findById(id) {
        return users.find(user => user.id === id);
    }

    static async validatePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    static async hashPassword(password) {
        return await bcrypt.hash(password, 10);
    }    static async createUser(userData) {
        // Set permissions based on role
        let permissions = ['read']; // Default employee permissions (read only)
        if (userData.role === 'admin') {
            permissions = ['read', 'write', 'delete'];
        } else if (userData.role === 'manager') {
            permissions = ['read', 'write'];
        }

        const newUser = {
            id: users.length + 1,
            ...userData,
            password: await this.hashPassword(userData.password),
            permissions,
            isActive: true
        };
        users.push(newUser);
        return newUser;
    }

    static async updateUser(id, updates) {
        const userIndex = users.findIndex(user => user.id === id);
        if (userIndex === -1) return null;
        
        if (updates.password) {
            updates.password = await this.hashPassword(updates.password);
        }
        
        users[userIndex] = { ...users[userIndex], ...updates };
        return users[userIndex];
    }

    static async deleteUser(id) {
        const userIndex = users.findIndex(user => user.id === id);
        if (userIndex === -1) return false;
        
        users.splice(userIndex, 1);
        return true;
    }

    static getAllUsers() {
        return users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
    }
}

export default UserModel;
