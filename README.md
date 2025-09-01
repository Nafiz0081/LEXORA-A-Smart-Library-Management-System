# Lexora Library Management System (CLI)

Lexora is a command-line Java application for managing library operations with an Oracle database backend. It supports librarian and member roles, book inventory, borrowing/returning, fines, and reporting.

## Features
- Role-based authentication (Librarian/Member)
- Book catalog management
- Member management
- Borrow/return books with due dates
- Fine calculation for overdue returns
- Search and reporting modules

## Requirements
- Java 11 or higher
- Oracle Database (schema pre-created)
- Oracle JDBC Driver (ojdbc8.jar or newer)

## Setup
1. Place the Oracle JDBC driver in the `lib/` directory.
2. Configure database credentials in `DbUtil.java`.
3. Compile with:
   ```
   javac -cp lib/ojdbc8.jar;. src/*.java
   ```
4. Run with:
   ```
   java -cp lib/ojdbc8.jar;. src.LexoraApp
   ```

## Database Connection
- User: lexora_user
- Password: lexora_password
- Schema: as provided

## Modules
- SmartSearch
- Circulation Manager
- PatronProfile
- PenaltyEngine
- InsightBoard
- InventoryPulse
- SecureOps

---

This project is modular and extensible. See source files for details.