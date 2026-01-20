import { useState, useEffect } from "react";
import { Button } from "@/components/ui-components";
import { Link } from "wouter";
import { motion } from "framer-motion"; 
import { CountUp } from "@/components/CountUp"; 
import { 
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, 
  PiggyBank, ShieldCheck, RotateCw, X 
} from "lucide-react";

// Tipe data biar tidak error
type DetailItem = { label: string; amount: number };
type DashboardCategory = {
  id: string;
  name: string;
  percent: string;
  value: number;
  color: string;
  details: DetailItem[];
};

export default function Dashboard() {
  const [income, setIncome] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [flippedCard, setFlippedCard] = useState<string | null>(null);
  
  // STATE KATEGORI (Sekarang Kosong Dulu, Nanti Diisi Data Allocator)
  const [categories, setCategories] = useState<DashboardCategory[]>([]);
  
  // State untuk Total Dana Aman (Dihitung Dinamis)
  const [realTotalMoney, setRealTotalMoney] = useState(0);

  useEffect(() => {
    // 1. AMBIL INCOME
    const savedIncome = localStorage.getItem("my-income");
    const valIncome = savedIncome ? Number(savedIncome) : 0;
    setIncome(valIncome);

    // 2. AMBIL HUTANG
    const savedDebts = localStorage.getItem("my-debts");
    if (savedDebts) {
      const parsedDebts = JSON.parse(savedDebts);
      const sum = parsedDebts.reduce((acc: number, cur: any) => acc + Number(cur.remainingAmount), 0);
      setTotalDebt(sum);
    } else {
      setTotalDebt(3500000); // Default kalau belum set hutang
    }

    // 3. AMBIL DATA DARI ALLOCATOR (Integrasi Inti)
    const savedBudget = localStorage.getItem("my-final-budget");
    
    if (savedBudget) {
        const parsedBudget = JSON.parse(savedBudget);
        
        // Transformasi Data: Dari format Allocator ke format Dashboard
        // Allocator punya "items", Dashboard butuh "details"
        const formattedCategories = parsedBudget.map((cat: any) => {
            const catTotal = cat.isAuto 
                ? cat.items[0].amount // Kalau Booster, ambil langsung
                : cat.items.reduce((sum: number, item: any) => sum + Number(item.amount), 0);
            
            const catPercent = valIncome > 0 ? Math.round((catTotal / valIncome) * 100) : 0;

            return {
                id: cat.id,
                name: cat.name,
                percent: catPercent + "%",
                value: catTotal,
                color: cat.color,
                details: cat.items.map((item: any) => ({
                    label: item.name || "Item", // Jaga-jaga kalau nama kosong
                    amount: Number(item.amount)
                }))
            };
        });

        setCategories(formattedCategories);

        // 4. HITUNG TOTAL DANA AMAN SECARA DINAMIS
        // Rumus: Booster (Tabungan) + Living (Dompet) + Playing (Dompet)
        // Kita anggap Needs adalah "Tagihan Hilang", sisanya adalah Uang Aman.
        // Atau lebih spesifik: Ambil kategori id 'booster', 'living', 'playing'.
        
        let safeMoney = 0;
        formattedCategories.forEach((cat: any) => {
            // Kita jumlahkan semua KECUALI 'needs' (Anggap needs itu tagihan/cicilan)
            // Kalau kamu mau Needs juga dihitung, hapus kondisi if ini.
            if (cat.id !== 'needs') { 
                safeMoney += cat.value;
            }
        });
        setRealTotalMoney(safeMoney);

    } else {
        // FALLBACK: Kalau User Belum Pernah Buka Allocator
        // Kita kasih data dummy biar gak error
        setRealTotalMoney(0);
        setCategories([]);
    }

  }, []);

  // Logika Perbandingan Minggu Lalu (Simulasi)
  const lastWeekTotal = 650000; 
  const difference = realTotalMoney - lastWeekTotal;
  const isPositive = difference >= 0;

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  const formatK = (num: number) => (num / 1000) + "k";

  return (
    <div className="p-4 md:p-6 pb-32 space-y-8 max-w-lg mx-auto min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold">CatatMoney</h1>
          <p className="text-orange-500 text-xs font-medium">Financial Dashboard</p>
        </div>
        <div className="bg-white/5 p-2 rounded-xl border border-white/10">
          <Wallet className="w-5 h-5 text-purple-400" />
        </div>
      </div>

      {/* --- TOTAL DANA AMAN --- */}
      <div className="bg-[#18181b] p-6 rounded-3xl border border-blue-500/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 bg-blue-500/10 blur-2xl rounded-full -mr-10 -mt-10"></div>
        <div className="flex items-center gap-2 mb-2 text-blue-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider font-bold">Total Dana Aman</span>
        </div>
        
        <h2 className="text-4xl font-sans font-medium tracking-tight mb-3 text-white">
            <CountUp value={realTotalMoney} prefix="Rp " />
        </h2>
        
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
            isPositive ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{isPositive ? "Naik" : "Turun"} {formatRupiah(Math.abs(difference))}</span>
        </div>
      </div>

      {/* --- ALOKASI DANA (DATA DARI ALLOCATOR) --- */}
      <div>
        <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="font-bold text-lg">Alokasi Dana</h3>
            <Link href="/allocator"><a className="text-xs text-purple-400 font-medium hover:text-purple-300">Atur Ulang</a></Link>
        </div>

        {categories.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
                {categories.map((cat) => (
                <div key={cat.id} className="relative h-[160px] group cursor-pointer" 
                    onClick={() => setFlippedCard(flippedCard === cat.id ? null : cat.id)}
                    style={{ perspective: "1000px" }} 
                >
                    <motion.div 
                        className="w-full h-full relative"
                        initial={false}
                        animate={{ rotateY: flippedCard === cat.id ? 180 : 0 }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        style={{ transformStyle: "preserve-3d" }}
                    >
                        {/* FRONT */}
                        <div className="absolute inset-0 bg-[#18181b] p-4 rounded-3xl border-l-4 flex flex-col justify-between"
                            style={{ borderLeftColor: cat.color, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">{cat.name}</p>
                                    <p className="text-lg font-bold font-mono tracking-tight">
                                        <CountUp value={cat.value} prefix="Rp " />
                                    </p>
                                </div>
                                <RotateCw className="w-4 h-4 text-muted-foreground/30 animate-pulse" />
                            </div>
                            <div className="mt-auto">
                                <span className="text-[10px] bg-white/5 px-2 py-1 rounded-full text-muted-foreground">{cat.percent} dari Gaji</span>
                            </div>
                        </div>

                        {/* BACK (Detail List) */}
                        <div className="absolute inset-0 bg-[#27272a] p-3 rounded-3xl border border-white/10 flex flex-col overflow-hidden"
                            style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                        >
                            <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate pr-2">Rincian {cat.name}</p>
                                <X className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            </div>
                            <ul className="space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
                                {cat.details.map((item, idx) => (
                                    <li key={idx} className="flex justify-between items-center text-[10px]">
                                        <span className="text-gray-400 truncate max-w-[70px]">{item.label}</span>
                                        <span className="font-mono font-medium text-white">{formatK(item.amount)}</span>
                                    </li>
                                ))}
                                {cat.details.length === 0 && (
                                    <li className="text-[10px] text-muted-foreground text-center italic mt-4">Belum ada item</li>
                                )}
                            </ul>
                        </div>
                    </motion.div>
                </div>
                ))}
            </div>
        ) : (
            // Tampilan kalau data belum ada
            <div className="text-center p-8 bg-white/5 rounded-3xl border border-dashed border-white/10">
                <p className="text-sm text-muted-foreground mb-2">Belum ada data alokasi.</p>
                <Link href="/allocator">
                    <Button variant="outline" size="sm">Buat Alokasi Sekarang</Button>
                </Link>
            </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="grid grid-cols-1 gap-3 pt-4">
        <Link href="/debt">
            <a className="block">
                <div className="bg-[#18181b] p-5 rounded-3xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500"><ArrowDownRight className="w-5 h-5" /></div>
                        <div><p className="text-xs text-muted-foreground">Sisa Kewajiban</p><p className="text-xl font-medium text-red-500">{formatRupiah(totalDebt)}</p></div>
                    </div>
                    <Button size="sm" variant="outline" className="text-red-500 border-red-500/20 text-xs h-8">Bayar</Button>
                </div>
            </a>
        </Link>
        <Link href="/dump-bin">
            <a className="block">
                <div className="bg-[#042f2e] p-6 rounded-3xl border border-teal-800/50 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400"><PiggyBank className="w-6 h-6" /></div>
                    <div><h3 className="text-teal-400 font-medium text-sm mb-1">Dump Bin</h3><p className="text-xs text-teal-200/60">Tempat buang sisa recehan.</p></div>
                </div>
            </a>
        </Link>
      </div>
    </div>
  );
}