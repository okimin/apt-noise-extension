package com.oki.noisehack.repository;

import com.oki.noisehack.entity.Complaints;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface ComplaintsRepository extends MongoRepository<Complaints, String> {

//    @Query(value="{complaint_type:'?0'}", fields="{'incident_address' : 1, 'borough' : 1}")
//    List<Complaints> findAll(String category);

    public long count();
}
