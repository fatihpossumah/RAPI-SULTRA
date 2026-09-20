import pandas as pd
import numpy as np
import os
import joblib

class PredictionEngine:
    def __init__(self, model_path="model/transaction_classifier_v2.pkl"):
        self.model_path = model_path
        self.model = None
        self.threshold = 0.70
        self.valid_channels = {'QRIS', 'Transfer', 'Cash', 'Invoice', 'Bank_Mutation'}
        self.valid_directions = {'IN', 'OUT'}
        self.valid_labels = {'Revenue', 'COGS', 'Operating_Expense', 'Financing', 'Transfer_Internal', 'Other'}
        self._load_model()

    def _load_model(self):
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model file not found at: {self.model_path}")
        
        try:
            self.model = joblib.load(self.model_path)
        except Exception as e:
            raise RuntimeError(f"Failed to load model from {self.model_path}. Error: {str(e)}")

    def _validate_input_row(self, description, channel, direction, amount):
        if pd.isna(description) or str(description).strip() == "":
            raise ValueError("Validation Error: 'description' cannot be empty.")
            
        try:
            float(amount)
        except (ValueError, TypeError):
            raise ValueError(f"Validation Error: 'amount' must be numeric. Got: {amount}")
            
        if channel not in self.valid_channels:
            raise ValueError(f"Validation Error: 'channel' must be one of {self.valid_channels}. Got: {channel}")
            
        if direction not in self.valid_directions:
            raise ValueError(f"Validation Error: 'direction' must be one of {self.valid_directions}. Got: {direction}")

    def predict_transaction(self, description, channel, direction, amount):
        """
        Predict a single transaction.
        Note: channel, direction, and amount are validated but NOT used as model features.
        """
        # Validate
        self._validate_input_row(description, channel, direction, amount)
        
        # Predict
        probs = self.model.predict_proba([description])[0]
        max_prob = np.max(probs)
        pred_idx = np.argmax(probs)
        predicted_label = self.model.classes_[pred_idx]
        
        if predicted_label not in self.valid_labels:
            raise ValueError(f"Model predicted invalid label: {predicted_label}")
            
        review_status = "AUTO_CLASSIFIED" if max_prob >= self.threshold else "REVIEW_REQUIRED"
        
        return {
            "predicted_label": predicted_label,
            "confidence": float(max_prob),
            "review_status": review_status
        }

    def predict_csv(self, input_csv_path, output_csv_path):
        """
        Predict transactions from a CSV file in batch.
        """
        if not os.path.exists(input_csv_path):
            raise FileNotFoundError(f"Input CSV file not found at: {input_csv_path}")
            
        try:
            df = pd.read_csv(input_csv_path)
        except Exception as e:
            raise RuntimeError(f"Failed to read CSV. Error: {str(e)}")
            
        if len(df) == 0:
            raise ValueError("Validation Error: The CSV file is empty.")
            
        required_columns = {'date', 'channel', 'direction', 'description', 'amount', 'reference_id'}
        missing_cols = required_columns - set(df.columns)
        if missing_cols:
            raise ValueError(f"Validation Error: Missing required columns: {missing_cols}")
            
        # Batch Validation
        for idx, row in df.iterrows():
            try:
                self._validate_input_row(row['description'], row['channel'], row['direction'], row['amount'])
            except ValueError as e:
                raise ValueError(f"Validation Error at row {idx + 1}: {str(e)}")
                
        # Batch Prediction (efficient, no loop)
        descriptions = df['description'].astype(str)
        probs = self.model.predict_proba(descriptions)
        
        max_probs = np.max(probs, axis=1)
        pred_indices = np.argmax(probs, axis=1)
        predicted_labels = self.model.classes_[pred_indices]
        
        # Check valid labels
        invalid_labels = set(predicted_labels) - self.valid_labels
        if invalid_labels:
            raise ValueError(f"Model predicted invalid labels: {invalid_labels}")
            
        # Compile Results
        review_statuses = ["AUTO_CLASSIFIED" if p >= self.threshold else "REVIEW_REQUIRED" for p in max_probs]
        
        result_df = df.copy()
        result_df['predicted_label'] = predicted_labels
        result_df['confidence'] = max_probs
        result_df['review_status'] = review_statuses
        
        # Save output preserving original order
        os.makedirs(os.path.dirname(output_csv_path), exist_ok=True)
        result_df.to_csv(output_csv_path, index=False)
        
        return result_df
