# Testing Guide - Toko 360 Staff Portal

## Demo Accounts

All demo accounts are available in `DemoAccounts.json` at the project root.

### Default Password
All accounts use the same password for testing: **235711**

### Master Admin Accounts

**Admin 1:**  
**Staff ID:** ADMIN001  
**Name:** Daniel Ishaku  
**Department:** Business Intelligence  
**Role:** Master Administrator  
**Permissions:** Full system access - all permissions enabled

**Admin 2:**  
**Staff ID:** ADMIN002  
**Name:** Sunshine  
**Department:** Business Intelligence  
**Role:** Master Administrator  
**Permissions:** Full system access - all permissions enabled

Both accounts have complete access to all features and administrative functions.

### How to Test

1. Open `DemoAccounts.json` to view all available test accounts
2. Choose an account from any department
3. Copy the `staffId` (e.g., AR001, SJ001, etc.)
4. Go to the login page
5. Enter the Staff ID and password (235711)
6. Click "SIGN IN TO PORTAL"

### Available Departments

- **Business Intelligence** - Full permissions including event creation and profile editing
- **Sales & Marketing** - Standard user permissions
- **Operations** - Standard user permissions
- **Customer Service** - Standard user permissions
- **Finance** - Standard user permissions
- **Human Resources** - Standard user permissions
- **IT** - Standard user permissions
- **Logistics** - Standard user permissions

### Special Permissions

- **Business Intelligence users only** can:
  - Create, edit, and delete events
  - Edit profile information (name, email)
  
- **All users** can:
  - Upload profile pictures
  - View events
  - Submit reports
  - Send messages
  - Clock in/out for attendance

### Quick Reference

| Staff ID | Name | Department | Role |
|----------|------|------------|------|
| **ADMIN001** | **Daniel Ishaku** | **Business Intelligence** | **Master Administrator** |
| **ADMIN002** | **Sunshine** | **Business Intelligence** | **Master Administrator** |
| AR001 | Arinze Raphael | Business Intelligence | BI Analyst |
| SJ001 | Samuel Johnson | Sales & Marketing | Sales Manager |
| OP001 | Oluwaseun Peters | Operations | Operations Manager |
| CS001 | Chioma Stephen | Customer Service | CS Lead |
| FN001 | Funmilayo Nelson | Finance | Finance Manager |
| HR001 | Hannah Roberts | Human Resources | HR Manager |
| IT001 | Ibrahim Thomas | IT | IT Manager |
| LG001 | Lawrence Gabriel | Logistics | Logistics Manager |

For complete list of all accounts, see `DemoAccounts.json`.
