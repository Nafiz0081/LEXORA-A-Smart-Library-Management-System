package src;

import java.sql.*;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class BorrowingService {
    public static class Borrowing {
        public final int borrowId;
        public final int memberId;
        public final int bookId;
        public final Date issueDate;
        public final Date dueDate;
        public final Date returnDate;
        public final double fineAmount;
        public final String status;
        public Borrowing(int borrowId, int memberId, int bookId, Date issueDate, Date dueDate, Date returnDate, double fineAmount, String status) {
            this.borrowId = borrowId;
            this.memberId = memberId;
            this.bookId = bookId;
            this.issueDate = issueDate;
            this.dueDate = dueDate;
            this.returnDate = returnDate;
            this.fineAmount = fineAmount;
            this.status = status;
        }
    }

    public static boolean issueBook(int memberId, int bookId, Date dueDate) {
        String sql = "INSERT INTO borrowings (member_id, book_id, due_date) VALUES (?, ?, ?)";
        String updateBookSql = "UPDATE books SET available_copies = available_copies - 1 WHERE book_id = ? AND available_copies > 0";
        Connection conn = null;
        PreparedStatement ps = null;
        PreparedStatement psUpdate = null;
        try {
            conn = DbUtil.getConnection();
            conn.setAutoCommit(false);
            psUpdate = conn.prepareStatement(updateBookSql);
            psUpdate.setInt(1, bookId);
            int updated = psUpdate.executeUpdate();
            if (updated == 0) {
                conn.rollback();
                System.err.println("No available copies to borrow.");
                return false;
            }
            ps = conn.prepareStatement(sql);
            ps.setInt(1, memberId);
            ps.setInt(2, bookId);
            ps.setDate(3, new java.sql.Date(dueDate.getTime()));
            boolean result = ps.executeUpdate() > 0;
            conn.commit();
            return result;
        } catch (SQLException e) {
            if (conn != null) {
                try { conn.rollback(); } catch (SQLException ex) { ex.printStackTrace(); }
            }
            System.err.println("Issue book error: " + e.getMessage());
            return false;
        } finally {
            try { if (ps != null) ps.close(); } catch (SQLException e) {}
            try { if (psUpdate != null) psUpdate.close(); } catch (SQLException e) {}
            try { if (conn != null) conn.setAutoCommit(true); conn.close(); } catch (SQLException e) {}
        }
    }

    public static boolean returnBook(int borrowId, double fineAmount) {
        String sql = "UPDATE borrowings SET return_date=TRUNC(SYSDATE), fine_amount=?, status='RETURNED' WHERE borrow_id=? AND status='ISSUED'";
        try (Connection conn = DbUtil.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDouble(1, fineAmount);
            ps.setInt(2, borrowId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("Return book error: " + e.getMessage());
            return false;
        }
    }

    public static List<Borrowing> getBorrowingsByMember(int memberId) {
        List<Borrowing> list = new ArrayList<>();
        String sql = "SELECT * FROM borrowings WHERE member_id=? ORDER BY issue_date DESC";
        try (Connection conn = DbUtil.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, memberId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new Borrowing(
                        rs.getInt("borrow_id"),
                        rs.getInt("member_id"),
                        rs.getInt("book_id"),
                        rs.getDate("issue_date"),
                        rs.getDate("due_date"),
                        rs.getDate("return_date"),
                        rs.getDouble("fine_amount"),
                        rs.getString("status")
                    ));
                }
            }
        } catch (SQLException e) {
            System.err.println("Get borrowings error: " + e.getMessage());
        }
        return list;
    }

    public static List<Borrowing> getOverdueBorrowings() {
        List<Borrowing> list = new ArrayList<>();
        String sql = "SELECT * FROM borrowings WHERE due_date < TRUNC(SYSDATE) AND status='ISSUED'";
        try (Connection conn = DbUtil.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new Borrowing(
                        rs.getInt("borrow_id"),
                        rs.getInt("member_id"),
                        rs.getInt("book_id"),
                        rs.getDate("issue_date"),
                        rs.getDate("due_date"),
                        rs.getDate("return_date"),
                        rs.getDouble("fine_amount"),
                        rs.getString("status")
                    ));
                }
            }
        } catch (SQLException e) {
            System.err.println("Get overdue borrowings error: " + e.getMessage());
        }
        return list;
    }

    public static List<Borrowing> getCurrentlyBorrowedBooks() {
        List<Borrowing> list = new ArrayList<>();
        String sql = "SELECT * FROM borrowings WHERE status='ISSUED' ORDER BY due_date ASC";
        try (Connection conn = DbUtil.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new Borrowing(
                        rs.getInt("borrow_id"),
                        rs.getInt("member_id"),
                        rs.getInt("book_id"),
                        rs.getDate("issue_date"),
                        rs.getDate("due_date"),
                        rs.getDate("return_date"),
                        rs.getDouble("fine_amount"),
                        rs.getString("status")
                    ));
                }
            }
        } catch (SQLException e) {
            System.err.println("Get currently borrowed books error: " + e.getMessage());
        }
        return list;
    }

    public static double calculateFine(Date dueDate, Date returnDate, double dailyRate) {
        if (returnDate == null || !returnDate.after(dueDate)) return 0.0;
        long diff = returnDate.getTime() - dueDate.getTime();
        long days = diff / (1000 * 60 * 60 * 24);
        return days * dailyRate;
    }
}