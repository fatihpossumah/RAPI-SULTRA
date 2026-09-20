import pandas as pd
import json

class ReadinessProfiler:
    """
    Transforms the Financial Profile into the RAPI Financing Readiness Profile evidence layer.
    """
    def __init__(self):
        pass

    def build_profile(self, fin_profile: dict) -> dict:
        
        # 1. R - Revenue Stability
        rs_input = fin_profile.get("revenue_stability", {})
        rs_status = rs_input.get("status", "INSUFFICIENT_DATA")
        rs_active = rs_input.get("active_months", 0)
        
        if rs_status == "INSUFFICIENT_DATA":
            rs = {
                "status": rs_status,
                "evidence": {},
                "interpretation": "Data tidak cukup untuk menentukan stabilitas pendapatan.",
                "data_sufficiency": "INSUFFICIENT"
            }
        else:
            rs = {
                "status": rs_status,
                "evidence": {
                    "active_months": rs_active,
                    "average_monthly_revenue": rs_input.get("average_monthly_revenue", 0),
                    "minimum_monthly_revenue": rs_input.get("minimum_monthly_revenue", 0),
                    "maximum_monthly_revenue": rs_input.get("maximum_monthly_revenue", 0),
                    "coefficient_of_variation": rs_input.get("coefficient_of_variation", 0)
                },
                "interpretation": f"Pendapatan teramati selama {rs_active} bulan aktif dengan status {rs_status}. Ini adalah proksi deskriptif dan tidak menjamin stabilitas pendapatan di masa depan.",
                "data_sufficiency": "SUFFICIENT"
            }

        # 2. A - Account / Cash-flow Consistency
        cf_input = fin_profile.get("cash_flow_consistency", {})
        cf_status = cf_input.get("status", "INSUFFICIENT_DATA")
        
        if cf_status == "INSUFFICIENT_DATA":
            cf = {
                "status": cf_status,
                "evidence": {},
                "interpretation": "Data tidak cukup untuk menentukan konsistensi arus kas.",
                "data_sufficiency": "INSUFFICIENT"
            }
        else:
            pos_months = cf_input.get("positive_months", 0)
            neg_months = cf_input.get("negative_months", 0)
            cf = {
                "status": cf_status,
                "evidence": {
                    "observed_months": pos_months + neg_months,
                    "positive_months": pos_months,
                    "negative_months": neg_months,
                    "average_monthly_net_cash_movement": cf_input.get("average_monthly_net_cash_movement", 0)
                },
                "interpretation": f"Pergerakan kas bersih bernilai positif pada {pos_months} dari total {pos_months + neg_months} bulan yang teramati.",
                "data_sufficiency": "SUFFICIENT"
            }

        # 3. P - Payment Behaviour
        pb_input = fin_profile.get("payment_behaviour", {})
        pb_status = pb_input.get("status", "INSUFFICIENT_DATA")
        
        if pb_status == "INSUFFICIENT_DATA":
            pb = {
                "status": pb_status,
                "evidence": {},
                "interpretation": "Tidak ada aktivitas pengeluaran pembiayaan yang teramati. Perilaku pembayaran tidak dapat dievaluasi.",
                "data_sufficiency": "INSUFFICIENT",
                "limitation": "Ketiadaan data tidak mengindikasikan perilaku buruk, melainkan hanya tidak adanya transaksi pembiayaan yang teramati dalam dataset ini."
            }
        else:
            metrics = pb_input.get("observed_metrics", {})
            pb = {
                "status": "OBSERVED_PAYMENT_ACTIVITY", # normalize status as requested
                "evidence": {
                    "months_with_payment": metrics.get("months_with_payment", 0),
                    "total_financing_outflow_observed": metrics.get("total_financing_outflow_observed", 0)
                },
                "interpretation": f"Terdapat pengeluaran pembiayaan yang teramati selama {metrics.get('months_with_payment', 0)} bulan.",
                "data_sufficiency": "LIMITED",
                "limitation": "Pengeluaran pembiayaan yang teramati tidak membuktikan kualitas pembayaran, ketepatan waktu, atau kelayakan kredit karena tidak adanya tanggal jatuh tempo atau jadwal yang tervalidasi."
            }

        # 4. I - Information Completeness
        ic_input = fin_profile.get("information_completeness", {})
        ic_status = ic_input.get("status", "INSUFFICIENT_DATA")
        
        if ic_status == "INSUFFICIENT_DATA":
            ic = {
                "status": ic_status,
                "evidence": {},
                "interpretation": "Metrik kelengkapan data tidak tersedia.",
                "data_sufficiency": "INSUFFICIENT"
            }
        else:
            ic = {
                "status": ic_status,
                "evidence": {
                    "overall_completeness_rate": ic_input.get("overall_completeness_rate", 0),
                    "transaction_count": ic_input.get("transaction_count", 0),
                    "complete_transaction_count": ic_input.get("complete_transaction_count", 0),
                    "review_required_count": ic_input.get("review_required_count", 0),
                    "reconciled_count": ic_input.get("reconciled_count", 0),
                    "duplicate_candidate_count": ic_input.get("duplicate_candidate_count", 0)
                },
                "interpretation": f"Dataset memiliki tingkat kelengkapan atribut keseluruhan sebesar {ic_input.get('overall_completeness_rate', 0)}%. Ini hanya mengukur keberadaan data, bukan kualitas kredit.",
                "data_sufficiency": "SUFFICIENT"
            }

        # Profile Summary
        dimensions_with_limited = 0
        if rs['data_sufficiency'] != "SUFFICIENT": dimensions_with_limited += 1
        if cf['data_sufficiency'] != "SUFFICIENT": dimensions_with_limited += 1
        if pb['data_sufficiency'] != "SUFFICIENT": dimensions_with_limited += 1
        if ic['data_sufficiency'] != "SUFFICIENT": dimensions_with_limited += 1

        period_months = 0
        if rs['data_sufficiency'] == "SUFFICIENT":
            period_months = rs['evidence'].get('active_months', 0)
            
        summary = {
            "observed_period_months": period_months,
            "dimensions_available": 4 - dimensions_with_limited if dimensions_with_limited < 4 else 0, # Rough proxy
            "dimensions_with_limited_data": dimensions_with_limited,
            "summary": "Profil ini memuat bukti observasi mengenai stabilitas pendapatan, konsistensi arus kas, aktivitas pembayaran, dan kelengkapan informasi transaksi."
        }

        # Final Construction
        meta = fin_profile.get("profile_metadata", {})
        rapi_profile = {
            "profile_metadata": {
                "source": "RAPI-SULTRA PoC",
                "period_start": meta.get("period_start", ""),
                "period_end": meta.get("period_end", ""),
                "profile_type": "Profil Kesiapan Pembiayaan"
            },
            "revenue_stability": rs,
            "cash_flow_consistency": cf,
            "payment_behaviour": pb,
            "information_completeness": ic,
            "profile_summary": summary,
            "disclaimer": "Profil ini murni merupakan lapisan bukti deskriptif Proof-of-Concept dan bukan merupakan skor kredit atau keputusan pembiayaan yang tervalidasi."
        }

        return rapi_profile
