import os
import json
import csv
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

PORT = int(os.environ.get("PORT", 8000))
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPORTS_DIR = os.path.join(BASE_DIR, "reports", "presentation")

def csv_to_dict_list(filepath):
    if not os.path.exists(filepath):
        return []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        return list(reader)

def load_json(filepath):
    if not os.path.exists(filepath):
        return {}
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

class RapiRequestHandler(BaseHTTPRequestHandler):
    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def send_json_response(self, data, status_code=200):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
        
    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        if path == '/health':
            self.send_json_response({"status": "ok", "message": "RAPI-SULTRA Backend POC v1.0"})
            return
            
        if path == '/api/dashboard/summary':
            # Aggregate all needed presentation data
            fin_sum = load_json(os.path.join(REPORTS_DIR, "presentation_financial_summary.json"))
            val_sum = load_json(os.path.join(REPORTS_DIR, "presentation_validation.json"))
            rapi_prof = load_json(os.path.join(REPORTS_DIR, "presentation_rapi_financing_readiness_profile.json"))
            monthly = csv_to_dict_list(os.path.join(REPORTS_DIR, "presentation_monthly_financial_summary.csv"))
            
            self.send_json_response({
                "financial_summary": fin_sum,
                "validation": val_sum,
                "rapi_profile": rapi_prof,
                "monthly_summary": monthly
            })
            return
            
        if path == '/api/dashboard/transactions':
            # Load predictions and format them for frontend
            txns = csv_to_dict_list(os.path.join(REPORTS_DIR, "presentation_predictions.csv"))
            
            # Map them slightly to match frontend expectations if necessary
            formatted_txns = []
            for t in txns:
                formatted_txns.append({
                    "id": t.get("raw_transaction_id", ""),
                    "date": t.get("date", ""),
                    "description": t.get("description", ""),
                    "channel": t.get("channel", ""),
                    "direction": t.get("direction", ""),
                    "amount": float(t.get("amount", 0)),
                    "referenceId": t.get("reference_id", ""),
                    "predicted_label": t.get("predicted_label", ""),
                    "validated_label": None,
                    "confidence": float(t.get("confidence", 0)),
                    "review_status": t.get("review_status", ""),
                    "financial_category": t.get("financial_category", ""),
                    "reconciliation_status": t.get("reconciliation_status", ""),
                    "duplicate_status": t.get("duplicate_status", "")
                })
                
            self.send_json_response({"transactions": formatted_txns})
            return
            
        if path == '/api/dashboard/duplicates':
            dups = csv_to_dict_list(os.path.join(REPORTS_DIR, "presentation_duplicate_candidates.csv"))
            self.send_json_response({"duplicate_candidates": dups})
            return
            
        if path == '/api/dashboard/reconciliation':
            recons = csv_to_dict_list(os.path.join(REPORTS_DIR, "presentation_reconciliation_matches.csv"))
            self.send_json_response({"reconciliation_matches": recons})
            return
            
        self.send_response(404)
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(b"Not Found")

    def do_POST(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/api/upload':
            # Mock upload parsing for CSV and just return success for Demo integration
            # In a real scenario we would save the CSV and call run_presentation()
            import subprocess
            try:
                # We'll just run the pipeline with the existing demo CSV for now
                script_path = os.path.join(BASE_DIR, "src", "run_presentation_pipeline.py")
                subprocess.run(["python", script_path], check=True)
                self.send_json_response({"status": "success", "message": "CSV uploaded and processed successfully"})
            except Exception as e:
                self.send_json_response({"status": "error", "message": str(e)}, status_code=500)
            return

        self.send_response(404)
        self.send_cors_headers()
        self.end_headers()

def run(server_class=HTTPServer, handler_class=RapiRequestHandler):
    server_address = ('0.0.0.0', PORT)
    httpd = server_class(server_address, handler_class)
    print(f"Starting RAPI-SULTRA API Server on port {PORT}...")
    httpd.serve_forever()

if __name__ == '__main__':
    run()
