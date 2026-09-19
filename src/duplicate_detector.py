import pandas as pd
import uuid
from difflib import SequenceMatcher

class DuplicateDetector:
    """
    Duplicate Detection module for RAPI-SULTRA.
    Detects possible duplicated records across 3 levels:
    1. Exact Match
    2. Reference Match
    3. Similarity Match
    """
    
    def __init__(self, date_tolerance_days=1, similarity_threshold=0.8):
        self.date_tolerance = pd.Timedelta(days=date_tolerance_days)
        self.similarity_threshold = similarity_threshold

    def _similarity(self, a, b):
        if pd.isna(a) or pd.isna(b):
            return 0.0
        return SequenceMatcher(None, str(a).lower(), str(b).lower()).ratio()

    def detect_duplicates(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Detects duplicates and adds duplicate status columns.
        """
        result_df = df.copy()
        
        # Ensure a canonical ID exists for processing
        if 'raw_transaction_id' not in result_df.columns:
            result_df['raw_transaction_id'] = [str(uuid.uuid4()) for _ in range(len(result_df))]
            
        result_df['duplicate_status'] = "UNIQUE"
        result_df['duplicate_group_id'] = None
        result_df['duplicate_reason'] = None
        
        # Ensure date is datetime for comparison
        result_df['parsed_date'] = pd.to_datetime(result_df['date'])
        
        groups = {} # to track duplicate groups
        
        n = len(result_df)
        for i in range(n):
            for j in range(i + 1, n):
                row_i = result_df.iloc[i]
                row_j = result_df.iloc[j]
                
                # Compare fields
                date_i, date_j = row_i['parsed_date'], row_j['parsed_date']
                amt_i, amt_j = row_i['amount'], row_j['amount']
                dir_i, dir_j = row_i['direction'], row_j['direction']
                ch_i, ch_j = row_i['channel'], row_j['channel']
                ref_i, ref_j = str(row_i['reference_id']).strip(), str(row_j['reference_id']).strip()
                desc_i, desc_j = str(row_i['description']), str(row_j['description'])
                
                status = None
                reason = None
                
                # LEVEL 1: Exact Duplicate
                if (date_i == date_j and amt_i == amt_j and dir_i == dir_j and 
                    ch_i == ch_j and ref_i == ref_j and desc_i == desc_j):
                    status = "EXACT_DUPLICATE"
                    reason = "exact_same_record"
                
                # LEVEL 2: Reference Duplicate
                elif amt_i == amt_j and ref_i != 'nan' and ref_i != 'None' and ref_i != '' and ref_i == ref_j:
                    if pd.notna(date_i) and pd.notna(date_j) and abs(date_i - date_j) <= self.date_tolerance:
                        status = "POSSIBLE_DUPLICATE"
                        reason = "same_reference_same_amount"
                
                # LEVEL 3: Transaction Similarity
                elif amt_i == amt_j and dir_i == dir_j and ch_i == ch_j:
                    if pd.notna(date_i) and pd.notna(date_j) and abs(date_i - date_j) <= self.date_tolerance:
                        desc_sim = self._similarity(desc_i, desc_j)
                        if desc_sim >= self.similarity_threshold:
                            status = "POSSIBLE_DUPLICATE"
                            reason = "similar_transaction_same_amount"
                
                if status:
                    # Determine Group ID
                    group_id = result_df.at[result_df.index[i], 'duplicate_group_id']
                    if not group_id:
                        group_id = str(uuid.uuid4())
                        result_df.at[result_df.index[i], 'duplicate_group_id'] = group_id
                    
                    result_df.at[result_df.index[j], 'duplicate_group_id'] = group_id
                    
                    # Update status if it's the first time or escalating from POSSIBLE to EXACT
                    curr_status_i = result_df.at[result_df.index[i], 'duplicate_status']
                    curr_status_j = result_df.at[result_df.index[j], 'duplicate_status']
                    
                    if curr_status_i == "UNIQUE" or (curr_status_i == "POSSIBLE_DUPLICATE" and status == "EXACT_DUPLICATE"):
                        result_df.at[result_df.index[i], 'duplicate_status'] = status
                        result_df.at[result_df.index[i], 'duplicate_reason'] = reason
                        
                    if curr_status_j == "UNIQUE" or (curr_status_j == "POSSIBLE_DUPLICATE" and status == "EXACT_DUPLICATE"):
                        result_df.at[result_df.index[j], 'duplicate_status'] = status
                        result_df.at[result_df.index[j], 'duplicate_reason'] = reason

        # Clean up temporary column
        result_df.drop(columns=['parsed_date'], inplace=True)
        return result_df
