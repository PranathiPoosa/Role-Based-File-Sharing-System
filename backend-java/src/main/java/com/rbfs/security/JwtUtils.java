package com.rbfs.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtils {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${rbfs.jwtSecret}")
    private String jwtSecret;

    @Value("${rbfs.jwtExpirationMs}")
    private int jwtExpirationMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String userId, String name, String email, String role) {
        return Jwts.builder()
                .setSubject(email)
                .claim("id", userId)
                .claim("name", name)
                .claim("email", email)
                .claim("role", role != null ? role.toLowerCase() : "user")
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateTokenFromUsername(String email) {
        return generateToken(null, email, email, "user");
    }

    public Claims getClaimsFromJwtToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String getEmailFromJwtToken(String token) {
        Claims claims = getClaimsFromJwtToken(token);
        String sub = claims.getSubject();
        if (sub != null && !sub.isEmpty()) {
            return sub;
        }
        return claims.get("email", String.class);
    }

    public String getUserIdFromJwtToken(String token) {
        Claims claims = getClaimsFromJwtToken(token);
        String id = claims.get("id", String.class);
        if (id == null) {
            id = claims.get("userId", String.class);
        }
        return id;
    }

    public String getNameFromJwtToken(String token) {
        Claims claims = getClaimsFromJwtToken(token);
        String name = claims.get("name", String.class);
        return name != null ? name : getEmailFromJwtToken(token);
    }

    public String getRoleFromJwtToken(String token) {
        Claims claims = getClaimsFromJwtToken(token);
        return claims.get("role", String.class);
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parse(authToken);
            return true;
        } catch (MalformedJwtException e) {
            logger.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("JWT claims string is empty: {}", e.getMessage());
        }
        return false;
    }
}
