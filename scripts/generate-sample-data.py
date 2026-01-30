#!/usr/bin/env python3
"""
Sample Data Generator for watsonx.data Demo

Generates sample JSON, CSV, and Parquet files for testing ingestion
"""

import json
import csv
import random
from datetime import datetime, timedelta
from pathlib import Path

# Sample data configuration
NUM_RECORDS = 1000
OUTPUT_DIR = Path("sample-data")

# Sample data generators
def generate_transaction():
    """Generate a sample transaction record"""
    return {
        "transaction_id": f"TXN{random.randint(100000, 999999)}",
        "customer_id": f"CUST{random.randint(1000, 9999)}",
        "product_id": f"PROD{random.randint(100, 999)}",
        "amount": round(random.uniform(10.0, 1000.0), 2),
        "quantity": random.randint(1, 10),
        "timestamp": (datetime.now() - timedelta(days=random.randint(0, 365))).isoformat(),
        "status": random.choice(["completed", "pending", "cancelled"]),
        "payment_method": random.choice(["credit_card", "debit_card", "paypal", "bank_transfer"]),
        "region": random.choice(["North", "South", "East", "West"]),
    }

def generate_customer():
    """Generate a sample customer record"""
    first_names = ["John", "Jane", "Michael", "Sarah", "David", "Emily", "Robert", "Lisa"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis"]
    
    return {
        "customer_id": f"CUST{random.randint(1000, 9999)}",
        "first_name": random.choice(first_names),
        "last_name": random.choice(last_names),
        "email": f"user{random.randint(1, 9999)}@example.com",
        "phone": f"+1-555-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
        "registration_date": (datetime.now() - timedelta(days=random.randint(0, 730))).isoformat(),
        "loyalty_points": random.randint(0, 10000),
        "status": random.choice(["active", "inactive", "suspended"]),
    }

def generate_product():
    """Generate a sample product record"""
    categories = ["Electronics", "Clothing", "Food", "Books", "Home", "Sports"]
    
    return {
        "product_id": f"PROD{random.randint(100, 999)}",
        "name": f"Product {random.randint(1, 100)}",
        "category": random.choice(categories),
        "price": round(random.uniform(5.0, 500.0), 2),
        "stock_quantity": random.randint(0, 1000),
        "supplier_id": f"SUP{random.randint(10, 99)}",
        "rating": round(random.uniform(1.0, 5.0), 1),
        "created_date": (datetime.now() - timedelta(days=random.randint(0, 1095))).isoformat(),
    }

def create_json_file(filename, generator, num_records):
    """Create a JSON file with sample data"""
    data = [generator() for _ in range(num_records)]
    
    filepath = OUTPUT_DIR / filename
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"✓ Created {filepath} ({num_records} records)")

def create_csv_file(filename, generator, num_records):
    """Create a CSV file with sample data"""
    data = [generator() for _ in range(num_records)]
    
    if not data:
        return
    
    filepath = OUTPUT_DIR / filename
    with open(filepath, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
    
    print(f"✓ Created {filepath} ({num_records} records)")

def create_parquet_file(filename, generator, num_records):
    """Create a Parquet file with sample data"""
    try:
        import pandas as pd
        
        data = [generator() for _ in range(num_records)]
        df = pd.DataFrame(data)
        
        filepath = OUTPUT_DIR / filename
        df.to_parquet(filepath, index=False)
        
        print(f"✓ Created {filepath} ({num_records} records)")
    except ImportError:
        print(f"⚠ Skipping {filename} - pandas not installed (pip install pandas pyarrow)")

def main():
    """Main function to generate all sample data files"""
    print("=" * 60)
    print("watsonx.data Sample Data Generator")
    print("=" * 60)
    print()
    
    # Create output directory
    OUTPUT_DIR.mkdir(exist_ok=True)
    print(f"Output directory: {OUTPUT_DIR.absolute()}")
    print()
    
    # Generate transaction data
    print("Generating transaction data...")
    create_json_file("transactions.json", generate_transaction, NUM_RECORDS)
    create_csv_file("transactions.csv", generate_transaction, NUM_RECORDS)
    create_parquet_file("transactions.parquet", generate_transaction, NUM_RECORDS)
    print()
    
    # Generate customer data
    print("Generating customer data...")
    create_json_file("customers.json", generate_customer, NUM_RECORDS // 2)
    create_csv_file("customers.csv", generate_customer, NUM_RECORDS // 2)
    create_parquet_file("customers.parquet", generate_customer, NUM_RECORDS // 2)
    print()
    
    # Generate product data
    print("Generating product data...")
    create_json_file("products.json", generate_product, NUM_RECORDS // 5)
    create_csv_file("products.csv", generate_product, NUM_RECORDS // 5)
    create_parquet_file("products.parquet", generate_product, NUM_RECORDS // 5)
    print()
    
    print("=" * 60)
    print("Sample data generation complete!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Upload files to MinIO/S3 bucket")
    print("2. Use the demo application to create ingestion jobs")
    print("3. Monitor job progress in the Jobs page")
    print()
    print("Example MinIO upload command:")
    print(f"  mc cp {OUTPUT_DIR}/*.json minio/your-bucket/data/")
    print()

if __name__ == "__main__":
    main()

# Made with Bob
