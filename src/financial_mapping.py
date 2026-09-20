import pandas as pd

class FinancialMapper:
    """
    Financial Mapping module for RAPI-SULTRA.
    Maps predicted labels and directions to standardized financial categories.
    """
    
    def __init__(self):
        pass
        
    def map_transactions(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Maps a DataFrame of predicted transactions to financial categories.
        
        Args:
            df (pd.DataFrame): DataFrame containing 'predicted_label', 'direction', 'review_status'
            
        Returns:
            pd.DataFrame: DataFrame with new columns 'financial_category', 'economic_group', 'financial_processing_status'
        """
        # Create a copy to avoid SettingWithCopyWarning and preserve raw data
        mapped_df = df.copy()
        
        # Initialize new columns
        mapped_df['financial_category'] = None
        mapped_df['economic_group'] = None
        mapped_df['financial_processing_status'] = None
        
        for idx, row in mapped_df.iterrows():
            label = row.get('predicted_label')
            direction = row.get('direction')
            review_status = row.get('review_status')
            
            fin_cat = None
            econ_group = None
            class_status = "MAPPED"
            
            if label == "Revenue":
                fin_cat = "REVENUE"
                econ_group = "OPERATING"
            elif label == "COGS":
                fin_cat = "COGS"
                econ_group = "OPERATING"
            elif label == "Operating_Expense":
                fin_cat = "OPERATING_EXPENSE"
                econ_group = "OPERATING"
            elif label == "Financing":
                fin_cat = "FINANCING"
                econ_group = "FINANCING"
                # distinction is just kept by direction, which is already in data
            elif label == "Transfer_Internal":
                fin_cat = "INTERNAL_TRANSFER"
                econ_group = "INTERNAL"
            elif label == "Other":
                fin_cat = "OTHER"
                econ_group = "UNRESOLVED"
                class_status = "REVIEW_REQUIRED"
            else:
                fin_cat = "UNKNOWN"
                econ_group = "UNKNOWN"
                class_status = "REVIEW_REQUIRED"
                
            # Process review status logic
            if review_status == "REVIEW_REQUIRED" or class_status == "REVIEW_REQUIRED":
                processing_status = "PENDING_REVIEW"
            else:
                processing_status = "MAPPED"
                
            mapped_df.at[idx, 'financial_category'] = fin_cat
            mapped_df.at[idx, 'economic_group'] = econ_group
            mapped_df.at[idx, 'financial_processing_status'] = processing_status
            
        return mapped_df
