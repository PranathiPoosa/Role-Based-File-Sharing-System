package com.rbfs.models;

import java.time.LocalDateTime;

public class FileVersion {
    private String fileName;
    private String filePath;
    private long fileSize;
    private String mimeType;
    private LocalDateTime uploadedAt;

    public FileVersion() {}

    public FileVersion(String fileName, String filePath, long fileSize, String mimeType, LocalDateTime uploadedAt) {
        this.fileName = fileName;
        this.filePath = filePath;
        this.fileSize = fileSize;
        this.mimeType = mimeType;
        this.uploadedAt = uploadedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String fileName;
        private String filePath;
        private long fileSize;
        private String mimeType;
        private LocalDateTime uploadedAt;

        public Builder fileName(String fileName) { this.fileName = fileName; return this; }
        public Builder filePath(String filePath) { this.filePath = filePath; return this; }
        public Builder fileSize(long fileSize) { this.fileSize = fileSize; return this; }
        public Builder mimeType(String mimeType) { this.mimeType = mimeType; return this; }
        public Builder uploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; return this; }

        public FileVersion build() {
            return new FileVersion(fileName, filePath, fileSize, mimeType, uploadedAt);
        }
    }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }

    public long getFileSize() { return fileSize; }
    public void setFileSize(long fileSize) { this.fileSize = fileSize; }

    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }

    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
}
