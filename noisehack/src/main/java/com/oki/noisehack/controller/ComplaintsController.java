package com.oki.noisehack.controller;

import com.oki.noisehack.entity.Complaints;
import com.oki.noisehack.service.ComplaintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(path = "/api", produces = MediaType.APPLICATION_JSON_VALUE)
public class ComplaintsController {


    private final ComplaintService complaintService;

    public ComplaintsController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }


    @GetMapping("/near") // Maps GET requests to /api/complaints/near?lon=...&lat=...&distance=...
    public ResponseEntity<List<Complaints>> findComplaintsNear(
            @RequestParam double lon,
            @RequestParam double lat,
            @RequestParam double distanceInKm) {
        List<Complaints> complaints = complaintService.findLocationsNear(lon, lat, distanceInKm);
        return new ResponseEntity<>(complaints, HttpStatus.OK);
    }

}
