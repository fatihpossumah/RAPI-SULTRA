import pandas as pd
import uuid
from difflib import SequenceMatcher

class ReconciliationEngine:
    """
    Reconciliation Engine module for RAPI-SULTRA.
    Matches two records from different channels that represent the same economic activity.
    """
    
    def __init__(self, date_tolerance_days=2, similarity_threshold=0.6):
        self.date_tolerance = pd.Timedelta(days=date_tolerance_days)
        self.similarity_threshold = similarity_threshold
        
        # Valid pairs as sets to allow unordered comparison
        self.valid_pairs = [
            {'QRIS', 'Bank_Mutation'},
            {'Transfer', 'Bank_Mutation'},
            {'Invoice', 'Transfer'},
            {'Invoice', 'QRIS'}
        ]

    def _similarity(self, a, b):
        if pd.isna(a) or pd.isna(b):
            return 0.0
        return SequenceMatcher(None, str(a).lower(), str(b).lower()).ratio()

    def reconcile(self, df: pd.DataFrame) -> pd.DataFrame:
        result_df = df.copy()
        
        # Ensure a canonical ID exists for processing
        if 'raw_transaction_id' not in result_df.columns:
            result_df['raw_transaction_id'] = [str(uuid.uuid4()) for _ in range(len(result_df))]
            
        result_df['reconciliation_status'] = "NOT_RECONCILED"
        result_df['reconciliation_group_id'] = None
        result_df['reconciliation_reason'] = None
        result_df['reconciliation_confidence'] = None
        
        result_df['parsed_date'] = pd.to_datetime(result_df['date'])
        
        n = len(result_df)
        for i in range(n):
            # Skip if already reconciled
            if result_df.at[result_df.index[i], 'reconciliation_status'] == 'RECONCILED':
                continue
                
            for j in range(i + 1, n):
                # Skip if already reconciled
                if result_df.at[result_df.index[j], 'reconciliation_status'] == 'RECONCILED':
                    continue
                    
                row_i = result_df.iloc[i]
                row_j = result_df.iloc[j]
                
                ch_i, ch_j = row_i['channel'], row_j['channel']
                
                # Cannot reconcile same channel or cash
                if ch_i == ch_j or ch_i == 'Cash' or ch_j == 'Cash':
                    continue
                    
                # Check valid relationship
                pair = {ch_i, ch_j}
                if pair not in self.valid_pairs:
                    continue
                
                amt_i, amt_j = row_i['amount'], row_j['amount']
                
                # Must match amount
                if amt_i != amt_j:
                    continue
                    
                dir_i, dir_j = row_i['direction'], row_j['direction']
                # Typically, they represent the same flow from business perspective (e.g., both IN) 
                # unless it's a specific accounting entry, but for PoC we assume they both represent IN or both OUT.
                if dir_i != dir_j:
                    continue
                
                date_i, date_j = row_i['parsed_date'], row_j['parsed_date']
                if pd.isna(date_i) or pd.isna(date_j) or abs(date_i - date_j) > self.date_tolerance:
                    continue
                    
                ref_i = str(row_i['reference_id']).strip()
                ref_j = str(row_j['reference_id']).strip()
                desc_i = str(row_i['description'])
                desc_j = str(row_j['description'])
                
                status = None
                confidence = None
                reason = None
                
                # HIGH CONFIDENCE
                if ref_i != 'nan' and ref_i != 'None' and ref_i != '' and ref_i == ref_j:
                    status = "RECONCILED"
                    confidence = "HIGH"
                    reason = "reference_match"
                
                # MEDIUM CONFIDENCE
                else:
                    desc_sim = self._similarity(desc_i, desc_j)
                    if desc_sim >= self.similarity_threshold:
                        status = "POSSIBLE_MATCH"
                        confidence = "MEDIUM"
                        reason = "similar_description_amount_date"
                
                if status:
                    # Determine Group ID
                    group_id = result_df.at[result_df.index[i], 'reconciliation_group_id']
                    if not group_id:
                        group_id = str(uuid.uuid4())
                        
                    result_df.at[result_df.index[i], 'reconciliation_group_id'] = group_id
                    result_df.at[result_df.index[i], 'reconciliation_status'] = status
                    result_df.at[result_df.index[i], 'reconciliation_reason'] = reason
                    result_df.at[result_df.index[i], 'reconciliation_confidence'] = confidence
                    
                    result_df.at[result_df.index[j], 'reconciliation_group_id'] = group_id
                    result_df.at[result_df.index[j], 'reconciliation_status'] = status
                    result_df.at[result_df.index[j], 'reconciliation_reason'] = reason
                    result_df.at[result_df.index[j], 'reconciliation_confidence'] = confidence
                    
                    if status == "RECONCILED":
                        break # Stop looking for i if it's highly reconciled

        result_df.drop(columns=['parsed_date'], inplace=True)
        return result_df
