package com.oki.noisehack.entity;


import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document("complaints")
public class Complaint {

    @Id
    private Long id;

    private String unique_key;
    private LocalDateTime created_date;
    private String complaint_type;
    private String location_type;
    private String descriptor;
    private String incident_zip;
    private String incident_address;
    private String city;
    private String borough;
    private String latitude;
    private String longitude;

}
