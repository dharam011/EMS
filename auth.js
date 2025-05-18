// Company Authentication Management
class CompanyAuth {
    constructor() {
        // Initialize companies array from localStorage
        this.companies = [];
        this.currentCompany = null;
        this.isAuthenticated = false;
        this.loadFromLocalStorage();
    }

    // Load data from localStorage
    loadFromLocalStorage() {
        try {
            const storedCompanies = localStorage.getItem('companies');
            if (storedCompanies) {
                this.companies = JSON.parse(storedCompanies);
            }

            // Check for current company in sessionStorage
            const currentCompany = sessionStorage.getItem('currentCompany');
            if (currentCompany) {
                this.currentCompany = JSON.parse(currentCompany);
                this.isAuthenticated = true;
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            this.companies = [];
            this.currentCompany = null;
            this.isAuthenticated = false;
        }
    }

    // Save data to localStorage
    saveToLocalStorage() {
        try {
            localStorage.setItem('companies', JSON.stringify(this.companies));
            if (this.currentCompany) {
                sessionStorage.setItem('currentCompany', JSON.stringify(this.currentCompany));
            }
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    // Register new company
    register(companyData) {
        try {
            // Validate required fields
            if (!companyData.name || !companyData.email || !companyData.password) {
                throw new Error('All fields are required');
            }

            // Check if company email already exists
            const existingCompany = this.companies.find(comp => comp.email === companyData.email);
            if (existingCompany) {
                throw new Error('Company with this email already registered');
            }

            // Clear any existing session data
            sessionStorage.removeItem('currentCompany');
            localStorage.removeItem('employees');
            localStorage.removeItem('attendance');
            localStorage.removeItem('salary');

            // Create company object
            const company = {
                id: 'COMP' + Date.now().toString().slice(-6),
                name: companyData.name,
                email: companyData.email,
                password: this.hashPassword(companyData.password),
                registrationDate: new Date().toISOString(),
                logo: companyData.logo || null,
                address: companyData.address || '',
                phone: companyData.phone || '',
                industry: companyData.industry || '',
                size: companyData.size || ''
            };

            // Add to companies array
            this.companies.push(company);
            this.currentCompany = company;
            this.isAuthenticated = true;
            
            // Save to localStorage
            this.saveToLocalStorage();

            // Initialize company-specific data
            this.initializeCompanyData(company.id);

            return true;
        } catch (error) {
            throw error;
        }
    }

    // Initialize company-specific data
    initializeCompanyData(companyId) {
        // Initialize empty arrays for company data
        const companyData = {
            employees: [],
            attendance: {},
            salary: {},
            departments: [
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
            ]
        };

        // Save company-specific data
        localStorage.setItem(`company_${companyId}_data`, JSON.stringify(companyData));
    }

    // Get company-specific data
    getCompanyData() {
        if (!this.currentCompany) return null;
        const data = localStorage.getItem(`company_${this.currentCompany.id}_data`);
        return data ? JSON.parse(data) : null;
    }

    // Save company-specific data
    saveCompanyData(data) {
        if (!this.currentCompany) return;
        localStorage.setItem(`company_${this.currentCompany.id}_data`, JSON.stringify(data));
    }

    // Login company
    login(email, password) {
        try {
            // Reload from localStorage to ensure we have latest data
            this.loadFromLocalStorage();

            // Find company by email
            const company = this.companies.find(comp => comp.email === email);
            
            if (!company) {
                throw new Error('Company not found with this email');
            }

            // Compare hashed passwords
            const hashedPassword = this.hashPassword(password);
            if (company.password !== hashedPassword) {
                throw new Error('Invalid password');
            }

            this.currentCompany = company;
            this.isAuthenticated = true;
            
            // Save to localStorage
            this.saveToLocalStorage();

            return true;
        } catch (error) {
            throw error;
        }
    }

    // Logout company
    logout() {
        this.currentCompany = null;
        this.isAuthenticated = false;
        sessionStorage.removeItem('currentCompany');
    }

    // Get current company
    getCurrentCompany() {
        return this.currentCompany;
    }

    // Check if authenticated
    checkAuth() {
        // Reload from localStorage to ensure we have latest data
        this.loadFromLocalStorage();
        return this.isAuthenticated;
    }

    // Get all companies
    getAllCompanies() {
        this.loadFromLocalStorage();
        return this.companies;
    }

    // Delete company
    deleteCompany(companyId) {
        this.companies = this.companies.filter(comp => comp.id !== companyId);
        localStorage.removeItem(`company_${companyId}_data`);
        this.saveToLocalStorage();
    }

    // Simple password hashing (for demo purposes only)
    hashPassword(password) {
        return btoa(password); // Base64 encoding (NOT secure for production)
    }
}

// Initialize auth
const companyAuth = new CompanyAuth();

// Export for use in other files
window.companyAuth = companyAuth; 