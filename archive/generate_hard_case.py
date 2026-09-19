import pandas as pd
import random
import os

def generate_hard_cases():
    random.seed(42)
    
    # Define channels and directions
    channels = ['QRIS', 'Transfer', 'Cash', 'Invoice', 'Bank_Mutation']
    
    # Descriptions for each class (20 each)
    cogs_desc = [
        "pembelian bahan baku utama", "beli stok krupuk", "nota 991 brg msk", "tebus sembako dr agen", 
        "restock etalase dpn", "pembayaran suplier pt makmur", "belanja kardus & plastik paking", 
        "bayar sayur pasar", "bahan adonan", "kulakan", "pembelian alat kerja produksi", 
        "beli ayam 10kg", "barang dagangan dr distributor", "pembelian kemasan", 
        "nota no 221 pakan ternak", "bayar faktur supplier beras", "bahan pokok", 
        "pembelian benang & kain", "restock gudang", "tebus invoice barang"
    ]
    
    opex_desc = [
        "pembelian ATK", "pembelian perlengkapan toko", "cicilan kendaraan operasional", 
        "bayar listrik 3bln", "iuran sampah pasar", "pembayaran kewajiban usaha bulanan", 
        "nota bengkel service ac", "langganan wifi", "beli token", "upah tukang angkut", 
        "pembayaran bunga bank", "sewa ruko tahunan", "pembelian sabun lantai", 
        "gaji karyawan mingguan", "bayar denda retribusi", "beli sapu dan pel", 
        "konsumsi lembur anak-anak", "cetak spanduk depan", "parkir bulanan", "service motor kurir"
    ]
    
    revenue_desc = [
        "penerimaan", "uang masuk", "transfer dari pelanggan", "pembayaran pesanan", 
        "nota kasir 112", "lunas", "dr bu ani", "dp catering bpk budi", "pelunasan po 12", 
        "trx qris 091", "masuk dr gofood", "hasil harian", "setoran shift pagi", 
        "invoice 001 dibayar", "penjualan", "trx shopeepay", "trf 89112", 
        "bayar makan meja 4", "titipan bayar barang", "terima uang muka"
    ]
    
    financing_desc = [
        "pencairan pinjaman", "angsuran pokok", "kredit investasi", "cair kur bri", 
        "bayar cicilan modal", "tarikan dana pinjol", "pelunasan hutang", "dana kur masuk", 
        "bayar pinjaman", "terima kta", "angsuran bulanan bri", "pembayaran utang ke pt abc", 
        "cair pnjm julo", "angsuran modal kerja", "masuk pinjaman rekan", "pengembalian dana investor", 
        "pencairan bpkb", "potongan angsuran", "kredit rekening koran", "setor cicilan"
    ]
    
    transfer_desc = [
        "pemindahan dana antar rekening sendiri", "setor tunai kas harian", "tarik tunai atm", 
        "pindah saldo ke bca", "trf ke rek istri", "isi saldo gopay usaha", "wd dari mesin edc", 
        "kas ke bank", "trf rek cadangan", "ambil cash", "setoran ke bank mandiri", 
        "pindah buku ke rek op", "top up ovo", "pindahan dr bca", "tarik saldo shopee", 
        "simpan tunai", "ambil dr kasir", "mutasi internal", "pindah dana operasional", "sweep in"
    ]
    
    other_desc = [
        "refund sisa kembalian", "salah transfer kembalikan", "bonus saldo bca", 
        "reversal trx", "cashback bulanan", "koreksi db", "biaya admin bulanan", 
        "pajak bunga", "uang nyasar", "titipan arisan", "potongan admin", 
        "pengembalian kelebihan", "sisa saldo", "penerimaan hadiah", "koreksi cr", 
        "saldo mengendap", "pengembalian dana batal", "biaya layanan aplikasi", 
        "promo reward", "saldo tdk terpakai"
    ]
    
    data = []
    
    def add_data(descriptions, label, direction_hint):
        for desc in descriptions:
            channel = random.choice(channels)
            # Add some noise to direction instead of hardcoding perfectly
            direction = direction_hint if random.random() < 0.8 else ("IN" if direction_hint == "OUT" else "OUT")
            amount = round(random.uniform(10000, 5000000), 0)
            data.append([desc, channel, direction, amount, label])

    add_data(cogs_desc, 'COGS', 'OUT')
    add_data(opex_desc, 'Operating_Expense', 'OUT')
    add_data(revenue_desc, 'Revenue', 'IN')
    add_data(financing_desc, 'Financing', random.choice(['IN', 'OUT'])) # Financing can be IN (loan) or OUT (pay)
    add_data(transfer_desc, 'Transfer_Internal', random.choice(['IN', 'OUT']))
    add_data(other_desc, 'Other', random.choice(['IN', 'OUT']))
    
    df = pd.DataFrame(data, columns=['description', 'channel', 'direction', 'amount', 'label'])
    
    os.makedirs('data', exist_ok=True)
    out_path = os.path.join('data', 'hard_case_transactions.csv')
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} hard-case transactions at {out_path}")

if __name__ == "__main__":
    generate_hard_cases()
