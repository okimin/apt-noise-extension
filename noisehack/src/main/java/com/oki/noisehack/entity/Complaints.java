package com.oki.noisehack.entity;


import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;

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
    private LocationData location; // Nested object for location details

    // Constructors
    public Complaints() {
    }

    public Complaints(String id, String uniqueKey, LocalDateTime createdDate, String complaintType, String locationType,
                     String descriptor, String incidentZip, String incidentAddress, String city,
                     String borough, Double latitude, Double longitude, LocationData location) {
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
        this.location = location;
    }

    // Getters and Setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUniqueKey() {
        return uniqueKey;
    }

    public void setUniqueKey(String uniqueKey) {
        this.uniqueKey = uniqueKey;
    }

    public LocalDateTime getCreatedDate() {
        return createdDate;
    }


    public String getComplaintType() {
        return complaintType;
    }

    public void setComplaintType(String complaintType) {
        this.complaintType = complaintType;
    }

    public String getLocationType() {
        return locationType;
    }

    public void setLocationType(String locationType) {
        this.locationType = locationType;
    }

    public String getDescriptor() {
        return descriptor;
    }

    public void setDescriptor(String descriptor) {
        this.descriptor = descriptor;
    }

    public String getIncidentZip() {
        return incidentZip;
    }

    public void setIncidentZip(String incidentZip) {
        this.incidentZip = incidentZip;
    }

    public String getIncidentAddress() {
        return incidentAddress;
    }

    public void setIncidentAddress(String incidentAddress) {
        this.incidentAddress = incidentAddress;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getBorough() {
        return borough;
    }

    public void setBorough(String borough) {
        this.borough = borough;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public LocationData getLocation() {
        return location;
    }

    public void setLocation(LocationData location) {
        this.location = location;
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

    // --- Nested Classes for Location Data ---

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class LocationData {
        @Field("latitude")
        private Double latitude;

        @Field("longitude")
        private Double longitude;

        // human_address is a JSON string, so we'll deserialize it into an object
        @Field("human_address")
        private String humanAddressJson; // Store as String initially

        // This field will hold the deserialized HumanAddress object
        private HumanAddress humanAddress;

        // Constructors
        public LocationData() {
        }

        public LocationData(Double latitude, Double longitude, String humanAddressJson) {
            this.latitude = latitude;
            this.longitude = longitude;
            this.humanAddressJson = humanAddressJson;
            // Attempt to parse humanAddressJson during construction if needed,
            // or rely on a custom deserializer/getter logic.
            // For simplicity, we'll parse it in the getter or when setting the JSON string.
        }

        // Getters and Setters

        public Double getLatitude() {
            return latitude;
        }

        public void setLatitude(Double latitude) {
            this.latitude = latitude;
        }

        public Double getLongitude() {
            return longitude;
        }

        public void setLongitude(Double longitude) {
            this.longitude = longitude;
        }

        public String getHumanAddressJson() {
            return humanAddressJson;
        }

        // When setting the JSON string, try to parse it into the HumanAddress object
        public void setHumanAddressJson(String humanAddressJson) {
            this.humanAddressJson = humanAddressJson;
            if (humanAddressJson != null && !humanAddressJson.isEmpty()) {
                try {
                    // Use ObjectMapper to parse the JSON string into HumanAddress
                    this.humanAddress = new ObjectMapper().readValue(humanAddressJson, HumanAddress.class);
                } catch (JsonProcessingException e) {
                    System.err.println("Error parsing human_address JSON: " + e.getMessage());
                    this.humanAddress = null; // Set to null if parsing fails
                }
            } else {
                this.humanAddress = null;
            }
        }

        // Provides access to the parsed HumanAddress object
        public HumanAddress getHumanAddress() {
            // Lazy load if not already set (e.g., if object was created without calling setHumanAddressJson)
            if (this.humanAddress == null && this.humanAddressJson != null && !this.humanAddressJson.isEmpty()) {
                try {
                    this.humanAddress = new ObjectMapper().readValue(this.humanAddressJson, HumanAddress.class);
                } catch (JsonProcessingException e) {
                    System.err.println("Error parsing human_address JSON in getter: " + e.getMessage());
                    this.humanAddress = null;
                }
            }
            return humanAddress;
        }

        // You might also want a setter for the HumanAddress object if you want to set it directly
        public void setHumanAddress(HumanAddress humanAddress) {
            this.humanAddress = humanAddress;
            // Optionally, convert HumanAddress back to JSON string if you modify it and need to save it
            if (humanAddress != null) {
                try {
                    this.humanAddressJson = new ObjectMapper().writeValueAsString(humanAddress);
                } catch (JsonProcessingException e) {
                    System.err.println("Error converting HumanAddress to JSON: " + e.getMessage());
                }
            } else {
                this.humanAddressJson = null;
            }
        }


        @Override
        public String toString() {
            return "LocationData{" +
                    "latitude=" + latitude +
                    ", longitude=" + longitude +
                    ", humanAddressJson='" + humanAddressJson + '\'' +
                    ", humanAddress=" + humanAddress +
                    '}';
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class HumanAddress {
        @JsonProperty("address") // Use @JsonProperty if field name differs from JSON key
        private String address;

        @JsonProperty("city")
        private String city;

        @JsonProperty("state")
        private String state;

        @JsonProperty("zip")
        private String zip;

        // Constructors
        public HumanAddress() {
        }

        public HumanAddress(String address, String city, String state, String zip) {
            this.address = address;
            this.city = city;
            this.state = state;
            this.zip = zip;
        }

        // Getters and Setters
        public String getAddress() {
            return address;
        }

        public void setAddress(String address) {
            this.address = address;
        }

        public String getCity() {
            return city;
        }

        public void setCity(String city) {
            this.city = city;
        }

        public String getState() {
            return state;
        }

        public void setState(String state) {
            this.state = state;
        }

        public String getZip() {
            return zip;
        }

        public void setZip(String zip) {
            this.zip = zip;
        }

        @Override
        public String toString() {
            return "HumanAddress{" +
                    "address='" + address + '\'' +
                    ", city='" + city + '\'' +
                    ", state='" + state + '\'' +
                    ", zip='" + zip + '\'' +
                    '}';
        }
    }
}