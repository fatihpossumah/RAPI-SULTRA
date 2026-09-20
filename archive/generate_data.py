import pandas as pd
import numpy as np
import random
import os

np.random.seed(42)
random.seed(42)

def generate_synthetic_data(n=6000):
    labels = ["Revenue", "COGS", "Operating_Expense", "Financing", "Transfer_Internal", "Other"]
    n_per_class = n // len(labels)
    
    data = []
    
    # Templates for descriptions
    desc_templates = {
        "Revenue": [
            "Penjualan produk {}", "Pembayaran dari pelanggan {}", "Pendapatan jasa {}",
            "Terima transfer penjualan {}", "Setoran hasil jualan {}", "Pelunasan tagihan {}"
        ],
        "COGS": [
            "Pembelian bahan baku {}", "Bayar supplier {}", "Beli stok barang {}",
            "Belanja grosir {}", "Pembayaran distributor {}", "Restock {}"
        ],
        "Operating_Expense": [
            "Bayar listrik PLN", "Sewa toko bulan ini", "Gaji karyawan {}",
            "Pembayaran internet WIFI", "Beli ATK", "Biaya kebersihan", "Biaya operasional {}"
        ],
        "Financing": [
            "Pinjaman bank {}", "Angsuran kredit {}", "Bayar cicilan modal",
            "Pencairan pinjaman {}", "Cicilan KUR", "Bayar bunga pinjaman"
        ],
        "Transfer_Internal": [
            "Transfer antar bank", "Pindah saldo ke rekening {}", "Tarik tunai ATM",
            "Setor tunai ke cabang", "Transfer ke dompet digital", "Top up saldo {}"
        ],
        "Other": [
            "Refund dana {}", "Biaya admin bulanan", "Donasi",
            "Retur barang {}", "Denda keterlambatan", "Koreksi saldo"
        ]
    }
    
    suffixes = ["A", "B", "C", "D", "X", "Y", "Z", "1", "2", "3", "Utama", "Jaya", "Makmur"]
    channels = ["Transfer Bank", "QRIS", "EDC", "Tunai", "e-Wallet"]
    
    for label in labels:
        for _ in range(n_per_class):
            template = random.choice(desc_templates[label])
            desc = template.format(random.choice(suffixes)) if "{}" in template else template
            
            # Direction rules based on label
            if label in ["Revenue", "Financing"]:
                direction = "In"
            elif label in ["COGS", "Operating_Expense", "Other"]:
                direction = "Out"
            else:
                direction = random.choice(["In", "Out"])
                
            channel = random.choice(channels)
            
            # Amounts
            if label == "Revenue":
                amount = np.random.uniform(50000, 5000000)
            elif label == "COGS":
                amount = np.random.uniform(100000, 10000000)
            elif label == "Operating_Expense":
                amount = np.random.uniform(50000, 2000000)
            elif label == "Financing":
                amount = np.random.uniform(500000, 50000000)
            elif label == "Transfer_Internal":
                amount = np.random.uniform(100000, 10000000)
            else:
                amount = np.random.uniform(10000, 500000)
                
            data.append([desc, channel, direction, round(amount, 2), label])
            
    df = pd.DataFrame(data, columns=["description", "channel", "direction", "amount", "label"])
    
    # Shuffle dataset
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    os.makedirs("../data", exist_ok=True)
    df.to_csv("../data/training_transactions.csv", index=False)
    print(f"Generated {len(df)} rows and saved to data/training_transactions.csv")

if __name__ == "__main__":
    generate_synthetic_data()
