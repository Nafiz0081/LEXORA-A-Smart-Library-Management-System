package src;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class AuthService {
    public static class AuthResult {
        public final int userId;
        public final String username;
        public final String role;
        public final Integer memberId;
        public AuthResult(int userId, String username, String role, Integer memberId) {
            this.userId = userId;
            this.username = username;
            this.role = role;
            this.memberId = memberId;
        }
    }

    public static AuthResult authenticate(String username, String password) {
        String sql = "SELECT user_id, username, password_hash, role_name, member_id " +
                "FROM app_users " +
                "WHERE UPPER(TRIM(username)) = UPPER(TRIM(?)) " +
                "AND NVL(active, 'N') = 'Y'";

        try (Connection conn = DbUtil.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, username);
            try (ResultSet rs = ps.executeQuery()) {
                boolean hasRow = rs.next();
                System.out.println("Hello1");
                System.out.println(hasRow);
                if (hasRow) {
                    System.out.println("Hello2");
                    String hash = rs.getString("password_hash");
                    System.out.println("Debug: Username: " + username);
                    System.out.println("Debug: Retrieved hash: " + hash);
                    System.out.println("Debug: Provided password: " + password);
                    if (PasswordUtil.verifyPassword(password, hash)) {
                        System.out.println("Hello");
                        int userId = rs.getInt("user_id");
                        String role = rs.getString("role_name");
                        Integer memberId = rs.getObject("member_id") != null ? rs.getInt("member_id") : null;
                        return new AuthResult(userId, username, role, memberId);
                    }
                }
            }
        } catch (SQLException e) {
            System.err.println("Authentication error: " + e.getMessage());
        }
        return null;
    }
}