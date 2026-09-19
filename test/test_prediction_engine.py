import os
import sys

# Ensure src can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.prediction_engine import PredictionEngine

def main():
    print("Initializing Prediction Engine...")
    try:
        engine = PredictionEngine(model_path="model/transaction_classifier_v2.pkl")
    except Exception as e:
        print(f"Error loading model: {e}")
        return
        
    print("Model loaded successfully.")
    
    # Single Transaction Test
    print("\n--- SINGLE TRANSACTION TEST ---")
    desc = "pembelian bahan baku supplier ayam"
    channel = "Transfer"
    direction = "OUT"
    amount = 350000
    
    print(f"Input: {desc} | {channel} | {direction} | {amount}")
    try:
        result = engine.predict_transaction(desc, channel, direction, amount)
        print(f"Predicted Label : {result['predicted_label']}")
        print(f"Model Confidence: {result['confidence']:.4f}")
        print(f"Review Status   : {result['review_status']}")
    except Exception as e:
        print(f"Prediction Error: {e}")
        
    print("\n--- BATCH PREDICTION TEST (CSV) ---")
    input_csv = os.path.join("test", "demo_transactions.csv")
    output_csv = os.path.join("reports", "demo_predictions.csv")
    
    print(f"Loading data from: {input_csv}")
    try:
        results_df = engine.predict_csv(input_csv, output_csv)
    except Exception as e:
        print(f"Batch Prediction Error: {e}")
        return
        
    print(f"\nSuccessfully predicted {len(results_df)} transactions.")
    print(f"Results saved to {output_csv}\n")
    
    # Summary
    auto = len(results_df[results_df['review_status'] == 'AUTO_CLASSIFIED'])
    review = len(results_df[results_df['review_status'] == 'REVIEW_REQUIRED'])
    
    print("--- SUMMARY ---")
    print(f"Total Transactions : {len(results_df)}")
    print(f"AUTO_CLASSIFIED    : {auto}")
    print(f"REVIEW_REQUIRED    : {review}")
    
    print("\n--- DETAILED RESULTS ---")
    for idx, row in results_df.iterrows():
        print(f"Desc      : {row['description']}")
        print(f"Label     : {row['predicted_label']}")
        print(f"Confidence: {row['confidence']:.4f}")
        print(f"Status    : {row['review_status']}")
        print("-" * 40)

if __name__ == "__main__":
    main()
