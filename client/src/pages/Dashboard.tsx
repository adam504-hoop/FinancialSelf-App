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
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-bold">Minggu Ini</h3>
          <Link href="/allocator">
            <a className="text-xs text-primary hover:underline">Atur Ulang</a>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Needs */}
          <Card className="p-4 flex flex-col justify-between bg-card border-l-4 border-l-primary">
            <span className="text-xs text-muted-foreground">Needs (58%)</span>
            <span className="text-lg font-bold">
              {formatRupiah(weeklyIncome * 0.58)}
            </span>
          </Card>

          {/* Living */}
          <Card className="p-4 flex flex-col justify-between bg-card border-l-4 border-l-secondary">
            <span className="text-xs text-muted-foreground">Living (13%)</span>
            <span className="text-lg font-bold">
              {formatRupiah(weeklyIncome * 0.13)}
            </span>
          </Card>

          {/* Playing */}
          <Link href="/playing">
            <a className="block group">
              <Card className="p-4 flex flex-col justify-between bg-card border-l-4 border-l-accent group-hover:bg-accent/5 transition-colors">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">
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

          {/* Booster */}
          <Card className="p-4 flex flex-col justify-between bg-card border-l-4 border-l-yellow-500">
            <span className="text-xs text-muted-foreground">Booster (12%)</span>
            <span className="text-lg font-bold text-yellow-500">
              {formatRupiah(weeklyIncome * 0.12)}
            </span>
          </Card>
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
          <Card className="p-4 bg-secondary/5 border-dashed border-secondary/30 hover:border-secondary transition-colors text-center">
            <div className="flex flex-col items-center gap-2">
              <PiggyBank className="w-8 h-8 text-secondary mb-1" />
              <p className="font-medium text-secondary">
                Punya Kembalian Receh?
              </p>
              <p className="text-xs text-muted-foreground">
                Masukin ke Dump Bin buat beli Keyboard!
              </p>
            </div>
          </Card>
        </a>
      </Link>
    </div>
  );
}
