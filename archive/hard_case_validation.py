import pandas as pd
import numpy as np
import os
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score

def validate_dataset(df):
    assert len(df) == 120, f"Expected 120 rows, got {len(df)}"
    assert set(df['label'].value_counts()) == {20}, "Classes are not balanced (20 per class)"
    assert df.isnull().sum().sum() == 0, "Found missing values"
    assert pd.api.types.is_numeric_dtype(df['amount']), "Amount is not numeric"
    print("Dataset validation passed.")

def run_validation():
    # Setup paths
    model_path = os.path.join("model", "transaction_classifier.pkl")
    data_path = os.path.join("data", "hard_case_transactions.csv")
    report_dir = "reports"
    os.makedirs(report_dir, exist_ok=True)
    
    # Load model & data
    print("Loading model and hard-case dataset...")
    model = joblib.load(model_path)
    df = pd.read_csv(data_path)
    
    validate_dataset(df)
    
    # Predict
    X = df['description']
    y_true = df['label']
    y_pred = model.predict(X)
    y_prob = model.predict_proba(X)
    
    # Extract confidence
    max_probs = np.max(y_prob, axis=1)
    df['predicted_label'] = y_pred
    df['confidence'] = max_probs
    df['review_status'] = ["AUTO_CLASSIFIED" if p >= 0.70 else "REVIEW_REQUIRED" for p in max_probs]
    
    # Save predictions
    pred_path = os.path.join(report_dir, "hard_case_predictions.csv")
    df.to_csv(pred_path, index=False)
    
    # Calculate metrics
    acc = accuracy_score(y_true, y_pred)
    macro_f1 = f1_score(y_true, y_pred, average='macro')
    weighted_f1 = f1_score(y_true, y_pred, average='weighted')
    
    # Prepare text report
    report_lines = []
    report_lines.append("=== HARD-CASE VALIDATION REPORT ===\n")
    report_lines.append(f"Accuracy: {acc:.4f} (Baseline was ~0.9758)")
    report_lines.append(f"Macro F1: {macro_f1:.4f} (Baseline was ~0.9758)")
    report_lines.append(f"Weighted F1: {weighted_f1:.4f} (Baseline was ~0.9758)\n")
    
    report_lines.append("--- CLASSIFICATION REPORT ---")
    report_lines.append(classification_report(y_true, y_pred))
    
    # Confusion Matrix
    cm = confusion_matrix(y_true, y_pred, labels=model.classes_)
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Reds', 
                xticklabels=model.classes_, yticklabels=model.classes_)
    plt.title('Hard-Case Confusion Matrix')
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.tight_layout()
    plt.savefig(os.path.join(report_dir, 'hard_case_confusion_matrix.png'))
    plt.close()
    
    # Error Analysis
    errors = df[df['label'] != df['predicted_label']].copy()
    report_lines.append(f"\n--- ERROR ANALYSIS ---")
    report_lines.append(f"Total Misclassified: {len(errors)} out of 120")
    
    if len(errors) > 0:
        error_pairs = errors.groupby(['label', 'predicted_label']).size().reset_index(name='count')
        error_pairs = error_pairs.sort_values(by='count', ascending=False)
        report_lines.append("\nTop Misclassification Pairs (Actual -> Predicted):")
        for _, row in error_pairs.iterrows():
            report_lines.append(f"{row['label']} -> {row['predicted_label']}: {row['count']} errors")
            
        report_lines.append("\nSample Misclassifications:")
        report_lines.append(errors[['description', 'label', 'predicted_label', 'confidence']].head(10).to_string())
        
    # Confidence Analysis
    correct_high = df[(df['label'] == df['predicted_label']) & (df['confidence'] >= 0.70)]
    correct_low = df[(df['label'] == df['predicted_label']) & (df['confidence'] < 0.70)]
    wrong_high = df[(df['label'] != df['predicted_label']) & (df['confidence'] >= 0.70)]
    wrong_low = df[(df['label'] != df['predicted_label']) & (df['confidence'] < 0.70)]
    
    report_lines.append("\n--- CONFIDENCE ANALYSIS ---")
    report_lines.append(f"Correct & High Confidence (>=0.70): {len(correct_high)}")
    report_lines.append(f"Correct & Low Confidence (<0.70): {len(correct_low)}")
    report_lines.append(f"Wrong & High Confidence (>=0.70): {len(wrong_high)}")
    report_lines.append(f"Wrong & Low Confidence (<0.70): {len(wrong_low)}")
    
    if len(wrong_high) > 0:
        report_lines.append("\nWARNING: High Confidence Errors Found!")
        report_lines.append(wrong_high[['description', 'label', 'predicted_label', 'confidence']].to_string())
        
    # Human in the loop check
    auto_classified = df[df['review_status'] == 'AUTO_CLASSIFIED']
    review_required = df[df['review_status'] == 'REVIEW_REQUIRED']
    
    report_lines.append("\n--- HUMAN-IN-THE-LOOP CHECK (Threshold 0.70) ---")
    report_lines.append(f"AUTO_CLASSIFIED: {len(auto_classified)}")
    report_lines.append(f"REVIEW_REQUIRED: {len(review_required)}")
    
    caught_errors = len(wrong_low)
    missed_errors = len(wrong_high)
    report_lines.append(f"Misclassifications caught by REVIEW_REQUIRED: {caught_errors}")
    report_lines.append(f"Misclassifications escaping as AUTO_CLASSIFIED: {missed_errors}")
    
    # Save Report
    report_text = "\n".join(report_lines)
    with open(os.path.join(report_dir, "hard_case_classification_report.txt"), "w") as f:
        f.write(report_text)
    
    print(report_text)

if __name__ == "__main__":
    run_validation()
