import os
from sodapy import Socrata
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

client = Socrata("data.cityofnewyork.us", "cF393sxKJybQh4OCshjnoO0Bc")
dataset_id = "erm2-nwe9"

soql = {
    "$select": "unique_key, created_date, complaint_type, location_type, descriptor, incident_zip, incident_address, city, borough, latitude, longitude, location",
    "$where": "created_date >= '2024-06-01T00:00:00' ",
    "$limit": 50000 # Always include a limit, even with filters
}

results = client.get(dataset_id, **soql)

df = pd.DataFrame.from_records(results)
data_to_insert = df.to_dict(orient='records')

critical_fields = ['longitude','latitude']

cleaned_data_to_insert = []
checkedForLocation = False
for record in data_to_insert:
    skip_document = False
    for field in critical_fields:
        # Get the value from the record. Handle potential missing keys in the record itself
        # though pandas `to_dict(orient='records')` usually ensures all DataFrame columns are keys.
        value = record.get(field)
        
        if pd.isna(value) or value is None:
            # If a critical field is null or NaN, mark the document for skipping
            skip_document = True
            break # No need to check other critical fields for this document
    
    if skip_document:
        continue # Move to the next document in data_to_insert
    record["location"] = {"longitude" :  record.get("longitude"), "latitude" : record.get("latitude")}
    cleaned_data_to_insert.append(record)

mongo_uri = os.environ.get("db_uri")

try :
    mongo_client = MongoClient(mongo_uri)
    db = mongo_client.nyc_open_data
except :
    print(f"Could not connect to MongoDB: {e}")
    exit() 

collection = db.Complaints

try :
    result = collection.delete_many({}) # Clear out previous data
    print(f"Deleted {result.deleted_count} documents.")

    result = collection.insert_many(cleaned_data_to_insert)
    print(f"Successfully inserted {len(result.inserted_ids)} documents into 'nypd_complaints' collection.")
except :
    print(f"Error inserting documents into MongoDB: {e}")

doc_count = collection.count_documents({})
print(f"Total documents now in 'complaints' collection: {doc_count}")

client.close()
print("MongoDB connection closed.")

print(f"Successfully ingested {len(df)} records.")
print(df.head())
print(df.columns)