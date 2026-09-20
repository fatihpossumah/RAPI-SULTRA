import pandas as pd
import os

def main():
    base_data = pd.read_csv(os.path.join("data", "training_transactions.csv"))
    aug_data = pd.read_csv(os.path.join("data", "augmented_transactions.csv"))
    dev_data = pd.read_csv(os.path.join("data", "hard_case_development.csv"))
    
    # Combine
    combined = pd.concat([base_data, aug_data, dev_data], ignore_index=True)
    
    # Quality check
    print(f"Total rows: {len(combined)}")
    print(f"Class balance:\n{combined['label'].value_counts()}")
    
    assert len(combined) == 6000 + 1200 + 60, "Row count mismatch"
    assert combined.isnull().sum().sum() == 0, "Missing values found"
    assert pd.api.types.is_numeric_dtype(combined['amount']), "Amount is not numeric"
    
    # Check for exact duplicates in descriptions
    duplicates = combined.duplicated(subset=['description']).sum()
    print(f"Exact duplicates found: {duplicates}")
    if duplicates > 0:
        print("Warning: some duplicates exist (could be from base data or random collisions). Removing them.")
        combined = combined.drop_duplicates(subset=['description'], keep='first')
        
    out_path = os.path.join("data", "training_transactions_v2.csv")
    combined.to_csv(out_path, index=False)
    print(f"Saved to {out_path} with {len(combined)} rows.")

if __name__ == "__main__":
    main()
