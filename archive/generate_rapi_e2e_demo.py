import pandas as pd
import random
from datetime import datetime, timedelta
import os

def generate_e2e_demo():
    random.seed(42)
    start_date = datetime(2026, 1, 1)
    
    data = []
    
    # 6 months of data
    for month_offset in range(6):
        month_start = start_date + pd.DateOffset(months=month_offset)
        
        # 1. Base Revenue (10 tx per month)
        for i in range(10):
            day = random.randint(1, 28)
            date_str = (month_start + timedelta(days=day-1)).strftime("%Y-%m-%d")
            amount = random.choice([50000, 100000, 150000, 200000, 500000])
            channel = random.choice(["QRIS", "Transfer", "Cash"])
            data.append({
                "date": date_str, "channel": channel, "direction": "IN", 
                "description": f"Pembayaran {i}", "amount": amount, "reference_id": f"REV-{month_offset}-{i}"
            })
            
        # 2. Base COGS (3 tx per month)
        for i in range(3):
            day = random.randint(1, 28)
            date_str = (month_start + timedelta(days=day-1)).strftime("%Y-%m-%d")
            data.append({
                "date": date_str, "channel": "Transfer", "direction": "OUT", 
                "description": f"Beli bahan baku {i}", "amount": random.choice([500000, 1000000]), 
                "reference_id": f"COGS-{month_offset}-{i}"
            })
            
        # 3. Base Opex (2 tx per month)
        for i in range(2):
            day = random.randint(1, 28)
            date_str = (month_start + timedelta(days=day-1)).strftime("%Y-%m-%d")
            data.append({
                "date": date_str, "channel": "Bank_Mutation", "direction": "OUT", 
                "description": f"Bayar PLN {i}", "amount": 350000, "reference_id": f"OPEX-{month_offset}-{i}"
            })

    # Add specific scenarios across the months
    # Financing IN
    data.append({"date": "2026-02-15", "channel": "Transfer", "direction": "IN", "description": "Pencairan KUR", "amount": 20000000, "reference_id": "KUR-01"})
    # Financing OUT (installments)
    for m in range(2, 6):
        date_str = (start_date + pd.DateOffset(months=m) + timedelta(days=14)).strftime("%Y-%m-%d")
        data.append({"date": date_str, "channel": "Bank_Mutation", "direction": "OUT", "description": "Cicilan KUR", "amount": 1000000, "reference_id": f"KUR-PAY-{m}"})
        
    # Internal Transfer
    data.append({"date": "2026-03-10", "channel": "Transfer", "direction": "IN", "description": "Pindah dana dari BCA", "amount": 5000000, "reference_id": "INT-01"})
    data.append({"date": "2026-04-10", "channel": "Transfer", "direction": "IN", "description": "Pindah dana pribadi", "amount": 3000000, "reference_id": "INT-02"})
    
    # Other / Bad descriptions -> REVIEW_REQUIRED
    data.append({"date": "2026-03-05", "channel": "Cash", "direction": "IN", "description": "masuk", "amount": 20000, "reference_id": "U-01"})
    data.append({"date": "2026-05-18", "channel": "Bank_Mutation", "direction": "OUT", "description": "Potongan admin tidak dikenal", "amount": 6500, "reference_id": "U-02"})

    # EXACT DUPLICATE (2 records exactly same)
    data.append({"date": "2026-04-15", "channel": "Transfer", "direction": "IN", "description": "DP Project A", "amount": 1000000, "reference_id": "PRJ-01"})
    data.append({"date": "2026-04-15", "channel": "Transfer", "direction": "IN", "description": "DP Project A", "amount": 1000000, "reference_id": "PRJ-01"})
    
    # RECONCILIATION MATCH
    # QRIS -> Bank_Mutation
    data.append({"date": "2026-02-20", "channel": "QRIS", "direction": "IN", "description": "Pembayaran Pesta", "amount": 2500000, "reference_id": "Q-100"})
    data.append({"date": "2026-02-21", "channel": "Bank_Mutation", "direction": "IN", "description": "Settlement Pesta", "amount": 2500000, "reference_id": "Q-100"})
    
    # Transfer -> Bank_Mutation
    data.append({"date": "2026-06-10", "channel": "Transfer", "direction": "IN", "description": "Pelunasan Budi", "amount": 4000000, "reference_id": "T-100"})
    data.append({"date": "2026-06-10", "channel": "Bank_Mutation", "direction": "IN", "description": "Trf In Budi", "amount": 4000000, "reference_id": "T-100"})

    df = pd.DataFrame(data)
    # Sort by date
    df['parsed_date'] = pd.to_datetime(df['date'])
    df = df.sort_values(by='parsed_date').drop(columns=['parsed_date']).reset_index(drop=True)
    
    output_path = "test/rapi_end_to_end_demo.csv"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Generated E2E demo data with {len(df)} transactions at {output_path}")

if __name__ == "__main__":
    generate_e2e_demo()
