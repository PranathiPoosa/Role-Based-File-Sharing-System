package com.rbfs.controllers;

import com.rbfs.models.FolderModel;
import com.rbfs.models.User;
import com.rbfs.repositories.FileRepository;
import com.rbfs.repositories.FolderRepository;
import com.rbfs.repositories.UserRepository;
import com.rbfs.security.UserDetailsImpl;
import com.rbfs.services.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/folders")
public class FolderController {

    @Autowired
    private FolderRepository folderRepository;

    @Autowired
    private FileRepository fileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired(required = false)
    private AuditService auditService;

    @GetMapping
    public ResponseEntity<List<FolderModel>> getFolders(@RequestParam(required = false) String parentFolder) {
        String parentId = (parentFolder == null || parentFolder.equalsIgnoreCase("null") || parentFolder.trim().isEmpty()) 
                ? null 
                : parentFolder;
        List<FolderModel> folders = folderRepository.findByParentFolderOrderByNameAsc(parentId);
        return ResponseEntity.ok(folders);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> createFolder(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String name = body.get("name");
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Folder name is required"));
        }

        String rawParent = body.get("parentFolder");
        String parentFolder = (rawParent == null || rawParent.equalsIgnoreCase("null") || rawParent.trim().isEmpty()) 
                ? null 
                : rawParent;

        if (folderRepository.existsByNameAndParentFolder(name.trim(), parentFolder)) {
            return ResponseEntity.badRequest().body(Map.of("message", "A folder with this name already exists in this location"));
        }

        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElse(null);

        FolderModel folder = FolderModel.builder()
                .name(name.trim())
                .parentFolder(parentFolder)
                .createdBy(user)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        FolderModel saved = folderRepository.save(folder);

        if (auditService != null) {
            auditService.log(
                    userDetails.getId(),
                    userDetails.getEmail(),
                    "FOLDER_CREATE",
                    saved.getId(),
                    "FOLDER",
                    "Created folder '" + saved.getName() + "'",
                    request.getRemoteAddr(),
                    "SUCCESS"
            );
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> deleteFolder(@PathVariable String id, HttpServletRequest request) {
        FolderModel folder = folderRepository.findById(id).orElse(null);
        if (folder == null) {
            return ResponseEntity.notFound().build();
        }

        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        boolean isAdmin = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && (folder.getCreatedBy() == null || !folder.getCreatedBy().getId().equals(userDetails.getId()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Not authorized to delete this folder"));
        }

        boolean hasFiles = fileRepository.existsByFolder(id);
        boolean hasSubfolders = folderRepository.existsByParentFolder(id);

        if (hasFiles || hasSubfolders) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot delete a folder that contains files or subfolders"));
        }

        folderRepository.delete(folder);

        if (auditService != null) {
            auditService.log(
                    userDetails.getId(),
                    userDetails.getEmail(),
                    "FOLDER_DELETE",
                    id,
                    "FOLDER",
                    "Deleted folder '" + folder.getName() + "'",
                    request.getRemoteAddr(),
                    "SUCCESS"
            );
        }

        return ResponseEntity.ok(Map.of("message", "Folder deleted successfully"));
    }
}
