package parking_Building_Management_System.service.Auth;

import parking_Building_Management_System.entity.user.ParkingUserDetails; // Đây là class chuẩn bạn đã tạo
import parking_Building_Management_System.entity.user.User;
import parking_Building_Management_System.repository.UserRepository;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class JWTAuthenticationFilter extends OncePerRequestFilter {
    private final JWTService jwtService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        String email;

        try {
            email = jwtService.extractAllClaims(token).getSubject();
        } catch (ExpiredJwtException e) {
            email = e.getClaims().getSubject();
        } catch (Exception e) {
            filterChain.doFilter(request, response);
            return;
        }

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            User user = userRepository.findByEmail(email);

            if (user == null) {
                filterChain.doFilter(request, response);
                return;
            }

            if (jwtService.isTokenExpired(token)) {
                String refreshToken = user.getRefreshToken();

                if (refreshToken != null && !jwtService.isTokenExpired(refreshToken)) {
                    Map<String, String> tokens = jwtService.generateTokens(user);
                    String newAccessToken = tokens.get("accessToken");

                    response.setHeader("New-Access-Token", newAccessToken);
                } else {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("Session expired. Please login again.");
                    return;
                }
            }

            // ĐÚNG: Đổi từ CustomUserDetails sang ParkingUserDetails cho khớp với dòng import số 3
            ParkingUserDetails userDetails = new ParkingUserDetails(user);

            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        filterChain.doFilter(request, response);
    }
}