import pytest
import pandas as pd
from financial_mapping import FinancialMapper
from duplicate_detector import DuplicateDetector
from reconciliation_engine import ReconciliationEngine
from run_financial_processing import determine_processing_status

def test_financial_mapping_revenue():
    df = pd.DataFrame([{"predicted_label": "Revenue", "direction": "IN", "review_status": "AUTO_CLASSIFIED"}])
    mapper = FinancialMapper()
    mapped = mapper.map_transactions(df)
    assert mapped.iloc[0]['financial_category'] == "REVENUE"
    assert mapped.iloc[0]['economic_group'] == "OPERATING"
    assert mapped.iloc[0]['financial_processing_status'] == "MAPPED"

def test_financial_mapping_cogs():
    df = pd.DataFrame([{"predicted_label": "COGS", "direction": "OUT", "review_status": "AUTO_CLASSIFIED"}])
    mapper = FinancialMapper()
    mapped = mapper.map_transactions(df)
    assert mapped.iloc[0]['financial_category'] == "COGS"
    assert mapped.iloc[0]['economic_group'] == "OPERATING"

def test_financial_mapping_operating_expense():
    df = pd.DataFrame([{"predicted_label": "Operating_Expense", "direction": "OUT", "review_status": "AUTO_CLASSIFIED"}])
    mapper = FinancialMapper()
    mapped = mapper.map_transactions(df)
    assert mapped.iloc[0]['financial_category'] == "OPERATING_EXPENSE"
    assert mapped.iloc[0]['economic_group'] == "OPERATING"

def test_financial_mapping_financing_in_out():
    df = pd.DataFrame([
        {"predicted_label": "Financing", "direction": "IN", "review_status": "AUTO_CLASSIFIED"},
        {"predicted_label": "Financing", "direction": "OUT", "review_status": "AUTO_CLASSIFIED"}
    ])
    mapper = FinancialMapper()
    mapped = mapper.map_transactions(df)
    assert mapped.iloc[0]['financial_category'] == "FINANCING"
    assert mapped.iloc[1]['financial_category'] == "FINANCING"
    assert mapped.iloc[0]['economic_group'] == "FINANCING"

def test_financial_mapping_transfer_internal():
    df = pd.DataFrame([{"predicted_label": "Transfer_Internal", "direction": "IN", "review_status": "AUTO_CLASSIFIED"}])
    mapper = FinancialMapper()
    mapped = mapper.map_transactions(df)
    assert mapped.iloc[0]['financial_category'] == "INTERNAL_TRANSFER"
    assert mapped.iloc[0]['economic_group'] == "INTERNAL"

def test_financial_mapping_other_pending_review():
    df = pd.DataFrame([{"predicted_label": "Other", "direction": "OUT", "review_status": "AUTO_CLASSIFIED"}])
    mapper = FinancialMapper()
    mapped = mapper.map_transactions(df)
    assert mapped.iloc[0]['financial_category'] == "OTHER"
    assert mapped.iloc[0]['financial_processing_status'] == "PENDING_REVIEW"

def test_financial_mapping_review_required():
    df = pd.DataFrame([{"predicted_label": "Revenue", "direction": "IN", "review_status": "REVIEW_REQUIRED"}])
    mapper = FinancialMapper()
    mapped = mapper.map_transactions(df)
    assert mapped.iloc[0]['financial_category'] == "REVENUE"
    assert mapped.iloc[0]['financial_processing_status'] == "PENDING_REVIEW"

def test_duplicate_exact():
    df = pd.DataFrame([
        {"date": "2026-01-01", "channel": "QRIS", "direction": "IN", "amount": 100, "reference_id": "Ref1", "description": "Test"},
        {"date": "2026-01-01", "channel": "QRIS", "direction": "IN", "amount": 100, "reference_id": "Ref1", "description": "Test"}
    ])
    detector = DuplicateDetector()
    res = detector.detect_duplicates(df)
    assert res.iloc[0]['duplicate_status'] == "EXACT_DUPLICATE"
    assert res.iloc[1]['duplicate_status'] == "EXACT_DUPLICATE"

def test_duplicate_possible():
    df = pd.DataFrame([
        {"date": "2026-01-01", "channel": "Transfer", "direction": "IN", "amount": 100, "reference_id": "Ref2", "description": "Desc A"},
        {"date": "2026-01-02", "channel": "QRIS", "direction": "IN", "amount": 100, "reference_id": "Ref2", "description": "Desc B"}
    ])
    detector = DuplicateDetector()
    res = detector.detect_duplicates(df)
    assert res.iloc[0]['duplicate_status'] == "POSSIBLE_DUPLICATE"
    assert res.iloc[1]['duplicate_status'] == "POSSIBLE_DUPLICATE"

def test_reconciliation_qris_bank_mutation():
    df = pd.DataFrame([
        {"date": "2026-01-01", "channel": "QRIS", "direction": "IN", "amount": 200, "reference_id": "Q1", "description": "QRIS A"},
        {"date": "2026-01-01", "channel": "Bank_Mutation", "direction": "IN", "amount": 200, "reference_id": "Q1", "description": "Set QRIS A"}
    ])
    rec = ReconciliationEngine()
    res = rec.reconcile(df)
    assert res.iloc[0]['reconciliation_status'] == "RECONCILED"
    assert res.iloc[1]['reconciliation_status'] == "RECONCILED"

def test_reconciliation_unmatched_cash():
    df = pd.DataFrame([
        {"date": "2026-01-01", "channel": "Cash", "direction": "IN", "amount": 50, "reference_id": "C1", "description": "Cash A"},
        {"date": "2026-01-01", "channel": "Bank_Mutation", "direction": "IN", "amount": 50, "reference_id": "C1", "description": "Setoran"}
    ])
    rec = ReconciliationEngine()
    res = rec.reconcile(df)
    assert res.iloc[0]['reconciliation_status'] == "NOT_RECONCILED"
    assert res.iloc[1]['reconciliation_status'] == "NOT_RECONCILED"
    
def test_processing_status_priority():
    row_review = {"review_status": "REVIEW_REQUIRED", "duplicate_status": "POSSIBLE_DUPLICATE"}
    assert determine_processing_status(row_review) == "PENDING_REVIEW"
    
    row_dup = {"review_status": "AUTO_CLASSIFIED", "duplicate_status": "POSSIBLE_DUPLICATE"}
    assert determine_processing_status(row_dup) == "POSSIBLE_DUPLICATE"
    
    row_ready = {"review_status": "AUTO_CLASSIFIED", "duplicate_status": "UNIQUE", "reconciliation_status": "NOT_RECONCILED"}
    assert determine_processing_status(row_ready) == "READY"
