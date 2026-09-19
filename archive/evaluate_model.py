import pandas as pd
import numpy as np
import os
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score

def evaluate():
    model_path = os.path.join("model", "transaction_classifier.pkl")
    data_path = os.path.join("data", "training_transactions.csv")
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found at {model_path}. Please run train_model.py first.")
    
    print("Loading model and dataset...")
    pipeline = joblib.load(model_path)
    df = pd.read_csv(data_path)
    
    # Ensure no missing values
    df = df.dropna(subset=['description', 'label'])
    
    X = df['description']
    y = df['label']
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=42
    )
    
    print("\n--- TEST SET EVALUATION ---")
    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)
    
    acc = accuracy_score(y_test, y_pred)
    macro_f1 = f1_score(y_test, y_pred, average='macro')
    weighted_f1 = f1_score(y_test, y_pred, average='weighted')
    
    print(f"\nAccuracy:   {acc:.4f}")
    print(f"Macro F1:   {macro_f1:.4f}")
    print(f"Weighted F1: {weighted_f1:.4f}")
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    print("\n--- CROSS VALIDATION ---")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(pipeline, X, y, cv=skf, scoring='f1_macro')
    print(f"5-Fold Macro F1 Scores: {cv_scores}")
    print(f"Mean Macro F1: {cv_scores.mean():.4f} (+/- {cv_scores.std()*2:.4f})")
    
    # Confusion Matrix Visualization
    cm = confusion_matrix(y_test, y_pred, labels=pipeline.classes_)
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=pipeline.classes_, yticklabels=pipeline.classes_)
    plt.title('Confusion Matrix')
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.tight_layout()
    plt.savefig('confusion_matrix.png')
    print("\nConfusion matrix saved to 'confusion_matrix.png'")
    
    print("\n--- ERROR ANALYSIS ---")
    # Find errors
    errors = X_test[y_test != y_pred].copy().to_frame()
    errors['Actual'] = y_test[y_test != y_pred]
    errors['Predicted'] = y_pred[y_test != y_pred]
    
    # Get max confidence for predicted class
    confidences = np.max(y_prob[y_test != y_pred], axis=1)
    errors['Confidence'] = confidences
    
    print(f"\nTotal misclassified instances: {len(errors)} out of {len(X_test)}")
    if len(errors) > 0:
        print("\nSample of misclassified transactions:")
        print(errors.head(10).to_string())

if __name__ == "__main__":
    evaluate()
