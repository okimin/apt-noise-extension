package com.oki.noisehack.service;

import com.oki.noisehack.entity.Complaints;
import com.oki.noisehack.repository.ComplaintsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.geo.*;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ComplaintService {
    private final ComplaintsRepository complaintsRepository;

    @Autowired
    public ComplaintService(ComplaintsRepository complaintsRepository) {
        this.complaintsRepository = complaintsRepository;
    }

    public List<Complaints> findLocationsNear(double longitude, double latitude, double distanceInKm) {
        Point center = new Point(longitude, latitude);
        Distance distance = new Distance(distanceInKm, Metrics.KILOMETERS); // Or Metrics.MILES, etc.

        List<Complaints> results = complaintsRepository.findByLocationNear(center, distance);
        return results.stream()
                .sorted(Comparator.comparing(Complaints::getCreatedDate).reversed())
                .collect(Collectors.toList());

    }
}
