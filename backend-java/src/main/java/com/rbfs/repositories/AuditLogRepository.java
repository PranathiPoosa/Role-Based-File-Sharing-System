package com.rbfs.repositories;

import com.rbfs.models.AuditLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {
    List<AuditLog> findAllByOrderByTimestampDesc();
    List<AuditLog> findByUserIdOrderByTimestampDesc(String userId);
}
