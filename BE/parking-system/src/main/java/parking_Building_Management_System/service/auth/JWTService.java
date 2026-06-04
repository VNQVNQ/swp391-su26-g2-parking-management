package parking_Building_Management_System.service.Auth;

import parking_Building_Management_System.entity.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;

@Service
public class JWTService {
    @Value("${jwt.secret}")
    private String secretKey;

    public String createToken(Map<String, Object> claims, String subject, long accessTime){
        return Jwts.builder()
                .setClaims(claims) // dữ liệu cần lưu
                .setSubject(subject) // tên tài khoản
                .setIssuedAt(new Date()) //thời gian tạo
                .setExpiration(new Date(System.currentTimeMillis() + accessTime)) //thời gian kết thúc
                .signWith(SignatureAlgorithm.HS256, secretKey)
                .compact();
    }

    public Map<String, String> generateTokens(User user){
        Map<String, Object> claims = Map.of(
                "userId", user.getUser_id()
        );

        String access = createToken(claims, user.getEmail(), 15 * 60 * 1000);
        String refresh = createToken(Map.of(), user.getEmail(), 30L * 24 * 60 * 60 * 1000);

        return Map.of("accessToken", access, "refreshToken", refresh);
    }

    public Map<String, String> generateTokenLockAccount(User user){
        Map<String, Object> claims = Map.of(
                "userId", user.getUser_id()
        );

        String tokenLockAcount = createToken(claims, user.getEmail(), 10 * 60 * 1000);

        return Map.of("TokenLockAccount", tokenLockAcount);
    }

    public Map<String, String> generateTokenResetPassword(User user){
        Map<String, Object> claims = Map.of(
                "userId", user.getUser_id()
        );

        String tokenResetPassword = createToken(claims, user.getEmail(), 10 * 60 * 1000);

        return Map.of("TokenResetPassword", tokenResetPassword);
    }

    private SecretKey getSignKey(){
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public Claims extractAllClaims(String token){
        return Jwts.parser()
                .setSigningKey(getSignKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public boolean isTokenExpired(String token) {
        Date expirationDate = extractAllClaims(token).getExpiration();
        return expirationDate.before(new Date());
    }

    public boolean isTokenValid(String token, String email) {
        final String subject = extractAllClaims(token).getSubject();
        return (subject.equals(email) && !isTokenExpired(token));
    }

    public Map<String, String> refreshAccessToken(String refreshToken) {
        try{
            if (isTokenExpired(refreshToken)) {
                throw new RuntimeException("Refresh token đã hết hạn, vui lòng đăng nhập lại.");
            }
            String username = extractAllClaims(refreshToken).getSubject();
            String newAccessToken = createToken(
                    Map.of("username", username),
                    username,
                    15 * 60 * 1000
            );
            return Map.of("accessToken", newAccessToken);
        }catch (Exception e){
            throw new RuntimeException("Refresh token không hợp lệ hoặc hết hạn.");
        }
    }
}
