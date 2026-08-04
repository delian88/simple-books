# Ledgerly REST API Documentation

Complete PHP REST API with MySQL database for the Ledgerly accounting application.

## 🚀 Features

- **Authentication**: JWT-based authentication with register, login, password reset
- **User Management**: Profile management, settings
- **Bank Accounts**: Manage multiple bank accounts
- **Transactions**: Income and expense tracking
- **Categories**: Customizable transaction categories
- **Receipts**: OCR receipt processing and storage
- **Invoices**: Create and manage invoices
- **Contacts**: Vendor and customer management
- **Budgets**: Budget planning and tracking
- **Reports**: Generate financial reports
- **Audit Logs**: Track all system changes

---

## 📋 Requirements

- PHP 7.4 or higher
- MySQL 5.7 or higher
- Apache/Nginx web server
- mod_rewrite enabled (for clean URLs)

---

## 🛠️ Installation

### 1. Database Setup

```bash
# Create database
mysql -u root -p < config/schema.sql

# Or import via phpMyAdmin
```

### 2. Configure Database Connection

Edit `config/database.php`:

```php
private $host = "localhost";
private $db_name = "ledgerly_db";
private $username = "root";
private $password = "your_password";
```

### 3. Set Secret Key

Edit `utils/Auth.php`:

```php
private $secret_key = "your-secret-key-change-this-in-production";
```

### 4. Configure Web Server

#### Apache `.htaccess`

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ $1.php [L,QSA]
```

#### Nginx

```nginx
location /api {
    try_files $uri $uri/ $uri.php?$query_string;
}
```

---

## 📚 API Endpoints

Base URL: `http://localhost/api`

### Authentication

#### Register User
```http
POST /auth/register.php
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "first_name": "John",
  "last_name": "Doe",
  "company_name": "Acme Corp",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user_id": 1
  }
}
```

#### Login
```http
POST /auth/login.php
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe"
    }
  }
}
```

### Protected Endpoints

All endpoints below require authentication header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📊 Dashboard Endpoints

#### Get Dashboard Summary
```http
GET /dashboard/summary.php?start_date=2026-08-01&end_date=2026-08-31
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_income": 15000.00,
      "total_expense": 8500.00,
      "profit": 6500.00,
      "income_count": 25,
      "expense_count": 42
    },
    "expenses_by_category": [...],
    "income_by_category": [...],
    "recent_transactions": [...],
    "daily_trend": [...]
  }
}
```

## 🧑‍💼 User Management

#### Get User Profile
```http
GET /user/profile.php
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Update User Profile
```http
PUT /user/profile.php
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "first_name": "Jane",
  "last_name": "Smith",
  "company_name": "New Company"
}
```

#### Get User Settings
```http
GET /user/settings.php
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Update User Settings
```http
PUT /user/settings.php
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "currency": "EUR",
  "date_format": "d/m/Y",
  "theme": "dark"
}
```

## 📈 Reports

#### Generate Profit & Loss Report
```http
GET /reports/profit-loss.php?start_date=2026-01-01&end_date=2026-12-31&group_by=category
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_income": 85000.00,
      "total_expenses": 45000.00,
      "net_profit": 40000.00,
      "profit_margin": 47.06
    },
    "income_by_category": [...],
    "expenses_by_category": [...]
  }
}
```

#### Generate Balance Sheet
```http
GET /reports/balance-sheet.php?as_of_date=2026-12-31
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assets": {
      "total": 125000.00,
      "categories": [...]
    },
    "liabilities": {
      "total": 35000.00,
      "categories": [...]
    },
    "equity": {
      "total": 90000.00,
      "retained_earnings": 40000.00
    }
  }
}
```

---

## 🗄️ Database Schema

### Users Table
- `id` - Primary key
- `email` - Unique email address
- `password` - Hashed password
- `first_name`, `last_name` - User name
- `company_name` - Optional company
- `status` - active/inactive/suspended
- `email_verified` - Email verification status
- `created_at`, `updated_at` - Timestamps

### Bank Accounts Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `account_name` - Account display name
- `account_number` - Bank account number
- `bank_name` - Name of bank
- `account_type` - checking/savings/credit/business
- `current_balance` - Current balance
- `is_active` - Active status

### Transactions Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `bank_account_id` - Foreign key to bank accounts
- `category_id` - Foreign key to categories
- `type` - income/expense
- `amount` - Transaction amount
- `description` - Transaction description
- `transaction_date` - Date of transaction
- `receipt_url` - Link to receipt image
- `is_reconciled` - Reconciliation status

### Categories Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `name` - Category name
- `type` - income/expense/asset/liability/equity
- `parent_id` - For subcategories
- `color` - Display color
- `is_system` - System vs custom category

### Receipts Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `transaction_id` - Optional link to transaction
- `file_path` - Stored file path
- `vendor_name` - Extracted vendor name
- `total_amount` - Extracted amount
- `ocr_data` - JSON OCR results
- `processed` - Processing status

### Invoices Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `contact_id` - Foreign key to contacts
- `invoice_number` - Unique invoice number
- `invoice_date`, `due_date` - Dates
- `status` - draft/sent/paid/overdue/cancelled
- `total_amount` - Invoice total
- `amount_paid` - Amount received

### Contacts Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `type` - vendor/customer/employee/other
- `name`, `company` - Contact details
- `email`, `phone` - Contact info
- `address`, `city`, `state` - Address
- `tax_id` - Tax identification

### Budgets Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `category_id` - Foreign key to categories
- `amount` - Budget amount
- `period` - monthly/quarterly/yearly
- `start_date`, `end_date` - Period dates
- `alert_threshold` - Alert percentage

---

## 🔐 Security Features

1. **Password Hashing**: BCrypt with cost factor 10
2. **JWT Tokens**: 7-day expiration
3. **SQL Injection Prevention**: PDO prepared statements
4. **XSS Protection**: Input sanitization
5. **CORS Configuration**: Cross-origin request handling
6. **Rate Limiting**: (Implement in production)
7. **HTTPS Only**: (Configure in production)

---

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2026-08-04 12:00:00"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": { ... },
  "timestamp": "2026-08-04 12:00:00"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Server Error

---

## 🧪 Testing

### Using cURL

```bash
# Register
curl -X POST http://localhost/api/auth/register.php \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User"
  }'

# Login
curl -X POST http://localhost/api/auth/login.php \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Using Postman

1. Import collection (create postman_collection.json)
2. Set environment variable `{{base_url}}` to `http://localhost/api`
3. Set `{{token}}` after login

---

## 📁 Project Structure

```
api/
├── auth/
│   ├── register.php
│   ├── login.php
│   └── reset-password.php
├── config/
│   ├── database.php
│   ├── cors.php
│   └── schema.sql
├── utils/
│   ├── Response.php
│   ├── Auth.php
│   └── JWT.php
├── transactions/
│   ├── create.php
│   ├── list.php
│   ├── get.php
│   ├── update.php
│   └── delete.php
├── accounts/
│   └── ...
├── invoices/
│   └── ...
└── README.md
```

---

## 🚧 Production Deployment

### Security Checklist

- [ ] Change JWT secret key
- [ ] Update database credentials
- [ ] Enable HTTPS
- [ ] Set `display_errors = 0`
- [ ] Implement rate limiting
- [ ] Set up database backups
- [ ] Configure firewall rules
- [ ] Enable security headers
- [ ] Use environment variables
- [ ] Implement logging
- [ ] Set up monitoring

### Environment Variables

Create `.env` file:

```env
DB_HOST=localhost
DB_NAME=ledgerly_db
DB_USER=root
DB_PASS=your_password
JWT_SECRET=your_secret_key
APP_ENV=production
```

---

## 📝 API Conventions

1. **Naming**: Use snake_case for JSON keys
2. **Dates**: ISO 8601 format (YYYY-MM-DD HH:MM:SS)
3. **Currency**: Store as decimal, 2 decimal places
4. **Pagination**: Use `page` and `limit` parameters
5. **Filtering**: Use query parameters
6. **Sorting**: Use `sort` and `order` parameters

---

## 🤝 Contributing

1. Follow PSR-12 coding standards
2. Document all endpoints
3. Write unit tests
4. Update this README

---

## 📄 License

MIT License - Copyright (c) 2026 Nutech

---

## 🆘 Support

For issues or questions:
- Email: support@nutech.com
- Documentation: https://docs.ledgerly.app
- GitHub Issues: https://github.com/your-repo/issues

---

## 🎯 Roadmap

- [ ] Add more transaction endpoints
- [ ] Implement file upload for receipts
- [ ] Add OCR processing
- [ ] Create report generation
- [ ] Add email notifications
- [ ] Implement webhooks
- [ ] Add export functionality
- [ ] Create admin panel
- [ ] Add analytics endpoints
- [ ] Implement caching

---

**Built with ❤️ by Nutech**
