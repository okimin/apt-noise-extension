package com.oki.noisehack;

import com.oki.noisehack.entity.Complaints;
import com.oki.noisehack.repository.ComplaintsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

import java.util.List;

@SpringBootApplication
@EnableMongoRepositories
public class NoisehackApplication implements CommandLineRunner {

	@Autowired
	ComplaintsRepository complaintsRepo;

	List<Complaints> complaintsList;

	public static void main(String[] args) {
		SpringApplication.run(NoisehackApplication.class, args);
	}

	public void run (String... args) {

		System.out.println("-------------SHOW COUNT-------------------------------\n");
		findCountOfComplaint();

		System.out.println("-------------SHOW ALL COMPLAINTS-------------------------------\n");
		getAllComplaints();


	}

	private void getAllComplaints(){
		complaintsList = complaintsRepo.findAll();
		System.out.println(complaintsList.size());

		for (int i = 0; i < 10; i++) {
			System.out.println(getItemDetails(complaintsList.get(i)));
		}
	}

	public String getItemDetails(Complaints complaint) {

		System.out.println(
				"Complaint" + complaint.getComplaintType() +
						", \nDescription: " + complaint.getDescriptor() +
						", \nBorough: " + complaint.getBorough() +
						", \nDate: " + complaint.getCreatedDate().getDayOfWeek() +
						", \nLocation: " + complaint.getLocation()

		);

		return "";
	}

	public void findCountOfComplaint() {
		long count = complaintsRepo.count();
		System.out.println("Number of documents in the collection = " + count);
	}

}
