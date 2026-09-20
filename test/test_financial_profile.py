import pytest
import pandas as pd
from financial_profile import FinancialProfiler

def test_revenue_stability_stable():
    profiler = FinancialProfiler()
    ms = pd.DataFrame([{'month': '2026-01'}, {'month': '2026-02'}])
    pi = pd.DataFrame([{'revenue_std': 0, 'average_monthly_revenue': 1000, 'active_months': 2}])
    res = profiler.generate_profile(ms, pi, {})
    assert res['revenue_stability']['status'] == 'STABLE'

def test_revenue_stability_high_variability():
    profiler = FinancialProfiler()
    ms = pd.DataFrame([{'month': '2026-01'}, {'month': '2026-02'}])
    # CV = 0.6 > 0.5 -> HIGH_VARIABILITY
    pi = pd.DataFrame([{'revenue_std': 600, 'average_monthly_revenue': 1000, 'active_months': 2}])
    res = profiler.generate_profile(ms, pi, {})
    assert res['revenue_stability']['status'] == 'HIGH_VARIABILITY'

def test_cash_flow_all_positive():
    profiler = FinancialProfiler()
    ms = pd.DataFrame([
        {'month': '2026-01', 'net_cash_movement': 100},
        {'month': '2026-02', 'net_cash_movement': 200}
    ])
    res = profiler.generate_profile(ms, pd.DataFrame([{}]), {})
    assert res['cash_flow_consistency']['status'] == 'CONSISTENTLY_POSITIVE'
    assert res['cash_flow_consistency']['positive_months'] == 2

def test_cash_flow_partially_negative():
    profiler = FinancialProfiler()
    ms = pd.DataFrame([
        {'month': '2026-01', 'net_cash_movement': 100},
        {'month': '2026-02', 'net_cash_movement': -50},
        {'month': '2026-03', 'net_cash_movement': -20}
    ])
    # 1/3 = 33% positive -> VULNERABLE
    res = profiler.generate_profile(ms, pd.DataFrame([{}]), {})
    assert res['cash_flow_consistency']['status'] == 'VULNERABLE'
    assert res['cash_flow_consistency']['negative_months'] == 2

def test_payment_behaviour_insufficient_data():
    profiler = FinancialProfiler()
    ms = pd.DataFrame([{'financing_outflow': 0}])
    pi = pd.DataFrame([{'total_financing_outflow': 0}])
    res = profiler.generate_profile(ms, pi, {})
    assert res['payment_behaviour']['status'] == 'INSUFFICIENT_DATA'

def test_information_completeness_100():
    profiler = FinancialProfiler()
    pi = pd.DataFrame([{'information_completeness_input': 100}])
    res = profiler.generate_profile(pd.DataFrame([{}]), pi, {})
    assert res['information_completeness']['status'] == 'HIGHLY_COMPLETE'
    assert res['information_completeness']['overall_completeness_rate'] == 100

def test_information_completeness_partial():
    profiler = FinancialProfiler()
    pi = pd.DataFrame([{'information_completeness_input': 65}])
    res = profiler.generate_profile(pd.DataFrame([{}]), pi, {})
    assert res['information_completeness']['status'] == 'INCOMPLETE'
    assert res['information_completeness']['overall_completeness_rate'] == 65

def test_empty_dataset():
    profiler = FinancialProfiler()
    res = profiler.generate_profile(pd.DataFrame(), pd.DataFrame(), {})
    assert res['revenue_stability']['status'] == 'INSUFFICIENT_DATA'
    assert res['cash_flow_consistency']['status'] == 'INSUFFICIENT_DATA'
    assert res['payment_behaviour']['status'] == 'INSUFFICIENT_DATA'
    assert res['information_completeness']['status'] == 'INCOMPLETE'

def test_zero_revenue():
    profiler = FinancialProfiler()
    ms = pd.DataFrame([{'month': '2026-01'}])
    pi = pd.DataFrame([{'revenue_std': 0, 'average_monthly_revenue': 0, 'active_months': 1}])
    res = profiler.generate_profile(ms, pi, {})
    assert res['revenue_stability']['status'] == 'INSUFFICIENT_DATA'
    assert res['revenue_stability']['coefficient_of_variation'] == 0

def test_missing_monthly_data():
    profiler = FinancialProfiler()
    pi = pd.DataFrame([{'revenue_std': 100, 'average_monthly_revenue': 1000}])
    res = profiler.generate_profile(pd.DataFrame(), pi, {})
    assert res['cash_flow_consistency']['status'] == 'INSUFFICIENT_DATA'
    assert res['revenue_stability']['status'] == 'STABLE' # Uses pi data
