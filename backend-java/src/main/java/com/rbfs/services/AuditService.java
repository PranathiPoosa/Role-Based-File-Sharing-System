package com.rbfs.services;

import com.rbfs.models.AuditLog;
import com.rbfs.repositories.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditService {
    private static final Logger logger = LoggerFactory.getLogger(AuditService.class);

    @Autowired
    private AuditLogRepository auditLogRepository;

    public AuditLog log(String userId, String userEmail, String action, String resourceId,
                         String resourceType, String details, String ipAddress, String status) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .userId(userId)
                    .userEmail(userEmail)
                    .action(action)
                    .resourceId(resourceId)
                    .resourceType(resourceType)
                    .details(details)
                    .ipAddress(ipAddress)
                    .status(status != null ? status : "SUCCESS")
                    .timestamp(LocalDateTime.now())
                    .build();

            return auditLogRepository.save(auditLog);
        } catch (Exception e) {
            logger.error("Failed to write audit log: {}", e.getMessage());
            return null;
        }
    }

    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }
}
