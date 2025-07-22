const express = require('express');
const Employee = require('../models/Employee');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all employees
// @route   GET /api/employees
// @access  Protected
router.get('/', protect, async (req, res) => {
    try {
        const { page = 1, limit = 20, search, department, isActive } = req.query;
        
        let query = {};
        
        if (search) {
            query = {
                $or: [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { employeeId: { $regex: search, $options: 'i' } },
                    { designation: { $regex: search, $options: 'i' } }
                ]
            };
        }
        
        if (department) query.department = department;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const employees = await Employee.find(query)
            .populate('reportingManager', 'firstName lastName employeeId')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Employee.countDocuments(query);

        res.json({
            success: true,
            data: employees,
            pagination: {
                current: parseInt(page),
                pageSize: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get employees error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while fetching employees'
        });
    }
});

// @desc    Get employee by ID
// @route   GET /api/employees/:id
// @access  Protected
router.get('/:id', protect, async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id)
            .populate('reportingManager', 'firstName lastName employeeId designation');

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        res.json({
            success: true,
            data: employee
        });
    } catch (error) {
        console.error('Get employee error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while fetching employee'
        });
    }
});

// @desc    Create employee
// @route   POST /api/employees
// @access  Protected (Admin/HR only)
router.post('/', protect, checkPermission(['create']), async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            dateOfBirth,
            gender,
            maritalStatus,
            bloodGroup,
            address,
            emergencyContact,
            employeeId,
            department,
            designation,
            dateOfJoining,
            employmentType,
            workLocation,
            reportingManager,
            basicSalary,
            allowances,
            bankDetails,
            panNumber,
            aadhaarNumber,
            qualifications,
            experience,
            skills,
            workShift,
            weekOffDays,
            profilePhoto,
            documents,
            leaveBalance
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !phone || !dateOfBirth || !gender || !employeeId || !department || !designation || !basicSalary) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: firstName, lastName, email, phone, dateOfBirth, gender, employeeId, department, designation, basicSalary'
            });
        }

        // Validate reporting manager if provided
        if (reportingManager) {
            const manager = await Employee.findById(reportingManager);
            if (!manager) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid reporting manager ID'
                });
            }
        }

        // Check if employee ID or email already exists
        const existingEmployee = await Employee.findOne({
            $or: [
                { employeeId: employeeId },
                { email: email.toLowerCase() }
            ]
        });

        if (existingEmployee) {
            return res.status(400).json({
                success: false,
                message: existingEmployee.employeeId === employeeId 
                    ? 'Employee ID already exists' 
                    : 'Email already registered'
            });
        }

        const employee = new Employee({
            firstName,
            lastName,
            email: email.toLowerCase(),
            phone,
            dateOfBirth,
            gender,
            maritalStatus,
            bloodGroup,
            address,
            emergencyContact,
            employeeId,
            department,
            designation,
            dateOfJoining: dateOfJoining || new Date(),
            employmentType: employmentType || 'full-time',
            workLocation: workLocation || 'Head Office',
            reportingManager,
            basicSalary,
            allowances: allowances || {},
            bankDetails,
            panNumber,
            aadhaarNumber,
            qualifications: qualifications || [],
            experience: experience || { totalYears: 0, previousCompanies: [] },
            skills: skills || [],
            workShift: workShift || 'morning',
            weekOffDays: weekOffDays || ['Sunday'],
            profilePhoto,
            documents: documents || {},
            leaveBalance: leaveBalance || {
                earned: 21,
                casual: 12,
                sick: 12,
                maternity: 0,
                paternity: 0
            }
        });

        await employee.save();
        
        // Populate the response
        await employee.populate('reportingManager', 'firstName lastName employeeId');

        res.status(201).json({
            success: true,
            message: 'Employee created successfully',
            data: employee
        });
    } catch (error) {
        console.error('Create employee error:', error);
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field === 'email' ? 'Email' : 'Employee ID'} already exists`
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while creating employee'
        });
    }
});

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Protected (Admin/HR only)
router.put('/:id', protect, checkPermission(['update']), async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        const updateData = { ...req.body };

        // Validate reporting manager if provided
        if (updateData.reportingManager && updateData.reportingManager !== employee.reportingManager?.toString()) {
            const manager = await Employee.findById(updateData.reportingManager);
            if (!manager) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid reporting manager ID'
                });
            }
        }

        // Convert email to lowercase if provided
        if (updateData.email) {
            updateData.email = updateData.email.toLowerCase();
        }

        // Remove undefined fields
        Object.keys(updateData).forEach(key => 
            updateData[key] === undefined && delete updateData[key]
        );

        const updatedEmployee = await Employee.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('reportingManager', 'firstName lastName employeeId');

        res.json({
            success: true,
            message: 'Employee updated successfully',
            data: updatedEmployee
        });
    } catch (error) {
        console.error('Update employee error:', error);
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field === 'email' ? 'Email' : 'Employee ID'} already exists`
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while updating employee'
        });
    }
});

// @desc    Delete employee (soft delete)
// @route   DELETE /api/employees/:id
// @access  Protected (Admin only)
router.delete('/:id', protect, checkPermission(['delete']), async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Soft delete - mark as inactive
        employee.isActive = false;
        employee.terminationDate = new Date();
        employee.terminationReason = req.body.reason || 'Administrative action';
        await employee.save();

        res.json({
            success: true,
            message: 'Employee deleted successfully'
        });
    } catch (error) {
        console.error('Delete employee error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while deleting employee'
        });
    }
});

// @desc    Get employees by department
// @route   GET /api/employees/department/:department
// @access  Protected
router.get('/department/:department', protect, async (req, res) => {
    try {
        const employees = await Employee.find({
            department: req.params.department,
            isActive: true
        })
        .select('firstName lastName employeeId designation email phone')
        .sort({ firstName: 1 });

        res.json({
            success: true,
            data: employees,
            count: employees.length
        });
    } catch (error) {
        console.error('Get employees by department error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while fetching employees'
        });
    }
});

// @desc    Get employee hierarchy
// @route   GET /api/employees/:id/hierarchy
// @access  Protected
router.get('/:id/hierarchy', protect, async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id)
            .populate('reportingManager', 'firstName lastName employeeId designation');

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Get subordinates
        const subordinates = await Employee.find({
            reportingManager: req.params.id,
            isActive: true
        })
        .select('firstName lastName employeeId designation department')
        .sort({ firstName: 1 });

        res.json({
            success: true,
            data: {
                employee,
                manager: employee.reportingManager,
                subordinates,
                subordinateCount: subordinates.length
            }
        });
    } catch (error) {
        console.error('Get employee hierarchy error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while fetching hierarchy'
        });
    }
});

// @desc    Update employee performance rating
// @route   POST /api/employees/:id/performance
// @access  Protected (Admin/HR only)
router.post('/:id/performance', protect, checkPermission(['update']), async (req, res) => {
    try {
        const { period, rating, comments } = req.body;

        if (!period || !rating) {
            return res.status(400).json({
                success: false,
                message: 'Period and rating are required'
            });
        }

        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        employee.performanceRatings.push({
            period,
            rating,
            comments,
            reviewDate: new Date()
        });

        await employee.save();

        res.json({
            success: true,
            message: 'Performance rating added successfully',
            data: employee.performanceRatings[employee.performanceRatings.length - 1]
        });
    } catch (error) {
        console.error('Add performance rating error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while adding performance rating'
        });
    }
});

// @desc    Update leave balance
// @route   PATCH /api/employees/:id/leave
// @access  Protected (Admin/HR only)
router.patch('/:id/leave', protect, checkPermission(['update']), async (req, res) => {
    try {
        const { leaveType, operation, days } = req.body; // operation: 'add', 'deduct'

        if (!leaveType || !operation || days === undefined) {
            return res.status(400).json({
                success: false,
                message: 'leaveType, operation, and days are required'
            });
        }

        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        const validLeaveTypes = ['earned', 'casual', 'sick', 'maternity', 'paternity'];
        if (!validLeaveTypes.includes(leaveType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid leave type'
            });
        }

        const currentBalance = employee.leaveBalance[leaveType] || 0;
        let newBalance = currentBalance;

        if (operation === 'add') {
            newBalance = currentBalance + days;
        } else if (operation === 'deduct') {
            newBalance = Math.max(0, currentBalance - days);
        }

        employee.leaveBalance[leaveType] = newBalance;
        await employee.save();

        res.json({
            success: true,
            message: 'Leave balance updated successfully',
            data: {
                leaveType,
                previousBalance: currentBalance,
                newBalance,
                operation,
                days
            }
        });
    } catch (error) {
        console.error('Update leave balance error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while updating leave balance'
        });
    }
});

module.exports = router;
