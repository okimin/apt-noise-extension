package com.oki.noisehack.entity;


import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "Complaints") // Replace "your_collection_name" with the actual name of your MongoDB collection
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Complaints {

    @Id // This maps to the "_id" field in MongoDB
    private String id; // Represents the "$oid" value

    @Field("unique_key")
    private String uniqueKey;

    @Field("created_date")
    private LocalDateTime createdDate; // Or LocalDateTime if you prefer to parse it

    @Field("complaint_type")
    private String complaintType;

    @Field("location_type")
    private String locationType;

    @Field("descriptor")
    private String descriptor;

    @Field("incident_zip")
    private String incidentZip;

    @Field("incident_address")
    private String incidentAddress;

    @Field("city")
    private String city;

    @Field("borough")
    private String borough;

    @Field("latitude")
    private Double latitude; // Changed to Double for numeric values

    @Field("longitude")
    private Double longitude; // Changed to Double for numeric values

    @Field("location")
    @GeoSpatialIndexed(type = GeoSpatialIndexType.GEO_2DSPHERE)
    private GeoJsonPoint location; // Nested object for location details

    // Constructors
    public Complaints() {
    }

    public Complaints(String id, String uniqueKey, LocalDateTime createdDate, String complaintType, String locationType,
                     String descriptor, String incidentZip, String incidentAddress, String city,
                     String borough, Double latitude, Double longitude) {
        this.id = id;
        this.uniqueKey = uniqueKey;
        this.createdDate = createdDate;
        this.complaintType = complaintType;
        this.locationType = locationType;
        this.descriptor = descriptor;
        this.incidentZip = incidentZip;
        this.incidentAddress = incidentAddress;
        this.city = city;
        this.borough = borough;
        this.latitude = latitude;
        this.longitude = longitude;
        this.location = new GeoJsonPoint(longitude, latitude);
    }

    // Getters and Setters

    public String getId() {
        return id;
    }

    public String getUniqueKey() {
        return uniqueKey;
    }

    public LocalDateTime getCreatedDate() {
        return createdDate;
    }


    public String getComplaintType() {
        return complaintType;
    }

    public String getLocationType() {
        return locationType;
    }

    public String getDescriptor() {
        return descriptor;
    }

    public String getIncidentZip() {
        return incidentZip;
    }

    public String getIncidentAddress() {
        return incidentAddress;
    }

    public String getCity() {
        return city;
    }

    public String getBorough() {
        return borough;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public GeoJsonPoint getLocation() {
        return location;
    }

    @Override
    public String toString() {
        return "Complaint{" +
                "id='" + id + '\'' +
                ", uniqueKey='" + uniqueKey + '\'' +
                ", createdDate='" + createdDate + '\'' +
                ", complaintType='" + complaintType + '\'' +
                ", locationType='" + locationType + '\'' +
                ", descriptor='" + descriptor + '\'' +
                ", incidentZip='" + incidentZip + '\'' +
                ", incidentAddress='" + incidentAddress + '\'' +
                ", city='" + city + '\'' +
                ", borough='" + borough + '\'' +
                ", latitude=" + latitude +
                ", longitude=" + longitude +
                ", location=" + location +
                '}';
    }

}