package com.rbfs.controllers;

import com.rbfs.models.User;
import com.rbfs.repositories.UserRepository;
import com.rbfs.security.JwtUtils;
import com.rbfs.security.UserDetailsImpl;
import com.rbfs.services.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired(required = false)
    AuditService auditService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        String role = userDetails.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "").toLowerCase();
        String jwt = jwtUtils.generateToken(userDetails.getId(), userDetails.getName(), userDetails.getEmail(), role);

        // Update last login timestamp
        userRepository.findByEmail(userDetails.getEmail()).ifPresent(user -> {
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);
        });

        if (auditService != null) {
            auditService.log(
                    userDetails.getId(),
                    userDetails.getEmail(),
                    "USER_LOGIN",
                    userDetails.getId(),
                    "AUTH",
                    "User logged in successfully",
                    request.getRemoteAddr(),
                    "SUCCESS"
            );
        }

        Map<String, Object> response = new HashMap<>();
        response.put("_id", userDetails.getId());
        response.put("name", userDetails.getName());
        response.put("email", userDetails.getEmail());
        response.put("role", role);
        response.put("token", jwt);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest signUpRequest, HttpServletRequest request) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use!"));
        }

        String assignedRole = signUpRequest.getRole() == null ? "user" : signUpRequest.getRole().toLowerCase();

        // Create new user's account
        User user = User.builder()
                .name(signUpRequest.getName())
                .email(signUpRequest.getEmail())
                .password(encoder.encode(signUpRequest.getPassword()))
                .role(assignedRole)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        userRepository.save(user);

        // Auto login with stateless claims
        String jwt = jwtUtils.generateToken(user.getId(), user.getName(), user.getEmail(), user.getRole());

        if (auditService != null) {
            auditService.log(
                    user.getId(),
                    user.getEmail(),
                    "USER_REGISTER",
                    user.getId(),
                    "AUTH",
                    "New user registered with role: " + assignedRole,
                    request.getRemoteAddr(),
                    "SUCCESS"
            );
        }

        Map<String, Object> response = new HashMap<>();
        response.put("_id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("role", user.getRole());
        response.put("token", jwt);

        return ResponseEntity.ok(response);
    }

    public static class LoginRequest {
        private String email;
        private String password;

        public LoginRequest() {}
        public LoginRequest(String email, String password) {
            this.email = email;
            this.password = password;
        }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class RegisterRequest {
        private String name;
        private String email;
        private String password;
        private String role;

        public RegisterRequest() {}
        public RegisterRequest(String name, String email, String password, String role) {
            this.name = name;
            this.email = email;
            this.password = password;
            this.role = role;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }

    public static class MessageResponse {
        private String message;

        public MessageResponse() {}
        public MessageResponse(String message) {
            this.message = message;
        }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}
