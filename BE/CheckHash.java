import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class CheckHash {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(10);
        String raw = "123456";
        String encoded = "$2a$10$slYQmyNdGzin7olVAklrue86.OJGSLByyL2L.BT1ZvqWnz.74iEm";
        System.out.println("Matches: " + encoder.matches(raw, encoded));
        System.out.println("New Hash: " + encoder.encode(raw));
    }
}
