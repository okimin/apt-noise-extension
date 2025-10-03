# Apartment Complaints Extension
The goal of this project is to build an extension that takes in an address and get the nearest complaints of up to a mile.

The intended audience is for apartment hunters to guage the safety and noise quality of places they are interested to rent/buy. This is meant to be used alongside Zillow/StreetEasy. Currennt implementation is for New York City apartments and houses. If you want to use for a different city, feel free to fork the repository.

## Tech Stack
- Javascript
- SpringBoot
- MongoDB
- Google Maps Api

## Current Features Done
- [x] Ingested data from OpenDataNYC to MongoDB
- [x] Created browser extension to take in address and determine if they are an address in NYC
- [x] Created Springboot application to get nearest complaints from a given coordinate
- [x] Connect Chrome extension to MongoDB and get location of complaints on maps
- [x] Deploy Springboot to Google Cloud Run and submitted extension for review

Screenshot of Application  
<img width="351" height="324" alt="Screenshot 2025-10-03 at 1 18 29 PM" src="https://github.com/user-attachments/assets/e15d11f2-ad14-441a-8d2a-5bb3d223438b" />

<img width="1094" height="693" alt="Screenshot 2025-10-03 at 1 19 18 PM" src="https://github.com/user-attachments/assets/ccc536d1-0d31-4db2-8ad9-a90d62ee9e01" />



## To be done
- [ ] Generate summary of complaints with Google Gemini
