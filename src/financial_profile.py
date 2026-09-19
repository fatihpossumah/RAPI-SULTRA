import pandas as pd
import json

class FinancialProfiler:
    """
    RAPI-SULTRA Financial Profiler
    Generates descriptive proxy indicators based on Financial Engine outputs.
    Does not produce credit scores or approval decisions.
    """
    def __init__(self):
        pass
        
    def _evaluate_revenue_stability(self, monthly_summary, profile_input):
        rev_std = profile_input.get('revenue_std', 0)
        avg_rev = profile_input.get('average_monthly_revenue', 0)
        
        cv = (rev_std / avg_rev) if avg_rev > 0 else 0
        
        if avg_rev == 0:
            status = "INSUFFICIENT_DATA"
            exp = "No average revenue to calculate stability."
        elif cv < 0.25:
            status = "STABLE"
            exp = f"Low revenue variability (CV = {cv:.2f})."
        elif cv <= 0.50:
            status = "MODERATE_VARIABILITY"
            exp = f"Moderate revenue variability (CV = {cv:.2f})."
        else:
            status = "HIGH_VARIABILITY"
            exp = f"High revenue variability (CV = {cv:.2f})."
            
        return {
            "active_months": int(profile_input.get('active_months', 0)),
            "average_monthly_revenue": float(avg_rev),
            "minimum_monthly_revenue": float(profile_input.get('revenue_min', 0)),
            "maximum_monthly_revenue": float(profile_input.get('revenue_max', 0)),
            "coefficient_of_variation": float(cv),
            "status": status,
            "explanation": exp
        }
        
    def _evaluate_cash_flow_consistency(self, monthly_summary, profile_input):
        if monthly_summary.empty or 'net_cash_movement' not in monthly_summary.columns:
            return {
                "average_monthly_net_cash_movement": 0,
                "positive_months": 0,
                "negative_months": 0,
                "status": "INSUFFICIENT_DATA",
                "explanation": "No monthly data available."
            }
            
        pos_months = len(monthly_summary[monthly_summary['net_cash_movement'] > 0])
        neg_months = len(monthly_summary[monthly_summary['net_cash_movement'] <= 0])
        total_months = len(monthly_summary)
        
        pos_ratio = pos_months / total_months if total_months > 0 else 0
        
        if pos_ratio >= 0.8:
            status = "CONSISTENTLY_POSITIVE"
        elif pos_ratio >= 0.5:
            status = "MODERATELY_POSITIVE"
        else:
            status = "VULNERABLE"
            
        return {
            "average_monthly_net_cash_movement": float(profile_input.get('average_monthly_cash_flow', 0)),
            "positive_months": int(pos_months),
            "negative_months": int(neg_months),
            "status": status,
            "explanation": f"{pos_ratio*100:.0f}% of observed months have positive net cash movement."
        }
        
    def _evaluate_payment_behaviour(self, monthly_summary, profile_input):
        # We only use financing_outflow as a proxy for payment behaviour.
        if monthly_summary.empty or 'financing_outflow' not in monthly_summary.columns:
            return {
                "status": "INSUFFICIENT_DATA",
                "observed_metrics": {},
                "explanation": "No financial data available."
            }
            
        fin_out = monthly_summary['financing_outflow']
        months_with_payment = len(fin_out[fin_out > 0])
        total_fin_out = profile_input.get('total_financing_outflow', 0)
        
        if total_fin_out == 0:
            return {
                "status": "INSUFFICIENT_DATA",
                "observed_metrics": {
                    "months_with_payment": 0,
                    "total_financing_outflow_observed": 0
                },
                "explanation": "No financing outflow (payments) observed in the dataset. Cannot evaluate payment behaviour."
            }
            
        return {
            "status": "OBSERVED_PAYMENTS",
            "observed_metrics": {
                "months_with_payment": int(months_with_payment),
                "total_financing_outflow_observed": float(total_fin_out)
            },
            "explanation": f"Observed financing outflow in {months_with_payment} out of {len(monthly_summary)} active months. This is a proxy indicator, not a validated creditworthiness score."
        }

    def _evaluate_information_completeness(self, monthly_summary, profile_input, overall_summary):
        comp_rate = profile_input.get('information_completeness_input', 0)
        
        if comp_rate >= 90:
            status = "HIGHLY_COMPLETE"
        elif comp_rate >= 70:
            status = "MODERATELY_COMPLETE"
        else:
            status = "INCOMPLETE"
            
        return {
            "overall_completeness_rate": float(comp_rate),
            "transaction_count": int(profile_input.get('transaction_count', 0)),
            "complete_transaction_count": int(overall_summary.get('included_transaction_count', 0)), # proxy for complete valid tx
            "review_required_count": int(overall_summary.get('pending_review_count', 0)),
            "reconciled_count": int(overall_summary.get('reconciled_transaction_count', 0)),
            "duplicate_candidate_count": int(overall_summary.get('duplicate_excluded_count', 0)),
            "status": status,
            "explanation": f"Information completeness rate is {comp_rate:.1f}%. This evaluates the presence of core transaction attributes."
        }

    def generate_profile(self, monthly_summary: pd.DataFrame, profile_input_df: pd.DataFrame, overall_summary: dict) -> dict:
        profile_input = profile_input_df.iloc[0].to_dict() if not profile_input_df.empty else {}
        
        # Build Profile
        has_month = 'month' in monthly_summary.columns
        profile = {
            "profile_metadata": {
                "period_start": str(monthly_summary['month'].min()) if not monthly_summary.empty and has_month else "",
                "period_end": str(monthly_summary['month'].max()) if not monthly_summary.empty and has_month else "",
                "source": "RAPI-SULTRA PoC - Financial Engine Output"
            },
            "revenue_stability": self._evaluate_revenue_stability(monthly_summary, profile_input),
            "cash_flow_consistency": self._evaluate_cash_flow_consistency(monthly_summary, profile_input),
            "payment_behaviour": self._evaluate_payment_behaviour(monthly_summary, profile_input),
            "information_completeness": self._evaluate_information_completeness(monthly_summary, profile_input, overall_summary)
        }
        
        return profile
