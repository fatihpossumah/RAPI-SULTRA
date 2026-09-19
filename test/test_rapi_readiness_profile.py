import pytest
import pandas as pd
import json
import os
from rapi_readiness_profile import ReadinessProfiler

def get_mock_fin_profile():
    return {
        "profile_metadata": {"period_start": "2026-01", "period_end": "2026-06"},
        "revenue_stability": {
            "status": "STABLE",
            "active_months": 6,
            "average_monthly_revenue": 1000,
            "minimum_monthly_revenue": 500,
            "maximum_monthly_revenue": 1500,
            "coefficient_of_variation": 0.1
        },
        "cash_flow_consistency": {
            "status": "CONSISTENTLY_POSITIVE",
            "positive_months": 5,
            "negative_months": 1,
            "average_monthly_net_cash_movement": 200
        },
        "payment_behaviour": {
            "status": "OBSERVED_PAYMENTS",
            "observed_metrics": {
                "months_with_payment": 2,
                "total_financing_outflow_observed": 500
            }
        },
        "information_completeness": {
            "status": "HIGHLY_COMPLETE",
            "overall_completeness_rate": 100,
            "transaction_count": 50,
            "complete_transaction_count": 50,
            "review_required_count": 0,
            "reconciled_count": 0,
            "duplicate_candidate_count": 0
        }
    }

def test_dimensions_exist():
    profiler = ReadinessProfiler()
    prof = profiler.build_profile(get_mock_fin_profile())
    assert "revenue_stability" in prof
    assert "cash_flow_consistency" in prof
    assert "payment_behaviour" in prof
    assert "information_completeness" in prof

def test_no_aggregate_score():
    profiler = ReadinessProfiler()
    prof = profiler.build_profile(get_mock_fin_profile())
    prof_str = json.dumps(prof).lower()
    assert "score" not in prof_str or "disclaimer" in prof_str # Ensure no score except disclaimer
    assert prof.get("rapi_score") is None
    assert prof.get("credit_score") is None

def test_no_approval_decision():
    profiler = ReadinessProfiler()
    prof = profiler.build_profile(get_mock_fin_profile())
    prof_str = json.dumps(prof).lower()
    assert "approved" not in prof_str
    assert "rejected" not in prof_str
    assert "eligible" not in prof_str.replace("ineligible", "") # exclude random substring matches if any

def test_revenue_stability_picks_up_values():
    profiler = ReadinessProfiler()
    prof = profiler.build_profile(get_mock_fin_profile())
    assert prof["revenue_stability"]["evidence"]["average_monthly_revenue"] == 1000

def test_cash_flow_picks_up_values():
    profiler = ReadinessProfiler()
    prof = profiler.build_profile(get_mock_fin_profile())
    assert prof["cash_flow_consistency"]["evidence"]["positive_months"] == 5

def test_payment_behaviour_insufficient():
    profiler = ReadinessProfiler()
    mock = get_mock_fin_profile()
    mock["payment_behaviour"]["status"] = "INSUFFICIENT_DATA"
    prof = profiler.build_profile(mock)
    assert prof["payment_behaviour"]["data_sufficiency"] == "INSUFFICIENT"
    assert prof["payment_behaviour"]["evidence"] == {}

def test_payment_behaviour_limited():
    profiler = ReadinessProfiler()
    prof = profiler.build_profile(get_mock_fin_profile())
    assert prof["payment_behaviour"]["data_sufficiency"] == "LIMITED"
    assert "limitation" in prof["payment_behaviour"]

def test_information_completeness_picks_up_values():
    profiler = ReadinessProfiler()
    prof = profiler.build_profile(get_mock_fin_profile())
    assert prof["information_completeness"]["evidence"]["overall_completeness_rate"] == 100

def test_empty_profile_no_crash():
    profiler = ReadinessProfiler()
    prof = profiler.build_profile({})
    assert prof["revenue_stability"]["status"] == "INSUFFICIENT_DATA"
    assert prof["profile_summary"]["dimensions_available"] == 0

def test_missing_payment_no_error():
    profiler = ReadinessProfiler()
    mock = get_mock_fin_profile()
    del mock["payment_behaviour"]
    prof = profiler.build_profile(mock)
    assert prof["payment_behaviour"]["status"] == "INSUFFICIENT_DATA"

def test_json_and_csv_export(tmp_path):
    from run_rapi_readiness_profile import run_rapi_profiler
    
    # Write mock input
    in_json = tmp_path / "financial_profile.json"
    with open(in_json, 'w') as f:
        json.dump(get_mock_fin_profile(), f)
        
    run_rapi_profiler(str(in_json), str(tmp_path))
    
    out_json = tmp_path / "rapi_financing_readiness_profile.json"
    assert out_json.exists()
    
    with open(out_json, 'r') as f:
        data = json.load(f)
        assert data["revenue_stability"]["status"] == "STABLE"
        
    out_csv = tmp_path / "rapi_financing_readiness_profile.csv"
    assert out_csv.exists()
    
    df = pd.read_csv(out_csv)
    expected_cols = ["dimension", "status", "data_sufficiency", "metric", "value", "interpretation"]
    for c in expected_cols:
        assert c in df.columns
