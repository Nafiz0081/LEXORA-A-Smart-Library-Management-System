package src;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class MemberService {
    public static class Member {
        public final int memberId;
        public final String fullName;
        public final String email;
        public final String phone;
        public final Date joinDate;
        public final String status;
        public Member(int memberId, String fullName, String email, String phone, Date joinDate, String status) {
            this.memberId = memberId;
            this.fullName = fullName;
            this.email = email;
            this.phone = phone;
            this.joinDate = joinDate;
            this.status = status;
        }
    }

    public static boolean addMember(String fullName, String email, String phone) {
        String sql = "INSERT INTO members (full_name, email, phone) VALUES (?, ?, ?)";
        try (Connection conn = DbUtil.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, fullName);
            ps.setString(2, email);
            ps.setString(3, phone);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("Add member error: " + e.getMessage());
            return false;
        }
    }

    public static boolean updateMember(int memberId, String fullName, String email, String phone, String status) {
        String sql = "UPDATE members SET full_name=?, email=?, phone=?, status=? WHERE member_id=?";
        try (Connection conn = DbUtil.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, fullName);
            ps.setString(2, email);
            ps.setString(3, phone);
            ps.setString(4, status);
            ps.setInt(5, memberId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("Update member error: " + e.getMessage());
            return false;
        }
    }

    public static boolean deleteMember(int memberId) {
        String sql = "DELETE FROM members WHERE member_id=?";
        try (Connection conn = DbUtil.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, memberId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("Delete member error: " + e.getMessage());
            return false;
        }
    }

    public static Member getMemberById(int memberId) {
        String sql = "SELECT * FROM members WHERE member_id=?";
        try (Connection conn = DbUtil.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, memberId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new Member(
                        rs.getInt("member_id"),
                        rs.getString("full_name"),
                        rs.getString("email"),
                        rs.getString("phone"),
                        rs.getDate("join_date"),
                        rs.getString("status")
                    );
                }
            }
        } catch (SQLException e) {
            System.err.println("Get member error: " + e.getMessage());
        }
        return null;
    }

    public static List<Member> searchMembers(String keyword) {
        List<Member> members = new ArrayList<>();
        String sql = "SELECT * FROM members WHERE LOWER(full_name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(phone) LIKE ? ORDER BY full_name";
        try (Connection conn = DbUtil.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            String kw = "%" + keyword.toLowerCase() + "%";
            ps.setString(1, kw);
            ps.setString(2, kw);
            ps.setString(3, kw);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    members.add(new Member(
                        rs.getInt("member_id"),
                        rs.getString("full_name"),
                        rs.getString("email"),
                        rs.getString("phone"),
                        rs.getDate("join_date"),
                        rs.getString("status")
                    ));
                }
            }
        } catch (SQLException e) {
            System.err.println("Search members error: " + e.getMessage());
        }
        return members;
    }

    // Get member's total borrowed books count using PL/SQL function
    public static int getMemberTotalBorrows(int memberId) {
        String sql = "SELECT fn_member_total_borrows(?) FROM dual";
        try (Connection conn = DbUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, String.valueOf(memberId));
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                return rs.getInt(1);
            }
        } catch (SQLException e) {
            System.err.println("Error getting member total borrows: " + e.getMessage());
        }
        return 0;
    }

    public static List<Member> getAllMembers() {
        List<Member> members = new ArrayList<>();
        String sql = "SELECT member_id, full_name, email, phone, join_date, status FROM members";
        try (Connection conn = DbUtil.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                members.add(new Member(
                    rs.getInt("member_id"),
                    rs.getString("full_name"),
                    rs.getString("email"),
                    rs.getString("phone"),
                    rs.getDate("join_date"),
                    rs.getString("status")
                ));
            }
        } catch (SQLException e) {
            System.err.println("Fetch all members error: " + e.getMessage());
        }
        return members;
    }
}