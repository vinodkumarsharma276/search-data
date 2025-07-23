const mongoose = require('mongoose');
const Customer = require('../models/Customer');
require('dotenv').config();

// Sample customer data
const customers = [
    {
        name: "Rajesh Kumar",
        address: "123 MG Road, Sector 15, Delhi",
        zone: "North",
        mobile: ["9876543210", "9876543211"],
        aadharNumber: "123456789012",
        panNumber: "ABCDE1234F",
        email: "rajesh.kumar@email.com",
        phone: "011-12345678"
    },
    {
        name: "Priya Sharma",
        address: "456 Park Street, Bandra West, Mumbai",
        zone: "West",
        mobile: ["9876543212"],
        aadharNumber: "234567890123",
        panNumber: "BCDEF2345G",
        email: "priya.sharma@email.com"
    },
    {
        name: "Amit Singh",
        address: "789 Brigade Road, Bangalore",
        zone: "South",
        mobile: ["9876543213", "9876543214"],
        aadharNumber: "345678901234",
        panNumber: "CDEFG3456H",
        email: "amit.singh@email.com",
        phone: "080-87654321"
    },
    {
        name: "Sunita Patel",
        address: "321 SG Highway, Ahmedabad",
        zone: "West",
        mobile: ["9876543215"],
        aadharNumber: "456789012345",
        panNumber: "DEFGH4567I",
        email: "sunita.patel@email.com"
    },
    {
        name: "Vikram Joshi",
        address: "654 Civil Lines, Pune",
        zone: "West",
        mobile: ["9876543216", "9876543217"],
        aadharNumber: "567890123456",
        panNumber: "EFGHI5678J",
        email: "vikram.joshi@email.com",
        phone: "020-65432109"
    },
    {
        name: "Kavita Reddy",
        address: "987 Jubilee Hills, Hyderabad",
        zone: "South",
        mobile: ["9876543218"],
        aadharNumber: "678901234567",
        panNumber: "FGHIJ6789K",
        email: "kavita.reddy@email.com"
    },
    {
        name: "Deepak Gupta",
        address: "147 Connaught Place, New Delhi",
        zone: "North",
        mobile: ["9876543219", "9876543220"],
        aadharNumber: "789012345678",
        panNumber: "GHIJK7890L",
        email: "deepak.gupta@email.com",
        phone: "011-98765432"
    },
    {
        name: "Meera Nair",
        address: "258 Marine Drive, Kochi",
        zone: "South",
        mobile: ["9876543221"],
        aadharNumber: "890123456789",
        panNumber: "HIJKL8901M",
        email: "meera.nair@email.com"
    },
    {
        name: "Ravi Agarwal",
        address: "369 Park Town, Chennai",
        zone: "South",
        mobile: ["9876543222", "9876543223"],
        aadharNumber: "901234567890",
        panNumber: "IJKLM9012N",
        email: "ravi.agarwal@email.com",
        phone: "044-56789012"
    },
    {
        name: "Anjali Mishra",
        address: "741 Hazratganj, Lucknow",
        zone: "North",
        mobile: ["9876543224"],
        aadharNumber: "012345678901",
        panNumber: "JKLMN0123O",
        email: "anjali.mishra@email.com"
    },
    {
        name: "Sanjay Yadav",
        address: "852 Sadar Bazaar, Jaipur",
        zone: "North",
        mobile: ["9876543225", "9876543226"],
        aadharNumber: "123456789013",
        panNumber: "KLMNO1234P",
        email: "sanjay.yadav@email.com",
        phone: "0141-23456789"
    },
    {
        name: "Pooja Malhotra",
        address: "963 Sector 17, Chandigarh",
        zone: "North",
        mobile: ["9876543227"],
        aadharNumber: "234567890124",
        panNumber: "LMNOP2345Q",
        email: "pooja.malhotra@email.com"
    },
    {
        name: "Arjun Kapoor",
        address: "159 Linking Road, Mumbai",
        zone: "West",
        mobile: ["9876543228", "9876543229"],
        aadharNumber: "345678901235",
        panNumber: "MNOPQ3456R",
        email: "arjun.kapoor@email.com",
        phone: "022-87654321"
    },
    {
        name: "Neha Bansal",
        address: "357 Model Town, Delhi",
        zone: "North",
        mobile: ["9876543230"],
        aadharNumber: "456789012346",
        panNumber: "NOPQR4567S",
        email: "neha.bansal@email.com"
    },
    {
        name: "Rohit Thakur",
        address: "468 Koramangala, Bangalore",
        zone: "South",
        mobile: ["9876543231", "9876543232"],
        aadharNumber: "567890123457",
        panNumber: "OPQRS5678T",
        email: "rohit.thakur@email.com",
        phone: "080-12345678"
    }
];

async function seedCustomers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing customers (optional - comment out if you want to keep existing data)
        // await Customer.deleteMany({});
        // console.log('🗑️ Cleared existing customers');

        // Check if customers already exist
        const existingCustomers = await Customer.countDocuments();
        console.log(`📊 Found ${existingCustomers} existing customers`);

        // Insert dummy customers
        const createdCustomers = await Customer.insertMany(customers);
        console.log(`✅ Successfully created ${createdCustomers.length} dummy customers`);

        // Display created customers
        console.log('\n📋 Created Customers:');
        createdCustomers.forEach((customer, index) => {
            console.log(`${index + 1}. ${customer.name} - ${customer.mobile[0]} (${customer.zone})`);
        });

        console.log('\n🎉 Seed data created successfully!');
        
    } catch (error) {
        console.error('❌ Error seeding customers:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔐 Database connection closed');
        process.exit(0);
    }
}

// Run the seed function
seedCustomers();
