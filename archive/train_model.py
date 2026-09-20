import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

def validate_dataset(df):
    """Validate dataset structure and content."""
    required_columns = ['description', 'channel', 'direction', 'amount', 'label']
    for col in required_columns:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")
    
    if df.isnull().any().any():
        print("Warning: Missing values found. Dropping rows with missing values.")
        df = df.dropna()
        
    valid_labels = ['Revenue', 'COGS', 'Operating_Expense', 'Financing', 'Transfer_Internal', 'Other']
    invalid_labels = df[~df['label'].isin(valid_labels)]['label'].unique()
    if len(invalid_labels) > 0:
        raise ValueError(f"Invalid labels found: {invalid_labels}")
        
    if not pd.api.types.is_numeric_dtype(df['amount']):
        print("Warning: Amount column is not purely numeric. Coercing to numeric.")
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
        df = df.dropna(subset=['amount'])
        
    return df

def main():
    data_path = os.path.join("data", "training_transactions.csv")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}")
        
    print(f"Loading dataset from {data_path}...")
    df = pd.read_csv(data_path)
    
    print("Validating dataset...")
    df = validate_dataset(df)
    
    print("\nDataset Summary:")
    print(f"Total rows: {len(df)}")
    print("\nLabel Distribution (All Data):")
    print(df['label'].value_counts())
    
    X = df['description']
    y = df['label']
    
    print("\nSplitting dataset into train and test sets (80:20)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=42
    )
    
    print("\nLabel Distribution (Train):")
    print(y_train.value_counts())
    print("\nLabel Distribution (Test):")
    print(y_test.value_counts())
    
    print("\nBuilding TF-IDF + Logistic Regression pipeline...")
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
    
    print("Training model...")
    pipeline.fit(X_train, y_train)
    
    # Quick sanity check
    y_pred_train = pipeline.predict(X_train)
    train_acc = accuracy_score(y_train, y_pred_train)
    print(f"Training Accuracy: {train_acc:.4f}")
    
    # Save model
    model_dir = "model"
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "transaction_classifier.pkl")
    
    print(f"Saving model pipeline to {model_path}...")
    joblib.dump(pipeline, model_path)
    print("Model saved successfully.")

if __name__ == "__main__":
    main()
