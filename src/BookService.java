package src;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class BookService {
    public static class Book {
        public final int bookId;
        public final String isbn;
        public final String title;
        public final String author;
        public final String category;
        public final int publishedYear;
        public final int totalCopies;
        public final int availableCopies;
        public final int borrowedCopies;
        public final String status;
        public Book(int bookId, String isbn, String title, String author, String category, int publishedYear, int totalCopies, int availableCopies, int borrowedCopies, String status) {
            this.bookId = bookId;
            this.isbn = isbn;
            this.title = title;
            this.author = author;
            this.category = category;
            this.publishedYear = publishedYear;
            this.totalCopies = totalCopies;
            this.availableCopies = availableCopies;
            this.borrowedCopies = borrowedCopies;
            this.status = status;
        }
    }

    public static boolean addBook(String isbn, String title, String author, String category, int publishedYear, int totalCopies) {
        String sql = "INSERT INTO books (isbn, title, author, category, published_year, total_copies, available_copies, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'AVAILABLE')";
        try (Connection conn = DbUtil.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, isbn);
            ps.setString(2, title);
            ps.setString(3, author);
            ps.setString(4, category);
            ps.setInt(5, publishedYear);
            ps.setInt(6, totalCopies);
            ps.setInt(7, totalCopies);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("Add book error: " + e.getMessage());
            return false;
        }
    }

    public static boolean updateBook(int bookId, String title, String author, String category, int publishedYear, int totalCopies, String status) {
        String sql = "UPDATE books SET title=?, author=?, category=?, published_year=?, total_copies=?, status=? WHERE book_id=?";
        try (Connection conn = DbUtil.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, title);
            ps.setString(2, author);
            ps.setString(3, category);
            ps.setInt(4, publishedYear);
            ps.setInt(5, totalCopies);
            ps.setString(6, status);
            ps.setInt(7, bookId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("Update book error: " + e.getMessage());
            return false;
        }
    }

    public static boolean deleteBook(int bookId) {
        String sql = "DELETE FROM books WHERE book_id=?";
        try (Connection conn = DbUtil.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, bookId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("Delete book error: " + e.getMessage());
            return false;
        }
    }

    public static List<Book> searchBooks(String keyword) {
        List<Book> books = new ArrayList<>();
        String sql = "SELECT * FROM books WHERE LOWER(title) LIKE ? OR LOWER(author) LIKE ? OR LOWER(category) LIKE ? ORDER BY title";
        try (Connection conn = DbUtil.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            String kw = "%" + keyword.toLowerCase() + "%";
            ps.setString(1, kw);
            ps.setString(2, kw);
            ps.setString(3, kw);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    books.add(new Book(
                        rs.getInt("book_id"),
                        rs.getString("isbn"),
                        rs.getString("title"),
                        rs.getString("author"),
                        rs.getString("category"),
                        rs.getInt("published_year"),
                        rs.getInt("total_copies"),
                        rs.getInt("available_copies"),
                        0,
                        rs.getString("status")
                    ));
                }
            }
        } catch (SQLException e) {
            System.err.println("Search books error: " + e.getMessage());
        }
        return books;
    }

    // Count books by author using PL/SQL function
    public static int countBooksByAuthor(String author) {
        String sql = "SELECT fn_count_books_by_author(?) FROM dual";
        try (Connection conn = DbUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, author);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                return rs.getInt(1);
            }
        } catch (SQLException e) {
            System.err.println("Error counting books by author: " + e.getMessage());
        }
        return 0;
    }

    public static Book getBookById(int bookId) {
        String sql = "SELECT * FROM books WHERE book_id=?";
        try (Connection conn = DbUtil.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, bookId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new Book(
                        rs.getInt("book_id"),
                        rs.getString("isbn"),
                        rs.getString("title"),
                        rs.getString("author"),
                        rs.getString("category"),
                        rs.getInt("published_year"),
                        rs.getInt("total_copies"),
                        rs.getInt("available_copies"),
                        0,
                        rs.getString("status")
                    );
                }
            }
        } catch (SQLException e) {
            System.err.println("Get book error: " + e.getMessage());
        }
        return null;
    }

    public static List<Book> getAllBooks() {
        List<Book> books = new ArrayList<>();
        String sql = "SELECT book_id, isbn, title, author, category, published_year, total_copies, available_copies, status FROM books";
        String borrowedSql = "SELECT book_id, COUNT(*) AS borrowed_count FROM borrowings WHERE return_date IS NULL GROUP BY book_id";
        java.util.Map<Integer, Integer> borrowedMap = new java.util.HashMap<>();
        try (Connection conn = DbUtil.getConnection();
             PreparedStatement psBorrowed = conn.prepareStatement(borrowedSql);
             ResultSet rsBorrowed = psBorrowed.executeQuery()) {
            while (rsBorrowed.next()) {
                borrowedMap.put(rsBorrowed.getInt("book_id"), rsBorrowed.getInt("borrowed_count"));
            }
        } catch (SQLException e) {
            System.err.println("Fetch borrowed books error: " + e.getMessage());
        }
        try (Connection conn = DbUtil.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                int bookId = rs.getInt("book_id");
                int borrowedCopies = borrowedMap.getOrDefault(bookId, 0);
                books.add(new Book(
                    bookId,
                    rs.getString("isbn"),
                    rs.getString("title"),
                    rs.getString("author"),
                    rs.getString("category"),
                    rs.getInt("published_year"),
                    rs.getInt("total_copies"),
                    rs.getInt("available_copies"),
                    borrowedCopies,
                    rs.getString("status")
                ));
            }
        } catch (SQLException e) {
            System.err.println("Fetch all books error: " + e.getMessage());
        }
        return books;
    }
}