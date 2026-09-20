import pandas as pd
import numpy as np
import os
import joblib

def load_model():
    model_path = os.path.join("model", "transaction_classifier.pkl")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found at {model_path}. Please run train_model.py first.")
    return joblib.load(model_path)

def predict_transactions(df, model, threshold=0.70):
    if 'description' not in df.columns:
        raise ValueError("DataFrame must contain 'description' column")
        
    descriptions = df['description']
    
    # Predict probabilities
    probs = model.predict_proba(descriptions)
    classes = model.classes_
    
    # Get max probability and corresponding class
    max_probs = np.max(probs, axis=1)
    pred_indices = np.argmax(probs, axis=1)
    predicted_labels = classes[pred_indices]
    
    # Determine review status
    statuses = ["AUTO_CLASSIFIED" if p >= threshold else "REVIEW_REQUIRED" for p in max_probs]
    
    # Assign results
    result_df = df.copy()
    result_df['predicted_label'] = predicted_labels
    result_df['confidence'] = max_probs
    result_df['review_status'] = statuses
    
    return result_df

def main():
    test_file = os.path.join("test", "demo_transactions.csv")
    if not os.path.exists(test_file):
        raise FileNotFoundError(f"Demo file not found at {test_file}")
        
    print(f"Loading demo dataset from {test_file}...")
    df = pd.read_csv(test_file)
    
    model = load_model()
    
    print("\nRunning predictions...\n")
    results = predict_transactions(df, model)
    
    # Display results
    columns_to_show = ['description', 'predicted_label', 'confidence', 'review_status']
    for idx, row in results.iterrows():
        print(f"Description: {row['description']}")
        print(f"Prediction : {row['predicted_label']}")
        print(f"Confidence : {row['confidence']:.4f}")
        print(f"Status     : {row['review_status']}")
        print("-" * 50)
        
if __name__ == "__main__":
    main()
