import pandas as pd
import random
from datetime import datetime, timedelta
import os

def generate_presentation_dataset():
    random.seed(99) # Fixed seed for reproducible demo
    start_date = datetime(2026, 1, 1)
    
    data = []
    
    # Scenario: "Toko Sembako Maju"
    # Modest revenue daily, regular stock purchases, some opex, one KUR financing.

    for month_offset in range(6):
        month_start = start_date + pd.DateOffset(months=month_offset)
        
        # REVENUE: 10-15 per month
        num_rev = random.randint(10, 15)
        for i in range(num_rev):
            day = random.randint(1, 28)
            date_str = (month_start + timedelta(days=day-1)).strftime("%Y-%m-%d")
            
            # Channels
            channel = random.choices(["QRIS", "Transfer", "Cash"], weights=[0.5, 0.3, 0.2])[0]
            amount = random.choice([75000, 150000, 250000, 300000, 500000, 1000000])
            desc = random.choice(["Pembayaran barang", "Penjualan beras", "Grosir", "QRIS Settlement", "Trf pembelian"])
            
            data.append({
                "date": date_str, "channel": channel, "direction": "IN", 
                "description": desc, "amount": amount, "reference_id": f"REV-P{month_offset}-{i}",
                "ground_truth_label": "REVENUE"
            })
            
        # COGS: 3-5 per month
        num_cogs = random.randint(3, 5)
        for i in range(num_cogs):
            day = random.randint(1, 28)
            date_str = (month_start + timedelta(days=day-1)).strftime("%Y-%m-%d")
            channel = random.choice(["Transfer", "Bank_Mutation"])
            amount = random.choice([1000000, 1500000, 2000000, 3000000])
            desc = random.choice(["Beli stok agen", "Pembayaran supplier beras", "Invoice distributor"])
            
            data.append({
                "date": date_str, "channel": channel, "direction": "OUT", 
                "description": desc, "amount": amount, "reference_id": f"COGS-P{month_offset}-{i}",
                "ground_truth_label": "COGS"
            })
            
        # OPEX: 2 per month
        data.append({
            "date": (month_start + timedelta(days=4)).strftime("%Y-%m-%d"), 
            "channel": "Bank_Mutation", "direction": "OUT", 
            "description": "Tagihan Listrik PLN", "amount": 450000, 
            "reference_id": f"OPEX-PLN-{month_offset}", "ground_truth_label": "OPERATING_EXPENSE"
        })
        data.append({
            "date": (month_start + timedelta(days=9)).strftime("%Y-%m-%d"), 
            "channel": "Transfer", "direction": "OUT", 
            "description": "Gaji Karyawan", "amount": 1500000, 
            "reference_id": f"OPEX-SAL-{month_offset}", "ground_truth_label": "OPERATING_EXPENSE"
        })

    # FINANCING
    # Inflow in month 1
    data.append({
        "date": "2026-01-15", "channel": "Transfer", "direction": "IN", 
        "description": "Pencairan Kredit Usaha", "amount": 25000000, 
        "reference_id": "FIN-IN-01", "ground_truth_label": "FINANCING"
    })
    # Outflow month 2-6
    for m in range(1, 6):
        date_str = (start_date + pd.DateOffset(months=m) + timedelta(days=14)).strftime("%Y-%m-%d")
        data.append({
            "date": date_str, "channel": "Bank_Mutation", "direction": "OUT", 
            "description": "Angsuran Pinjaman", "amount": 1200000, 
            "reference_id": f"FIN-OUT-{m}", "ground_truth_label": "FINANCING"
        })

    # INTERNAL TRANSFER
    data.append({
        "date": "2026-03-20", "channel": "Transfer", "direction": "IN", 
        "description": "Trf dari rekening BCA sendiri", "amount": 5000000, 
        "reference_id": "INT-01", "ground_truth_label": "INTERNAL_TRANSFER"
    })
    
    # AMBIGUOUS (REVIEW REQUIRED or OTHER)
    data.append({
        "date": "2026-04-12", "channel": "Bank_Mutation", "direction": "OUT", 
        "description": "Biaya adm", "amount": 5000, 
        "reference_id": "AMB-01", "ground_truth_label": "OTHER"
    })
    data.append({
        "date": "2026-05-18", "channel": "Cash", "direction": "IN", 
        "description": "masuk", "amount": 20000, 
        "reference_id": "AMB-02", "ground_truth_label": "OTHER"
    })

    # DUPLICATES
    data.append({
        "date": "2026-02-10", "channel": "Invoice", "direction": "OUT", 
        "description": "Beli stok agen", "amount": 2000000, 
        "reference_id": "DUP-INV", "ground_truth_label": "COGS"
    })
    data.append({
        "date": "2026-02-10", "channel": "Invoice", "direction": "OUT", 
        "description": "Beli stok agen", "amount": 2000000, 
        "reference_id": "DUP-INV", "ground_truth_label": "COGS" # EXACT COPY
    })

    # RECONCILIATION
    # QRIS -> Bank Mutation
    data.append({
        "date": "2026-06-05", "channel": "QRIS", "direction": "IN", 
        "description": "Pembayaran Toko", "amount": 350000, 
        "reference_id": "REC-Q1", "ground_truth_label": "REVENUE"
    })
    data.append({
        "date": "2026-06-06", "channel": "Bank_Mutation", "direction": "IN", 
        "description": "Settlement QRIS", "amount": 350000, 
        "reference_id": "REC-Q1", "ground_truth_label": "REVENUE"
    })

    df = pd.DataFrame(data)
    df['parsed_date'] = pd.to_datetime(df['date'])
    df = df.sort_values(by='parsed_date').drop(columns=['parsed_date']).reset_index(drop=True)
    
    gt_path = "test/rapi_presentation_ground_truth.csv"
    demo_path = "test/rapi_presentation_demo.csv"
    
    os.makedirs(os.path.dirname(gt_path), exist_ok=True)
    
    # Save ground truth
    df.to_csv(gt_path, index=False)
    
    # Save input (without ground truth label)
    df_input = df.drop(columns=['ground_truth_label'])
    df_input.to_csv(demo_path, index=False)
    
    print(f"Generated Presentation Dataset: {len(df)} records.")
    print(f"Input: {demo_path}")
    print(f"Ground Truth: {gt_path}")

if __name__ == "__main__":
    generate_presentation_dataset()
