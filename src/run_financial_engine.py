import pandas as pd
import json
import os
from financial_engine import FinancialEngine

def run_engine(input_csv, out_dir):
    print("=======================================")
    print(" RAPI-SULTRA FINANCIAL ENGINE          ")
    print("=======================================")
    
    if not os.path.exists(input_csv):
        print(f"Error: {input_csv} not found.")
        return
        
    df = pd.read_csv(input_csv)
    print(f"Loaded {len(df)} processed transactions.")
    
    engine = FinancialEngine()
    results = engine.calculate_financials(df)
    
    os.makedirs(out_dir, exist_ok=True)
    
    # 1. Canonical Transactions
    canon_path = os.path.join(out_dir, "canonical_transactions.csv")
    results['canonical_df'].to_csv(canon_path, index=False)
    
    # 2. Monthly Summary
    ms_path = os.path.join(out_dir, "monthly_financial_summary.csv")
    results['monthly_summary_df'].to_csv(ms_path, index=False)
    
    # 3. Monthly Trend
    mt_path = os.path.join(out_dir, "monthly_transaction_trend.csv")
    results['monthly_trend_df'].to_csv(mt_path, index=False)
    
    # 4. Profile Input
    pi_path = os.path.join(out_dir, "financial_profile_input.csv")
    results['profile_input_df'].to_csv(pi_path, index=False)
    
    # 5. Overall Summary
    os_path = os.path.join(out_dir, "financial_summary.json")
    with open(os_path, 'w') as f:
        json.dump(results['overall_summary'], f, indent=4)
        
    print("\n--- FINANCIAL ENGINE SUMMARY ---")
    summary = results['overall_summary']
    print(f"Revenue: {summary['revenue']}")
    print(f"COGS: {summary['cogs']}")
    print(f"Operating Expense: {summary['operating_expense']}")
    print(f"Gross Profit: {summary['gross_profit']}")
    print(f"Operating Result: {summary['operating_result']}")
    print(f"Net Cash Movement: {summary['net_cash_movement']}")
    print("---------------------------------------")
    print(f"Included: {summary['included_transaction_count']}")
    print(f"Pending Review Excluded: {summary['pending_review_count']}")
    print(f"Duplicate Excluded: {summary['duplicate_excluded_count']}")
    print(f"Reconciled: {summary['reconciled_transaction_count']}")
    
    print("\nFiles generated in 'reports/':")
    print("- canonical_transactions.csv")
    print("- monthly_financial_summary.csv")
    print("- monthly_transaction_trend.csv")
    print("- financial_profile_input.csv")
    print("- financial_summary.json")
    print("Done.")

if __name__ == "__main__":
    run_engine(
        input_csv="reports/processed_transactions.csv",
        out_dir="reports"
    )
