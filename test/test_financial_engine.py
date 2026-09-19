import pytest
import pandas as pd
from financial_engine import FinancialEngine

def get_base_df(rows):
    return pd.DataFrame(rows)

def test_revenue_calculated_correctly():
    df = get_base_df([
        {"date": "2026-01-01", "channel": "QRIS", "direction": "IN", "amount": 100, "financial_category": "REVENUE", "processing_status": "READY"},
        {"date": "2026-01-02", "channel": "QRIS", "direction": "IN", "amount": 50, "financial_category": "REVENUE", "processing_status": "READY"}
    ])
    engine = FinancialEngine()
    res = engine.calculate_financials(df)
    assert res['overall_summary']['revenue'] == 150

def test_cogs_calculated_correctly():
    df = get_base_df([{"date": "2026-01-01", "channel": "Transfer", "direction": "OUT", "amount": 75, "financial_category": "COGS", "processing_status": "READY"}])
    engine = FinancialEngine()
    res = engine.calculate_financials(df)
    assert res['overall_summary']['cogs'] == 75

def test_opex_calculated_correctly():
    df = get_base_df([{"date": "2026-01-01", "channel": "Bank_Mutation", "direction": "OUT", "amount": 30, "financial_category": "OPERATING_EXPENSE", "processing_status": "READY"}])
    engine = FinancialEngine()
    res = engine.calculate_financials(df)
    assert res['overall_summary']['operating_expense'] == 30

def test_financing_in_not_in_revenue():
    df = get_base_df([
        {"date": "2026-01-01", "channel": "Transfer", "direction": "IN", "amount": 1000, "financial_category": "FINANCING", "processing_status": "READY"}
    ])
    engine = FinancialEngine()
    res = engine.calculate_financials(df)
    assert res['overall_summary']['revenue'] == 0
    assert res['overall_summary']['financing_inflow'] == 1000

def test_financing_out_not_in_opex():
    df = get_base_df([
        {"date": "2026-01-01", "channel": "Transfer", "direction": "OUT", "amount": 100, "financial_category": "FINANCING", "processing_status": "READY"}
    ])
    engine = FinancialEngine()
    res = engine.calculate_financials(df)
    assert res['overall_summary']['operating_expense'] == 0
    assert res['overall_summary']['financing_outflow'] == 100

def test_internal_transfer_not_in_revenue():
    df = get_base_df([{"date": "2026-01-01", "channel": "Transfer", "direction": "IN", "amount": 500, "financial_category": "INTERNAL_TRANSFER", "processing_status": "READY"}])
    engine = FinancialEngine()
    res = engine.calculate_financials(df)
    assert res['overall_summary']['revenue'] == 0

def test_internal_transfer_not_in_expense():
    df = get_base_df([{"date": "2026-01-01", "channel": "Transfer", "direction": "OUT", "amount": 500, "financial_category": "INTERNAL_TRANSFER", "processing_status": "READY"}])
    engine = FinancialEngine()
    res = engine.calculate_financials(df)
    assert res['overall_summary']['operating_expense'] == 0
    assert res['overall_summary']['cogs'] == 0

def test_review_required_excluded():
    df = get_base_df([
        {"date": "2026-01-01", "channel": "QRIS", "direction": "IN", "amount": 100, "financial_category": "REVENUE", "processing_status": "PENDING_REVIEW"}
    ])
    engine = FinancialEngine()
    res = engine.calculate_financials(df)
    assert res['overall_summary']['revenue'] == 0
    assert res['overall_summary']['pending_review_count'] == 1

def test_other_excluded():
    df = get_base_df([
        {"date": "2026-01-01", "channel": "QRIS", "direction": "IN", "amount": 100, "financial_category": "OTHER", "processing_status": "READY"}
    ])
    engine = FinancialEngine()
    res = engine.calculate_financials(df)
    assert res['overall_summary']['revenue'] == 0
    assert res['overall_summary']['pending_review_count'] == 1

def test_reconciled_pair_counted_once():
    df = get_base_df([
        {"date": "2026-01-01", "channel": "QRIS", "direction": "IN", "amount": 200, "financial_category": "REVENUE", "processing_status": "READY", "reconciliation_status": "RECONCILED", "reconciliation_group_id": "G1"},
        {"date": "2026-01-01", "channel": "Bank_Mutation", "direction": "IN", "amount": 200, "financial_category": "REVENUE", "processing_status": "READY", "reconciliation_status": "RECONCILED", "reconciliation_group_id": "G1"}
    ])
    engine = FinancialEngine()
    res = engine.calculate_financials(df)
    assert res['overall_summary']['revenue'] == 200
    assert res['overall_summary']['reconciled_transaction_count'] == 1

def test_exact_duplicate_counted_once():
    df = get_base_df([
        {"date": "2026-01-01", "channel": "QRIS", "direction": "IN", "amount": 300, "financial_category": "REVENUE", "processing_status": "READY", "duplicate_status": "EXACT_DUPLICATE", "duplicate_group_id": "D1"},
        {"date": "2026-01-01", "channel": "QRIS", "direction": "IN", "amount": 300, "financial_category": "REVENUE", "processing_status": "READY", "duplicate_status": "EXACT_DUPLICATE", "duplicate_group_id": "D1"}
    ])
    engine = FinancialEngine()
    res = engine.calculate_financials(df)
    assert res['overall_summary']['revenue'] == 300
    assert res['overall_summary']['duplicate_excluded_count'] == 1

def test_amount_original_unchanged():
    df = get_base_df([{"date": "2026-01-01", "channel": "QRIS", "direction": "IN", "amount": 123.45, "financial_category": "REVENUE", "processing_status": "READY"}])
    engine = FinancialEngine()
    res = engine.calculate_financials(df)
    assert res['canonical_df'].iloc[0]['amount'] == 123.45

def test_gross_profit_correct():
    df = get_base_df([
        {"date": "2026-01-01", "channel": "QRIS", "direction": "IN", "amount": 1000, "financial_category": "REVENUE", "processing_status": "READY"},
        {"date": "2026-01-01", "channel": "Transfer", "direction": "OUT", "amount": 400, "financial_category": "COGS", "processing_status": "READY"}
    ])
    engine = FinancialEngine()
    res = engine.calculate_financials(df)
    assert res['overall_summary']['gross_profit'] == 600

def test_gross_margin_correct():
    df = get_base_df([
        {"date": "2026-01-01", "channel": "QRIS", "direction": "IN", "amount": 1000, "financial_category": "REVENUE", "processing_status": "READY"},
        {"date": "2026-01-01", "channel": "Transfer", "direction": "OUT", "amount": 400, "financial_category": "COGS", "processing_status": "READY"}
    ])
    engine = FinancialEngine()
    res = engine.calculate_financials(df)
    assert res['overall_summary']['gross_margin'] == 60.0

def test_operating_result_correct():
    df = get_base_df([
        {"date": "2026-01-01", "channel": "QRIS", "direction": "IN", "amount": 1000, "financial_category": "REVENUE", "processing_status": "READY"},
        {"date": "2026-01-01", "channel": "Transfer", "direction": "OUT", "amount": 400, "financial_category": "COGS", "processing_status": "READY"},
        {"date": "2026-01-01", "channel": "Bank_Mutation", "direction": "OUT", "amount": 200, "financial_category": "OPERATING_EXPENSE", "processing_status": "READY"}
    ])
    engine = FinancialEngine()
    res = engine.calculate_financials(df)
    assert res['overall_summary']['operating_result'] == 400

def test_net_cash_movement_correct():
    df = get_base_df([
        {"date": "2026-01-01", "channel": "QRIS", "direction": "IN", "amount": 1000, "financial_category": "REVENUE", "processing_status": "READY"},
        {"date": "2026-01-01", "channel": "Transfer", "direction": "OUT", "amount": 400, "financial_category": "COGS", "processing_status": "READY"},
        {"date": "2026-01-01", "channel": "Transfer", "direction": "IN", "amount": 5000, "financial_category": "FINANCING", "processing_status": "READY"} # Inflow
    ])
    engine = FinancialEngine()
    res = engine.calculate_financials(df)
    assert res['overall_summary']['net_cash_movement'] == 5600

def test_monthly_aggregation():
    df = get_base_df([
        {"date": "2026-01-01", "channel": "QRIS", "direction": "IN", "amount": 1000, "financial_category": "REVENUE", "processing_status": "READY"},
        {"date": "2026-02-01", "channel": "QRIS", "direction": "IN", "amount": 2000, "financial_category": "REVENUE", "processing_status": "READY"}
    ])
    engine = FinancialEngine()
    res = engine.calculate_financials(df)
    assert len(res['monthly_summary_df']) == 2
    assert res['monthly_summary_df'].iloc[0]['month'] == '2026-01'
    assert res['monthly_summary_df'].iloc[0]['revenue'] == 1000
    assert res['monthly_summary_df'].iloc[1]['month'] == '2026-02'
    assert res['monthly_summary_df'].iloc[1]['revenue'] == 2000

def test_zero_revenue_division_error():
    df = get_base_df([
        {"date": "2026-01-01", "channel": "Transfer", "direction": "OUT", "amount": 400, "financial_category": "COGS", "processing_status": "READY"}
    ])
    engine = FinancialEngine()
    res = engine.calculate_financials(df)
    assert res['overall_summary']['gross_margin'] is None
    assert res['overall_summary']['revenue'] == 0
