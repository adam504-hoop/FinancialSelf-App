import { useState, useEffect } from "react";
import { Card, Button, Input, Modal } from "@/components/ui-components"; 
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Save, Plus, Trash2, Edit2, Sparkles } from "lucide-react"; 
import { useToast } from "@/hooks/use-toast";
import { CountUp } from "@/components/CountUp";

type AllocationItem = {
  id: string;
  name: string;
  amount: number;
};

type Category = {
  id: string; 
  name: string; 
  color: string;
  items: AllocationItem[];
  isAuto?: boolean; 
};

export default function Allocator() {
  const { toast } = useToast();

  const [income, setIncome] = useState(720000);
  const [categories, setCategories] = useState<Category[]>([
    { 
      id: "needs", name: "Needs (Wajib)", color: "#3b82f6", 
      items: [{ id: "1", name: "Jatah Ortu", amount: 200000 }] 
    },
    { 
      id: "living", name: "Living (Harian)", color: "#10b981", 
      items: [{ id: "2", name: "Bensin", amount: 20000 }] 
    },
    { 
      id: "playing", name: "Playing (Happy)", color: "#f43f5e", 
      items: [{ id: "3", name: "Nonton", amount: 35000 }] 
    },
  ]);

  const [selectedCatIndex, setSelectedCatIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const savedIncome = localStorage.getItem("my-income");
    const savedCats = localStorage.getItem("my-categories");
    
    if (savedIncome) setIncome(Number(savedIncome));
    if (savedCats) {
        const parsed = JSON.parse(savedCats).filter((c: Category) => c.id !== 'booster');
        setCategories(parsed);
    }
  }, []);

  const getCategoryTotal = (cat: Category) => {
    return cat.items.reduce((sum, item) => sum + Number(item.amount), 0);
  };

  const totalManualExpenses = categories.reduce((sum, cat) => sum + getCategoryTotal(cat), 0);
  const boosterAmount = Math.max(0, income - totalManualExpenses);
  
  const boosterCategory: Category = {
      id: "booster", name: "Booster (Otomatis)", color: "#f59e0b", isAuto: true,
      items: [{ id: "auto-1", name: "Sisa Dana", amount: boosterAmount }]
  };

  const allCategoriesForChart = [...categories];
  if (boosterAmount > 0) allCategoriesForChart.push(boosterCategory);

  const handleSave = () => {
    localStorage.setItem("my-income", income.toString());
    localStorage.setItem("my-categories", JSON.stringify(categories));
    localStorage.setItem("my-final-budget", JSON.stringify([...categories, ...(boosterAmount > 0 ? [boosterCategory] : [])]));
    
    const simpleAllocations = {
        needs: getCategoryTotal(categories[0] || {items:[]}),
        living: getCategoryTotal(categories[1] || {items:[]}),
        playing: getCategoryTotal(categories[2] || {items:[]}),
        booster: boosterAmount,
    };
    localStorage.setItem("my-allocations", JSON.stringify(simpleAllocations));

    toast({ title: "Berhasil Disimpan!", description: `Gaji Rp ${formatRupiah(income)} telah dialokasikan.` });
  };

  // CRUD
  const addCategory = () => {
    const colors = ["#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#64748b"]; 
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newCat: Category = { id: Date.now().toString(), name: "Kategori Baru", color: randomColor, items: [] };
    setCategories([...categories, newCat]);
  };

  const deleteCategory = () => {
    if (selectedCatIndex === null) return;
    if (confirm(`Hapus kategori "${categories[selectedCatIndex].name}"?`)) {
        const newCats = categories.filter((_, index) => index !== selectedCatIndex);
        setCategories(newCats);
        setIsModalOpen(false);
        setSelectedCatIndex(null);
    }
  };

  const updateCategory = (field: 'name' | 'color', value: string) => {
    if (selectedCatIndex === null) return;
    const newCats = [...categories];
    // @ts-ignore
    newCats[selectedCatIndex][field] = value;
    setCategories(newCats);
  };

  const handleOpenModal = (index: number) => { setSelectedCatIndex(index); setIsModalOpen(true); };

  const addItem = () => {
    if (selectedCatIndex === null) return;
    const newCats = [...categories];
    newCats[selectedCatIndex].items.push({ id: Date.now().toString(), name: "", amount: 0 });
    setCategories(newCats);
  };

  const updateItem = (itemIndex: number, field: 'name' | 'amount', value: any) => {
    if (selectedCatIndex === null) return;
    const newCats = [...categories];
    // @ts-ignore
    newCats[selectedCatIndex].items[itemIndex][field] = value;
    setCategories(newCats);
  };

  const deleteItem = (itemIndex: number) => {
    if (selectedCatIndex === null) return;
    const newCats = [...categories];
    newCats[selectedCatIndex].items.splice(itemIndex, 1);
    setCategories(newCats);
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const chartData = allCategoriesForChart.map(cat => ({
    name: cat.name,
    value: cat.isAuto ? boosterAmount : getCategoryTotal(cat),
    color: cat.color
  }));

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6 max-w-lg mx-auto">
      
      {/* Header */}
      <div className="mb-2">
          <h1 className="text-2xl font-display font-bold">Auto Allocator</h1>
          <p className="text-xs text-muted-foreground">Booster otomatis menghabiskan sisa uang.</p>
      </div>

      {/* Input Gaji + Tombol Save Kotak (Versi HTML Asli) */}
      <Card className="p-4 border-primary/20 bg-primary/5">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
          Pemasukan Minggu Ini
        </label>
        
        <div className="flex gap-2 h-12">
            <Input 
                type="number" 
                value={income} 
                onChange={(e) => setIncome(Number(e.target.value))}
                className="flex-1 text-2xl font-bold font-mono h-full bg-background border-primary/30"
                placeholder="0"
            />
            
            {/* KITA PAKAI BUTTON BIASA BIAR IKONNYA PASTI MUNCUL */}
            <button 
                onClick={handleSave} 
                className="h-12 w-12 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center shadow-lg transition-colors shrink-0"
                title="Simpan Data"
            >
                <Save className="w-6 h-6" />
            </button>
        </div>
      </Card>


      {/* Grafik */}
      <div className="h-48 w-full relative">
         <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">
                Total Plot
            </span>
            
            {/* INI DIA ANIMASINYA */}
            <span className={`text-sm font-black font-mono ${
                income > 600000 ? 'text-emerald-600' : 'text-red-500'
            }`}>
                <CountUp value={income} prefix="Rp " />
            </span>
        </div>
        
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
             {/* ... (Pie Chart sama seperti sebelumnya) ... */}
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} cornerRadius={4} dataKey="value">
              {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* LIST KATEGORI */}
      <div className="grid grid-cols-1 gap-3">
        {/* MANUAL */}
        {categories.map((cat, index) => {
            const total = getCategoryTotal(cat);
            const percent = income > 0 ? Math.round((total / income) * 100) : 0;
            return (
                <div key={cat.id} onClick={() => handleOpenModal(index)} className="cursor-pointer group">
                    <Card className="p-4 border-l-4 hover:bg-accent/5 transition-all relative overflow-hidden" style={{ borderLeftColor: cat.color }}>
                         <div className="flex justify-between items-center relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm" style={{ backgroundColor: cat.color }}>
                                    {cat.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{cat.name}</p>
                                    <p className="text-xs text-muted-foreground">{cat.items.length} Item</p>
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

        {/* OTOMATIS */}
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
                            <p className="text-xs text-muted-foreground">{Math.round((boosterAmount / income) * 100)}%</p>
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
      {selectedCatIndex !== null && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Kategori">
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                <div className="flex gap-2 items-end">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Nama</label>
                        <Input value={categories[selectedCatIndex].name} onChange={(e) => updateCategory('name', e.target.value)} className="font-bold text-lg mt-1" />
                    </div>
                    <div>
                         <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Warna</label>
                        <div className="flex items-center gap-2 border p-1 rounded-md h-10 w-16 cursor-pointer relative overflow-hidden">
                             <input type="color" value={categories[selectedCatIndex].color} onChange={(e) => updateCategory('color', e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                             <div className="w-full h-full rounded bg-current" style={{ backgroundColor: categories[selectedCatIndex].color }} />
                        </div>
                    </div>
                </div>
                
                {/* Items */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Item</label>
                    {categories[selectedCatIndex].items.map((item, idx) => (
                        <div key={item.id} className="flex gap-2 items-center">
                            <Input placeholder="Nama" value={item.name} onChange={(e) => updateItem(idx, 'name', e.target.value)} className="flex-1" />
                            <div className="relative w-32">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                                <Input type="number" value={item.amount} onChange={(e) => updateItem(idx, 'amount', Number(e.target.value))} className="pl-8 text-right font-mono" />
                            </div>
                            <button onClick={() => deleteItem(idx)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>
                <Button variant="outline" className="w-full border-dashed border-2" onClick={addItem}><Plus className="w-4 h-4 mr-2" /> Tambah Item</Button>
                
                <div className="pt-4 border-t flex flex-col gap-2">
                    <Button className="w-full" onClick={() => setIsModalOpen(false)}>Selesai</Button>
                    <Button variant="ghost" className="w-full text-red-500 hover:bg-red-500/10" onClick={deleteCategory}><Trash2 className="w-4 h-4 mr-2" /> Hapus Kategori</Button>
                </div>
            </div>
        </Modal>
      )}
    </div>
  );
}