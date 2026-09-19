import pandas as pd
import os
import uuid
from prediction_engine import PredictionEngine
from financial_mapping import FinancialMapper
from duplicate_detector import DuplicateDetector
from reconciliation_engine import ReconciliationEngine

def determine_processing_status(row):
    if row.get('review_status') == 'REVIEW_REQUIRED' or row.get('financial_processing_status') == 'PENDING_REVIEW':
        return 'PENDING_REVIEW'
    if row.get('duplicate_status') == 'POSSIBLE_DUPLICATE':
        return 'POSSIBLE_DUPLICATE'
    if row.get('reconciliation_status') == 'POSSIBLE_MATCH':
        return 'RECONCILIATION_REVIEW'
    return 'READY'

def run_pipeline(input_csv, processed_csv, rec_csv, dup_csv):
    print("=======================================")
    print(" RAPI-SULTRA FINANCIAL PROCESSING      ")
    print("=======================================")
    
    # 1. Prediction Engine
    print("1. Running Prediction Engine (v2 model)...")
    pe = PredictionEngine()
    df = pe.predict_csv(input_csv, "reports/temp_predictions.csv")
    
    # Ensure raw_transaction_id
    if 'raw_transaction_id' not in df.columns:
        df['raw_transaction_id'] = [str(uuid.uuid4()) for _ in range(len(df))]
        
    # 2. Financial Mapping
    print("2. Running Financial Mapping...")
    mapper = FinancialMapper()
    df = mapper.map_transactions(df)
    
    # 3. Duplicate Detection
    print("3. Running Duplicate Detection...")
    dup_detector = DuplicateDetector()
    df = dup_detector.detect_duplicates(df)
    
    # 4. Reconciliation Engine
    print("4. Running Reconciliation Engine...")
    rec_engine = ReconciliationEngine()
    df = rec_engine.reconcile(df)
    
    # 5. Determine Final Processing Status
    print("5. Determining Final Processing Status...")
    df['processing_status'] = df.apply(determine_processing_status, axis=1)
    
    # Export main dataset
    os.makedirs(os.path.dirname(processed_csv), exist_ok=True)
    df.to_csv(processed_csv, index=False)
    
    # Export Duplicate Candidates (EXACT and POSSIBLE)
    dups = df[df['duplicate_status'].isin(['EXACT_DUPLICATE', 'POSSIBLE_DUPLICATE'])]
    dups = dups[['raw_transaction_id', 'duplicate_status', 'duplicate_reason', 'duplicate_group_id', 'date', 'channel', 'amount', 'description']]
    dups.to_csv(dup_csv, index=False)
    
    # Export Reconciliation Matches (RECONCILED and POSSIBLE_MATCH)
    recs = df[df['reconciliation_status'].isin(['RECONCILED', 'POSSIBLE_MATCH'])]
    recs = recs[['raw_transaction_id', 'reconciliation_status', 'reconciliation_reason', 'reconciliation_confidence', 'reconciliation_group_id', 'date', 'channel', 'amount', 'description']]
    recs.to_csv(rec_csv, index=False)
    
    # Summary
    print("\n--- SUMMARY ---")
    print(f"Total Transactions: {len(df)}")
    print(f"READY: {len(df[df['processing_status'] == 'READY'])}")
    print(f"PENDING_REVIEW: {len(df[df['processing_status'] == 'PENDING_REVIEW'])}")
    print(f"POSSIBLE_DUPLICATE: {len(df[df['processing_status'] == 'POSSIBLE_DUPLICATE'])}")
    print(f"RECONCILIATION_REVIEW: {len(df[df['processing_status'] == 'RECONCILIATION_REVIEW'])}")
    print(f"Total Duplicate Candidates (Records): {len(dups)}")
    print(f"Total Reconciled/Matches (Records): {len(recs)}")
    
    # Clean up temp
    if os.path.exists("reports/temp_predictions.csv"):
        os.remove("reports/temp_predictions.csv")
        
    print("\nFiles generated:")
    print(f"- {processed_csv}")
    print(f"- {rec_csv}")
    print(f"- {dup_csv}")
    print("Done.")

if __name__ == "__main__":
    run_pipeline(
        input_csv="test/rapi_end_to_end_demo.csv",
        processed_csv="reports/processed_transactions.csv",
        rec_csv="reports/reconciliation_matches.csv",
        dup_csv="reports/duplicate_candidates.csv"
    )
