package com.rbfs.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "users")
public class User {
    @Id
    private String id;

    private String name;

    @Indexed(unique = true)
    private String email;

    private String password;

    private String role; // 'admin', 'manager', 'user'

    private LocalDateTime lastLogin;

    private String lastDownloadedFile;

    private LocalDateTime lastDownloadedAt;

    private List<RecentDownload> recentlyDownloaded = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public User() {}

    public User(String id, String name, String email, String password, String role, 
                LocalDateTime lastLogin, String lastDownloadedFile, LocalDateTime lastDownloadedAt, 
                List<RecentDownload> recentlyDownloaded, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.lastLogin = lastLogin;
        this.lastDownloadedFile = lastDownloadedFile;
        this.lastDownloadedAt = lastDownloadedAt;
        this.recentlyDownloaded = recentlyDownloaded != null ? recentlyDownloaded : new ArrayList<>();
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String name;
        private String email;
        private String password;
        private String role;
        private LocalDateTime lastLogin;
        private String lastDownloadedFile;
        private LocalDateTime lastDownloadedAt;
        private List<RecentDownload> recentlyDownloaded = new ArrayList<>();
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(String id) { this.id = id; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder password(String password) { this.password = password; return this; }
        public Builder role(String role) { this.role = role; return this; }
        public Builder lastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; return this; }
        public Builder lastDownloadedFile(String lastDownloadedFile) { this.lastDownloadedFile = lastDownloadedFile; return this; }
        public Builder lastDownloadedAt(LocalDateTime lastDownloadedAt) { this.lastDownloadedAt = lastDownloadedAt; return this; }
        public Builder recentlyDownloaded(List<RecentDownload> recentlyDownloaded) { this.recentlyDownloaded = recentlyDownloaded; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public User build() {
            return new User(id, name, email, password, role, lastLogin, lastDownloadedFile, lastDownloadedAt, recentlyDownloaded, createdAt, updatedAt);
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }

    public String getLastDownloadedFile() { return lastDownloadedFile; }
    public void setLastDownloadedFile(String lastDownloadedFile) { this.lastDownloadedFile = lastDownloadedFile; }

    public LocalDateTime getLastDownloadedAt() { return lastDownloadedAt; }
    public void setLastDownloadedAt(LocalDateTime lastDownloadedAt) { this.lastDownloadedAt = lastDownloadedAt; }

    public List<RecentDownload> getRecentlyDownloaded() { return recentlyDownloaded; }
    public void setRecentlyDownloaded(List<RecentDownload> recentlyDownloaded) { this.recentlyDownloaded = recentlyDownloaded; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static class RecentDownload {
        private String fileName;
        private String fileId;
        private LocalDateTime downloadedAt;

        public RecentDownload() {}

        public RecentDownload(String fileName, String fileId, LocalDateTime downloadedAt) {
            this.fileName = fileName;
            this.fileId = fileId;
            this.downloadedAt = downloadedAt;
        }

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private String fileName;
            private String fileId;
            private LocalDateTime downloadedAt;

            public Builder fileName(String fileName) { this.fileName = fileName; return this; }
            public Builder fileId(String fileId) { this.fileId = fileId; return this; }
            public Builder downloadedAt(LocalDateTime downloadedAt) { this.downloadedAt = downloadedAt; return this; }

            public RecentDownload build() {
                return new RecentDownload(fileName, fileId, downloadedAt);
            }
        }

        public String getFileName() { return fileName; }
        public void setFileName(String fileName) { this.fileName = fileName; }

        public String getFileId() { return fileId; }
        public void setFileId(String fileId) { this.fileId = fileId; }

        public LocalDateTime getDownloadedAt() { return downloadedAt; }
        public void setDownloadedAt(LocalDateTime downloadedAt) { this.downloadedAt = downloadedAt; }
    }
}
