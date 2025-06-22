package com.oki.noisehack.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.GeospatialIndex;
import org.springframework.data.mongodb.core.index.IndexInfo;
import org.springframework.data.mongodb.core.index.IndexOperations;

import jakarta.annotation.PostConstruct;
import java.util.List;

@Configuration
public class MongoConfig {

    @Autowired
    private MongoTemplate mongoTemplate;

    @PostConstruct
    public void initIndexes() {
        IndexOperations indexOps = mongoTemplate.indexOps("Complaints");

        // Check if 2dsphere index already exists
        List<IndexInfo> indexes = indexOps.getIndexInfo();
        boolean geoIndexExists = indexes.stream()
                .anyMatch(index -> index.getName().contains("geoLocation"));

        if (!geoIndexExists) {
            // Create 2dsphere index for geospatial queries
            indexOps.createIndex(new GeospatialIndex("geoLocation"));
            System.out.println("Created 2dsphere index on geoLocation field");
        } else {
            System.out.println("Geospatial index already exists on geoLocation field");
        }

        // You can also create compound indexes for better performance
        // For example, if you frequently query by complaint type and location:
        // indexOps.ensureIndex(new CompoundIndexDefinition(
        //     new Document("complaint_type", 1).append("geoLocation", "2dsphere")
        // ));
    }
}