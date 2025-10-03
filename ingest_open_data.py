import os
from sodapy import Socrata
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

client = Socrata("data.cityofnewyork.us", "cF393sxKJybQh4OCshjnoO0Bc")
dataset_id = "erm2-nwe9"

soql = {
    "$select": "unique_key, created_date, complaint_type, location_type, descriptor, incident_zip, incident_address, city, borough, latitude, longitude",
    # Only include records on/after 2024-06-01 and where complaint_type mentions Noise or Loud (case-insensitive)
    "$where": "created_date >= '2024-06-01T00:00:00' AND complaint_type IS NOT NULL AND (upper(complaint_type) LIKE '%NOISE%' OR upper(complaint_type) LIKE '%LOUD%')",
    # Return most recent records first
    "$order": "created_date DESC",
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
    record["latitude"] = float(record.get("latitude"))
    record["longitude"] = float(record.get("longitude"))
    record["location"] = {"type" : "Point" , "coordinates":[record["longitude"],record["latitude"]]}
    cleaned_data_to_insert.append(record)

mongo_uri = os.environ.get("db_uri")

try :
    mongo_client = MongoClient(mongo_uri)
    db = mongo_client.nyc_open_data
except Exception as e:
    print(f"Could not connect to MongoDB: {e}")
    exit() 

collection = db.Complaints

try:
    # Ensure there's no conflicting geo index and create a 2dsphere index for GeoJSON Points
    try:
        # Drop any index that references 'location' (safe on new collection)
        for idx in collection.list_indexes():
            if 'location' in "".join([k for k in idx.get('key', {}).keys()]):
                collection.drop_index(idx['name'])
    except Exception as idx_err:
        # ignore if no indexes or drop fails for some reason
        print(f"Ignoring index drop error: {idx_err}")

    collection.create_index([("location", "2dsphere")])
    print("Ensured 2dsphere index on 'location'.")

    # Safety: don't try to insert an empty list (avoids confusing errors)
    if not cleaned_data_to_insert:
        print("No cleaned documents to insert. Exiting.")
    else:
        result = collection.delete_many({})  # Clear out previous data
        print(f"Deleted {result.deleted_count} documents.")

        result = collection.insert_many(cleaned_data_to_insert)
        print(f"Successfully inserted {len(result.inserted_ids)} documents into 'Complaints' collection.")
except Exception as e:
    print(f"Error inserting documents into MongoDB: {e}")

doc_count = collection.count_documents({})
print(f"Total documents now in 'complaints' collection: {doc_count}")

client.close()
print("MongoDB connection closed.")

print(f"Successfully ingested {len(df)} records.")
print(df.head())
print(df.columns)