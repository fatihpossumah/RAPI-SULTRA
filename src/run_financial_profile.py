import pandas as pd
import json
import os
from financial_profile import FinancialProfiler

def run_profiler(ms_csv, pi_csv, os_json, out_dir):
    print("=======================================")
    print(" RAPI-SULTRA FINANCIAL PROFILER        ")
    print("=======================================")
    
    if not (os.path.exists(ms_csv) and os.path.exists(pi_csv) and os.path.exists(os_json)):
        print("Error: Required input files from Financial Engine are missing.")
        return
        
    monthly_summary = pd.read_csv(ms_csv)
    profile_input = pd.read_csv(pi_csv)
    with open(os_json, 'r') as f:
        overall_summary = json.load(f)
        
    profiler = FinancialProfiler()
    profile = profiler.generate_profile(monthly_summary, profile_input, overall_summary)
    
    os.makedirs(out_dir, exist_ok=True)
    
    # Export JSON
    json_path = os.path.join(out_dir, "financial_profile.json")
    with open(json_path, 'w') as f:
        json.dump(profile, f, indent=4)
        
    # Export CSV (Flat format for dashboard)
    csv_path = os.path.join(out_dir, "financial_profile.csv")
    flat_profile = {
        "period_start": profile["profile_metadata"]["period_start"],
        "period_end": profile["profile_metadata"]["period_end"],
        "revenue_stability_status": profile["revenue_stability"]["status"],
        "revenue_cv": profile["revenue_stability"]["coefficient_of_variation"],
        "cash_flow_consistency_status": profile["cash_flow_consistency"]["status"],
        "cash_flow_positive_months_ratio": profile["cash_flow_consistency"]["positive_months"] / max(1, (profile["cash_flow_consistency"]["positive_months"] + profile["cash_flow_consistency"]["negative_months"])),
        "payment_behaviour_status": profile["payment_behaviour"]["status"],
        "information_completeness_status": profile["information_completeness"]["status"],
        "information_completeness_rate": profile["information_completeness"]["overall_completeness_rate"]
    }
    pd.DataFrame([flat_profile]).to_csv(csv_path, index=False)
    
    print("\n--- FINANCIAL PROFILE SUMMARY ---")
    print(f"Revenue Stability: {profile['revenue_stability']['status']}")
    print(f"Cash-Flow Consistency: {profile['cash_flow_consistency']['status']}")
    print(f"Payment Behaviour: {profile['payment_behaviour']['status']}")
    print(f"Information Completeness: {profile['information_completeness']['status']} ({profile['information_completeness']['overall_completeness_rate']:.1f}%)")
    print("---------------------------------------")
    print("NOTE: This is a descriptive proxy profile. It is NOT a credit score.")
    
    print("\nFiles generated in 'reports/':")
    print("- financial_profile.json")
    print("- financial_profile.csv")
    print("Done.")

if __name__ == "__main__":
    run_profiler(
        ms_csv="reports/monthly_financial_summary.csv",
        pi_csv="reports/financial_profile_input.csv",
        os_json="reports/financial_summary.json",
        out_dir="reports"
    )
