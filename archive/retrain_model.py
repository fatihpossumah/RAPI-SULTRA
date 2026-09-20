import pandas as pd
import numpy as np
import os
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, classification_report, confusion_matrix

def main():
    report_dir = "reports"
    os.makedirs(report_dir, exist_ok=True)
    
    # 1. Load Data
    data_path = os.path.join("data", "training_transactions_v2.csv")
    df = pd.read_csv(data_path)
    
    X = df['description']
    y = df['label']
    
    # 2. Train-Test Split (80:20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=42
    )
    
    # 3. Model Definition
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            ngram_range=(1, 2),
            min_df=2,
            max_features=5000,
            lowercase=True
        )),
        ('clf', LogisticRegression(
            max_iter=1000,
            random_state=42,
            class_weight='balanced'
        ))
    ])
    
    # 4. Retraining
    print("Retraining model on v2 dataset...")
    pipeline.fit(X_train, y_train)
    
    # Validation test
    y_pred_test = pipeline.predict(X_test)
    print(f"Validation Split Accuracy: {accuracy_score(y_test, y_pred_test):.4f}")
    
    # Save model
    model_path = os.path.join("model", "transaction_classifier_v2.pkl")
    joblib.dump(pipeline, model_path)
    
    # 5. Evaluate on Hard-Case Development
    dev_path = os.path.join("data", "hard_case_development.csv")
    df_dev = pd.read_csv(dev_path)
    acc_dev = accuracy_score(df_dev['label'], pipeline.predict(df_dev['description']))
    print(f"Hard-Case Development Accuracy: {acc_dev:.4f}")
    
    # 6. Evaluate on Locked Test
    locked_path = os.path.join("data", "locked_hard_case_test.csv")
    df_locked = pd.read_csv(locked_path)
    
    X_locked = df_locked['description']
    y_true_locked = df_locked['label']
    y_pred_locked = pipeline.predict(X_locked)
    y_prob_locked = pipeline.predict_proba(X_locked)
    max_probs = np.max(y_prob_locked, axis=1)
    
    acc_locked = accuracy_score(y_true_locked, y_pred_locked)
    macro_locked = f1_score(y_true_locked, y_pred_locked, average='macro')
    weighted_locked = f1_score(y_true_locked, y_pred_locked, average='weighted')
    
    # Save Predictions
    df_locked['predicted_label'] = y_pred_locked
    df_locked['confidence'] = max_probs
    df_locked['review_status'] = ["AUTO_CLASSIFIED" if p >= 0.70 else "REVIEW_REQUIRED" for p in max_probs]
    df_locked.to_csv(os.path.join(report_dir, "retrained_predictions.csv"), index=False)
    
    # Confusion Matrix
    cm = confusion_matrix(y_true_locked, y_pred_locked, labels=pipeline.classes_)
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Greens', 
                xticklabels=pipeline.classes_, yticklabels=pipeline.classes_)
    plt.title('Retrained Model - Locked Hard-Case Confusion Matrix')
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.tight_layout()
    plt.savefig(os.path.join(report_dir, 'retrained_confusion_matrix.png'))
    plt.close()
    
    # Error Analysis
    errors = df_locked[df_locked['label'] != df_locked['predicted_label']].copy()
    errors.to_csv(os.path.join(report_dir, "error_analysis.csv"), index=False)
    
    # Prepare text report
    report_lines = []
    report_lines.append("=== RETRAINED MODEL EVALUATION ON LOCKED TEST ===")
    report_lines.append(f"Accuracy: {acc_locked:.4f}")
    report_lines.append(f"Macro F1: {macro_locked:.4f}")
    report_lines.append(f"Weighted F1: {weighted_locked:.4f}\n")
    report_lines.append("--- CLASSIFICATION REPORT ---")
    report_lines.append(classification_report(y_true_locked, y_pred_locked))
    
    # Error Pairs
    if len(errors) > 0:
        error_pairs = errors.groupby(['label', 'predicted_label']).size().reset_index(name='count')
        error_pairs = error_pairs.sort_values(by='count', ascending=False)
        report_lines.append("\n--- TOP MISCLASSIFICATION PAIRS ---")
        for _, row in error_pairs.iterrows():
            report_lines.append(f"{row['label']} -> {row['predicted_label']}: {row['count']}")
    
    # Confidence Analysis
    correct_high = df_locked[(df_locked['label'] == df_locked['predicted_label']) & (df_locked['confidence'] >= 0.70)]
    correct_low = df_locked[(df_locked['label'] == df_locked['predicted_label']) & (df_locked['confidence'] < 0.70)]
    wrong_high = df_locked[(df_locked['label'] != df_locked['predicted_label']) & (df_locked['confidence'] >= 0.70)]
    wrong_low = df_locked[(df_locked['label'] != df_locked['predicted_label']) & (df_locked['confidence'] < 0.70)]
    
    report_lines.append("\n--- CONFIDENCE ANALYSIS ---")
    report_lines.append(f"Correct & High Confidence (>=0.70): {len(correct_high)}")
    report_lines.append(f"Correct & Low Confidence (<0.70): {len(correct_low)}")
    report_lines.append(f"Wrong & High Confidence (>=0.70): {len(wrong_high)}")
    report_lines.append(f"Wrong & Low Confidence (<0.70): {len(wrong_low)}")
    
    with open(os.path.join(report_dir, "retrained_evaluation.txt"), "w") as f:
        f.write("\n".join(report_lines))

if __name__ == "__main__":
    main()
