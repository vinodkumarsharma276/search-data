# Vinod Electronics - MongoDB Data Model

## Overview
This document outlines the comprehensive data model for Vinod Electronics business management system, designed to handle Sales, Purchases, Inventory, and Ledger functionalities equivalent to Tally.

## Collections Structure

### 1. **Categories Collection**
```javascript
{
  _id: ObjectId,
  name: "Mobile Phones", // Mobile Phones, Washing Machines, Air Conditioners, etc.
  description: "Electronic mobile devices",
  isActive: true,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. **Brands Collection**
```javascript
{
  _id: ObjectId,
  name: "Samsung",
  logo: "url_to_logo",
  categories: [ObjectId], // References to category IDs this brand operates in
  isActive: true,
  createdAt: Date,
  updatedAt: Date
}
```

### 3. **Products Collection** (Master Product Catalog)
```javascript
{
  _id: ObjectId,
  name: "Galaxy S24 Ultra",
  modelNumber: "SM-S928B",
  brandId: ObjectId, // Reference to brands collection
  categoryId: ObjectId, // Reference to categories collection
  specifications: {
    storage: "256GB",
    ram: "12GB",
    color: "Titanium Black",
    warranty: "1 Year",
    // Dynamic specifications based on product type
  },
  basePrice: 120000, // MRP/Base price
  isActive: true,
  createdAt: Date,
  updatedAt: Date
}
```

### 4. **Distributors Collection**
```javascript
{
  _id: ObjectId,
  name: "ABC Electronics Distributors",
  contactPerson: "Rajesh Kumar",
  phone: "9876543210",
  email: "rajesh@abcelectronics.com",
  address: {
    street: "123 Electronics Market",
    city: "Delhi",
    state: "Delhi",
    pincode: "110001",
    country: "India"
  },
  gstNumber: "07AAACH7409R1ZZ",
  panNumber: "AAACH7409R",
  bankDetails: {
    accountNumber: "1234567890",
    ifscCode: "HDFC0001234",
    bankName: "HDFC Bank",
    branch: "Electronics Market"
  },
  totalPurchaseAmount: 0, // Will be calculated from purchases
  totalProductsPurchased: 0, // Will be calculated from purchases
  isActive: true,
  createdAt: Date,
  updatedAt: Date
}
```

### 5. **Inventory Collection** (Individual Product Instances)
```javascript
{
  _id: ObjectId,
  productId: ObjectId, // Reference to products collection
  serialNumber: "SN123456789", // Unique serial number
  imeiNumber: "123456789012345", // For mobile phones
  distributorId: ObjectId, // Reference to distributors collection
  purchaseDetails: {
    purchaseDate: Date,
    purchasePrice: 100000, // Price we bought from distributor
    invoiceNumber: "INV-2024-001",
    gstAmount: 18000,
    totalAmount: 118000
  },
  status: "Available", // Available, Sold, Damaged, Returned
  saleId: ObjectId, // Reference to sales collection (if sold)
  createdAt: Date,
  updatedAt: Date
}
```

### 6. **Customers Collection**
```javascript
{
  _id: ObjectId,
  name: "Amit Sharma",
  phone: "9876543210",
  alternatePhone: "9876543211",
  email: "amit@example.com",
  address: {
    street: "456 Residential Area",
    city: "Delhi",
    state: "Delhi",
    pincode: "110002",
    country: "India"
  },
  aadharNumber: "1234 5678 9012",
  panNumber: "ABCDE1234F",
  dateOfBirth: Date,
  occupation: "Software Engineer",
  monthlyIncome: 75000,
  creditScore: 750, // For installment eligibility
  totalPurchases: 0, // Will be calculated
  totalOutstanding: 0, // Pending installment amount
  isActive: true,
  createdAt: Date,
  updatedAt: Date
}
```

### 7. **Sales Collection**
```javascript
{
  _id: ObjectId,
  saleNumber: "SALE-2024-001", // Auto-generated
  customerId: ObjectId, // Reference to customers collection
  items: [{
    inventoryId: ObjectId, // Reference to inventory collection
    productId: ObjectId, // Reference to products collection
    sellingPrice: 115000,
    discount: 5000,
    finalPrice: 110000,
    gstAmount: 19800,
    totalAmount: 129800
  }],
  subtotal: 110000,
  totalGst: 19800,
  totalAmount: 129800,
  paymentType: "Installment", // Cash, Card, UPI, Installment
  paymentDetails: {
    // For Cash/Card/UPI
    amountPaid: 129800,
    paymentMethod: "UPI",
    transactionId: "TXN123456",
    
    // For Installments
    downPayment: 30000,
    fileCharge: 2000,
    interestRate: 12, // Annual percentage
    installmentMonths: 12,
    monthlyInstallment: 8650,
    totalInstallmentAmount: 103800,
    emiStartDate: Date
  },
  salesPerson: "Vinod Sharma",
  notes: "Customer happy with the product",
  status: "Completed", // Pending, Completed, Cancelled
  createdAt: Date,
  updatedAt: Date
}
```

### 8. **Purchases Collection** (From Distributors)
```javascript
{
  _id: ObjectId,
  purchaseNumber: "PUR-2024-001",
  distributorId: ObjectId, // Reference to distributors collection
  items: [{
    productId: ObjectId, // Reference to products collection
    quantity: 10,
    unitPrice: 100000,
    gstRate: 18,
    gstAmount: 180000,
    totalAmount: 1180000,
    serialNumbers: ["SN123", "SN124", "SN125"] // Will create inventory items
  }],
  subtotal: 1000000,
  totalGst: 180000,
  totalAmount: 1180000,
  invoiceNumber: "DIST-INV-001",
  paymentStatus: "Paid", // Pending, Partial, Paid
  paymentDate: Date,
  notes: "Good quality products",
  createdAt: Date,
  updatedAt: Date
}
```

### 9. **Installments Collection**
```javascript
{
  _id: ObjectId,
  saleId: ObjectId, // Reference to sales collection
  customerId: ObjectId, // Reference to customers collection
  installmentNumber: 1, // 1, 2, 3... up to total months
  dueDate: Date,
  amount: 8650,
  status: "Pending", // Pending, Paid, Overdue
  paidDate: Date,
  paidAmount: 8650,
  paymentMethod: "Cash",
  transactionId: "TXN789",
  lateFee: 0,
  notes: "Paid on time",
  createdAt: Date,
  updatedAt: Date
}
```

### 10. **Ledger Collection** (Financial Transactions)
```javascript
{
  _id: ObjectId,
  transactionType: "Sale", // Sale, Purchase, Expense, Payment
  referenceId: ObjectId, // Reference to sale/purchase/installment
  referenceType: "Sales", // Sales, Purchases, Installments
  accountType: "Revenue", // Revenue, Expense, Asset, Liability
  debitAmount: 129800,
  creditAmount: 0,
  description: "Sale of Samsung Galaxy S24 Ultra to Amit Sharma",
  transactionDate: Date,
  createdAt: Date
}
```

## Sample Data

### Categories
```javascript
[
  { name: "Mobile Phones", description: "Smartphones and feature phones" },
  { name: "Washing Machines", description: "Automatic and semi-automatic washing machines" },
  { name: "Air Conditioners", description: "Split and window AC units" },
  { name: "Refrigerators", description: "Single and double door refrigerators" },
  { name: "Televisions", description: "LED, OLED, and Smart TVs" }
]
```

### Brands
```javascript
[
  { name: "Samsung", categories: ["Mobile Phones", "Washing Machines", "AC", "TV"] },
  { name: "Vivo", categories: ["Mobile Phones"] },
  { name: "Whirlpool", categories: ["Washing Machines", "Refrigerators"] },
  { name: "LG", categories: ["Washing Machines", "AC", "TV", "Refrigerators"] },
  { name: "Sony", categories: ["Mobile Phones", "TV"] }
]
```

## Key Design Decisions

1. **Normalization vs Denormalization**: Used references for related data but included essential fields for quick queries
2. **Inventory Tracking**: Each product instance has its own inventory record with serial numbers
3. **Payment Flexibility**: Single sales record handles both full payment and installments
4. **Audit Trail**: All collections have creation and update timestamps
5. **Financial Tracking**: Separate ledger collection for comprehensive financial reporting
6. **Scalability**: Modular design allows easy addition of new product categories and business features

## Indexes for Performance
```javascript
// Customers
db.customers.createIndex({ phone: 1 })
db.customers.createIndex({ name: "text" })

// Inventory
db.inventory.createIndex({ serialNumber: 1 }, { unique: true })
db.inventory.createIndex({ status: 1 })
db.inventory.createIndex({ productId: 1 })

// Sales
db.sales.createIndex({ customerId: 1 })
db.sales.createIndex({ createdAt: -1 })
db.sales.createIndex({ saleNumber: 1 }, { unique: true })

// Installments
db.installments.createIndex({ saleId: 1 })
db.installments.createIndex({ dueDate: 1 })
db.installments.createIndex({ status: 1 })
```

This data model provides a solid foundation for your Tally-equivalent business management system while maintaining flexibility for future enhancements.
