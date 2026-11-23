package com.rbfs.repositories;

import com.rbfs.models.FileModel;
import com.rbfs.models.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileRepository extends MongoRepository<FileModel, String> {
    List<FileModel> findAllByOrderByCreatedAtDesc();
    List<FileModel> findByUploadedByOrderByCreatedAtDesc(User uploadedBy);
    List<FileModel> findByApprovalStatusOrderByCreatedAtDesc(String approvalStatus);

    List<FileModel> findByFolderOrderByCreatedAtDesc(String folder);
    List<FileModel> findByFolderAndApprovalStatusOrderByCreatedAtDesc(String folder, String approvalStatus);
    List<FileModel> findByFolderAndUploadedByOrderByCreatedAtDesc(String folder, User uploadedBy);

    boolean existsByFolder(String folder);
}
