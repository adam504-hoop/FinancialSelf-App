import { useState, useEffect } from "react";
import { Button, Input, Card, Modal } from "@/components/ui-components";
import { Plus, Trash2, CheckCircle, Skull, TrendingDown, Pencil } from "lucide-react"; 
import { useToast } from "@/hooks/use-toast";
import { CountUp } from "@/components/CountUp"; 

type DebtItem = {
  id: string;
  name: string;
  totalAmount: number;     
  remainingAmount: number; 
  targetDate?: string;
};

export default function Debt() {
  const { toast } = useToast();
  
  const [debts, setDebts] = useState<DebtItem[]>([]);
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [selectedDebt, setSelectedDebt] = useState<DebtItem | null>(null);

  // Form States (String biar bisa ada titiknya)
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState(""); // Input Tambah

  const [payAmount, setPayAmount] = useState(""); // Input Bayar

  // Form State (Edit Debt)
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editTotal, setEditTotal] = useState("");     // Input Edit Total
  const [editRemaining, setEditRemaining] = useState(""); // Input Edit Sisa

  // --- HELPER: FORMAT RUPIAH SAAT KETIK ---
  // Fungsi ini otomatis kasih titik saat user ngetik
  const handleMoneyChange = (value: string, setter: (val: string) => void) => {
    // 1. Buang semua karakter selain angka
    const rawValue = value.replace(/\D/g, "");
    
    // 2. Format jadi rupiah (pake titik)
    if (rawValue === "") {
        setter("");
    } else {
        const formatted = new Intl.NumberFormat('id-ID').format(Number(rawValue));
        setter(formatted);
    }
  };

  // --- HELPER: BERSIHKAN TITIK SAAT SIMPAN ---
  // Fungsi ini balikin "2.000" jadi angka 2000 murni buat disimpan
  const cleanMoney = (val: string) => {
      return Number(val.replace(/\./g, ""));
  };

  // LOAD DATA
  useEffect(() => {
    const savedDebts = localStorage.getItem("my-debts");
    if (savedDebts) {
      setDebts(JSON.parse(savedDebts));
    } else {
      const initialDebts = [
        { id: "1", name: "Jody", totalAmount: 4500000, remainingAmount: 3500000 }
      ];
      setDebts(initialDebts);
      localStorage.setItem("my-debts", JSON.stringify(initialDebts));
    }
  }, []);

  const saveToLocal = (newDebts: DebtItem[]) => {
    setDebts(newDebts);
    localStorage.setItem("my-debts", JSON.stringify(newDebts));
  };

  const totalRemaining = debts.reduce((acc, curr) => acc + curr.remainingAmount, 0);

  // --- ACTIONS ---

  // 1. TAMBAH BARU
  const handleAddDebt = () => {
    if (!newName || !newAmount) return;
    const amount = cleanMoney(newAmount); // Bersihkan titik
    
    const newDebt: DebtItem = {
      id: Date.now().toString(),
      name: newName,
      totalAmount: amount,
      remainingAmount: amount
    };
    saveToLocal([...debts, newDebt]);
    setIsAddModalOpen(false);
    setNewName("");
    setNewAmount("");
    toast({ title: "Terjerat Lagi...", description: "Semangat bayarnya ya!" });
  };

  // 2. BAYAR CICILAN
  const openPayModal = (debt: DebtItem) => {
    setSelectedDebt(debt);
    setPayAmount("");
    setIsPayModalOpen(true);
  };

  const handlePayDebt = () => {
    if (!selectedDebt || !payAmount) return;
    const amount = cleanMoney(payAmount); // Bersihkan titik
    
    const updatedDebts = debts.map(d => {
        if (d.id === selectedDebt.id) {
            const newRemaining = Math.max(0, d.remainingAmount - amount);
            return { ...d, remainingAmount: newRemaining };
        }
        return d;
    });

    saveToLocal(updatedDebts);
    setIsPayModalOpen(false);
    toast({ title: "Mantap!", description: `Beban ${selectedDebt.name} berkurang.` });
  };

  // 3. EDIT HUTANG
  const openEditModal = (debt: DebtItem) => {
    setEditId(debt.id);
    setEditName(debt.name);
    // Format dulu data lama biar pas dibuka ada titiknya
    setEditTotal(new Intl.NumberFormat('id-ID').format(debt.totalAmount));
    setEditRemaining(new Intl.NumberFormat('id-ID').format(debt.remainingAmount));
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    const updatedDebts = debts.map(d => {
        if (d.id === editId) {
            return {
                ...d,
                name: editName,
                totalAmount: cleanMoney(editTotal), // Bersihkan titik
                remainingAmount: cleanMoney(editRemaining) // Bersihkan titik
            };
        }
        return d;
    });
    saveToLocal(updatedDebts);
    setIsEditModalOpen(false);
    toast({ title: "Data Diupdate", description: "Informasi hutang berhasil diubah." });
  };

  const handleDelete = (id: string) => {
    if(confirm("Hapus catatan ini?")) {
        const filtered = debts.filter(d => d.id !== id);
        saveToLocal(filtered);
    }
  };

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6 max-w-lg mx-auto min-h-screen">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-display font-bold">Daftar Hutang</h1>
            <p className="text-xs text-muted-foreground">Lunasi perlahan, pasti selesai.</p>
        </div>
      </div>

      {/* TOTAL HUTANG CARD */}
      <div className="bg-[#18181b] p-6 rounded-3xl border border-white/10 relative overflow-hidden group">
         <Skull className="absolute -right-6 -bottom-6 w-40 h-40 text-white/5 rotate-12 pointer-events-none" />
         
         <div className="flex items-center gap-2 mb-3 text-rose-500 relative z-10">
            <TrendingDown className="w-5 h-5" />
            <span className="text-xs uppercase tracking-wider font-bold">Total Kewajiban</span>
         </div>

         <h2 className="text-rose-500 text-4xl font-sans font-bold tracking-tight relative z-10">
            <span className="mr-2">Rp</span>
            <CountUp value={totalRemaining}/>
         </h2>
         
         <p className="text-[10px] text-muted-foreground mt-1 relative z-10">
            Semangat melunasinya!
         </p>
      </div>

      {/* LIST HUTANG */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
            <h3 className="font-bold text-lg">Rincian</h3>
            <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => setIsAddModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> Tambah
            </Button>
        </div>

        {debts.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500/50" />
                <p className="text-sm text-muted-foreground">Bebas Hutang! Nikmati hidupmu.</p>
            </div>
        ) : (
            debts.map((debt) => {
                const progress = ((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100;
                const isPaidOff = debt.remainingAmount <= 0;

                return (
                    <Card key={debt.id} className={`p-4 border-l-4 transition-all ${
                        isPaidOff 
                        ? 'border-l-emerald-500 opacity-60' 
                        : 'border-l-rose-600'
                    }`}>
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex gap-3">
                                {!isPaidOff && <Skull className="w-5 h-5 text-rose-500/50 mt-1" />}
                                <div>
                                    <h4 className="font-bold text-lg">{debt.name}</h4>
                                    <p className="text-xs text-muted-foreground">Total: {formatRupiah(debt.totalAmount)}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`font-mono font-bold ${isPaidOff ? 'text-emerald-500' : 'text-rose-600'}`}>
                                    {formatRupiah(debt.remainingAmount)}
                                </p>
                                <p className="text-[10px] text-muted-foreground">Sisa</p>
                            </div>
                        </div>

                        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mb-4">
                            <div 
                                className={`h-full ${isPaidOff ? 'bg-emerald-500' : 'bg-rose-600'}`} 
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        <div className="flex gap-2">
                            {isPaidOff ? (
                                <Button variant="outline" className="w-full border-emerald-500/20 text-emerald-500 h-9 text-xs" disabled>Lunas ✨</Button>
                            ) : (
                                <Button className="w-full bg-[#881337] hover:bg-[#9f1239] text-white border-none h-9 text-xs font-bold tracking-wide" onClick={() => openPayModal(debt)}>
                                    BAYAR CICILAN
                                </Button>
                            )}
                            
                            <button onClick={() => openEditModal(debt)} className="px-3 rounded-lg text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500 transition-colors border border-transparent hover:border-blue-500/20">
                                <Pencil className="w-4 h-4" />
                            </button>

                            <button onClick={() => handleDelete(debt.id)} className="px-3 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors border border-transparent hover:border-red-500/20">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </Card>
                )
            })
        )}
      </div>

      {/* MODAL TAMBAH (DENGAN FORMATTER) */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Hutang Baru">
        <div className="space-y-4">
            <div>
                <label className="text-xs uppercase font-bold text-muted-foreground">Pemberi Hutang</label>
                <Input placeholder="Nama..." value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div>
                <label className="text-xs uppercase font-bold text-muted-foreground">Nominal</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                    <Input 
                        type="text"
                        inputMode="numeric" 
                        className="pl-9" 
                        placeholder="0" 
                        value={newAmount} 
                        onChange={e => handleMoneyChange(e.target.value, setNewAmount)} 
                    />
                </div>
            </div>
            <Button className="w-full" onClick={handleAddDebt}>Simpan</Button>
        </div>
      </Modal>

      {/* MODAL BAYAR (DENGAN FORMATTER) */}
      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title={`Bayar: ${selectedDebt?.name}`}>
        <div className="space-y-4">
            <div className="p-4 bg-secondary/20 border border-white/5 rounded-lg text-center">
                <p className="text-xs text-foreground mb-1">Sisa Hutang :</p>
                <p className="text-xl font-mono font-bold text-rose-500">{selectedDebt && formatRupiah(selectedDebt.remainingAmount)}</p>
            </div>
            <div>
                <label className="text-xs uppercase font-bold text-muted-foreground">Nominal Pembayaran</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">Rp</span>
                    <Input 
                        type="text" // Ganti type text biar bisa render titik
                        inputMode="numeric" // Biar di HP muncul keyboard angka
                        placeholder="0" 
                        value={payAmount} 
                        onChange={e => handleMoneyChange(e.target.value, setPayAmount)} 
                        className="text-lg font-bold pl-10"
                    />
                </div>
            </div>
            <Button className="w-full bg-[green] hover:bg-[#15803d] text-white" onClick={handlePayDebt}>
                <CheckCircle className="w-4 h-4 mr-2" /> Konfirmasi Bayar
            </Button>
        </div>
      </Modal>

      {/* MODAL EDIT (DENGAN FORMATTER) */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Rincian Hutang">
        <div className="space-y-4">
            <div>
                <label className="text-xs uppercase font-bold text-muted-foreground">Nama Pemberi Hutang</label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Total Awal</label>
                    <Input 
                        type="text"
                        inputMode="numeric"
                        value={editTotal} 
                        onChange={e => handleMoneyChange(e.target.value, setEditTotal)} 
                        className="text-sm" 
                    />
                </div>
                <div>
                    <label className="text-[10px] uppercase font-bold text-rose-500">Sisa Saat Ini</label>
                    <Input 
                        type="text"
                        inputMode="numeric"
                        value={editRemaining} 
                        onChange={e => handleMoneyChange(e.target.value, setEditRemaining)} 
                        className="text-sm border-rose-500/50 bg-rose-500/5 font-bold" 
                    />
                </div>
            </div>
            
            <Button className="w-full" onClick={handleSaveEdit}>Simpan Perubahan</Button>
        </div>
      </Modal>

    </div>
  );
}