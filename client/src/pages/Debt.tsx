import { useState, useEffect } from "react";
import { Button, Input, Card, Modal } from "@/components/ui-components";
import { Plus, Trash2, CheckCircle, Skull, TrendingDown, Pencil } from "lucide-react"; 
import { useToast } from "@/hooks/use-toast";
import { CountUp } from "@/components/CountUp"; 

// Tipe Data Sesuai Python (snake_case)
type DebtItem = {
  id: number;
  name: string;
  total_amount: number;     
  remaining_amount: number; 
  target_date?: string;
};

const API_URL = "http://127.0.0.1:8000/api/debts";

export default function Debt() {
  const { toast } = useToast();
  const [debts, setDebts] = useState<DebtItem[]>([]);
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtItem | null>(null);

  // Form States
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState(""); 
  const [payAmount, setPayAmount] = useState(""); 

  // Edit States
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editTotal, setEditTotal] = useState("");     
  const [editRemaining, setEditRemaining] = useState(""); 

  // --- 1. FETCH DATA DARI DATABASE ---
  const fetchDebts = async () => {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        setDebts(data);
    } catch (err) {
        console.error("Gagal ambil data hutang:", err);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  // --- HELPER FORMATTER ---
  const handleMoneyChange = (value: string, setter: (val: string) => void) => {
    const rawValue = value.replace(/\D/g, "");
    if (rawValue === "") { setter(""); } 
    else { setter(new Intl.NumberFormat('id-ID').format(Number(rawValue))); }
  };

  const cleanMoney = (val: string) => Number(val.replace(/\./g, ""));
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  const totalRemaining = debts.reduce((acc, curr) => acc + curr.remaining_amount, 0);

  // --- 2. TAMBAH BARU (POST) ---
  const handleAddDebt = async () => {
    if (!newName || !newAmount) return;
    const amount = cleanMoney(newAmount);
    
    const payload = {
        name: newName,
        total_amount: amount,
        remaining_amount: amount
    };

    await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    fetchDebts(); // Refresh data
    setIsAddModalOpen(false);
    setNewName(""); setNewAmount("");
    toast({ title: "Terjerat Lagi...", description: "Semangat bayarnya ya!" });
  };

  // --- 3. BAYAR CICILAN (UPDATE / PUT) ---
  const openPayModal = (debt: DebtItem) => {
    setSelectedDebt(debt);
    setPayAmount("");
    setIsPayModalOpen(true);
  };

  const handlePayDebt = async () => {
    if (!selectedDebt || !payAmount) return;
    const amount = cleanMoney(payAmount);
    const newRemaining = Math.max(0, selectedDebt.remaining_amount - amount);

    const updatedData = { ...selectedDebt, remaining_amount: newRemaining };

    await fetch(`${API_URL}/${selectedDebt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
    });

    fetchDebts();
    setIsPayModalOpen(false);
    toast({ title: "Mantap!", description: `Beban ${selectedDebt.name} berkurang.` });
  };

  // --- 4. EDIT HUTANG (PUT) ---
  const openEditModal = (debt: DebtItem) => {
    setEditId(debt.id);
    setEditName(debt.name);
    setEditTotal(new Intl.NumberFormat('id-ID').format(debt.total_amount));
    setEditRemaining(new Intl.NumberFormat('id-ID').format(debt.remaining_amount));
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if(!editId) return;
    const updatedData = {
        name: editName,
        total_amount: cleanMoney(editTotal),
        remaining_amount: cleanMoney(editRemaining)
    };

    await fetch(`${API_URL}/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
    });

    fetchDebts();
    setIsEditModalOpen(false);
    toast({ title: "Data Diupdate", description: "Informasi hutang berhasil diubah." });
  };

  // --- 5. HAPUS (DELETE) ---
  const handleDelete = async (id: number) => {
    if(confirm("Hapus catatan ini?")) {
        await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        fetchDebts();
        toast({ title: "Dihapus", description: "Data hutang dihapus." });
    }
  };

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6 max-w-lg mx-auto min-h-screen">
      
      <div className="flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-display font-bold">Daftar Hutang</h1>
            <p className="text-xs text-muted-foreground">Lunasi perlahan, pasti selesai.</p>
        </div>
      </div>

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
                const progress = ((debt.total_amount - debt.remaining_amount) / debt.total_amount) * 100;
                const isPaidOff = debt.remaining_amount <= 0;

                return (
                    <Card key={debt.id} className={`p-4 border-l-4 transition-all ${
                        isPaidOff ? 'border-l-emerald-500 opacity-60' : 'border-l-rose-600'
                    }`}>
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex gap-3">
                                {!isPaidOff && <Skull className="w-5 h-5 text-rose-500/50 mt-1" />}
                                <div>
                                    <h4 className="font-bold text-lg">{debt.name}</h4>
                                    <p className="text-xs text-muted-foreground">Total: {formatRupiah(debt.total_amount)}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`font-mono font-bold ${isPaidOff ? 'text-emerald-500' : 'text-rose-600'}`}>
                                    {formatRupiah(debt.remaining_amount)}
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

      {/* MODAL FORM SAMA SEPERTI SEBELUMNYA (Sudah disesuaikan handler-nya) */}
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
                    <Input type="text" inputMode="numeric" className="pl-9" placeholder="0" value={newAmount} onChange={e => handleMoneyChange(e.target.value, setNewAmount)} />
                </div>
            </div>
            <Button className="w-full" onClick={handleAddDebt}>Simpan</Button>
        </div>
      </Modal>

      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title={`Bayar: ${selectedDebt?.name}`}>
        <div className="space-y-4">
            <div className="p-4 bg-secondary/20 border border-white/5 rounded-lg text-center">
                <p className="text-xs text-foreground mb-1">Sisa Hutang :</p>
                <p className="text-xl font-mono font-bold text-rose-500">{selectedDebt && formatRupiah(selectedDebt.remaining_amount)}</p>
            </div>
            <div>
                <label className="text-xs uppercase font-bold text-muted-foreground">Nominal Pembayaran</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">Rp</span>
                    <Input type="text" inputMode="numeric" placeholder="0" value={payAmount} onChange={e => handleMoneyChange(e.target.value, setPayAmount)} className="text-lg font-bold pl-10"/>
                </div>
            </div>
            <Button className="w-full bg-[green] hover:bg-[#15803d] text-white" onClick={handlePayDebt}><CheckCircle className="w-4 h-4 mr-2" /> Konfirmasi Bayar</Button>
        </div>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Rincian Hutang">
        <div className="space-y-4">
            <div><label className="text-xs uppercase font-bold text-muted-foreground">Nama Pemberi Hutang</label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] uppercase font-bold text-muted-foreground">Total Awal</label><Input type="text" inputMode="numeric" value={editTotal} onChange={e => handleMoneyChange(e.target.value, setEditTotal)} className="text-sm" /></div>
                <div><label className="text-[10px] uppercase font-bold text-rose-500">Sisa Saat Ini</label><Input type="text" inputMode="numeric" value={editRemaining} onChange={e => handleMoneyChange(e.target.value, setEditRemaining)} className="text-sm border-rose-500/50 bg-rose-500/5 font-bold" /></div>
            </div>
            <Button className="w-full" onClick={handleSaveEdit}>Simpan Perubahan</Button>
        </div>
      </Modal>

    </div>
  );
}