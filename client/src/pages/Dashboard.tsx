import { Card, Button } from "@/components/ui-components";
import { Link } from "wouter";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PiggyBank,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

export default function Dashboard() {
  // --- DATA SIMULASI (Bisa diganti nanti dengan database asli) ---
  const weeklyIncome = 720000;

  // Aset kamu (Misal: Saldo di bank + Dompet + Tabungan)
  const assets = {
    bank: 500000, // Contoh: Saldo SeaBank
    cash: 220000, // Contoh: Uang di Dompet
    booster: 86400, // Tabungan Booster minggu ini
  };

  // Hutang (Sesuai data Debt Destroyer)
  const totalDebt = 3500000;

  // Hitung Net Worth (Kekayaan Bersih) = Total Aset - Total Hutang
  const totalAssets = assets.bank + assets.cash + assets.booster;
  const netWorth = totalAssets - totalDebt;

  // Helper Format Rupiah
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6 max-w-lg mx-auto min-h-screen">
      {/* 1. Header & Net Worth */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-display font-bold">CatatMoney</h1>
            <p className="text-muted-foreground text-sm">Overview Keuanganmu</p>
          </div>
          <div className="bg-primary/10 p-2 rounded-full">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Kartu Net Worth Reality Check */}
        <Card
          className={`p-6 border-none shadow-lg ${netWorth < 0 ? "bg-destructive/10" : "bg-primary/10"}`}
        >
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">
              Net Worth Reality
            </span>
          </div>
          <h2
            className={`text-4xl font-mono font-bold ${netWorth < 0 ? "text-destructive" : "text-primary"}`}
          >
            {formatRupiah(netWorth)}
          </h2>
          <p className="text-xs text-muted-foreground mt-2">
            (Total Aset Rp {totalAssets.toLocaleString()} - Hutang Rp{" "}
            {totalDebt.toLocaleString()})
          </p>
          {netWorth < 0 && (
            <div className="mt-4 flex items-start gap-2 bg-background/50 p-2 rounded text-xs text-destructive">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Tenang, minus itu wajar di awal. Fokus hancurkan hutang dulu!
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* 2. Ringkasan Mingguan (Alokasi) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-bold">Minggu Ini</h3>
          <Link href="/allocator">
            <a className="text-xs text-primary hover:underline">Atur Ulang</a>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Needs */}
          <div className="space-y-2">
            <Card className="p-4 flex flex-col justify-between bg-card border-l-4 border-l-primary h-24">
              <span className="text-xs text-muted-foreground font-medium">Needs (58%)</span>
              <span className="text-lg font-bold">
                {formatRupiah(weeklyIncome * 0.58)}
              </span>
            </Card>
            <div className="px-1 space-y-1">
              {["Cicilan/Sewa", "Listrik/Air", "Beras/Sembako"].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-primary/40" />
                  <span className="text-[10px] text-muted-foreground leading-none">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Living */}
          <div className="space-y-2">
            <Card className="p-4 flex flex-col justify-between bg-card border-l-4 border-l-secondary h-24">
              <span className="text-xs text-muted-foreground font-medium">Living (13%)</span>
              <span className="text-lg font-bold">
                {formatRupiah(weeklyIncome * 0.13)}
              </span>
            </Card>
            <div className="px-1 space-y-1">
              {["Makan Luar", "Pulsa/Data", "Sabun/Pembersih"].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-secondary/40" />
                  <span className="text-[10px] text-muted-foreground leading-none">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Playing */}
          <div className="space-y-2">
            <Link href="/playing">
              <a className="block group">
                <Card className="p-4 flex flex-col justify-between bg-card border-l-4 border-l-accent group-hover:bg-accent/5 transition-colors h-24">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground font-medium">
                      Playing (17%)
                    </span>
                    <ArrowUpRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </div>
                  <span className="text-lg font-bold">
                    {formatRupiah(weeklyIncome * 0.17)}
                  </span>
                </Card>
              </a>
            </Link>
            <div className="px-1 space-y-1">
              {["Nonton/Film", "Hobi", "Self-Reward"].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-accent/40" />
                  <span className="text-[10px] text-muted-foreground leading-none">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Booster */}
          <div className="space-y-2">
            <Card className="p-4 flex flex-col justify-between bg-card border-l-4 border-l-yellow-500 h-24">
              <span className="text-xs text-muted-foreground font-medium">Booster (12%)</span>
              <span className="text-lg font-bold text-yellow-500">
                {formatRupiah(weeklyIncome * 0.12)}
              </span>
            </Card>
            <div className="px-1 space-y-1">
              {["Tabungan", "Investasi", "Dana Darurat"].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-yellow-500/40" />
                  <span className="text-[10px] text-muted-foreground leading-none">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Status Hutang */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-bold text-destructive">Musuh Utama (Hutang)</h3>
          <Link href="/debt">
            <a className="text-xs text-destructive hover:underline">
              Lihat Detail
            </a>
          </Link>
        </div>
        <Link href="/debt">
          <a className="block">
            <Card className="p-5 flex items-center justify-between border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="bg-destructive/20 p-3 rounded-full">
                  <ArrowDownRight className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sisa Hutang</p>
                  <p className="text-xl font-bold text-destructive">
                    {formatRupiah(totalDebt)}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-destructive/30 text-destructive"
              >
                Bayar
              </Button>
            </Card>
          </a>
        </Link>
      </div>

      {/* 4. Celengan Sisa */}
      <Link href="/dump-bin">
        <a className="block">
          <Card className="p-5 bg-secondary/5 border-dashed border-secondary/30 hover:border-secondary transition-colors text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="bg-secondary/10 p-3 rounded-full mb-1">
                <PiggyBank className="w-8 h-8 text-secondary" />
              </div>
              <p className="font-bold text-secondary">
                Dump Bin (Savings Goals)
              </p>
              <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                Kumpulin receh sisa jajan di sini buat beli barang impianmu!
              </p>
            </div>
          </Card>
        </a>
      </Link>
    </div>
  );
}
