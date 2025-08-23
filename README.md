# Lexora - Smart Library Management System

A comprehensive library management system built with the OERN stack (Oracle, Express.js, React, Node.js).

## Features

### Librarian Functions
- Add, update, and delete books
- Manage member records
- Issue and return books with automatic due date calculation
- Track overdue items and compute fines
- Generate comprehensive reports

### Member Functions
- Search and view available books
- Track current borrowed books and due dates
- Access borrowing history
- View fine details

### System Features
- Enforce borrow limits per member
- Automatic return policies with fine calculation
- Real-time stock updates
- Comprehensive error handling and validation

## Technology Stack

- **Frontend**: React 18, Material-UI, React Router
- **Backend**: Node.js, Express.js
- **Database**: Oracle Database
- **Authentication**: JWT tokens
- **Development**: Concurrently for running both client and server

## Project Structure

```
LEXORA-A-Smart-Library-Management-System/
├── client/                 # React frontend application
├── server/                 # Express.js backend API
├── db/                     # Oracle database scripts
│   ├── schema.sql         # Database schema
│   ├── functions.sql      # Utility functions
│   ├── triggers.sql       # Business logic triggers
│   ├── views.sql          # Database views
│   ├── circulation_pkg.sql # Circulation package
│   ├── reports.sql        # Reports package
│   └── data.sql           # Sample data
└── package.json           # Root package configuration
```

## Prerequisites

- Node.js (v16 or higher)
- Oracle Database (19c or higher)
- Oracle Instant Client

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd LEXORA-A-Smart-Library-Management-System
```

2. Install all dependencies:
```bash
npm run install-all
```

3. Set up Oracle Database:
   - Run the SQL scripts in the `db/` folder in the following order:
     1. `clean-up.sql` (optional, for fresh installation)
     2. `schema.sql`
     3. `functions.sql`
     4. `triggers.sql`
     5. `views.sql`
     6. `circulation_pkg.sql`
     7. `reports.sql`
     8. `data.sql`

4. Configure environment variables:
   - Copy `server/.env.example` to `server/.env`
   - Update database connection details

## Development

Run both client and server in development mode:
```bash
npm run dev
```

Or run them separately:
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

## Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Books
- `GET /api/books` - Get all available books
- `POST /api/books` - Add new book
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book

### Members
- `GET /api/members` - Get all members
- `POST /api/members` - Register new member
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member

### Borrowings
- `POST /api/borrowings/issue` - Issue book
- `PUT /api/borrowings/return/:id` - Return book
- `GET /api/borrowings/member/:id` - Get member's active loans
- `GET /api/borrowings/overdue` - Get overdue loans

### Reports
- `GET /api/reports/top-books` - Most borrowed books
- `GET /api/reports/member-history/:id` - Member borrowing history
- `GET /api/reports/outstanding/:id` - Member outstanding fines

## Database Schema

The system uses the following main tables:
- `lexora_settings` - System configuration
- `members` - Library members
- `books` - Book inventory
- `borrowings` - Borrow transactions
- `fine_payments` - Fine payment records
- `app_users` - System users (librarians/members)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.