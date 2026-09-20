import os
import json
import pandas as pd
from run_financial_processing import run_pipeline
from run_financial_engine import run_engine
from run_financial_profile import run_profiler
from run_rapi_readiness_profile import run_rapi_profiler

def run_presentation():
    print("=======================================")
    print(" RAPI-SULTRA PRESENTATION PIPELINE     ")
    print("=======================================")
    
    in_csv = "test/rapi_presentation_demo.csv"
    if not os.path.exists(in_csv):
        print(f"Error: {in_csv} not found. Run generate_presentation_demo.py first.")
        return
        
    out_dir = "reports/presentation"
    os.makedirs(out_dir, exist_ok=True)
    
    # 1. Processing
    processed_csv = os.path.join(out_dir, "presentation_predictions.csv")
    rec_csv = os.path.join(out_dir, "presentation_reconciliation_matches.csv")
    dup_csv = os.path.join(out_dir, "presentation_duplicate_candidates.csv")
    
    print("\n[1/4] Running Processing Pipeline...")
    run_pipeline(
        input_csv=in_csv,
        processed_csv=processed_csv,
        rec_csv=rec_csv,
        dup_csv=dup_csv
    )
    
    # 2. Engine
    print("\n[2/4] Running Financial Engine...")
    run_engine(
        input_csv=processed_csv,
        out_dir=out_dir
    )
    # the engine hardcodes some output names internally, wait, let me fix run_engine or just rename them
    # Ah, the run_engine writes directly to out_dir using standard names. I'll just rename them after.
    eng_files = ["canonical_transactions.csv", "monthly_financial_summary.csv", 
                 "monthly_transaction_trend.csv", "financial_profile_input.csv", "financial_summary.json"]
    for f in eng_files:
        src = os.path.join(out_dir, f)
        dst = os.path.join(out_dir, f"presentation_{f}")
        if os.path.exists(src):
            if os.path.exists(dst):
                os.remove(dst)
            os.rename(src, dst)
            
    # 3. Profile
    print("\n[3/4] Running Financial Profiler...")
    run_profiler(
        ms_csv=os.path.join(out_dir, "presentation_monthly_financial_summary.csv"),
        pi_csv=os.path.join(out_dir, "presentation_financial_profile_input.csv"),
        os_json=os.path.join(out_dir, "presentation_financial_summary.json"),
        out_dir=out_dir
    )
    
    prof_files = ["financial_profile.json", "financial_profile.csv"]
    for f in prof_files:
        src = os.path.join(out_dir, f)
        dst = os.path.join(out_dir, f"presentation_{f}")
        if os.path.exists(src):
            if os.path.exists(dst):
                os.remove(dst)
            os.rename(src, dst)
            
    # 4. Readiness Profile
    print("\n[4/4] Running RAPI Readiness Profiler...")
    run_rapi_profiler(
        fp_json=os.path.join(out_dir, "presentation_financial_profile.json"),
        out_dir=out_dir
    )
    
    rapi_files = ["rapi_financing_readiness_profile.json", "rapi_financing_readiness_profile.csv"]
    for f in rapi_files:
        src = os.path.join(out_dir, f)
        dst = os.path.join(out_dir, f"presentation_{f}")
        if os.path.exists(src):
            if os.path.exists(dst):
                os.remove(dst)
            os.rename(src, dst)
            
    # 5. Validation Summary
    print("\n[5/5] Generating Validation Summary...")
    df_in = pd.read_csv(in_csv)
    df_proc = pd.read_csv(processed_csv)
    with open(os.path.join(out_dir, "presentation_financial_summary.json"), 'r') as f:
        fin_sum = json.load(f)
    with open(os.path.join(out_dir, "presentation_rapi_financing_readiness_profile.json"), 'r') as f:
        rapi_prof = json.load(f)
        
    auto_class = len(df_proc[df_proc['processing_status'] == 'READY'])
    rev_req = len(df_proc[df_proc['processing_status'] == 'PENDING_REVIEW'])
    
    val_json = {
        "total_input_transactions": len(df_in),
        "auto_classified_count": auto_class,
        "review_required_count": rev_req,
        "duplicate_candidate_count": fin_sum.get("duplicate_excluded_count", 0),
        "reconciled_count": fin_sum.get("reconciled_transaction_count", 0),
        "finalized_canonical_transactions": fin_sum.get("included_transaction_count", 0),
        "revenue": fin_sum.get("revenue", 0),
        "cogs": fin_sum.get("cogs", 0),
        "operating_expense": fin_sum.get("operating_expense", 0),
        "financing_inflow": fin_sum.get("financing_inflow", 0),
        "financing_outflow": fin_sum.get("financing_outflow", 0),
        "gross_profit": fin_sum.get("gross_profit", 0),
        "gross_margin": fin_sum.get("gross_margin", 0),
        "operating_result": fin_sum.get("operating_result", 0),
        "net_cash_movement": fin_sum.get("net_cash_movement", 0),
        "number_of_active_months": rapi_prof.get("profile_summary", {}).get("observed_period_months", 0),
        "four_financial_profile_dimensions": [
            rapi_prof.get("revenue_stability", {}).get("status"),
            rapi_prof.get("cash_flow_consistency", {}).get("status"),
            rapi_prof.get("payment_behaviour", {}).get("status"),
            rapi_prof.get("information_completeness", {}).get("status")
        ]
    }
    
    val_path = os.path.join(out_dir, "presentation_validation.json")
    with open(val_path, 'w') as f:
        json.dump(val_json, f, indent=4)
        
    print(f"Validation summary saved to {val_path}")
    print("Presentation Pipeline Completed!")

if __name__ == "__main__":
    run_presentation()
