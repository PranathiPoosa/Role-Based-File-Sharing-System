package com.rbfs.models;

import java.time.LocalDateTime;

public class FileComment {
    private String user;
    private String userName;
    private String text;
    private LocalDateTime createdAt;

    public FileComment() {}

    public FileComment(String user, String userName, String text, LocalDateTime createdAt) {
        this.user = user;
        this.userName = userName;
        this.text = text;
        this.createdAt = createdAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String user;
        private String userName;
        private String text;
        private LocalDateTime createdAt;

        public Builder user(String user) { this.user = user; return this; }
        public Builder userName(String userName) { this.userName = userName; return this; }
        public Builder text(String text) { this.text = text; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public FileComment build() {
            return new FileComment(user, userName, text, createdAt);
        }
    }

    public String getUser() { return user; }
    public void setUser(String user) { this.user = user; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
