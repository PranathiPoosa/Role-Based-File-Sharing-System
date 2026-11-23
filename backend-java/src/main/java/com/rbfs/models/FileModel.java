package com.rbfs.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "files")
public class FileModel {
    @Id
    private String id;

    private String originalName;
    private String fileName;
    private String filePath;
    private long fileSize;
    private String mimeType;

    private String folder; // null for root, or folderId
    private String description;

    @DBRef
    private User uploadedBy;

    private String approvalStatus; // 'pending', 'approved', 'rejected'

    @DBRef
    private User approvedBy;
    private LocalDateTime approvedAt;

    @DBRef
    private User rejectedBy;
    private LocalDateTime rejectedAt;
    private String rejectionReason;

    private long downloadCount = 0;

    private List<FileVersion> versions = new ArrayList<>();
    private List<FileComment> comments = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public FileModel() {}

    public FileModel(String id, String originalName, String fileName, String filePath, long fileSize, String mimeType,
                     String folder, String description, User uploadedBy, String approvalStatus, User approvedBy,
                     LocalDateTime approvedAt, User rejectedBy, LocalDateTime rejectedAt, String rejectionReason,
                     long downloadCount, List<FileVersion> versions, List<FileComment> comments,
                     LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.originalName = originalName;
        this.fileName = fileName;
        this.filePath = filePath;
        this.fileSize = fileSize;
        this.mimeType = mimeType;
        this.folder = folder;
        this.description = description;
        this.uploadedBy = uploadedBy;
        this.approvalStatus = approvalStatus;
        this.approvedBy = approvedBy;
        this.approvedAt = approvedAt;
        this.rejectedBy = rejectedBy;
        this.rejectedAt = rejectedAt;
        this.rejectionReason = rejectionReason;
        this.downloadCount = downloadCount;
        this.versions = versions != null ? versions : new ArrayList<>();
        this.comments = comments != null ? comments : new ArrayList<>();
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String originalName;
        private String fileName;
        private String filePath;
        private long fileSize;
        private String mimeType;
        private String folder;
        private String description;
        private User uploadedBy;
        private String approvalStatus;
        private User approvedBy;
        private LocalDateTime approvedAt;
        private User rejectedBy;
        private LocalDateTime rejectedAt;
        private String rejectionReason;
        private long downloadCount = 0;
        private List<FileVersion> versions = new ArrayList<>();
        private List<FileComment> comments = new ArrayList<>();
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(String id) { this.id = id; return this; }
        public Builder originalName(String originalName) { this.originalName = originalName; return this; }
        public Builder fileName(String fileName) { this.fileName = fileName; return this; }
        public Builder filePath(String filePath) { this.filePath = filePath; return this; }
        public Builder fileSize(long fileSize) { this.fileSize = fileSize; return this; }
        public Builder mimeType(String mimeType) { this.mimeType = mimeType; return this; }
        public Builder folder(String folder) { this.folder = folder; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder uploadedBy(User uploadedBy) { this.uploadedBy = uploadedBy; return this; }
        public Builder approvalStatus(String approvalStatus) { this.approvalStatus = approvalStatus; return this; }
        public Builder approvedBy(User approvedBy) { this.approvedBy = approvedBy; return this; }
        public Builder approvedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; return this; }
        public Builder rejectedBy(User rejectedBy) { this.rejectedBy = rejectedBy; return this; }
        public Builder rejectedAt(LocalDateTime rejectedAt) { this.rejectedAt = rejectedAt; return this; }
        public Builder rejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; return this; }
        public Builder downloadCount(long downloadCount) { this.downloadCount = downloadCount; return this; }
        public Builder versions(List<FileVersion> versions) { this.versions = versions; return this; }
        public Builder comments(List<FileComment> comments) { this.comments = comments; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public FileModel build() {
            return new FileModel(id, originalName, fileName, filePath, fileSize, mimeType, folder, description,
                    uploadedBy, approvalStatus, approvedBy, approvedAt, rejectedBy, rejectedAt, rejectionReason,
                    downloadCount, versions, comments, createdAt, updatedAt);
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getOriginalName() { return originalName; }
    public void setOriginalName(String originalName) { this.originalName = originalName; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }

    public long getFileSize() { return fileSize; }
    public void setFileSize(long fileSize) { this.fileSize = fileSize; }

    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }

    public String getFolder() { return folder; }
    public void setFolder(String folder) { this.folder = folder; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public User getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(User uploadedBy) { this.uploadedBy = uploadedBy; }

    public String getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(String approvalStatus) { this.approvalStatus = approvalStatus; }

    public User getApprovedBy() { return approvedBy; }
    public void setApprovedBy(User approvedBy) { this.approvedBy = approvedBy; }

    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }

    public User getRejectedBy() { return rejectedBy; }
    public void setRejectedBy(User rejectedBy) { this.rejectedBy = rejectedBy; }

    public LocalDateTime getRejectedAt() { return rejectedAt; }
    public void setRejectedAt(LocalDateTime rejectedAt) { this.rejectedAt = rejectedAt; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public long getDownloadCount() { return downloadCount; }
    public void setDownloadCount(long downloadCount) { this.downloadCount = downloadCount; }

    public List<FileVersion> getVersions() { return versions; }
    public void setVersions(List<FileVersion> versions) { this.versions = versions; }

    public List<FileComment> getComments() { return comments; }
    public void setComments(List<FileComment> comments) { this.comments = comments; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
