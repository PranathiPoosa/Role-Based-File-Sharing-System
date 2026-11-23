package com.rbfs.controllers;

import com.rbfs.models.FileComment;
import com.rbfs.models.FileModel;
import com.rbfs.models.FileVersion;
import com.rbfs.models.User;
import com.rbfs.repositories.FileRepository;
import com.rbfs.repositories.UserRepository;
import com.rbfs.security.UserDetailsImpl;
import com.rbfs.services.AuditService;
import com.rbfs.services.FileEncryptionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/files")
public class FileController {

    @Autowired
    private FileRepository fileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileEncryptionService encryptionService;

    @Autowired(required = false)
    private AuditService auditService;

    @Value("${file.upload-dir}")
    private String uploadDir;

    /**
     * Resolves and validates a file path against the configured upload directory to prevent path traversal.
     */
    private Path getValidatedPath(String fileName) {
        Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path target = root.resolve(fileName).normalize();
        if (!target.startsWith(root)) {
            throw new SecurityException("Path traversal attempt detected for file: " + fileName);
        }
        return target;
    }

    @PostMapping("/upload")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folderId", required = false) String folderId,
            @RequestParam(value = "description", required = false) String description,
            HttpServletRequest request) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(new MessageResponse("No file uploaded"));
            }

            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            User currentUser = userRepository.findById(userDetails.getId()).orElse(null);

            boolean isAdmin = userDetails.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

            // Ensure upload root directory exists
            Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
            if (!Files.exists(root)) {
                Files.createDirectories(root);
            }

            String originalFileName = file.getOriginalFilename();
            String uniqueFileName = UUID.randomUUID().toString() + "_" + originalFileName + ".enc";
            Path filePath = getValidatedPath(uniqueFileName);

            // Stream-based AES-256-CBC Encryption on upload (16-byte IV prepended automatically)
            try (InputStream is = file.getInputStream();
                 OutputStream os = Files.newOutputStream(filePath)) {
                encryptionService.encryptStream(is, os);
            }

            String cleanFolderId = (folderId == null || folderId.equalsIgnoreCase("null") || folderId.trim().isEmpty()) 
                    ? null 
                    : folderId;

            FileModel fileModel = FileModel.builder()
                    .originalName(originalFileName)
                    .fileName(uniqueFileName)
                    .filePath(filePath.toString())
                    .fileSize(file.getSize())
                    .mimeType(file.getContentType())
                    .folder(cleanFolderId)
                    .description(description != null ? description.trim() : "")
                    .uploadedBy(currentUser)
                    .approvalStatus(isAdmin ? "approved" : "pending")
                    .approvedBy(isAdmin ? currentUser : null)
                    .approvedAt(isAdmin ? LocalDateTime.now() : null)
                    .downloadCount(0)
                    .versions(new ArrayList<>())
                    .comments(new ArrayList<>())
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            FileModel saved = fileRepository.save(fileModel);

            if (auditService != null) {
                auditService.log(
                        userDetails.getId(),
                        userDetails.getEmail(),
                        "FILE_UPLOAD",
                        saved.getId(),
                        "FILE",
                        "Uploaded and AES-encrypted file '" + originalFileName + "' (approval: " + saved.getApprovalStatus() + ")",
                        request.getRemoteAddr(),
                        "SUCCESS"
                );
            }

            Map<String, Object> response = new HashMap<>();
            response.put("message", isAdmin ? "File uploaded and approved" : "File uploaded successfully and is pending admin approval");
            response.put("file", saved);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Could not upload file: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<FileModel>> getFiles(@RequestParam(value = "folderId", required = false) String folderId) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String role = userDetails.getAuthorities().iterator().next().getAuthority();

        String cleanFolderId = (folderId == null || folderId.equalsIgnoreCase("null") || folderId.trim().isEmpty()) 
                ? null 
                : folderId;

        List<FileModel> files;
        if (role.equals("ROLE_ADMIN")) {
            files = cleanFolderId != null 
                    ? fileRepository.findByFolderOrderByCreatedAtDesc(cleanFolderId)
                    : fileRepository.findByFolderOrderByCreatedAtDesc(null);
        } else if (role.equals("ROLE_MANAGER")) {
            User user = userRepository.findById(userDetails.getId()).orElse(null);
            files = cleanFolderId != null
                    ? fileRepository.findByFolderAndUploadedByOrderByCreatedAtDesc(cleanFolderId, user)
                    : fileRepository.findByFolderAndUploadedByOrderByCreatedAtDesc(null, user);
        } else {
            files = cleanFolderId != null
                    ? fileRepository.findByFolderAndApprovalStatusOrderByCreatedAtDesc(cleanFolderId, "approved")
                    : fileRepository.findByFolderAndApprovalStatusOrderByCreatedAtDesc(null, "approved");
        }

        return ResponseEntity.ok(files);
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<FileModel>> getPendingFiles() {
        return ResponseEntity.ok(fileRepository.findByApprovalStatusOrderByCreatedAtDesc("pending"));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approveFile(@PathVariable String id, HttpServletRequest request) {
        FileModel file = fileRepository.findById(id).orElse(null);
        if (file == null) return ResponseEntity.notFound().build();

        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User admin = userRepository.findById(userDetails.getId()).orElse(null);

        file.setApprovalStatus("approved");
        file.setApprovedBy(admin);
        file.setApprovedAt(LocalDateTime.now());
        file.setRejectedBy(null);
        file.setRejectedAt(null);
        file.setRejectionReason("");
        file.setUpdatedAt(LocalDateTime.now());
        fileRepository.save(file);

        if (auditService != null) {
            auditService.log(
                    userDetails.getId(),
                    userDetails.getEmail(),
                    "FILE_APPROVE",
                    file.getId(),
                    "FILE",
                    "Approved file '" + file.getOriginalName() + "'",
                    request.getRemoteAddr(),
                    "SUCCESS"
            );
        }

        Map<String, Object> response = new HashMap<>();
        response.put("message", "File approved successfully");
        response.put("file", file);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> rejectFile(@PathVariable String id, @RequestBody Map<String, String> body, HttpServletRequest request) {
        FileModel file = fileRepository.findById(id).orElse(null);
        if (file == null) return ResponseEntity.notFound().build();

        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User admin = userRepository.findById(userDetails.getId()).orElse(null);

        String reason = body.getOrDefault("reason", "");
        file.setApprovalStatus("rejected");
        file.setRejectedBy(admin);
        file.setRejectedAt(LocalDateTime.now());
        file.setRejectionReason(reason);
        file.setApprovedBy(null);
        file.setApprovedAt(null);
        file.setUpdatedAt(LocalDateTime.now());
        fileRepository.save(file);

        if (auditService != null) {
            auditService.log(
                    userDetails.getId(),
                    userDetails.getEmail(),
                    "FILE_REJECT",
                    file.getId(),
                    "FILE",
                    "Rejected file '" + file.getOriginalName() + "' with reason: " + reason,
                    request.getRemoteAddr(),
                    "SUCCESS"
            );
        }

        Map<String, Object> response = new HashMap<>();
        response.put("message", "File rejected successfully");
        response.put("file", file);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/rename")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> renameFile(@PathVariable String id, @RequestBody Map<String, String> body, HttpServletRequest request) {
        String originalName = body.get("originalName");
        if (originalName == null || originalName.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("New name is required"));
        }

        FileModel file = fileRepository.findById(id).orElse(null);
        if (file == null) return ResponseEntity.notFound().build();

        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        boolean isAdmin = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && (file.getUploadedBy() == null || !file.getUploadedBy().getId().equals(userDetails.getId()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Not authorized to rename this file"));
        }

        String oldName = file.getOriginalName();
        file.setOriginalName(originalName.trim());
        file.setUpdatedAt(LocalDateTime.now());
        fileRepository.save(file);

        if (auditService != null) {
            auditService.log(
                    userDetails.getId(),
                    userDetails.getEmail(),
                    "FILE_RENAME",
                    file.getId(),
                    "FILE",
                    "Renamed file from '" + oldName + "' to '" + file.getOriginalName() + "'",
                    request.getRemoteAddr(),
                    "SUCCESS"
            );
        }

        return ResponseEntity.ok(file);
    }

    @PatchMapping("/{id}/version")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> uploadVersion(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(new MessageResponse("No file uploaded"));
            }

            FileModel fileModel = fileRepository.findById(id).orElse(null);
            if (fileModel == null) return ResponseEntity.notFound().build();

            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            boolean isAdmin = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

            if (!isAdmin && (fileModel.getUploadedBy() == null || !fileModel.getUploadedBy().getId().equals(userDetails.getId()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Not authorized to update this file"));
            }

            // Archive current version
            if (fileModel.getVersions() == null) {
                fileModel.setVersions(new ArrayList<>());
            }
            fileModel.getVersions().add(FileVersion.builder()
                    .fileName(fileModel.getFileName())
                    .filePath(fileModel.getFilePath())
                    .fileSize(fileModel.getFileSize())
                    .mimeType(fileModel.getMimeType())
                    .uploadedAt(fileModel.getUpdatedAt() != null ? fileModel.getUpdatedAt() : LocalDateTime.now())
                    .build());

            // Save new version encrypted
            String newUniqueFileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename() + ".enc";
            Path newFilePath = getValidatedPath(newUniqueFileName);

            try (InputStream is = file.getInputStream();
                 OutputStream os = Files.newOutputStream(newFilePath)) {
                encryptionService.encryptStream(is, os);
            }

            fileModel.setFileName(newUniqueFileName);
            fileModel.setFilePath(newFilePath.toString());
            fileModel.setFileSize(file.getSize());
            fileModel.setMimeType(file.getContentType());
            fileModel.setUpdatedAt(LocalDateTime.now());

            if (!isAdmin) {
                fileModel.setApprovalStatus("pending");
                fileModel.setApprovedBy(null);
                fileModel.setApprovedAt(null);
            }

            fileRepository.save(fileModel);

            if (auditService != null) {
                auditService.log(
                        userDetails.getId(),
                        userDetails.getEmail(),
                        "FILE_VERSION_UPLOAD",
                        fileModel.getId(),
                        "FILE",
                        "Uploaded version " + (fileModel.getVersions().size() + 1) + " for '" + fileModel.getOriginalName() + "'",
                        request.getRemoteAddr(),
                        "SUCCESS"
                );
            }

            Map<String, Object> response = new HashMap<>();
            response.put("message", isAdmin ? "Version updated successfully" : "New version uploaded and pending approval");
            response.put("file", fileModel);
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Could not update version: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<?> addComment(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {
        String text = body.get("text");
        if (text == null || text.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Comment text is required"));
        }

        FileModel file = fileRepository.findById(id).orElse(null);
        if (file == null) return ResponseEntity.notFound().build();

        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (file.getComments() == null) {
            file.setComments(new ArrayList<>());
        }

        FileComment comment = FileComment.builder()
                .user(userDetails.getId())
                .userName(userDetails.getName() != null ? userDetails.getName() : userDetails.getEmail())
                .text(text.trim())
                .createdAt(LocalDateTime.now())
                .build();

        file.getComments().add(comment);
        fileRepository.save(file);

        if (auditService != null) {
            auditService.log(
                    userDetails.getId(),
                    userDetails.getEmail(),
                    "FILE_COMMENT",
                    file.getId(),
                    "FILE",
                    "Commented on '" + file.getOriginalName() + "'",
                    request.getRemoteAddr(),
                    "SUCCESS"
            );
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(file.getComments());
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> getStats() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        boolean isAdmin = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        List<FileModel> files;
        if (isAdmin) {
            files = fileRepository.findAll();
        } else {
            User user = userRepository.findById(userDetails.getId()).orElse(null);
            files = fileRepository.findByUploadedByOrderByCreatedAtDesc(user);
        }

        long totalDownloads = files.stream().mapToLong(FileModel::getDownloadCount).sum();

        List<Map<String, Object>> mostDownloaded = files.stream()
                .sorted((a, b) -> Long.compare(b.getDownloadCount(), a.getDownloadCount()))
                .limit(5)
                .map(f -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", f.getId());
                    map.put("name", f.getOriginalName());
                    map.put("downloads", f.getDownloadCount());
                    return map;
                })
                .toList();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalFiles", files.size());
        stats.put("totalDownloads", totalDownloads);
        stats.put("mostDownloaded", mostDownloaded);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/download/{id}")
    public void downloadFile(@PathVariable String id, HttpServletRequest request,
                             jakarta.servlet.http.HttpServletResponse response) throws IOException {
        FileModel fileModel = fileRepository.findById(id).orElse(null);
        if (fileModel == null) {
            response.sendError(HttpStatus.NOT_FOUND.value(), "File not found");
            return;
        }

        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        boolean isAdmin = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isManager = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER"));

        // Access control logic
        if (!isAdmin) {
            if (isManager) {
                if (fileModel.getUploadedBy() == null || !fileModel.getUploadedBy().getId().equals(userDetails.getId())) {
                    if (!"approved".equals(fileModel.getApprovalStatus())) {
                        response.sendError(HttpStatus.FORBIDDEN.value(), "Access denied: File not approved");
                        return;
                    }
                }
            } else if (!"approved".equals(fileModel.getApprovalStatus())) {
                response.sendError(HttpStatus.FORBIDDEN.value(), "File is not approved yet");
                return;
            }
        }

        // Path traversal validation
        Path targetPath = getValidatedPath(fileModel.getFileName());
        if (!Files.exists(targetPath) || !Files.isReadable(targetPath)) {
            response.sendError(HttpStatus.NOT_FOUND.value(), "File not found on server storage");
            return;
        }

        // Increment download count and update user's recent downloads
        fileModel.setDownloadCount(fileModel.getDownloadCount() + 1);
        fileRepository.save(fileModel);

        userRepository.findById(userDetails.getId()).ifPresent(user -> {
            user.setLastDownloadedFile(fileModel.getOriginalName());
            user.setLastDownloadedAt(LocalDateTime.now());

            if (user.getRecentlyDownloaded() == null) {
                user.setRecentlyDownloaded(new ArrayList<>());
            }
            user.getRecentlyDownloaded().removeIf(rd -> rd.getFileId() != null && rd.getFileId().equals(fileModel.getId()));
            user.getRecentlyDownloaded().add(0, User.RecentDownload.builder()
                    .fileName(fileModel.getOriginalName())
                    .fileId(fileModel.getId())
                    .downloadedAt(LocalDateTime.now())
                    .build());

            if (user.getRecentlyDownloaded().size() > 5) {
                user.setRecentlyDownloaded(new ArrayList<>(user.getRecentlyDownloaded().subList(0, 5)));
            }
            userRepository.save(user);
        });

        if (auditService != null) {
            auditService.log(
                    userDetails.getId(),
                    userDetails.getEmail(),
                    "FILE_DOWNLOAD",
                    fileModel.getId(),
                    "FILE",
                    "Downloaded and AES-decrypted file '" + fileModel.getOriginalName() + "'",
                    request.getRemoteAddr(),
                    "SUCCESS"
            );
        }

        // Stream-based AES-256-CBC Decryption directly to HttpServletResponse output stream
        response.setContentType(MediaType.APPLICATION_OCTET_STREAM_VALUE);
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileModel.getOriginalName() + "\"");
        try (InputStream encryptedIn = Files.newInputStream(targetPath)) {
            encryptionService.decryptStream(encryptedIn, response.getOutputStream());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> deleteFile(@PathVariable String id, HttpServletRequest request) {
        FileModel fileModel = fileRepository.findById(id).orElse(null);
        if (fileModel == null) return ResponseEntity.notFound().build();

        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        boolean isAdmin = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && (fileModel.getUploadedBy() == null || !fileModel.getUploadedBy().getId().equals(userDetails.getId()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Not authorized to delete this file"));
        }

        try {
            // Delete encrypted physical file
            Path targetPath = getValidatedPath(fileModel.getFileName());
            Files.deleteIfExists(targetPath);

            // Delete version files if any
            if (fileModel.getVersions() != null) {
                for (FileVersion version : fileModel.getVersions()) {
                    if (version.getFileName() != null) {
                        try {
                            Files.deleteIfExists(getValidatedPath(version.getFileName()));
                        } catch (Exception ignored) {}
                    }
                }
            }

            fileRepository.delete(fileModel);

            if (auditService != null) {
                auditService.log(
                        userDetails.getId(),
                        userDetails.getEmail(),
                        "FILE_DELETE",
                        fileModel.getId(),
                        "FILE",
                        "Deleted file '" + fileModel.getOriginalName() + "'",
                        request.getRemoteAddr(),
                        "SUCCESS"
                );
            }

            return ResponseEntity.ok(new MessageResponse("File deleted successfully"));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error deleting physical file: " + e.getMessage()));
        }
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
