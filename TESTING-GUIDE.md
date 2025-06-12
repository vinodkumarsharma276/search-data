# User Testing Guide - Full-Stack PWA Application

## 🚀 How to Test Your Application

### Access the Application
- **Frontend URL**: http://localhost:5173
- **Backend API**: http://localhost:5000

### Test User Accounts

#### 1. Admin User (Full Access)
- **Username**: `jagdishsharma`
- **Password**: `jagdish123`
- **Permissions**: Read, Write, Delete
- **Can Access**: All features including cache management

#### 2. Manager User (Read/Write)
- **Username**: `vinodsharma`
- **Password**: `vinod123`
- **Permissions**: Read, Write
- **Can Access**: Search, data refresh (no cache delete)

#### 3. Employee User (Read-Only)
- **Username**: `emp`
- **Password**: `emp123`
- **Permissions**: Read only
- **Can Access**: Search only (no data management)

### 🧪 Testing Checklist

#### Authentication Testing
- [ ] **Login**: Try logging in with each user account
- [ ] **Role Display**: Check that user role is displayed after login
- [ ] **Logout**: Test logout functionality
- [ ] **Invalid Login**: Try wrong password (should show error)
- [ ] **Session Management**: Refresh page (should stay logged in)

#### Search Functionality Testing
- [ ] **Basic Search**: Search for "mobile" or "noida"
- [ ] **Field-Specific Search**: Try searching in specific fields
- [ ] **Empty Search**: Try searching with no query
- [ ] **Pagination**: Navigate through search results
- [ ] **Results Display**: Verify customer data is shown correctly

#### Role-Based Access Testing
- [ ] **Employee Login**: Should only see search interface
- [ ] **Manager Login**: Should see search + refresh button
- [ ] **Admin Login**: Should see all features including cache management
- [ ] **Permission Errors**: Lower roles trying admin features should fail

#### Data Management Testing (Admin/Manager Only)
- [ ] **Data Refresh**: Click refresh to reload from Google Sheets
- [ ] **Cache Info**: View cache statistics and last update time
- [ ] **Cache Clear**: (Admin only) Clear data cache
- [ ] **Success Messages**: Verify operations show success/error messages

#### Error Handling Testing
- [ ] **Network Issues**: Disconnect internet and test error handling
- [ ] **Invalid Tokens**: Clear localStorage and verify redirect to login
- [ ] **Permission Denied**: Try admin features with employee account
- [ ] **Search Errors**: Test with very long search queries

### 📊 Expected Data
- **Total Records**: 9,846 customer records
- **Data Fields**: ID, Account, Customer Name, Address, Mobile, Area, etc.
- **Sample Searches**: 
  - "mobile" → Should find mobile-related entries
  - "noida" → Should find Noida area customers
  - "colony" → Should find colony area customers

### 🔍 What to Look For

#### Performance
- **Fast Loading**: Pages should load quickly
- **Responsive Search**: Search results should appear quickly
- **Cache Usage**: Second searches should be faster (cached data)

#### Security
- **Authentication Required**: Cannot access data without login
- **Role Restrictions**: Each role sees appropriate features only
- **Secure Logout**: All data cleared on logout

#### User Experience
- **Clear Navigation**: Easy to understand interface
- **Error Messages**: Helpful error messages when things go wrong
- **Data Display**: Clean, readable customer data presentation

### 🐛 Common Issues & Solutions

#### "Failed to load data"
- Check if backend server is running (port 5000)
- Verify login credentials are correct
- Check browser console for error messages

#### "Access Denied" Errors
- Verify you're logged in with the correct user role
- Check if token has expired (re-login)

#### Search Not Working
- Ensure you're logged in
- Try different search terms
- Check pagination (results might be on other pages)

### 🎯 Success Criteria
✅ **Authentication**: All three user roles can login successfully
✅ **Search**: Can search and browse 9,846 customer records  
✅ **Permissions**: Each role has appropriate access levels
✅ **Data Management**: Admin/Manager can refresh data
✅ **Security**: Unauthorized access is properly blocked
✅ **Performance**: Fast loading and responsive interface

---

**Happy Testing! 🎉**

*The application demonstrates a complete transformation from frontend-only to secure full-stack architecture.*
