package src;

import java.util.Scanner;
import java.util.List;
import java.util.Date;

public class LexoraApp {
    private static Scanner scanner = new Scanner(System.in);

    public static void main(String[] args) {

        System.out.println(PasswordUtil.hashPassword("admin123"));
        // Test database data fetching

        System.out.println("Welcome to Lexora Library Management System");
        while (true) {
            System.out.println("\n1. Login\n2. Exit");
            System.out.print("Select an option: ");
            String choice = scanner.nextLine();
            if (choice.equals("1")) {
                loginFlow();
            } else if (choice.equals("2")) {
                System.out.println("Goodbye!");
                break;
            } else {
                System.out.println("Invalid option. Try again.");
            }
        }
    }

    private static void loginFlow() {
        System.out.print("Username: ");
        String username = scanner.nextLine();
        System.out.print("Password: ");
        String password = scanner.nextLine();
        AuthService.AuthResult auth = AuthService.authenticate(username, password);
        if (auth == null) {
            System.out.println("Login failed. Please check your credentials.");
            return;
        }
        System.out.println("\nLogin successful! Welcome, " + auth.username + " (" + auth.role + ")");
        if ("LIBRARIAN".equalsIgnoreCase(auth.role)) {
            librarianMenu();
        } else if ("MEMBER".equalsIgnoreCase(auth.role)) {
            memberMenu(auth.memberId);
        } else {
            System.out.println("Unknown role. Contact admin.");
        }
    }

    private static void librarianMenu() {
        while (true) {
            System.out.println("\n--- Librarian Menu ---");
            System.out.println("1. Manage Books");
            System.out.println("2. Manage Members");
            System.out.println("3. Borrowing/Returning");
            System.out.println("4. Reports");
            System.out.println("5. View All Books");
            System.out.println("6. View All Members");
            System.out.println("7. Logout");
            System.out.println("8. View Currently Rented Books");
            System.out.print("Select an option: ");
            String choice = scanner.nextLine();
            switch (choice) {
                case "1":
                    manageBooks();
                    break;
                case "2":
                    manageMembers();
                    break;
                case "3":
                    manageBorrowing();
                    break;
                case "4":
                    showReports();
                    break;
                case "5":
                    viewAllBooks();
                    break;
                case "6":
                    viewAllMembers();
                    break;
                case "7":
                    return;
                case "8":
                    viewCurrentlyRentedBooks();
                    break;
                default:
                    System.out.println("Invalid option. Try again.");
            }
        }
    }

    private static void memberMenu(Integer memberId) {
        while (true) {
            System.out.println("\n--- Member Menu ---");
            System.out.println("1. Search Books");
            System.out.println("2. View My Borrowings");
            System.out.println("3. Logout");
            System.out.print("Select an option: ");
            String choice = scanner.nextLine();
            switch (choice) {
                case "1":
                    searchBooks();
                    break;
                case "2":
                    viewMyBorrowings(memberId);
                    break;
                case "3":
                    return;
                default:
                    System.out.println("Invalid option. Try again.");
            }
        }
    }

    // --- Book Management ---
    private static void manageBooks() {
        while (true) {
            System.out.println("\n--- Book Management ---");
            System.out.println("1. Add Book");
            System.out.println("2. Update Book");
            System.out.println("3. Delete Book");
            System.out.println("4. Search Books");
            System.out.println("5. Back");
            System.out.print("Select an option: ");
            String choice = scanner.nextLine();
            switch (choice) {
                case "1":
                    addBook();
                    break;
                case "2":
                    updateBook();
                    break;
                case "3":
                    deleteBook();
                    break;
                case "4":
                    searchBooks();
                    break;
                case "5":
                    return;
                default:
                    System.out.println("Invalid option. Try again.");
            }
        }
    }

    private static void addBook() {
        System.out.print("ISBN: ");
        String isbn = scanner.nextLine();
        System.out.print("Title: ");
        String title = scanner.nextLine();
        System.out.print("Author: ");
        String author = scanner.nextLine();
        System.out.print("Category: ");
        String category = scanner.nextLine();
        System.out.print("Published Year: ");
        int year = Integer.parseInt(scanner.nextLine());
        System.out.print("Total Copies: ");
        int copies = Integer.parseInt(scanner.nextLine());
        boolean success = BookService.addBook(isbn, title, author, category, year, copies);
        System.out.println(success ? "Book added successfully." : "Failed to add book.");
    }

    private static void updateBook() {
        System.out.print("Book ID to update: ");
        int bookId = Integer.parseInt(scanner.nextLine());
        System.out.print("New Title: ");
        String title = scanner.nextLine();
        System.out.print("New Author: ");
        String author = scanner.nextLine();
        System.out.print("New Category: ");
        String category = scanner.nextLine();
        System.out.print("New Published Year: ");
        int year = Integer.parseInt(scanner.nextLine());
        System.out.print("New Total Copies: ");
        int copies = Integer.parseInt(scanner.nextLine());
        System.out.print("New Status (AVAILABLE/REMOVED): ");
        String status = scanner.nextLine();
        boolean success = BookService.updateBook(bookId, title, author, category, year, copies, status);
        System.out.println(success ? "Book updated successfully." : "Failed to update book.");
    }

    private static void deleteBook() {
        System.out.print("Book ID to delete: ");
        int bookId = Integer.parseInt(scanner.nextLine());
        boolean success = BookService.deleteBook(bookId);
        System.out.println(success ? "Book deleted successfully." : "Failed to delete book.");
    }

    private static void searchBooks() {
        System.out.print("Enter keyword to search: ");
        String keyword = scanner.nextLine();
        List<BookService.Book> books = BookService.searchBooks(keyword);
        if (books.isEmpty()) {
            System.out.println("No books found.");
        } else {
            System.out.println("\n--- Book List ---");
            for (BookService.Book b : books) {
                System.out.println("ID: " + b.bookId + ", ISBN: " + b.isbn + ", Title: " + b.title + ", Author: " + b.author + ", Category: " + b.category + ", Year: " + b.publishedYear + ", Total Copies: " + b.totalCopies + ", Borrowed: " + b.borrowedCopies + ", Available: " + b.availableCopies + ", Status: " + b.status);
            }
        }
    }

    // --- Member Management ---
    private static void manageMembers() {
        while (true) {
            System.out.println("\n--- Member Management ---");
            System.out.println("1. Add Member");
            System.out.println("2. Update Member");
            System.out.println("3. Delete Member");
            System.out.println("4. Back");
            System.out.print("Select an option: ");
            String choice = scanner.nextLine();
            switch (choice) {
                case "1":
                    addMember();
                    break;
                case "2":
                    updateMember();
                    break;
                case "3":
                    deleteMember();
                    break;
                case "4":
                    return;
                default:
                    System.out.println("Invalid option. Try again.");
            }
        }
    }

    private static void addMember() {
        System.out.print("Full Name: ");
        String name = scanner.nextLine();
        System.out.print("Email: ");
        String email = scanner.nextLine();
        System.out.print("Phone: ");
        String phone = scanner.nextLine();
        boolean success = MemberService.addMember(name, email, phone);
        System.out.println(success ? "Member added successfully." : "Failed to add member.");
    }

    private static void updateMember() {
        System.out.print("Member ID to update: ");
        int memberId = Integer.parseInt(scanner.nextLine());
        System.out.print("New Full Name: ");
        String name = scanner.nextLine();
        System.out.print("New Email: ");
        String email = scanner.nextLine();
        System.out.print("New Phone: ");
        String phone = scanner.nextLine();
        System.out.print("New Status (ACTIVE/INACTIVE): ");
        String status = scanner.nextLine();
        boolean success = MemberService.updateMember(memberId, name, email, phone, status);
        System.out.println(success ? "Member updated successfully." : "Failed to update member.");
    }

    private static void deleteMember() {
        System.out.print("Member ID to delete: ");
        int memberId = Integer.parseInt(scanner.nextLine());
        boolean success = MemberService.deleteMember(memberId);
        System.out.println(success ? "Member deleted successfully." : "Failed to delete member.");
    }

    // --- Borrowing/Returning ---
    private static void manageBorrowing() {
        while (true) {
            System.out.println("\n--- Borrowing/Returning ---");
            System.out.println("1. Issue Book");
            System.out.println("2. Return Book");
            System.out.println("3. Back");
            System.out.print("Select an option: ");
            String choice = scanner.nextLine();
            switch (choice) {
                case "1":
                    issueBook();
                    break;
                case "2":
                    returnBook();
                    break;
                case "3":
                    return;
                default:
                    System.out.println("Invalid option. Try again.");
            }
        }
    }

    private static void issueBook() {
        System.out.print("Member ID: ");
        int memberId = Integer.parseInt(scanner.nextLine());
        System.out.print("Book ID: ");
        int bookId = Integer.parseInt(scanner.nextLine());
        System.out.print("Due Date (yyyy-mm-dd): ");
        String dueDateStr = scanner.nextLine();
        try {
            Date dueDate = java.sql.Date.valueOf(dueDateStr);
            boolean success = BorrowingService.issueBook(memberId, bookId, dueDate);
            System.out.println(success ? "Book issued successfully." : "Failed to issue book.");
        } catch (Exception e) {
            System.out.println("Invalid date format.");
        }
    }

    private static void returnBook() {
        System.out.print("Borrow ID: ");
        int borrowId = Integer.parseInt(scanner.nextLine());
        System.out.print("Fine Amount (if any, else 0): ");
        double fine = Double.parseDouble(scanner.nextLine());
        boolean success = BorrowingService.returnBook(borrowId, fine);
        System.out.println(success ? "Book returned successfully." : "Failed to return book.");
    }

    // --- Reports ---
    private static void showReports() {
        System.out.println("\n--- Reports ---");
        System.out.println("1. Overdue Borrowings");
        System.out.println("2. Back");
        System.out.print("Select an option: ");
        String choice = scanner.nextLine();
        if (choice.equals("1")) {
            List<BorrowingService.Borrowing> overdue = BorrowingService.getOverdueBorrowings();
            if (overdue.isEmpty()) {
                System.out.println("No overdue borrowings.");
            } else {
                System.out.println("\n--- Overdue Borrowings ---");
                for (BorrowingService.Borrowing b : overdue) {
                    System.out.println("Borrow ID: " + b.borrowId + ", Member ID: " + b.memberId + ", Book ID: " + b.bookId + ", Due: " + b.dueDate + ", Fine: " + b.fineAmount + ", Status: " + b.status);
                }
            }
        }
    }

    // --- Member Borrowings ---
    private static void viewMyBorrowings(Integer memberId) {
        List<BorrowingService.Borrowing> list = BorrowingService.getBorrowingsByMember(memberId);
        if (list.isEmpty()) {
            System.out.println("You have no borrowings.");
        } else {
            System.out.println("\n--- My Borrowings ---");
            for (BorrowingService.Borrowing b : list) {
                System.out.println("Borrow ID: " + b.borrowId + ", Book ID: " + b.bookId + ", Issue: " + b.issueDate + ", Due: " + b.dueDate + ", Returned: " + b.returnDate + ", Fine: " + b.fineAmount + ", Status: " + b.status);
            }
        }
    }

    private static void viewAllBooks() {
        List<BookService.Book> books = BookService.getAllBooks();
        if (books.isEmpty()) {
            System.out.println("No books found.");
        } else {
            System.out.println("\n--- All Books ---");
            for (BookService.Book b : books) {
                System.out.println("ID: " + b.bookId + ", ISBN: " + b.isbn + ", Title: " + b.title + ", Author: " + b.author + ", Category: " + b.category + ", Year: " + b.publishedYear + ", Total Copies: " + b.totalCopies + ", Borrowed: " + b.borrowedCopies + ", Available: " + b.availableCopies + ", Status: " + b.status);
            }
        }
    }

    private static void viewAllMembers() {
        List<MemberService.Member> members = MemberService.getAllMembers();
        if (members.isEmpty()) {
            System.out.println("No members found.");
        } else {
            System.out.println("\n--- All Members ---");
            for (MemberService.Member m : members) {
                System.out.println("ID: " + m.memberId + ", Name: " + m.fullName + ", Email: " + m.email + ", Phone: " + m.phone + ", Status: " + m.status);
            }
        }
    }
    private static void viewCurrentlyRentedBooks() {
        List<BorrowingService.Borrowing> borrowed = BorrowingService.getCurrentlyBorrowedBooks();
        if (borrowed.isEmpty()) {
            System.out.println("No books are currently rented.");
        } else {
            System.out.println("\n--- Currently Rented Books ---");
            java.util.Date today = new java.util.Date();
            for (BorrowingService.Borrowing b : borrowed) {
                long diff = b.dueDate.getTime() - today.getTime();
                long daysLeft = diff / (1000 * 60 * 60 * 24);
                System.out.println("Borrow ID: " + b.borrowId + ", Member ID: " + b.memberId + ", Book ID: " + b.bookId + ", Due: " + b.dueDate + ", Days Remaining: " + daysLeft + ", Status: " + b.status);
            }
        }
    }



}




