import pandas as pd
import json
import os
from rapi_readiness_profile import ReadinessProfiler

def run_rapi_profiler(fp_json, out_dir):
    print("=======================================")
    print(" RAPI FINANCING READINESS PROFILE      ")
    print("=======================================")
    
    if not os.path.exists(fp_json):
        print(f"Error: {fp_json} not found.")
        return
        
    with open(fp_json, 'r') as f:
        fin_profile = json.load(f)
        
    profiler = ReadinessProfiler()
    rapi_profile = profiler.build_profile(fin_profile)
    
    os.makedirs(out_dir, exist_ok=True)
    
    # 1. Export JSON
    json_path = os.path.join(out_dir, "rapi_financing_readiness_profile.json")
    with open(json_path, 'w') as f:
        json.dump(rapi_profile, f, indent=4)
        
    # 2. Export CSV
    # dimension, status, data_sufficiency, metric, value, interpretation
    csv_rows = []
    
    dims = ["revenue_stability", "cash_flow_consistency", "payment_behaviour", "information_completeness"]
    for d in dims:
        obj = rapi_profile[d]
        status = obj['status']
        suff = obj['data_sufficiency']
        interp = obj['interpretation']
        ev = obj['evidence']
        
        if not ev:
            csv_rows.append({
                "dimension": d,
                "status": status,
                "data_sufficiency": suff,
                "metric": "N/A",
                "value": "N/A",
                "interpretation": interp
            })
        else:
            for k, v in ev.items():
                csv_rows.append({
                    "dimension": d,
                    "status": status,
                    "data_sufficiency": suff,
                    "metric": k,
                    "value": v,
                    "interpretation": interp
                })
                
    csv_path = os.path.join(out_dir, "rapi_financing_readiness_profile.csv")
    pd.DataFrame(csv_rows).to_csv(csv_path, index=False)
    
    print("\n--- RAPI PROFILE EXPORTED ---")
    print("This profile is a descriptive proof-of-concept evidence layer.")
    print("It is NOT a validated credit score or financing decision.\n")
    print("Files generated:")
    print(f"- {json_path}")
    print(f"- {csv_path}")
    print("Done.")

if __name__ == "__main__":
    run_rapi_profiler(
        fp_json="reports/financial_profile.json",
        out_dir="reports"
    )
