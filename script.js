// DOM Elements
const navBtns = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');
const addEmployeeBtn = document.getElementById('add-employee-btn');
const employeeModal = document.getElementById('employee-modal');
const confirmModal = document.getElementById('confirm-modal');
const employeeForm = document.getElementById('employee-form');
const searchInput = document.getElementById('search-input');
const departmentFilter = document.getElementById('department-filter');
const employmentFilter = document.getElementById('employment-filter');
const employeeList = document.getElementById('employee-list');
const themeToggle = document.querySelector('.theme-toggle');
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

// State Management
let employees = [];
let departments = [];
let attendance = {};
let salary = {};
let currentEmployeeId = null;
let isDarkMode = localStorage.getItem('darkMode') === 'true';

// Department Management
const DEPARTMENTS = [
    'Administration',
    'Business Development',
    'Customer Support',
    'Engineering',
    'Finance',
    'Human Resources',
    'Information Technology',
    'Legal',
    'Marketing',
    'Operations',
    'Product Management',
    'Quality Assurance',
    'Research & Development',
    'Sales',
    'Security',
    'Supply Chain',
    'Training & Development'
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    loadCompanyData(); // Load data first
    updateDepartmentFilters();
    renderEmployeeList(); // Render employees immediately
    updateDashboard();
    setupEventListeners();
    initializeAttendance();
    initializeSalary();
    loadCompanyDetails(); // Load company details for administrator section
    setupNavigation(); // Make sure navigation is set up
});

// Theme Management
function initializeTheme() {
    if (isDarkMode) {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('darkMode', isDarkMode);
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    themeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// Navigation
function setupNavigation() {
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and pages
            navBtns.forEach(b => b.classList.remove('active'));
            pages.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked button and corresponding page
            btn.classList.add('active');
            const pageId = btn.getAttribute('data-page');
            document.getElementById(pageId).classList.add('active');
            
            // Handle mobile menu
            if (window.innerWidth <= 768) {
                navLinks.classList.remove('active');
            }
        });
    });

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
            navLinks.classList.remove('active');
        }
    });
}

// Employee Management
function generateEmployeeId() {
    return 'EMP' + Date.now().toString().slice(-6);
}

function addEmployee(employeeData) {
    const employee = {
        id: generateEmployeeId(),
        ...employeeData,
        joiningDate: new Date(employeeData.joiningDate).toISOString(),
        attendance: [],
        createdAt: new Date().toISOString()
    };
    
    employees.push(employee);
    
    // Update department list if new department
    if (!departments.includes(employeeData.department)) {
        departments.push(employeeData.department);
    }
    
    // Save and update UI
    saveCompanyData();
    updateDepartmentFilters();
    renderEmployeeList();
    renderAttendanceList();
    renderSalaryList();
    updateDashboard();
    
    // Show success message
    showNotification('Employee added successfully!');
}

function updateEmployee(id, employeeData) {
    const index = employees.findIndex(emp => emp.id === id);
    if (index !== -1) {
        employees[index] = {
            ...employees[index],
            ...employeeData,
            joiningDate: new Date(employeeData.joiningDate).toISOString(),
            updatedAt: new Date().toISOString()
        };
        saveCompanyData();
        renderEmployeeList();
        updateDashboard();
        
        // Show success message
        showNotification('Employee updated successfully!');
    }
}

function deleteEmployee(id) {
    // Remove from employees array
    employees = employees.filter(emp => emp.id !== id);

    // Remove from attendance records
    for (const date in attendance) {
        attendance[date] = attendance[date].filter(record => record.employeeId !== id);
    }

    saveCompanyData();
    renderEmployeeList();
    renderAttendanceList();
    renderSalaryList();
    updateDashboard();

    // Show success message
    showNotification('Employee deleted successfully!');
}

function saveCompanyData() {
    const companyData = {
        employees,
        departments,
        attendance,
        salary
    };
    companyAuth.saveCompanyData(companyData);
}

// UI Rendering
function renderEmployeeList(filteredEmployees = employees) {
    employeeList.innerHTML = '';
    
    if (filteredEmployees.length === 0) {
        employeeList.innerHTML = '<p class="no-data">No employees found</p>';
        return;
    }

    filteredEmployees.forEach(employee => {
        const card = document.createElement('div');
        card.className = 'employee-card';
        
        // Calculate duration if employee has left
        let durationText = '';
        if (employee.leftDate) {
            const duration = employee.duration || 0;
            durationText = `
                <p class="duration">
                    <i class="fas fa-clock"></i> Duration: ${duration} months
                    <br>
                    <small>Left on: ${new Date(employee.leftDate).toLocaleDateString()}</small>
                </p>
            `;
        }

        card.innerHTML = `
            <div class="employee-header">
                <img src="${employee.photo || 'assets/default-avatar.png'}" alt="${employee.name}" class="employee-photo">
                <div>
                    <h3>${employee.name}</h3>
                    <p class="employee-id">${employee.id}</p>
                </div>
            </div>
            <div class="employee-details">
                <p><i class="fas fa-envelope"></i> ${employee.email}</p>
                <p><i class="fas fa-phone"></i> ${employee.phone}</p>
                <p><i class="fas fa-building"></i> ${employee.department}</p>
                <p><i class="fas fa-briefcase"></i> ${employee.designation}</p>
                <p><i class="fas fa-calendar"></i> ${new Date(employee.joiningDate).toLocaleDateString()}</p>
                <p><i class="fas fa-money-bill-wave"></i> ₹${employee.salary}</p>
                ${durationText}
            </div>
            <div class="employee-actions">
                ${!employee.leftDate ? `
                    <button class="btn primary" onclick="editEmployee('${employee.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn danger" onclick="handleEmployeeLeft('${employee.id}')">
                        <i class="fas fa-sign-out-alt"></i> Mark as Left
                    </button>
                ` : `
                    <button class="btn secondary" disabled>
                        <i class="fas fa-user-slash"></i> Left
                    </button>
                `}
                <button class="btn danger" onclick="confirmDelete('${employee.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        employeeList.appendChild(card);
    });
}

function updateDashboard() {
    // Update stats
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(emp => !emp.leftDate).length;
    
    // Calculate present employees for today
    const today = new Date().toISOString().split('T')[0];
    const presentToday = employees.filter(emp => {
        if (emp.leftDate) return false; // Skip left employees
        const todayAttendance = emp.attendance?.find(a => a.date === today);
        return todayAttendance?.status === 'present';
    }).length;

    // Calculate total unique departments among active employees
    const activeDepartments = new Set(employees
        .filter(emp => !emp.leftDate)
        .map(emp => emp.department)
        .filter(department => department)); // Filter out potentially empty department strings
    const totalDepartments = activeDepartments.size;

    const totalSalary = employees
        .filter(emp => !emp.leftDate)
        .reduce((sum, emp) => sum + (Number(emp.salary) || 0), 0);

    // Update dashboard stats
    document.getElementById('total-employees').textContent = totalEmployees;
    document.getElementById('present-today').textContent = presentToday;
    document.getElementById('total-departments').textContent = totalDepartments;
    document.getElementById('total-salary').textContent = `₹${totalSalary.toLocaleString()}`;

    // Update charts
    updateDepartmentChart();
    updateAttendanceChart();
    updateRecentActivities();
    updateTopDepartments();
}

function updateDepartmentChart() {
    const ctx = document.getElementById('department-chart').getContext('2d');
    const departmentData = {};
    
    employees.forEach(emp => {
        if (!emp.leftDate) {
            departmentData[emp.department] = (departmentData[emp.department] || 0) + 1;
        }
    });

    // Before creating a new chart, destroy the old one if it exists
    if (window.departmentChart) {
        window.departmentChart.destroy();
    }

    window.departmentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(departmentData),
            datasets: [{
                label: 'Active Employees',
                data: Object.values(departmentData),
                backgroundColor: 'rgba(74, 144, 226, 0.8)',
                borderColor: 'rgba(74, 144, 226, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function updateAttendanceChart() {
    const ctx = document.getElementById('attendance-chart').getContext('2d');
    
    // Get dates for last 7 days
    const dates = [];
    const presentData = [];
    const absentData = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dates.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        
        // Count only marked attendance (present or absent)
        let present = 0;
        let absent = 0;
        
        employees.filter(emp => !emp.leftDate).forEach(emp => {
            const attendance = emp.attendance?.find(a => a.date === dateStr);
            if (attendance && (attendance.status === 'present' || attendance.status === 'absent')) {
                if (attendance.status === 'present') present++;
                else if (attendance.status === 'absent') absent++;
            }
        });
        
        presentData.push(present);
        absentData.push(absent);
    }

    // Destroy existing chart if it exists
    if (window.attendanceChart) {
        window.attendanceChart.destroy();
    }

    // Create new chart
    window.attendanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Present',
                    data: presentData,
                    backgroundColor: 'rgba(40, 167, 69, 0.8)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Absent',
                    data: absentData,
                    backgroundColor: 'rgba(220, 53, 69, 0.8)',
                    borderColor: 'rgba(220, 53, 69, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Weekly Attendance Overview'
                }
            }
        }
    });
}

function updateRecentActivities() {
    const activityList = document.getElementById('activity-list');
    activityList.innerHTML = '';

    const activities = [];
    
    // Add employee activities
    employees.forEach(emp => {
        if (emp.joiningDate) {
            activities.push({
                type: 'join',
                name: emp.name,
                date: emp.joiningDate,
                icon: 'fa-user-plus'
            });
        }
        if (emp.leftDate) {
            activities.push({
                type: 'left',
                name: emp.name,
                date: emp.leftDate,
                icon: 'fa-user-minus'
            });
        }
    });

    // Sort activities by date
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Display last 5 activities
    activities.slice(0, 5).forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="fas ${activity.icon}"></i>
            </div>
            <div class="activity-details">
                <p>${activity.name} ${activity.type === 'join' ? 'joined' : 'left'} the company</p>
                <span class="activity-time">${new Date(activity.date).toLocaleDateString()}</span>
            </div>
        `;
        activityList.appendChild(activityItem);
    });
}

function updateTopDepartments() {
    const topDepartments = document.getElementById('top-departments');
    topDepartments.innerHTML = '';

    const departmentStats = {};
    employees.forEach(emp => {
        if (!emp.leftDate) {
            departmentStats[emp.department] = (departmentStats[emp.department] || 0) + 1;
        }
    });

    const sortedDepartments = Object.entries(departmentStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);

    sortedDepartments.forEach(([dept, count], index) => {
        const deptItem = document.createElement('div');
        deptItem.className = 'department-item';
        deptItem.innerHTML = `
            <div class="department-info">
                <div class="department-rank">${index + 1}</div>
                <span>${dept}</span>
            </div>
            <div class="department-stats">
                <div class="department-count">${count} employees</div>
            </div>
        `;
        topDepartments.appendChild(deptItem);
    });
}

// Modal Management
function showModal(modal) {
    modal.classList.add('active');
}

function hideModal(modal) {
    modal.classList.remove('active');
}

function openEmployeeModal(employee = null) {
    currentEmployeeId = employee?.id || null;
    const modalTitle = document.getElementById('modal-title');
    modalTitle.textContent = employee ? 'Edit Employee' : 'Add New Employee';
    
    // Reset form first
    employeeForm.reset();
    document.getElementById('photo-preview').innerHTML = '';
    
    if (employee) {
        // Fill form with employee data
        document.getElementById('name').value = employee.name;
        document.getElementById('email').value = employee.email;
        document.getElementById('phone').value = employee.phone;
        document.getElementById('department').value = employee.department;
        document.getElementById('designation').value = employee.designation;
        document.getElementById('joining-date').value = new Date(employee.joiningDate).toISOString().split('T')[0];
        document.getElementById('salary').value = employee.salary;
        
        // Show current photo if exists
        if (employee.photo) {
            document.getElementById('photo-preview').innerHTML = `
                <img src="${employee.photo}" alt="Current Photo" style="max-width: 200px; margin-top: 1rem;">
            `;
        }
    }
    
    showModal(employeeModal);
}

// --- Confirm Delete Function ---
function confirmDelete(id) {
    const employee = employees.find(emp => emp.id === id);
    if (!employee) return;
    
    // Set the confirmation message
    document.getElementById('confirm-message').textContent = 
        `Are you sure you want to permanently delete ${employee.name}? This action cannot be undone.`;
    
    // Set the action for the confirm button
    const confirmBtn = document.getElementById('confirm-btn');
    // Remove any existing event listeners by cloning and replacing
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    newConfirmBtn.onclick = () => {
        deleteEmployee(id);
        hideModal(confirmModal);
    };
    
    // Show the confirmation modal
    showModal(confirmModal);
}
// --- End Confirm Delete Function ---

function confirmEmployeeLeft(id) {
    const employee = employees.find(emp => emp.id === id);
    if (!employee) return;
    
    // Set the confirmation message
    document.getElementById('confirm-message').textContent = 
        `Are you sure you want to mark ${employee.name} as left?`;
    
    // Remove any existing event listeners
    const confirmBtn = document.getElementById('confirm-btn');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // Add new event listener
    newConfirmBtn.addEventListener('click', () => {
        handleEmployeeLeft(id);
        hideModal(confirmModal);
    });
    
    // Show the confirmation modal
    showModal(confirmModal);
}

function handleEmployeeLeft(id) {
    const employee = employees.find(emp => emp.id === id);
    if (employee) {
        // Add left date
        employee.leftDate = new Date().toISOString();
        
        // Calculate duration
        const joiningDate = new Date(employee.joiningDate);
        const leftDate = new Date(employee.leftDate);
        const duration = Math.floor((leftDate - joiningDate) / (1000 * 60 * 60 * 24 * 30));
        employee.duration = duration;
        
        // Save to localStorage
        saveCompanyData();
        updateDepartmentFilters();
        
        // Update UI
        renderEmployeeList();
        updateDashboard();
        
        // Show success message
        showNotification(`Employee marked as left. Duration: ${duration} months`);
    }
}

function handleEmployeeSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const employeeData = Object.fromEntries(formData.entries());
    
    // Handle photo upload
    const photoFile = formData.get('photo');
    if (photoFile && photoFile.size > 0) {
        const reader = new FileReader();
        reader.onload = function(e) {
            employeeData.photo = e.target.result; // Store as base64
            saveEmployeeData(employeeData);
        };
        reader.readAsDataURL(photoFile);
    } else {
        // Keep existing photo if editing
        if (currentEmployeeId) {
            const existingEmployee = employees.find(emp => emp.id === currentEmployeeId);
            if (existingEmployee && existingEmployee.photo) {
                employeeData.photo = existingEmployee.photo;
            }
        }
        saveEmployeeData(employeeData);
    }
}

function saveEmployeeData(employeeData) {
    try {
        if (currentEmployeeId) {
            updateEmployee(currentEmployeeId, employeeData);
        } else {
            addEmployee(employeeData);
        }
        
        hideModal(employeeModal);
        employeeForm.reset();
        document.getElementById('photo-preview').innerHTML = '';
    } catch (error) {
        showNotification('Error saving employee data: ' + error.message, 'error');
    }
}

// Search and Filter
function filterEmployees() {
    const searchTerm = searchInput.value.toLowerCase();
    const department = departmentFilter.value;
    const employmentType = employmentFilter.value;
    
    const filtered = employees.filter(employee => {
        // Search term filter
        const matchesSearch = 
            employee.name.toLowerCase().includes(searchTerm) ||
            employee.email.toLowerCase().includes(searchTerm) ||
            employee.department.toLowerCase().includes(searchTerm);
        
        // Department filter
        const matchesDepartment = !department || employee.department === department;
        
        // Employment type filter
        let matchesEmploymentType = true;
        if (employmentType === 'current') {
            matchesEmploymentType = !employee.leftDate;
        } else if (employmentType === 'past') {
            matchesEmploymentType = !!employee.leftDate;
        }
        
        return matchesSearch && matchesDepartment && matchesEmploymentType;
    });
    
    renderEmployeeList(filtered);
}

// Attendance Management
function initializeAttendance() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('attendance-date').value = today;
    renderAttendanceList();
    setupAttendanceEventListeners();
}

function renderAttendanceList(filteredEmployees = employees) {
    const attendanceList = document.getElementById('attendance-list');
    const selectedDate = document.getElementById('attendance-date').value;
    
    attendanceList.innerHTML = '';
    
    // Filter only current employees
    const currentEmployees = filteredEmployees.filter(emp => !emp.leftDate);
    
    if (currentEmployees.length === 0) {
        attendanceList.innerHTML = '<p class="no-data">No active employees found</p>';
        return;
    }

    currentEmployees.forEach(employee => {
        const attendance = employee.attendance?.find(a => a.date === selectedDate) || { 
            status: 'pending',
            entryTime: '',
            closingTime: ''
        };
        
        const card = document.createElement('div');
        card.className = 'attendance-card';
        card.innerHTML = `
            <div class="employee-header">
                <img src="${employee.photo || 'assets/default-avatar.png'}" alt="${employee.name}" class="employee-photo">
                <div>
                    <h3>${employee.name}</h3>
                    <p class="employee-id">${employee.id}</p>
                </div>
            </div>
            <div class="employee-details">
                <p><i class="fas fa-building"></i> ${employee.department}</p>
                <p><i class="fas fa-briefcase"></i> ${employee.designation}</p>
            </div>
            ${attendance.status === 'present' ? `
                <div class="attendance-time">
                    <div class="time-input">
                        <label>Entry Time:</label>
                        <input type="time" id="entry-${employee.id}" value="${attendance.entryTime || ''}" 
                               onchange="updateAttendanceTime('${employee.id}', 'entry', this.value)">
                    </div>
                    <div class="time-input">
                        <label>Closing Time:</label>
                        <input type="time" id="closing-${employee.id}" value="${attendance.closingTime || ''}"
                               onchange="updateAttendanceTime('${employee.id}', 'closing', this.value)">
                    </div>
                </div>
            ` : ''}
            <div class="attendance-status">
                <button class="${attendance.status === 'present' ? 'present' : 'inactive'}" 
                        onclick="markAttendance('${employee.id}', 'present')">
                    <i class="fas fa-check"></i> Present
                </button>
                <button class="${attendance.status === 'absent' ? 'absent' : 'inactive'}"
                        onclick="markAttendance('${employee.id}', 'absent')">
                    <i class="fas fa-times"></i> Absent
                </button>
                <button class="${attendance.status === 'leave' ? 'leave' : 'inactive'}"
                        onclick="markAttendance('${employee.id}', 'leave')">
                    <i class="fas fa-calendar-alt"></i> On Leave
                </button>
            </div>
        `;
        attendanceList.appendChild(card);
    });
}

function markAttendance(employeeId, status) {
    const selectedDate = document.getElementById('attendance-date').value;
    const employee = employees.find(emp => emp.id === employeeId);
    
    if (employee && !employee.leftDate) {
        if (!employee.attendance) {
            employee.attendance = [];
        }
        
        const existingRecord = employee.attendance.findIndex(a => a.date === selectedDate);
        if (existingRecord !== -1) {
            employee.attendance[existingRecord].status = status;
            // Clear time entries if not present
            if (status !== 'present') {
                employee.attendance[existingRecord].entryTime = '';
                employee.attendance[existingRecord].closingTime = '';
            }
        } else {
            employee.attendance.push({ 
                date: selectedDate, 
                status,
                entryTime: status === 'present' ? '' : '',
                closingTime: status === 'present' ? '' : ''
            });
        }
        
        saveCompanyData();
        renderAttendanceList();
        updateDashboard();
    }
}

function updateAttendanceTime(employeeId, type, time) {
    const selectedDate = document.getElementById('attendance-date').value;
    const employee = employees.find(emp => emp.id === employeeId);
    
    if (employee && !employee.leftDate) {
        if (!employee.attendance) {
            employee.attendance = [];
        }
        
        const existingRecord = employee.attendance.findIndex(a => a.date === selectedDate);
        if (existingRecord !== -1) {
            employee.attendance[existingRecord][type === 'entry' ? 'entryTime' : 'closingTime'] = time;
        } else {
            employee.attendance.push({ 
                date: selectedDate, 
                status: 'present',
                entryTime: type === 'entry' ? time : '',
                closingTime: type === 'closing' ? time : ''
            });
        }
        
        saveCompanyData();
    }
}

function markAllPresent() {
    const selectedDate = document.getElementById('attendance-date').value;
    
    // Only mark attendance for current employees
    employees.filter(emp => !emp.leftDate).forEach(employee => {
        if (!employee.attendance) {
            employee.attendance = [];
        }
        const existingRecord = employee.attendance.findIndex(a => a.date === selectedDate);
        if (existingRecord !== -1) {
            employee.attendance[existingRecord].status = 'present';
        } else {
            employee.attendance.push({ date: selectedDate, status: 'present' });
        }
    });
    
    saveCompanyData();
    renderAttendanceList();
    updateDashboard();
}

// Salary Management
function initializeSalary() {
    populateMonthPicker();
    renderSalaryList();
    setupSalaryEventListeners();
}

function populateMonthPicker() {
    const monthPicker = document.getElementById('salary-month');
    const currentDate = new Date();
    const months = [];
    
    for (let i = 0; i < 12; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthStr = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        const monthValue = date.toISOString().slice(0, 7);
        months.push({ value: monthValue, text: monthStr });
    }
    
    monthPicker.innerHTML = '<option value="">Select Month</option>' +
        months.map(m => `<option value="${m.value}">${m.text}</option>`).join('');
}

function renderSalaryList(filteredEmployees = employees) {
    const salaryList = document.getElementById('salary-list');
    const selectedMonth = document.getElementById('salary-month').value;
    
    salaryList.innerHTML = '';
    
    if (filteredEmployees.length === 0) {
        salaryList.innerHTML = '<p class="no-data">No employees found</p>';
        return;
    }

    filteredEmployees.forEach(employee => {
        const card = document.createElement('div');
        card.className = 'salary-card';
        card.innerHTML = `
            <div class="employee-header">
                <img src="${employee.photo || 'assets/default-avatar.png'}" alt="${employee.name}" class="employee-photo">
                <div>
                    <h3>${employee.name}</h3>
                    <p class="employee-id">${employee.id}</p>
                </div>
            </div>
            <div class="salary-details">
                <p><i class="fas fa-building"></i> ${employee.department}</p>
                <p><i class="fas fa-briefcase"></i> ${employee.designation}</p>
                <p class="salary-amount"><i class="fas fa-money-bill-wave"></i> ₹${employee.salary}</p>
            </div>
            <div class="employee-actions">
                <button class="btn primary" onclick="generateSalarySlip('${employee.id}')">
                    <i class="fas fa-file-invoice"></i> Generate Slip
                </button>
            </div>
        `;
        salaryList.appendChild(card);
    });
}

function generateSalarySlip(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId);
    const selectedMonth = document.getElementById('salary-month').value;
    
    if (!employee || !selectedMonth) {
        alert('Please select a month first');
        return;
    }
    
    // Calculate attendance for the month
    const [year, month] = selectedMonth.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    const attendance = employee.attendance?.filter(a => 
        a.date.startsWith(selectedMonth) && a.status === 'present'
    ).length || 0;
    
    const attendancePercentage = (attendance / daysInMonth) * 100;
    const salary = Number(employee.salary);
    const deductions = salary * (1 - (attendancePercentage / 100));
    const netSalary = salary - deductions;

    // Create a temporary div for the salary slip content
    const slipDiv = document.createElement('div');
    slipDiv.style.padding = '20px';
    slipDiv.style.fontFamily = 'Arial, sans-serif';
    slipDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #4a90e2; margin-bottom: 10px;">Salary Slip</h1>
            <p style="color: #666;">${new Date(selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h2 style="color: #333; margin-bottom: 10px;">Employee Details</h2>
            <p><strong>Name:</strong> ${employee.name}</p>
            <p><strong>Employee ID:</strong> ${employee.id}</p>
            <p><strong>Department:</strong> ${employee.department}</p>
            <p><strong>Designation:</strong> ${employee.designation}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h2 style="color: #333; margin-bottom: 10px;">Salary Details</h2>
            <p><strong>Basic Salary:</strong> ₹${salary.toLocaleString()}</p>
            <p><strong>Attendance:</strong> ${attendance}/${daysInMonth} days (${attendancePercentage.toFixed(1)}%)</p>
            <p><strong>Deductions:</strong> ₹${deductions.toFixed(2)}</p>
            <p style="font-size: 1.2em; font-weight: bold; color: #4a90e2;">
                <strong>Net Salary:</strong> ₹${netSalary.toFixed(2)}
            </p>
        </div>
        
        <div style="margin-top: 40px; text-align: center; color: #666;">
            <p>This is a computer-generated document and does not require a signature.</p>
        </div>
    `;

    // Add the div to the document temporarily
    document.body.appendChild(slipDiv);

    // Generate PDF using html2canvas and jsPDF
    html2canvas(slipDiv, {
        scale: 2,
        useCORS: true,
        logging: false
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new window.jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`salary-slip-${employee.id}-${selectedMonth}.pdf`);

        // Remove the temporary div
        document.body.removeChild(slipDiv);
    });
}

// Event Listeners
function setupEventListeners() {
    // Navigation
    setupNavigation();
    
    // Theme Toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Employee Form
    employeeForm.addEventListener('submit', handleEmployeeSubmit);
    
    // Add Employee Button
    addEmployeeBtn.addEventListener('click', () => openEmployeeModal());
    
    // Modal Close Buttons
    document.querySelectorAll('.close-btn, #cancel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            hideModal(employeeModal);
        });
    });

    // Company Modal Close Button
    document.querySelector('#company-modal .close-btn').addEventListener('click', () => {
        hideModal(document.getElementById('company-modal'));
    });
    
    // Confirm Modal Buttons
    document.getElementById('cancel-confirm-btn').addEventListener('click', () => {
        hideModal(confirmModal);
    });
    
    // Search and Filter
    searchInput.addEventListener('input', filterEmployees);
    departmentFilter.addEventListener('change', filterEmployees);
    employmentFilter.addEventListener('change', filterEmployees);
    
    // Photo Preview
    document.getElementById('photo').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('photo-preview').innerHTML = `
                    <img src="${e.target.result}" alt="Preview" style="max-width: 200px; margin-top: 1rem;">
                `;
            };
            reader.readAsDataURL(file);
        }
    });

    // Company form
    document.getElementById('company-form').addEventListener('submit', handleCompanySubmit);
    
    // Company modal close button
    document.getElementById('cancel-company-btn').addEventListener('click', () => {
        hideModal(document.getElementById('company-modal'));
    });
    
    // Company logo file input event listener
    const companyLogoInput = document.getElementById('company-logo');
    const companyLogoLabel = document.querySelector('#company-form .file-upload-label');
    const companyLogoPreview = document.getElementById('company-logo-preview');

    if (companyLogoInput && companyLogoLabel) {
        // Add click event to label
        companyLogoLabel.addEventListener('click', function(e) {
            e.preventDefault();
            companyLogoInput.click();
        });

        // Add change event to input
        companyLogoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    companyLogoPreview.innerHTML = `
                        <img src="${e.target.result}" alt="Preview" style="max-width: 200px; margin-top: 1rem;">
                    `;
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

function setupAttendanceEventListeners() {
    document.getElementById('attendance-date').addEventListener('change', () => {
        renderAttendanceList();
    });
    
    document.getElementById('mark-all-present').addEventListener('click', markAllPresent);
    
    document.getElementById('attendance-search').addEventListener('input', filterAttendance);
    document.getElementById('attendance-department-filter').addEventListener('change', filterAttendance);
}

function setupSalaryEventListeners() {
    document.getElementById('salary-month').addEventListener('change', () => {
        renderSalaryList();
    });
    
    document.getElementById('salary-search').addEventListener('input', filterSalary);
    document.getElementById('salary-department-filter').addEventListener('change', filterSalary);
}

function filterAttendance() {
    const searchTerm = document.getElementById('attendance-search').value.toLowerCase();
    const department = document.getElementById('attendance-department-filter').value;
    
    const filtered = employees.filter(employee => {
        const matchesSearch = 
            employee.name.toLowerCase().includes(searchTerm) ||
            employee.id.toLowerCase().includes(searchTerm);
        
        const matchesDepartment = !department || employee.department === department;
        
        return matchesSearch && matchesDepartment;
    });
    
    renderAttendanceList(filtered);
}

function filterSalary() {
    const searchTerm = document.getElementById('salary-search').value.toLowerCase();
    const department = document.getElementById('salary-department-filter').value;
    
    const filtered = employees.filter(employee => {
        const matchesSearch = 
            employee.name.toLowerCase().includes(searchTerm) ||
            employee.id.toLowerCase().includes(searchTerm);
        
        const matchesDepartment = !department || employee.department === department;
        
        return matchesSearch && matchesDepartment;
    });
    
    renderSalaryList(filtered);
}

// Export functions for HTML onclick handlers
window.editEmployee = function(id) {
    const employee = employees.find(emp => emp.id === id);
    if (employee) {
        openEmployeeModal(employee);
    }
};

window.confirmEmployeeLeft = function(id) {
    if (confirm('Are you sure you want to mark this employee as left?')) {
        handleEmployeeLeft(id);
    }
};

// Update department filters
function updateDepartmentFilters() {
    // Update main department filter
    const departmentFilter = document.getElementById('department-filter');
    departmentFilter.innerHTML = '<option value="">All Departments</option>';
    DEPARTMENTS.forEach(dept => {
        departmentFilter.innerHTML += `<option value="${dept}">${dept}</option>`;
    });
    
    // Update attendance department filter
    const attendanceDeptFilter = document.getElementById('attendance-department-filter');
    attendanceDeptFilter.innerHTML = '<option value="">All Departments</option>';
    DEPARTMENTS.forEach(dept => {
        attendanceDeptFilter.innerHTML += `<option value="${dept}">${dept}</option>`;
    });
    
    // Update salary department filter
    const salaryDeptFilter = document.getElementById('salary-department-filter');
    salaryDeptFilter.innerHTML = '<option value="">All Departments</option>';
    DEPARTMENTS.forEach(dept => {
        salaryDeptFilter.innerHTML += `<option value="${dept}">${dept}</option>`;
    });

    // Update employee form department select
    const formDepartmentSelect = document.getElementById('department');
    formDepartmentSelect.innerHTML = '<option value="">Select Department</option>';
    DEPARTMENTS.forEach(dept => {
        formDepartmentSelect.innerHTML += `<option value="${dept}">${dept}</option>`;
    });
}

// Load company-specific data
function loadCompanyData() {
    const companyData = companyAuth.getCompanyData();
    if (companyData) {
        employees = companyData.employees || [];
        departments = companyData.departments || [];
        attendance = companyData.attendance || {};
        salary = companyData.salary || {};
    } else {
        employees = [];
        departments = [];
        attendance = {};
        salary = {};
    }
}

// Update department filter
function updateDepartmentFilter() {
    const departments = [...new Set(employees.map(emp => emp.department))];
    const filter = document.getElementById('department-filter');
    const attendanceFilter = document.getElementById('attendance-department-filter');
    const salaryFilter = document.getElementById('salary-department-filter');

    [filter, attendanceFilter, salaryFilter].forEach(select => {
        if (select) {
            select.innerHTML = '<option value="">All Departments</option>';
            departments.forEach(dept => {
                select.innerHTML += `<option value="${dept}">${dept}</option>`;
            });
        }
    });
}

// Company Management
function loadCompanyDetails() {
    const company = companyAuth.getCurrentCompany();
    if (company) {
        // Update company details in the administrator section
        document.getElementById('company-name-large').textContent = company.name;
        document.getElementById('company-email').textContent = company.email;
        document.getElementById('company-phone').textContent = company.phone || '-';
        document.getElementById('company-address').textContent = company.address || '-';
        document.getElementById('company-industry').textContent = company.industry || '-';
        document.getElementById('company-size').textContent = company.size || '-';
        document.getElementById('company-registration-date').textContent = 
            new Date(company.registrationDate).toLocaleDateString();
        
        // Update company logo
        if (company.logo) {
            document.getElementById('company-logo-large').src = company.logo;
        }
    }
}

function openCompanyEditModal() {
    const company = companyAuth.getCurrentCompany();
    if (company) {
        // Fill form with current company data
        document.getElementById('company-name').value = company.name;
        document.getElementById('company-email').value = company.email;
        document.getElementById('company-phone').value = company.phone || '';
        document.getElementById('company-address').value = company.address || '';
        document.getElementById('company-industry').value = company.industry || '';
        document.getElementById('company-size').value = company.size || '';
        
        // Show current logo if exists
        const preview = document.getElementById('company-logo-preview');
        if (company.logo) {
            preview.innerHTML = `
                <img src="${company.logo}" alt="Current Logo" style="max-width: 200px; margin-top: 1rem;">
            `;
        } else {
            preview.innerHTML = '<p>No logo uploaded</p>';
        }
        
        showModal(document.getElementById('company-modal'));
    }
}

function handleCompanySubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const companyData = Object.fromEntries(formData.entries());
    
    // Handle logo upload
    const logoFile = formData.get('logo');
    if (logoFile && logoFile.size > 0) {
        // Validate file type
        if (!logoFile.type.startsWith('image/')) {
            showNotification('Please select an image file', 'error');
            return;
        }

        // Validate file size (max 2MB)
        if (logoFile.size > 2 * 1024 * 1024) {
            showNotification('Image size should be less than 2MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            companyData.logo = e.target.result;
            updateCompanyDetails(companyData);
        };
        reader.onerror = function() {
            showNotification('Error reading the file', 'error');
        };
        reader.readAsDataURL(logoFile);
    } else {
        // Keep existing logo if no new one uploaded
        const currentCompany = companyAuth.getCurrentCompany();
        if (currentCompany && currentCompany.logo) {
            companyData.logo = currentCompany.logo;
        }
        updateCompanyDetails(companyData);
    }
}

function updateCompanyDetails(companyData) {
    try {
        const currentCompany = companyAuth.getCurrentCompany();
        if (currentCompany) {
            // Update company data
            const updatedCompany = {
                ...currentCompany,
                ...companyData
            };
            
            // Update in auth system
            companyAuth.updateCompany(updatedCompany);
            
            // Update UI
            loadCompanyDetails();
            
            // Update navbar company info
            document.getElementById('company-name').textContent = updatedCompany.name;
            if (updatedCompany.logo) {
                document.getElementById('company-logo').src = updatedCompany.logo;
            }
            
            hideModal(document.getElementById('company-modal'));
            showNotification('Company details updated successfully!');
        }
    } catch (error) {
        showNotification('Error updating company details: ' + error.message, 'error');
    }
}

// Notification System
function showNotification(message, type = 'success') {
    const popup = document.getElementById('popup-notification');
    const popupMessage = document.getElementById('popup-message');
    
    // Set message and type
    popupMessage.textContent = message;
    popup.className = 'popup-notification ' + type;
    
    // Show popup
    popup.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
        popup.style.animation = 'slideOut 0.5s ease-out';
        setTimeout(() => {
            popup.style.display = 'none';
            popup.style.animation = 'slideIn 0.5s ease-out';
        }, 500);
    }, 3000);
}

// Mobile Menu Toggle
document.querySelector('.hamburger').addEventListener('click', function() {
    const navLinks = document.querySelector('.nav-links');
    const navRight = document.querySelector('.nav-right');
    navLinks.classList.toggle('active');
    navRight.classList.toggle('active');
});

// Close mobile menu when clicking outside
document.addEventListener('click', function(e) {
    const navLinks = document.querySelector('.nav-links');
    const navRight = document.querySelector('.nav-right');
    const hamburger = document.querySelector('.hamburger');
    
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target) && !navRight.contains(e.target)) {
        navLinks.classList.remove('active');
        navRight.classList.remove('active');
    }
}); 