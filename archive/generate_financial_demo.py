import pandas as pd
import uuid
import os

def generate_demo_data(output_path):
    data = [
        # 1. Revenue (High Confidence)
        {"date": "2026-10-01", "channel": "QRIS", "direction": "IN", "description": "Pembayaran Pelanggan", "amount": 150000.0, "reference_id": "QR-001", "predicted_label": "Revenue", "confidence": 0.95, "review_status": "AUTO_CLASSIFIED"},
        # 2. Revenue (Low Confidence -> REVIEW_REQUIRED)
        {"date": "2026-10-01", "channel": "Cash", "direction": "IN", "description": "Uang masuk gak jelas", "amount": 25000.0, "reference_id": "CSH-001", "predicted_label": "Revenue", "confidence": 0.65, "review_status": "REVIEW_REQUIRED"},
        # 3. COGS
        {"date": "2026-10-02", "channel": "Transfer", "direction": "OUT", "description": "Beli Bahan Baku Tepung", "amount": 500000.0, "reference_id": "TRF-001", "predicted_label": "COGS", "confidence": 0.88, "review_status": "AUTO_CLASSIFIED"},
        # 4. Operating_Expense
        {"date": "2026-10-03", "channel": "Bank_Mutation", "direction": "OUT", "description": "Bayar Listrik PLN", "amount": 350000.0, "reference_id": "BM-001", "predicted_label": "Operating_Expense", "confidence": 0.92, "review_status": "AUTO_CLASSIFIED"},
        # 5. Financing IN
        {"date": "2026-10-04", "channel": "Transfer", "direction": "IN", "description": "Pencairan Pinjaman KUR", "amount": 10000000.0, "reference_id": "LN-001", "predicted_label": "Financing", "confidence": 0.90, "review_status": "AUTO_CLASSIFIED"},
        # 6. Financing OUT
        {"date": "2026-10-05", "channel": "Transfer", "direction": "OUT", "description": "Bayar Cicilan KUR", "amount": 1000000.0, "reference_id": "LN-002", "predicted_label": "Financing", "confidence": 0.93, "review_status": "AUTO_CLASSIFIED"},
        # 7. Transfer_Internal
        {"date": "2026-10-06", "channel": "Transfer", "direction": "IN", "description": "Pindah dana dari BCA ke Mandiri", "amount": 5000000.0, "reference_id": "INT-001", "predicted_label": "Transfer_Internal", "confidence": 0.85, "review_status": "AUTO_CLASSIFIED"},
        # 8. Other (Review Required)
        {"date": "2026-10-07", "channel": "Bank_Mutation", "direction": "OUT", "description": "Biaya admin tidak dikenal", "amount": 6500.0, "reference_id": "BM-002", "predicted_label": "Other", "confidence": 0.50, "review_status": "REVIEW_REQUIRED"},
        
        # --- Duplicates Scenarios ---
        # 9. Exact Duplicate (Row 1)
        {"date": "2026-10-08", "channel": "Invoice", "direction": "IN", "description": "Invoice Penjualan", "amount": 75000.0, "reference_id": "INV-001", "predicted_label": "Revenue", "confidence": 0.82, "review_status": "AUTO_CLASSIFIED"},
        # 10. Exact Duplicate (Row 2 - Identical)
        {"date": "2026-10-08", "channel": "Invoice", "direction": "IN", "description": "Invoice Penjualan", "amount": 75000.0, "reference_id": "INV-001", "predicted_label": "Revenue", "confidence": 0.82, "review_status": "AUTO_CLASSIFIED"},
        
        # 11. Possible Duplicate (Same Amount, Same Ref, but different date/channel)
        {"date": "2026-10-08", "channel": "Invoice", "direction": "IN", "description": "Tagihan Budi", "amount": 100000.0, "reference_id": "INV-002", "predicted_label": "Revenue", "confidence": 0.80, "review_status": "AUTO_CLASSIFIED"},
        {"date": "2026-10-09", "channel": "QRIS", "direction": "IN", "description": "Pembayaran Budi via QRIS", "amount": 100000.0, "reference_id": "INV-002", "predicted_label": "Revenue", "confidence": 0.80, "review_status": "AUTO_CLASSIFIED"},
        
        # --- Reconciliation Scenarios ---
        # 13. QRIS <-> Bank_Mutation (Reconciled Match)
        {"date": "2026-10-10", "channel": "QRIS", "direction": "IN", "description": "Customer A", "amount": 250000.0, "reference_id": "QR-002", "predicted_label": "Revenue", "confidence": 0.90, "review_status": "AUTO_CLASSIFIED"},
        {"date": "2026-10-10", "channel": "Bank_Mutation", "direction": "IN", "description": "Settlement QRIS A", "amount": 250000.0, "reference_id": "QR-002", "predicted_label": "Revenue", "confidence": 0.90, "review_status": "AUTO_CLASSIFIED"},
        
        # 15. Transfer <-> Bank_Mutation (Possible Match / Reconciled)
        {"date": "2026-10-11", "channel": "Transfer", "direction": "IN", "description": "Transfer dari Budi", "amount": 300000.0, "reference_id": "TRF-003", "predicted_label": "Revenue", "confidence": 0.88, "review_status": "AUTO_CLASSIFIED"},
        {"date": "2026-10-11", "channel": "Bank_Mutation", "direction": "IN", "description": "TRF IN BUDI", "amount": 300000.0, "reference_id": "", "predicted_label": "Revenue", "confidence": 0.75, "review_status": "AUTO_CLASSIFIED"},
        
        # 17. Cash (Should NOT be automatically reconciled even with same amount)
        {"date": "2026-10-12", "channel": "Cash", "direction": "IN", "description": "Penjualan Tunai", "amount": 50000.0, "reference_id": "CSH-002", "predicted_label": "Revenue", "confidence": 0.85, "review_status": "AUTO_CLASSIFIED"},
        {"date": "2026-10-12", "channel": "Bank_Mutation", "direction": "IN", "description": "Setoran Tunai", "amount": 50000.0, "reference_id": "BM-003", "predicted_label": "Transfer_Internal", "confidence": 0.70, "review_status": "AUTO_CLASSIFIED"},
        
        # 19. Same amount, NOT a match (Different directions)
        {"date": "2026-10-13", "channel": "Transfer", "direction": "IN", "description": "DP Masuk", "amount": 1000000.0, "reference_id": "TRF-004", "predicted_label": "Revenue", "confidence": 0.90, "review_status": "AUTO_CLASSIFIED"},
        {"date": "2026-10-13", "channel": "Transfer", "direction": "OUT", "description": "Bayar Supplier", "amount": 1000000.0, "reference_id": "TRF-005", "predicted_label": "COGS", "confidence": 0.92, "review_status": "AUTO_CLASSIFIED"},
    ]

    df = pd.DataFrame(data)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Generated demo data at: {output_path}")

if __name__ == "__main__":
    generate_demo_data("test/financial_processing_demo.csv")
