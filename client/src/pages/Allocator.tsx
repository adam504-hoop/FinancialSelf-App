import { useState, useEffect } from "react";
import { Card, Button, Input, Modal } from "@/components/ui-components"; 
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Save, Plus, Trash2, Sparkles, RefreshCw } from "lucide-react"; 
import { useToast } from "@/hooks/use-toast";
import { CountUp } from "@/components/CountUp"; 

// --- TIPE DATA SESUAI BACKEND PYTHON ---
type AllocationItem = {
  id: number;
  name: string;
  amount: number;
  category_id: number;
};

type Category = {
  id: number; 
  name: string; 
  color: string;
  items: AllocationItem[];
};

const API_URL = "http://127.0.0.1:8000/api";

export default function Allocator() {
  const { toast } = useToast();

  // STATE
  const [incomeStr, setIncomeStr] = useState("0"); 
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Modal State
  const [selectedCatIndex, setSelectedCatIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- 1. FETCH DATA DARI PYTHON ---
  const fetchData = async () => {
    try {
        const res = await fetch(`${API_URL}/categories`);
        const data = await res.json();
        setCategories(data);
    } catch (error) {
        console.error("Gagal ambil data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    // Load Income dari localstorage (Gaji biarkan di lokal dulu biar simpel)
    const savedIncome = localStorage.getItem("my-income");
    if (savedIncome) setIncomeStr(new Intl.NumberFormat('id-ID').format(Number(savedIncome)));
  }, []);

  // --- HELPER FORMATTER ---
  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num);
  const cleanNumber = (str: string) => {
      const cleaned = str.replace(/\D/g, "");
      return cleaned === "" ? 0 : Number(cleaned);
  };
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  const handleIncomeChange = (val: string) => {
      const raw = val.replace(/\D/g, "");
      if (raw === "") setIncomeStr("");
      else setIncomeStr(formatNumber(Number(raw)));
  };
  
  const saveIncome = () => {
      localStorage.setItem("my-income", cleanNumber(incomeStr).toString());
      toast({ title: "Gaji Disimpan", description: "Angka pendapatan diperbarui." });
  };

  const incomeValue = cleanNumber(incomeStr);

  // --- HITUNG-HITUNGAN ---
  const getCategoryTotal = (cat: Category) => {
    // Pastikan items ada (kadang dari DB bisa null kalau kosong)
    if(!cat.items) return 0;
    return cat.items.reduce((sum, item) => sum + item.amount, 0);
  };

  const totalManualExpenses = categories.reduce((sum, cat) => sum + getCategoryTotal(cat), 0);
  const boosterAmount = Math.max(0, incomeValue - totalManualExpenses);

  // --- CHART DATA ---
  const chartData = categories.map(cat => ({
    name: cat.name,
    value: getCategoryTotal(cat),
    color: cat.color
  }));
  if (boosterAmount > 0) {
      chartData.push({ name: "Booster", value: boosterAmount, color: "#f59e0b" });
  }

  // =========================================
  //  CRUD DATABASE (KONEKSI KE PYTHON)
  // =========================================

  // 1. TAMBAH KATEGORI (POST)
  const addCategory = async () => {
    const colors = ["#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#64748b"]; 
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const payload = { name: "Kategori Baru", color: randomColor };

    try {
        await fetch(`${API_URL}/categories`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        fetchData(); // Refresh tampilan
    } catch(e) { toast({ title: "Gagal", variant: "destructive" }); }
  };

  // 2. UPDATE KATEGORI (PUT)
  const updateCategory = async (catId: number, field: 'name' | 'color', value: string) => {
    // Update tampilan dulu biar cepat (Optimistic UI)
    const newCats = [...categories];
    const catIndex = newCats.findIndex(c => c.id === catId);
    if(catIndex === -1) return;
    
    // @ts-ignore
    newCats[catIndex][field] = value;
    setCategories(newCats);

    // Kirim ke server (Debounce manual sederhana)
    await fetch(`${API_URL}/categories/${catId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCats[catIndex]) // Kirim object kategori utuh
    });
  };

  // 3. HAPUS KATEGORI (DELETE)
  const deleteCategory = async () => {
    if (selectedCatIndex === null) return;
    const cat = categories[selectedCatIndex];
    
    if (confirm(`Hapus kategori "${cat.name}" beserta isinya?`)) {
        await fetch(`${API_URL}/categories/${cat.id}`, { method: "DELETE" });
        setIsModalOpen(false);
        setSelectedCatIndex(null);
        fetchData();
    }
  };

  // 4. TAMBAH ITEM (POST)
  const addItem = async () => {
    if (selectedCatIndex === null) return;
    const cat = categories[selectedCatIndex];

    const payload = {
        name: "Item Baru",
        amount: 0,
        category_id: cat.id
    };

    await fetch(`${API_URL}/allocations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    fetchData();
  };

  // 5. UPDATE ITEM (PUT)
  const updateItem = async (item: AllocationItem, field: 'name' | 'amount', value: any) => {
     // Kita update state lokal dulu supaya input tidak "lompat" kursornya
     const newCats = [...categories];
     // Cari lokasi di local state
     if (selectedCatIndex === null) return;
     const itemIndex = newCats[selectedCatIndex].items.findIndex(i => i.id === item.id);
     if(itemIndex === -1) return;

     // Update Value
     const updatedItem = { ...newCats[selectedCatIndex].items[itemIndex] };
     // @ts-ignore
     updatedItem[field] = value;
     
     newCats[selectedCatIndex].items[itemIndex] = updatedItem;
     setCategories(newCats);

     // Kirim ke Backend
     await fetch(`${API_URL}/allocations/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedItem)
     });
  };

  // 6. HAPUS ITEM (DELETE)
  const deleteItem = async (itemId: number) => {
     await fetch(`${API_URL}/allocations/${itemId}`, { method: "DELETE" });
     fetchData();
  };


  // --- RENDER UTAMA ---
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6 max-w-lg mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-display font-bold">Auto Allocator</h1>
            <p className="text-xs text-muted-foreground">Database Mode: ON 🟢</p>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchData}><RefreshCw className="w-4 h-4"/></Button>
      </div>

      {/* Input Gaji */}
      <Card className="p-4 border-primary/20 bg-primary/5">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
          Pemasukan Minggu Ini
        </label>
        <div className="flex gap-2 h-12">
            <Input 
                type="text" 
                inputMode="numeric"
                value={incomeStr} 
                onChange={(e) => handleIncomeChange(e.target.value)}
                className="flex-1 text-2xl font-bold font-mono h-full bg-background border-primary/30"
                placeholder="0"
            />
            <button onClick={saveIncome} className="h-12 w-12 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center shadow-lg transition-colors shrink-0">
                <Save className="w-6 h-6" />
            </button>
        </div>
      </Card>

      {/* Grafik Pie */}
      <div className="h-48 w-full relative">
         <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Total Plot</span>
            <span className={`text-sm font-black font-mono ${incomeValue > 600000 ? 'text-emerald-600' : 'text-red-500'}`}>
                <CountUp value={incomeValue} prefix="Rp " />
            </span>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} cornerRadius={4} dataKey="value">
              {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* LIST KATEGORI */}
      <div className="grid grid-cols-1 gap-3">
        {categories.map((cat, index) => {
            const total = getCategoryTotal(cat);
            const percent = incomeValue > 0 ? Math.round((total / incomeValue) * 100) : 0;
            return (
                <div key={cat.id} onClick={() => { setSelectedCatIndex(index); setIsModalOpen(true); }} className="cursor-pointer group">
                    <Card className="p-4 border-l-4 hover:bg-accent/5 transition-all relative overflow-hidden" style={{ borderLeftColor: cat.color }}>
                          <div className="flex justify-between items-center relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm" style={{ backgroundColor: cat.color }}>
                                    {cat.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{cat.name}</p>
                                    <p className="text-xs text-muted-foreground">{cat.items ? cat.items.length : 0} Item</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-mono font-bold">{formatRupiah(total)}</p>
                                <p className="text-xs text-muted-foreground">{percent}%</p>
                            </div>
                        </div>
                    </Card>
                </div>
            );
        })}

        {/* Booster (Otomatis) */}
        {boosterAmount > 0 ? (
             <div className="cursor-not-allowed opacity-90">
                <Card className="p-4 border-l-4 bg-amber-500/5 border-amber-500 relative overflow-hidden">
                    <Sparkles className="absolute -right-2 -top-2 w-16 h-16 text-amber-500/10" />
                    <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm bg-amber-500">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-amber-600">Booster (Otomatis)</p>
                                <p className="text-xs text-muted-foreground">Sisa uang</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-mono font-bold text-amber-600">{formatRupiah(boosterAmount)}</p>
                            <p className="text-xs text-muted-foreground">{Math.round((boosterAmount / incomeValue) * 100)}%</p>
                        </div>
                    </div>
                </Card>
            </div>
        ) : (
             <div className="p-3 border border-dashed border-red-300 bg-red-50 rounded-xl text-center">
                 <p className="text-xs text-red-500 font-bold">Tidak ada sisa untuk Booster</p>
             </div>
        )}

        <Button variant="outline" className="w-full border-dashed h-12 text-muted-foreground hover:text-primary mt-2" onClick={addCategory}>
            <Plus className="w-4 h-4 mr-2" /> Tambah Kategori
        </Button>
      </div>

      {/* MODAL EDIT */}
      {selectedCatIndex !== null && categories[selectedCatIndex] && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Kategori">
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                {/* Header Kategori */}
                <div className="flex gap-2 items-end">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Nama Kategori</label>
                        <Input 
                            value={categories[selectedCatIndex].name} 
                            onChange={(e) => updateCategory(categories[selectedCatIndex].id, 'name', e.target.value)} 
                            className="font-bold text-lg mt-1" 
                        />
                    </div>
                    <div>
                         <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Warna</label>
                        <div className="flex items-center gap-2 border p-1 rounded-md h-10 w-16 cursor-pointer relative overflow-hidden">
                             <input type="color" 
                                value={categories[selectedCatIndex].color} 
                                onChange={(e) => updateCategory(categories[selectedCatIndex].id, 'color', e.target.value)} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                             />
                             <div className="w-full h-full rounded bg-current" style={{ backgroundColor: categories[selectedCatIndex].color }} />
                        </div>
                    </div>
                </div>
                
                {/* List Items */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Rincian Pengeluaran</label>
                    {categories[selectedCatIndex].items?.map((item, idx) => {
                        return (
                            <div key={item.id} className="flex gap-2 items-center">
                                <Input 
                                    placeholder="Nama item" 
                                    value={item.name} 
                                    onChange={(e) => updateItem(item, 'name', e.target.value)} 
                                    className="flex-1" 
                                />
                                <div className="relative w-32">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                                    <Input 
                                        type="text" 
                                        inputMode="numeric"
                                        value={item.amount === 0 ? "" : formatNumber(item.amount)} 
                                        onChange={(e) => updateItem(item, 'amount', cleanNumber(e.target.value))} 
                                        className="pl-8 text-right font-mono" 
                                    />
                                </div>
                                <button onClick={() => deleteItem(item.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
                <Button variant="outline" className="w-full border-dashed border-2" onClick={addItem}>
                    <Plus className="w-4 h-4 mr-2" /> Tambah Item
                </Button>
                
                <div className="pt-4 border-t flex flex-col gap-2">
                    <Button className="w-full" onClick={() => setIsModalOpen(false)}>Selesai</Button>
                    <Button variant="ghost" className="w-full text-red-500 hover:bg-red-500/10" onClick={deleteCategory}>
                        <Trash2 className="w-4 h-4 mr-2" /> Hapus Kategori Ini
                    </Button>
                </div>
            </div>
        </Modal>
      )}
    </div>
  );
}