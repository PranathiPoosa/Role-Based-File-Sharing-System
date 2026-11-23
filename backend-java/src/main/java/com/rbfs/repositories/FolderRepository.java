package com.rbfs.repositories;

import com.rbfs.models.FolderModel;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FolderRepository extends MongoRepository<FolderModel, String> {
    List<FolderModel> findByParentFolderOrderByNameAsc(String parentFolder);
    boolean existsByNameAndParentFolder(String name, String parentFolder);
    boolean existsByParentFolder(String parentFolder);
}
