import pandas as pd
import os
import json

class FinancialEngine:
    def __init__(self):
        pass

    def _canonicalize_transactions(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Filters and canonicalizes the processed transactions.
        Produces a dataframe where each economic activity is represented exactly once.
        """
        result = df.copy()
        
        # Determine canonical status
        statuses = []
        for idx, row in result.iterrows():
            if row.get('processing_status') == 'PENDING_REVIEW' or row.get('financial_category') == 'OTHER':
                statuses.append('EXCLUDED_PENDING_REVIEW')
            elif row.get('duplicate_status') == 'EXACT_DUPLICATE':
                # We will mark all EXACT_DUPLICATE as EXCLUDED_DUPLICATE initially, 
                # then fix the first one later.
                statuses.append('EXCLUDED_DUPLICATE')
            elif row.get('duplicate_status') == 'POSSIBLE_DUPLICATE':
                statuses.append('EXCLUDED_DUPLICATE')
            elif row.get('reconciliation_status') == 'RECONCILED':
                # Similar to duplicate, we mark initially, fix one later
                statuses.append('CANONICAL_RECONCILED')
            else:
                statuses.append('INCLUDED')
                
        result['canonical_status'] = statuses
        
        # Fix exact duplicates: keep the first occurrence per group as INCLUDED
        if 'duplicate_status' in result.columns and 'duplicate_group_id' in result.columns:
            dup_groups = result[result['duplicate_status'] == 'EXACT_DUPLICATE']['duplicate_group_id'].unique()
            for g in dup_groups:
                if pd.notna(g):
                    idx = result[result['duplicate_group_id'] == g].index[0]
                    result.at[idx, 'canonical_status'] = 'INCLUDED'
                    
        # Fix reconciled: keep the first occurrence per group as CANONICAL_RECONCILED, others EXCLUDED_RECONCILED
        if 'reconciliation_status' in result.columns and 'reconciliation_group_id' in result.columns:
            rec_groups = result[result['reconciliation_status'] == 'RECONCILED']['reconciliation_group_id'].unique()
            for g in rec_groups:
                if pd.notna(g):
                    indices = result[result['reconciliation_group_id'] == g].index
                    # Keep first
                    result.at[indices[0], 'canonical_status'] = 'CANONICAL_RECONCILED'
                    # Exclude rest
                    for i in indices[1:]:
                        result.at[i, 'canonical_status'] = 'EXCLUDED_RECONCILED'
                    
        return result

    def calculate_financials(self, df: pd.DataFrame):
        canonical_df = self._canonicalize_transactions(df)
        
        # Only use valid canonical transactions for totals
        valid_df = canonical_df[canonical_df['canonical_status'].isin(['INCLUDED', 'CANONICAL_RECONCILED'])]
        
        # Date parsing
        valid_df['parsed_date'] = pd.to_datetime(valid_df['date'])
        valid_df['month'] = valid_df['parsed_date'].dt.to_period('M').astype(str)
        
        # Group by month
        monthly_data = []
        months = sorted(valid_df['month'].unique())
        
        for m in months:
            m_df = valid_df[valid_df['month'] == m]
            
            # Totals
            rev = m_df[m_df['financial_category'] == 'REVENUE']['amount'].sum()
            cogs = m_df[m_df['financial_category'] == 'COGS']['amount'].sum()
            opex = m_df[m_df['financial_category'] == 'OPERATING_EXPENSE']['amount'].sum()
            fin_in = m_df[(m_df['financial_category'] == 'FINANCING') & (m_df['direction'] == 'IN')]['amount'].sum()
            fin_out = m_df[(m_df['financial_category'] == 'FINANCING') & (m_df['direction'] == 'OUT')]['amount'].sum()
            
            # Profits
            gp = rev - cogs
            gm = (gp / rev * 100) if rev > 0 else None
            op_res = rev - cogs - opex
            
            # Cash flow (assuming revenue/cogs/opex are all cash-like for this PoC, based on valid IN/OUT)
            # "other valid IN transactions" - internal transfers are valid IN/OUT but cancel each other or just excluded from cashflow?
            # Prompt: "Pastikan internal transfer tidak membuat cash movement menjadi dua kali." - we can just exclude them from total cash flow or sum them properly.
            # Actually, total valid IN:
            cash_in = m_df[m_df['direction'] == 'IN']['amount'].sum()
            cash_out = m_df[m_df['direction'] == 'OUT']['amount'].sum()
            
            # Remove internal transfers from cash in/out to avoid inflating (they just move money)
            int_in = m_df[(m_df['financial_category'] == 'INTERNAL_TRANSFER') & (m_df['direction'] == 'IN')]['amount'].sum()
            int_out = m_df[(m_df['financial_category'] == 'INTERNAL_TRANSFER') & (m_df['direction'] == 'OUT')]['amount'].sum()
            
            adj_cash_in = cash_in - int_in
            adj_cash_out = cash_out - int_out
            
            net_cash = adj_cash_in - adj_cash_out
            
            monthly_data.append({
                "month": m,
                "revenue": float(rev),
                "cogs": float(cogs),
                "operating_expense": float(opex),
                "financing_inflow": float(fin_in),
                "financing_outflow": float(fin_out),
                "gross_profit": float(gp),
                "gross_margin": float(gm) if gm is not None else None,
                "operating_result": float(op_res),
                "net_cash_movement": float(net_cash)
            })
            
        monthly_summary_df = pd.DataFrame(monthly_data)
        
        # Monthly trends (all valid tx)
        trend_data = []
        for m in months:
            m_df = valid_df[valid_df['month'] == m]
            trend_data.append({
                "month": m,
                "transaction_count": len(m_df),
                "revenue_count": len(m_df[m_df['financial_category'] == 'REVENUE']),
                "cogs_count": len(m_df[m_df['financial_category'] == 'COGS']),
                "operating_expense_count": len(m_df[m_df['financial_category'] == 'OPERATING_EXPENSE']),
                "financing_count": len(m_df[m_df['financial_category'] == 'FINANCING']),
                "review_count": len(canonical_df[(canonical_df['canonical_status'] == 'EXCLUDED_PENDING_REVIEW') & (pd.to_datetime(canonical_df['date']).dt.to_period('M').astype(str) == m)])
            })
            
        monthly_trend_df = pd.DataFrame(trend_data)
        
        # Profile input
        total_rev = monthly_summary_df['revenue'].sum() if not monthly_summary_df.empty else 0
        avg_rev = monthly_summary_df['revenue'].mean() if not monthly_summary_df.empty else 0
        std_rev = monthly_summary_df['revenue'].std() if not monthly_summary_df.empty and len(monthly_summary_df) > 1 else 0
        min_rev = monthly_summary_df['revenue'].min() if not monthly_summary_df.empty else 0
        max_rev = monthly_summary_df['revenue'].max() if not monthly_summary_df.empty else 0
        
        tot_cogs = monthly_summary_df['cogs'].sum() if not monthly_summary_df.empty else 0
        tot_opex = monthly_summary_df['operating_expense'].sum() if not monthly_summary_df.empty else 0
        avg_cf = monthly_summary_df['net_cash_movement'].mean() if not monthly_summary_df.empty else 0
        tot_fin_in = monthly_summary_df['financing_inflow'].sum() if not monthly_summary_df.empty else 0
        tot_fin_out = monthly_summary_df['financing_outflow'].sum() if not monthly_summary_df.empty else 0
        
        # Info Completeness
        req_cols = ['date', 'channel', 'direction', 'description', 'amount', 'reference_id', 'predicted_label']
        available_cols = [c for c in req_cols if c in df.columns]
        total_fields = len(df) * len(req_cols)
        present_fields = df[available_cols].notna().sum().sum() if available_cols else 0
        # count empty strings as missing
        empty_str = df[available_cols].apply(lambda x: (x == '').sum()).sum() if available_cols else 0
        completeness = ((present_fields - empty_str) / total_fields) * 100 if total_fields > 0 else 100
        
        review_rate = len(canonical_df[canonical_df['canonical_status'] == 'EXCLUDED_PENDING_REVIEW']) / len(df) * 100
        dup_rate = len(canonical_df[canonical_df['canonical_status'] == 'EXCLUDED_DUPLICATE']) / len(df) * 100
        rec_rate = len(canonical_df[canonical_df['canonical_status'] == 'CANONICAL_RECONCILED']) / len(df) * 100
        
        profile_input = {
            "total_revenue": total_rev,
            "average_monthly_revenue": avg_rev,
            "revenue_std": std_rev,
            "revenue_min": min_rev,
            "revenue_max": max_rev,
            "total_cogs": tot_cogs,
            "total_operating_expense": tot_opex,
            "average_monthly_cash_flow": avg_cf,
            "total_financing_inflow": tot_fin_in,
            "total_financing_outflow": tot_fin_out,
            "transaction_count": len(valid_df),
            "active_months": len(months),
            "review_rate": review_rate,
            "duplicate_rate": dup_rate,
            "reconciled_rate": rec_rate,
            "information_completeness_input": completeness
        }
        
        # Overall Summary
        overall_summary = {
            "revenue": total_rev,
            "cogs": tot_cogs,
            "operating_expense": tot_opex,
            "financing_inflow": tot_fin_in,
            "financing_outflow": tot_fin_out,
            "gross_profit": total_rev - tot_cogs,
            "gross_margin": ((total_rev - tot_cogs) / total_rev * 100) if total_rev > 0 else None,
            "operating_result": total_rev - tot_cogs - tot_opex,
            "net_cash_movement": monthly_summary_df['net_cash_movement'].sum() if not monthly_summary_df.empty else 0,
            "included_transaction_count": len(valid_df),
            "pending_review_count": len(canonical_df[canonical_df['canonical_status'] == 'EXCLUDED_PENDING_REVIEW']),
            "duplicate_excluded_count": len(canonical_df[canonical_df['canonical_status'] == 'EXCLUDED_DUPLICATE']),
            "reconciled_transaction_count": len(canonical_df[canonical_df['canonical_status'] == 'CANONICAL_RECONCILED'])
        }

        return {
            "canonical_df": canonical_df,
            "monthly_summary_df": monthly_summary_df,
            "monthly_trend_df": monthly_trend_df,
            "profile_input_df": pd.DataFrame([profile_input]),
            "overall_summary": overall_summary
        }
