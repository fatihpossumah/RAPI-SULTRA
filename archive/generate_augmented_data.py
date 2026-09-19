import pandas as pd
import random
import os

def generate_augmented():
    random.seed(123)
    
    channels = ['QRIS', 'Transfer', 'Cash', 'Invoice', 'Bank_Mutation']
    
    # Templates & Vocabs
    item_cogs = ["bahan baku", "stok barang", "ayam potong 10kg", "tepung terigu", "kain meteran", "plastik kemasan", "sayur mayur", "minyak goreng 5l", "beras", "gas elpiji", "barang dagangan", "telur", "bumbu dapur", "bahan produksi"]
    supplier = ["makmur", "abc", "distributor utama", "agen jaya", "toko maju", "grosir", "pemasok a", "suplier sayur"]
    
    item_opex = ["ATK administrasi", "perlengkapan kantor", "kertas hvs", "tinta printer", "sapu dan pel", "sabun lantai", "kopi gula kantor", "spanduk", "brosur"]
    bill = ["listrik bulan ini", "internet wifi", "air pdam", "sewa ruko", "kebersihan keamanan", "retribusi pasar", "parkir langganan", "bengkel mobil"]
    asset = ["kendaraan operasional", "motor kurir", "mesin kasir"]
    service = ["administrasi bulanan", "layanan gobiz", "pemasaran fb ads", "promosi ig", "tukang servis", "konsultan pajak"]
    
    customer = ["pelanggan", "customer", "bapak budi", "bu ani", "pt xyz", "warung sebelah", "toko kelontong", "klien"]
    product = ["pesanan katering", "baju gamis", "sepatu", "jasa perbaikan", "kopi susu", "paket sembako", "barang"]
    qris_id = [f"qris {i}" for i in range(100, 200)]
    
    loan_type = ["pinjaman", "kredit usaha", "pembiayaan", "kpr", "kta", "modal kerja", "kredit investasi"]
    bank = ["bri", "mandiri", "bca", "bni", "pinjol", "koperasi"]
    
    internal_acc = ["rekening sendiri", "rek istri", "kasir", "brankas", "kas harian", "rekening utama", "rekening operasional"]
    
    cogs_descs = []
    opex_descs = []
    rev_descs = []
    fin_descs = []
    trans_descs = []
    other_descs = []
    
    def generate_list(target_list, generators, count=200):
        while len(target_list) < count:
            func = random.choice(generators)
            desc = func() + f" {random.randint(1000, 9999)}"
            if desc not in target_list:
                target_list.append(desc)
                
    # COGS
    def cogs_1(): return f"pembelian {random.choice(item_cogs)}"
    def cogs_2(): return f"stok {random.choice(item_cogs)}"
    def cogs_3(): return f"kulakan {random.choice(item_cogs)} dr {random.choice(supplier)}"
    def cogs_4(): return f"bayar nota pt {random.choice(supplier)}"
    def cogs_5(): return f"restock {random.choice(item_cogs)}"
    def cogs_6(): return f"bahan baku dari {random.choice(supplier)}"
    generate_list(cogs_descs, [cogs_1, cogs_2, cogs_3, cogs_4, cogs_5, cogs_6])
    
    # OPEX
    def opex_1(): return f"pembelian {random.choice(item_opex)}"
    def opex_2(): return f"bayar {random.choice(bill)}"
    def opex_3(): return f"cicilan {random.choice(asset)}"
    def opex_4(): return f"biaya {random.choice(service)}"
    def opex_5(): return f"iuran {random.choice(bill)}"
    def opex_6(): return f"perawatan {random.choice(asset)}"
    generate_list(opex_descs, [opex_1, opex_2, opex_3, opex_4, opex_5, opex_6])
    
    # REV
    def rev_1(): return f"uang masuk dr {random.choice(customer)}"
    def rev_2(): return f"pembayaran {random.choice(product)}"
    def rev_3(): return f"penjualan {random.choice(product)}"
    def rev_4(): return f"trx {random.choice(qris_id)}"
    def rev_5(): return f"transfer pelanggan {random.choice(customer)}"
    def rev_6(): return f"hasil penjualan harian"
    generate_list(rev_descs, [rev_1, rev_2, rev_3, rev_4, rev_5, rev_6])
    
    # FIN
    def fin_1(): return f"pencairan {random.choice(loan_type)}"
    def fin_2(): return f"kur {random.choice(bank)}"
    def fin_3(): return f"angsuran pokok {random.choice(loan_type)}"
    def fin_4(): return f"bayar kredit {random.choice(bank)}"
    def fin_5(): return f"dana pinjaman masuk"
    def fin_6(): return f"pembiayaan dari {random.choice(bank)}"
    generate_list(fin_descs, [fin_1, fin_2, fin_3, fin_4, fin_5, fin_6])
    
    # TRANS
    def trans_1(): return f"trf ke {random.choice(internal_acc)}"
    def trans_2(): return f"tarik tunai {random.choice(bank)}"
    def trans_3(): return f"pindah saldo ke {random.choice(internal_acc)}"
    def trans_4(): return f"setor ke {random.choice(internal_acc)}"
    def trans_5(): return f"mutasi kas ke {random.choice(bank)}"
    def trans_6(): return f"ambil cash dari atm {random.choice(bank)}"
    generate_list(trans_descs, [trans_1, trans_2, trans_3, trans_4, trans_5, trans_6])
    
    # OTHER
    other_ambiguous = ["penerimaan tanpa konteks", "kode transaksi", "trx tidak dikenal", "uang nyasar", "sisa saldo"]
    def oth_1(): return f"salah transfer {random.choice(customer)}"
    def oth_2(): return f"koreksi mutasi {random.choice(bank)}"
    def oth_3(): return f"admin bulanan {random.choice(bank)}"
    def oth_4(): return f"bonus reward {random.choice(bank)}"
    def oth_5(): return f"trx gagal reversal"
    def oth_6(): return random.choice(other_ambiguous) + f" {random.randint(10, 99)}"
    generate_list(other_descs, [oth_1, oth_2, oth_3, oth_4, oth_5, oth_6])
    
    data = []
    
    def add_data(descriptions, label, direction_hint):
        for desc in descriptions:
            channel = random.choice(channels)
            direction = direction_hint if random.random() < 0.8 else ("IN" if direction_hint == "OUT" else "OUT")
            amount = round(random.uniform(50000, 5000000), 0)
            data.append([desc, channel, direction, amount, label])

    add_data(cogs_descs, 'COGS', 'OUT')
    add_data(opex_descs, 'Operating_Expense', 'OUT')
    add_data(rev_descs, 'Revenue', 'IN')
    add_data(fin_descs, 'Financing', random.choice(['IN', 'OUT']))
    add_data(trans_descs, 'Transfer_Internal', random.choice(['IN', 'OUT']))
    add_data(other_descs, 'Other', random.choice(['IN', 'OUT']))
    
    df = pd.DataFrame(data, columns=['description', 'channel', 'direction', 'amount', 'label'])
    
    out_path = os.path.join('data', 'augmented_transactions.csv')
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} augmented transactions at {out_path}")

if __name__ == "__main__":
    generate_augmented()
