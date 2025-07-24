const mongoose = require('mongoose');
const Distributor = require('../models/Distributor');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vinod-electronics';

// Sample distributor data - 35 realistic distributors
const distributorData = [
    {
        name: "Sharma Electronics Hub",
        companyType: "Sole Proprietorship",
        gstNumber: "07ABCDE1234F1Z5",
        panNumber: "ABCDE1234F",
        primaryPhone: "9876543210",
        secondaryPhone: "8765432109",
        email: "contact@sharmaelectronics.com",
        website: "www.sharmaelectronics.com",
        address: "123 Electronics Market, Sector 15",
        city: "Delhi",
        state: "Delhi",
        pinCode: "110001",
        bankName: "HDFC Bank",
        accountNumber: "50100123456789",
        ifscCode: "HDFC0001234",
        branchName: "Connaught Place Branch",
        notes: "Premium electronics distributor with 15+ years experience"
    },
    {
        name: "Modern Tech Solutions",
        companyType: "Partnership",
        gstNumber: "09FGHIJ5678G2A1",
        panNumber: "FGHIJ5678G",
        primaryPhone: "9765432108",
        secondaryPhone: "8654321098",
        email: "info@moderntechsol.com",
        website: "www.moderntechsolutions.in",
        address: "456 Tech Park, Phase 2",
        city: "Gurgaon",
        state: "Haryana",
        pinCode: "122001",
        bankName: "ICICI Bank",
        accountNumber: "60200234567890",
        ifscCode: "ICIC0002345",
        branchName: "Cyber City Branch",
        notes: "Specializes in mobile accessories and gadgets"
    },
    {
        name: "Digital World Enterprises",
        companyType: "Private Limited",
        gstNumber: "19KLMNO9012H3B2",
        panNumber: "KLMNO9012H",
        primaryPhone: "9654321097",
        secondaryPhone: "8543210987",
        email: "sales@digitalworldent.com",
        website: "www.digitalworld.co.in",
        address: "789 Digital Plaza, IT Corridor",
        city: "Bangalore",
        state: "Karnataka",
        pinCode: "560001",
        bankName: "SBI",
        accountNumber: "70300345678901",
        ifscCode: "SBIN0003456",
        branchName: "MG Road Branch",
        notes: "Leading supplier of computer peripherals"
    },
    {
        name: "Royal Electronics",
        companyType: "Sole Proprietorship",
        gstNumber: "27PQRST3456I4C3",
        panNumber: "PQRST3456I",
        primaryPhone: "9543210986",
        secondaryPhone: "8432109876",
        email: "royal@royalelectronics.in",
        website: "",
        address: "321 Royal Market Street",
        city: "Mumbai",
        state: "Maharashtra",
        pinCode: "400001",
        bankName: "Axis Bank",
        accountNumber: "80400456789012",
        ifscCode: "UTIB0004567",
        branchName: "Fort Branch",
        notes: "Traditional electronics dealer since 1995"
    },
    {
        name: "Future Tech Distributors",
        companyType: "Partnership",
        gstNumber: "33UVWXY7890J5D4",
        panNumber: "UVWXY7890J",
        primaryPhone: "9432109875",
        secondaryPhone: "8321098765",
        email: "contact@futuretechdist.com",
        website: "www.futuretech.net.in",
        address: "654 Future Complex, Tech Zone",
        city: "Hyderabad",
        state: "Telangana",
        pinCode: "500001",
        bankName: "Kotak Mahindra Bank",
        accountNumber: "90500567890123",
        ifscCode: "KKBK0005678",
        branchName: "Banjara Hills Branch",
        notes: "Innovative technology solutions provider"
    },
    {
        name: "Bright Electronics Co.",
        companyType: "Private Limited",
        gstNumber: "06ZABCD1234K6E5",
        panNumber: "ZABCD1234K",
        primaryPhone: "9321098764",
        secondaryPhone: "8210987654",
        email: "info@brightelectronics.com",
        website: "www.brightelectronics.co.in",
        address: "987 Bright Plaza, Electronics Hub",
        city: "Pune",
        state: "Maharashtra",
        pinCode: "411001",
        bankName: "Punjab National Bank",
        accountNumber: "10600678901234",
        ifscCode: "PUNB0006789",
        branchName: "FC Road Branch",
        notes: "Quality electronics with competitive pricing"
    },
    {
        name: "Metro Electronics",
        companyType: "Sole Proprietorship",
        gstNumber: "24EFGHI5678L7F6",
        panNumber: "EFGHI5678L",
        primaryPhone: "9210987653",
        secondaryPhone: "8109876543",
        email: "metro@metroelectronics.in",
        website: "",
        address: "147 Metro Street, Central Market",
        city: "Chennai",
        state: "Tamil Nadu",
        pinCode: "600001",
        bankName: "Indian Bank",
        accountNumber: "11700789012345",
        ifscCode: "IDIB0007890",
        branchName: "T Nagar Branch",
        notes: "Local electronics distributor with fast delivery"
    },
    {
        name: "Prime Tech Solutions",
        companyType: "Partnership",
        gstNumber: "10JKLMN9012M8G7",
        panNumber: "JKLMN9012M",
        primaryPhone: "9109876542",
        secondaryPhone: "8098765432",
        email: "prime@primetechsol.com",
        website: "www.primetech.org.in",
        address: "258 Prime Tower, Business District",
        city: "Ahmedabad",
        state: "Gujarat",
        pinCode: "380001",
        bankName: "Bank of Baroda",
        accountNumber: "12800890123456",
        ifscCode: "BARB0008901",
        branchName: "CG Road Branch",
        notes: "Wholesale electronics distributor"
    },
    {
        name: "Smart Electronics Hub",
        companyType: "Private Limited",
        gstNumber: "23OPQRS3456N9H8",
        panNumber: "OPQRS3456N",
        primaryPhone: "9098765431",
        secondaryPhone: "7987654321",
        email: "smart@smartelectronicshub.com",
        website: "www.smarthub.in",
        address: "369 Smart Complex, Tech City",
        city: "Kolkata",
        state: "West Bengal",
        pinCode: "700001",
        bankName: "Union Bank of India",
        accountNumber: "13900901234567",
        ifscCode: "UBIN0009012",
        branchName: "Park Street Branch",
        notes: "Smart home electronics specialist"
    },
    {
        name: "Global Electronics",
        companyType: "Sole Proprietorship",
        gstNumber: "32TUVWX7890O0I9",
        panNumber: "TUVWX7890O",
        primaryPhone: "8987654320",
        secondaryPhone: "7876543210",
        email: "global@globalelectronics.co.in",
        website: "www.globalelec.net",
        address: "741 Global Plaza, International Market",
        city: "Jaipur",
        state: "Rajasthan",
        pinCode: "302001",
        bankName: "Central Bank of India",
        accountNumber: "14011012345678",
        ifscCode: "CBIN0010123",
        branchName: "MI Road Branch",
        notes: "International brand electronics importer"
    },
    {
        name: "Tech Master Distributors",
        companyType: "Partnership",
        gstNumber: "20YZABC1234P1J0",
        panNumber: "YZABC1234P",
        primaryPhone: "8876543219",
        secondaryPhone: "7765432109",
        email: "techmaster@techmasterdist.com",
        website: "www.techmaster.co.in",
        address: "852 Tech Plaza, Silicon Valley",
        city: "Indore",
        state: "Madhya Pradesh",
        pinCode: "452001",
        bankName: "Indian Overseas Bank",
        accountNumber: "15112123456789",
        ifscCode: "IOBA0011234",
        branchName: "Vijay Nagar Branch",
        notes: "Master distributor for multiple brands"
    },
    {
        name: "Elite Electronics",
        companyType: "Private Limited",
        gstNumber: "35DEFGH5678Q2K1",
        panNumber: "DEFGH5678Q",
        primaryPhone: "8765432108",
        secondaryPhone: "7654321098",
        email: "elite@eliteelectronics.in",
        website: "www.eliteelectronics.com",
        address: "963 Elite Tower, Premium Zone",
        city: "Lucknow",
        state: "Uttar Pradesh",
        pinCode: "226001",
        bankName: "Canara Bank",
        accountNumber: "16213234567890",
        ifscCode: "CNRB0012345",
        branchName: "Hazratganj Branch",
        notes: "Premium electronics for elite customers"
    },
    {
        name: "Power Electronics",
        companyType: "Sole Proprietorship",
        gstNumber: "08IJKLO9012R3L2",
        panNumber: "IJKLO9012R",
        primaryPhone: "8654321097",
        secondaryPhone: "7543210987",
        email: "power@powerelectronics.co.in",
        website: "",
        address: "174 Power Street, Industrial Area",
        city: "Kanpur",
        state: "Uttar Pradesh",
        pinCode: "208001",
        bankName: "Bank of India",
        accountNumber: "17314345678901",
        ifscCode: "BKID0013456",
        branchName: "Civil Lines Branch",
        notes: "Power electronics and electrical appliances"
    },
    {
        name: "Dynamic Tech",
        companyType: "Partnership",
        gstNumber: "16MNPQR3456S4M3",
        panNumber: "MNPQR3456S",
        primaryPhone: "8543210986",
        secondaryPhone: "7432109876",
        email: "dynamic@dynamictech.net.in",
        website: "www.dynamictech.org",
        address: "285 Dynamic Plaza, New Town",
        city: "Bhubaneswar",
        state: "Odisha",
        pinCode: "751001",
        bankName: "UCO Bank",
        accountNumber: "18415456789012",
        ifscCode: "UCBA0014567",
        branchName: "Kharavel Nagar Branch",
        notes: "Dynamic solutions for modern electronics"
    },
    {
        name: "Crystal Electronics",
        companyType: "Private Limited",
        gstNumber: "29STUVY7890T5N4",
        panNumber: "STUVY7890T",
        primaryPhone: "8432109875",
        secondaryPhone: "7321098765",
        email: "crystal@crystalelectronics.com",
        website: "www.crystalelec.in",
        address: "396 Crystal Complex, Tech Park",
        city: "Kochi",
        state: "Kerala",
        pinCode: "682001",
        bankName: "Federal Bank",
        accountNumber: "19516567890123",
        ifscCode: "FDRL0015678",
        branchName: "Marine Drive Branch",
        notes: "Crystal clear electronics solutions"
    },
    {
        name: "Reliable Electronics",
        companyType: "Sole Proprietorship",
        gstNumber: "04WXYZ1234U6O5",
        panNumber: "WXYZ1234U",
        primaryPhone: "8321098764",
        secondaryPhone: "7210987654",
        email: "reliable@reliableelectronics.co.in",
        website: "www.reliableelec.net",
        address: "507 Reliable Plaza, Main Market",
        city: "Chandigarh",
        state: "Chandigarh",
        pinCode: "160001",
        bankName: "Punjab & Sind Bank",
        accountNumber: "20617678901234",
        ifscCode: "PSIB0016789",
        branchName: "Sector 17 Branch",
        notes: "Reliable electronics since 1988"
    },
    {
        name: "Supreme Electronics",
        companyType: "Partnership",
        gstNumber: "22ABCDE5678V7P6",
        panNumber: "ABCDE5678V",
        primaryPhone: "8210987653",
        secondaryPhone: "7109876543",
        email: "supreme@supremeelectronics.in",
        website: "www.supremeelec.co.in",
        address: "618 Supreme Tower, Electronics City",
        city: "Coimbatore",
        state: "Tamil Nadu",
        pinCode: "641001",
        bankName: "Karur Vysya Bank",
        accountNumber: "21718789012345",
        ifscCode: "KVBL0017890",
        branchName: "RS Puram Branch",
        notes: "Supreme quality electronics distributor"
    },
    {
        name: "Innovative Electronics",
        companyType: "Private Limited",
        gstNumber: "36FGHIJ9012W8Q7",
        panNumber: "FGHIJ9012W",
        primaryPhone: "8109876542",
        secondaryPhone: "6998765432",
        email: "innovative@innovativeelec.com",
        website: "www.innovative-electronics.in",
        address: "729 Innovation Hub, IT Park",
        city: "Trivandrum",
        state: "Kerala",
        pinCode: "695001",
        bankName: "South Indian Bank",
        accountNumber: "22819890123456",
        ifscCode: "SIBL0018901",
        branchName: "Statue Branch",
        notes: "Innovative electronics solutions provider"
    },
    {
        name: "Advanced Tech Systems",
        companyType: "LLP",
        gstNumber: "11KLMNO3456X9R8",
        panNumber: "KLMNO3456X",
        primaryPhone: "7998765431",
        secondaryPhone: "6887654321",
        email: "advanced@advancedtechsys.co.in",
        website: "www.advancedtech.net.in",
        address: "840 Advanced Plaza, Cyber Hub",
        city: "Noida",
        state: "Uttar Pradesh",
        pinCode: "201301",
        bankName: "Yes Bank",
        accountNumber: "23920901234567",
        ifscCode: "YESB0019012",
        branchName: "Sector 18 Branch",
        notes: "Advanced technology systems integrator"
    },
    {
        name: "Mega Electronics",
        companyType: "Partnership",
        gstNumber: "17PQRST7890Y0S9",
        panNumber: "PQRST7890Y",
        primaryPhone: "7887654320",
        secondaryPhone: "6776543210",
        email: "mega@megaelectronics.in",
        website: "www.megaelec.org",
        address: "951 Mega Complex, Business Bay",
        city: "Surat",
        state: "Gujarat",
        pinCode: "395001",
        bankName: "IDFC First Bank",
        accountNumber: "24021012345678",
        ifscCode: "IDFB0020123",
        branchName: "Athwa Lines Branch",
        notes: "Mega electronics wholesale distributor"
    },
    {
        name: "Star Electronics",
        companyType: "Private Limited",
        gstNumber: "25UVWXY1234Z1T0",
        panNumber: "UVWXY1234Z",
        primaryPhone: "7776543219",
        secondaryPhone: "6665432109",
        email: "star@starelectronics.co.in",
        website: "www.starelec.in",
        address: "162 Star Plaza, Commercial Street",
        city: "Mysore",
        state: "Karnataka",
        pinCode: "570001",
        bankName: "Vijaya Bank",
        accountNumber: "25122123456789",
        ifscCode: "VIJB0021234",
        branchName: "Sayyaji Rao Road Branch",
        notes: "Star quality electronics at best prices"
    },
    {
        name: "Perfect Electronics",
        companyType: "Sole Proprietorship",
        gstNumber: "31ZABCD5678A2U1",
        panNumber: "ZABCD5678A",
        primaryPhone: "7665432108",
        secondaryPhone: "6554321098",
        email: "perfect@perfectelectronics.net.in",
        website: "",
        address: "273 Perfect Street, Old City",
        city: "Vijayawada",
        state: "Andhra Pradesh",
        pinCode: "520001",
        bankName: "Andhra Bank",
        accountNumber: "26223234567890",
        ifscCode: "ANDB0022345",
        branchName: "Governorpet Branch",
        notes: "Perfect electronics for all needs"
    },
    {
        name: "Ultra Electronics",
        companyType: "Partnership",
        gstNumber: "18EFGHI9012B3V2",
        panNumber: "EFGHI9012B",
        primaryPhone: "7554321097",
        secondaryPhone: "6443210987",
        email: "ultra@ultraelectronics.com",
        website: "www.ultraelec.co.in",
        address: "384 Ultra Tower, Tech Zone",
        city: "Vadodara",
        state: "Gujarat",
        pinCode: "390001",
        bankName: "Bank of Maharashtra",
        accountNumber: "27324345678901",
        ifscCode: "MAHB0023456",
        branchName: "Sayajigunj Branch",
        notes: "Ultra modern electronics solutions"
    },
    {
        name: "Quality Electronics",
        companyType: "Private Limited",
        gstNumber: "26JKLMN3456C4W3",
        panNumber: "JKLMN3456C",
        primaryPhone: "7443210986",
        secondaryPhone: "6332109876",
        email: "quality@qualityelectronics.in",
        website: "www.qualityelec.net",
        address: "495 Quality Plaza, Industrial Estate",
        city: "Nashik",
        state: "Maharashtra",
        pinCode: "422001",
        bankName: "Dena Bank",
        accountNumber: "28425456789012",
        ifscCode: "BKDN0024567",
        branchName: "College Road Branch",
        notes: "Quality assured electronics distributor"
    },
    {
        name: "Express Electronics",
        companyType: "LLP",
        gstNumber: "12OPQRS7890D5X4",
        panNumber: "OPQRS7890D",
        primaryPhone: "7332109875",
        secondaryPhone: "6221098765",
        email: "express@expresselectronics.co.in",
        website: "www.expresselec.org",
        address: "606 Express Plaza, Rapid Transit",
        city: "Ghaziabad",
        state: "Uttar Pradesh",
        pinCode: "201001",
        bankName: "Oriental Bank of Commerce",
        accountNumber: "29526567890123",
        ifscCode: "ORBC0025678",
        branchName: "Raj Nagar Branch",
        notes: "Express delivery electronics supplier"
    },
    {
        name: "Golden Electronics",
        companyType: "Partnership",
        gstNumber: "28TUVWX1234E6Y5",
        panNumber: "TUVWX1234E",
        primaryPhone: "7221098764",
        secondaryPhone: "6110987654",
        email: "golden@goldenelectronics.in",
        website: "www.goldenelec.co.in",
        address: "717 Golden Complex, Gold Market",
        city: "Agra",
        state: "Uttar Pradesh",
        pinCode: "282001",
        bankName: "Allahabad Bank",
        accountNumber: "30627678901234",
        ifscCode: "ALLA0026789",
        branchName: "Sadar Bazaar Branch",
        notes: "Golden standard in electronics"
    },
    {
        name: "Superior Electronics",
        companyType: "Private Limited",
        gstNumber: "34YZABC5678F7Z6",
        panNumber: "YZABC5678F",
        primaryPhone: "7110987653",
        secondaryPhone: "5999876543",
        email: "superior@superiorelectronics.com",
        website: "www.superiorelec.net.in",
        address: "828 Superior Tower, Premium District",
        city: "Faridabad",
        state: "Haryana",
        pinCode: "121001",
        bankName: "Corporation Bank",
        accountNumber: "31728789012345",
        ifscCode: "CORP0027890",
        branchName: "NIT Branch",
        notes: "Superior electronics with superior service"
    },
    {
        name: "Classic Electronics",
        companyType: "Sole Proprietorship",
        gstNumber: "05DEFGH9012G8A7",
        panNumber: "DEFGH9012G",
        primaryPhone: "6998765432",
        secondaryPhone: "5888765432",
        email: "classic@classicelectronics.co.in",
        website: "",
        address: "939 Classic Street, Heritage Market",
        city: "Jodhpur",
        state: "Rajasthan",
        pinCode: "342001",
        bankName: "Syndicate Bank",
        accountNumber: "32829890123456",
        ifscCode: "SYNB0028901",
        branchName: "High Court Road Branch",
        notes: "Classic electronics with modern touch"
    },
    {
        name: "Premier Electronics",
        companyType: "Partnership",
        gstNumber: "21IJKLO3456H9B8",
        panNumber: "IJKLO3456H",
        primaryPhone: "6887654321",
        secondaryPhone: "5777654321",
        email: "premier@premierelectronics.in",
        website: "www.premierelec.org.in",
        address: "150 Premier Plaza, Elite Zone",
        city: "Meerut",
        state: "Uttar Pradesh",
        pinCode: "250001",
        bankName: "Indian Bank",
        accountNumber: "33930901234567",
        ifscCode: "IDIB0029012",
        branchName: "Sadar Branch",
        notes: "Premier electronics distributor since 1992"
    },
    {
        name: "Apex Electronics",
        companyType: "Private Limited",
        gstNumber: "37MNPQR7890I0C9",
        panNumber: "MNPQR7890I",
        primaryPhone: "6776543210",
        secondaryPhone: "5666543210",
        email: "apex@apexelectronics.com",
        website: "www.apexelec.in",
        address: "261 Apex Tower, Summit Plaza",
        city: "Rajkot",
        state: "Gujarat",
        pinCode: "360001",
        bankName: "Bank of Baroda",
        accountNumber: "34031012345678",
        ifscCode: "BARB0030123",
        branchName: "Jawahar Road Branch",
        notes: "Apex quality electronics solutions"
    },
    {
        name: "Trinity Electronics",
        companyType: "LLP",
        gstNumber: "13STUVY1234J1D0",
        panNumber: "STUVY1234J",
        primaryPhone: "6665432109",
        secondaryPhone: "5555432109",
        email: "trinity@trinityelectronics.co.in",
        website: "www.trinityelec.net",
        address: "372 Trinity Complex, Three Rivers",
        city: "Allahabad",
        state: "Uttar Pradesh",
        pinCode: "211001",
        bankName: "United Bank of India",
        accountNumber: "35132123456789",
        ifscCode: "UTBI0031234",
        branchName: "Civil Lines Branch",
        notes: "Trinity of quality, service, and price"
    },
    {
        name: "Platinum Electronics",
        companyType: "Partnership",
        gstNumber: "30WXYZ5678K2E1",
        panNumber: "WXYZ5678K",
        primaryPhone: "6554321098",
        secondaryPhone: "5444321098",
        email: "platinum@platinumelectronics.in",
        website: "www.platinumelec.co.in",
        address: "483 Platinum Plaza, Luxury District",
        city: "Amritsar",
        state: "Punjab",
        pinCode: "143001",
        bankName: "Punjab National Bank",
        accountNumber: "36233234567890",
        ifscCode: "PUNB0032345",
        branchName: "Hall Bazaar Branch",
        notes: "Platinum grade electronics distributor"
    },
    {
        name: "Cosmic Electronics",
        companyType: "Private Limited",
        gstNumber: "14ABCDE9012L3F2",
        panNumber: "ABCDE9012L",
        primaryPhone: "6443210987",
        secondaryPhone: "5333210987",
        email: "cosmic@cosmicelectronics.com",
        website: "www.cosmicelec.org",
        address: "594 Cosmic Center, Space Technology Park",
        city: "Thiruvananthapuram",
        state: "Kerala",
        pinCode: "695014",
        bankName: "Canara Bank",
        accountNumber: "37334345678901",
        ifscCode: "CNRB0033456",
        branchName: "Technopark Branch",
        notes: "Cosmic range of electronics solutions"
    },
    {
        name: "Zenith Electronics",
        companyType: "Sole Proprietorship",
        gstNumber: "02FGHIJ3456M4G3",
        panNumber: "FGHIJ3456M",
        primaryPhone: "6332109876",
        secondaryPhone: "5222109876",
        email: "zenith@zenithelectronics.co.in",
        website: "www.zenithelec.net.in",
        address: "705 Zenith Heights, Peak Plaza",
        city: "Dehradun",
        state: "Uttarakhand",
        pinCode: "248001",
        bankName: "State Bank of India",
        accountNumber: "38435456789012",
        ifscCode: "SBIN0034567",
        branchName: "Paltan Bazaar Branch",
        notes: "Zenith of electronics excellence"
    }
];

async function seedDistributors() {
    try {
        console.log('🏪 ========================================');
        console.log('🏪 SEEDING 35 DUMMY DISTRIBUTORS');
        console.log('🏪 ========================================');
        
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully!');
        
        console.log('🏪 ----------------------------------------');
        console.log('📝 Starting to insert 35 distributors...');
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < distributorData.length; i++) {
            try {
                console.log(`\n📦 Inserting distributor ${i + 1}/35: ${distributorData[i].name}`);
                
                const distributor = new Distributor(distributorData[i]);
                const savedDistributor = await distributor.save();
                
                console.log(`✅ Success! Saved: ${savedDistributor.name} (ID: ${savedDistributor._id})`);
                successCount++;
                
            } catch (error) {
                console.error(`❌ Error saving ${distributorData[i].name}:`, error.message);
                errorCount++;
                
                // If it's a duplicate key error, continue with next
                if (error.code === 11000) {
                    console.log(`⚠️  Duplicate entry for ${distributorData[i].name}, skipping...`);
                }
            }
        }
        
        console.log('\n🏪 ========================================');
        console.log('🏪 SEEDING COMPLETE!');
        console.log('🏪 ========================================');
        console.log(`✅ Successfully inserted: ${successCount} distributors`);
        console.log(`❌ Errors/Duplicates: ${errorCount} distributors`);
        console.log(`📊 Total processed: ${distributorData.length} distributors`);
        console.log('🏪 ========================================');
        
        // Verify the count in database
        const totalCount = await Distributor.countDocuments();
        console.log(`📈 Total distributors in database: ${totalCount}`);
        
        console.log('\n🎉 Database seeding completed successfully!');
        
    } catch (error) {
        console.error('❌ ========================================');
        console.error('❌ ERROR DURING SEEDING!');
        console.error('❌ ========================================');
        console.error('❌ Error details:', error);
        console.error('❌ ========================================');
    } finally {
        // Close database connection
        console.log('\n🔌 Closing database connection...');
        await mongoose.connection.close();
        console.log('✅ Database connection closed.');
        process.exit(0);
    }
}

// Run the seeding function
seedDistributors();
