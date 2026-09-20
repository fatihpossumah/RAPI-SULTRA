import pandas as pd
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, classification_report, confusion_matrix

def main():
    data_path = os.path.join("data", "hard_case_transactions.csv")
    df = pd.read_csv(data_path)
    
    # Split 50:50, stratified
    df_dev, df_locked = train_test_split(
        df, test_size=0.5, stratify=df['label'], random_state=42
    )
    
    # Save splits
    dev_path = os.path.join("data", "hard_case_development.csv")
    locked_path = os.path.join("data", "locked_hard_case_test.csv")
    
    df_dev.to_csv(dev_path, index=False)
    df_locked.to_csv(locked_path, index=False)
    
    print(f"Saved {len(df_dev)} rows to {dev_path}")
    print(f"Saved {len(df_locked)} rows to {locked_path}")
    
    # Evaluate baseline on locked test
    model_path = os.path.join("model", "transaction_classifier.pkl")
    model = joblib.load(model_path)
    
    X_locked = df_locked['description']
    y_locked = df_locked['label']
    
    y_pred = model.predict(X_locked)
    
    acc = accuracy_score(y_locked, y_pred)
    macro_f1 = f1_score(y_locked, y_pred, average='macro')
    weighted_f1 = f1_score(y_locked, y_pred, average='weighted')
    
    report_lines = [
        "=== BASELINE ON LOCKED TEST ===",
        f"Accuracy: {acc:.4f}",
        f"Macro F1: {macro_f1:.4f}",
        f"Weighted F1: {weighted_f1:.4f}",
        "",
        "--- CLASSIFICATION REPORT ---",
        classification_report(y_locked, y_pred),
        "",
        "--- CONFUSION MATRIX ---",
        str(confusion_matrix(y_locked, y_pred, labels=model.classes_)),
        f"Classes: {model.classes_}"
    ]
    
    report_path = os.path.join("reports", "baseline_locked_test.txt")
    with open(report_path, "w") as f:
        f.write("\n".join(report_lines))
        
    print(f"Baseline evaluation on locked test saved to {report_path}")

if __name__ == "__main__":
    main()
