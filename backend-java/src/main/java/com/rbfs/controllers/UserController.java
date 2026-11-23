package com.rbfs.controllers;

import com.rbfs.models.User;
import com.rbfs.repositories.UserRepository;
import com.rbfs.security.UserDetailsImpl;
import com.rbfs.services.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired(required = false)
    private AuditService auditService;

    @GetMapping("/profile")
    public ResponseEntity<User> getProfile() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findById(userDetails.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String name = body.get("name");
        String email = body.get("email");
        String password = body.get("password");
        String role = body.getOrDefault("role", "user").toLowerCase();

        if (name == null || email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Name, email, and password are required"));
        }

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("message", "User with this email already exists"));
        }

        User newUser = User.builder()
                .name(name.trim())
                .email(email.trim().toLowerCase())
                .password(encoder.encode(password))
                .role(role)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        User saved = userRepository.save(newUser);

        UserDetailsImpl adminDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (auditService != null) {
            auditService.log(
                    adminDetails.getId(),
                    adminDetails.getEmail(),
                    "USER_CREATE",
                    saved.getId(),
                    "USER",
                    "Admin created user '" + saved.getEmail() + "' with role '" + role + "'",
                    request.getRemoteAddr(),
                    "SUCCESS"
            );
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserRole(@PathVariable String id, @RequestBody Map<String, String> body, HttpServletRequest request) {
        String role = body.get("role");
        if (role == null || (!role.equalsIgnoreCase("admin") && !role.equalsIgnoreCase("manager") && !role.equalsIgnoreCase("user"))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid role specified"));
        }

        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        String oldRole = user.getRole();
        user.setRole(role.toLowerCase());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        UserDetailsImpl adminDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (auditService != null) {
            auditService.log(
                    adminDetails.getId(),
                    adminDetails.getEmail(),
                    "USER_ROLE_CHANGE",
                    user.getId(),
                    "USER",
                    "Changed role of user '" + user.getEmail() + "' from " + oldRole + " to " + user.getRole(),
                    request.getRemoteAddr(),
                    "SUCCESS"
            );
        }

        return ResponseEntity.ok(user);
    }

    @PatchMapping("/password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password must be at least 6 characters"));
        }

        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        userRepository.findById(userDetails.getId()).ifPresent(user -> {
            user.setPassword(encoder.encode(newPassword));
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        });

        if (auditService != null) {
            auditService.log(
                    userDetails.getId(),
                    userDetails.getEmail(),
                    "USER_PASSWORD_CHANGE",
                    userDetails.getId(),
                    "USER",
                    "User updated their password",
                    request.getRemoteAddr(),
                    "SUCCESS"
            );
        }

        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable String id, HttpServletRequest request) {
        UserDetailsImpl adminDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (adminDetails.getId().equals(id)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot delete your own admin account"));
        }

        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        userRepository.deleteById(id);

        if (auditService != null) {
            auditService.log(
                    adminDetails.getId(),
                    adminDetails.getEmail(),
                    "USER_DELETE",
                    id,
                    "USER",
                    "Admin deleted user '" + user.getEmail() + "'",
                    request.getRemoteAddr(),
                    "SUCCESS"
            );
        }

        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }
}
