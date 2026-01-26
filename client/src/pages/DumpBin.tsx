import { useState, useEffect } from "react";
import { Button, Input, Modal } from "@/components/ui-components";
import { Archive, Plus, Trash2, Edit2, Coins, Sparkles, CheckCircle2 } from "lucide-react"; 
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

// TYPE KITA SESUAIKAN DENGAN PYTHON
type DumpItem = {
  id: number; // Dulu string, sekarang number (karena ID database itu angka)
  name: string;
  target_amount: number; // Dulu targetAmount (camelCase), sekarang target_amount (snake_case dari Python)
  current_amount: number;
  is_dump_bin: boolean;
};

// URL BACKEND KITA
const API_URL = "http://127.0.0.1:8000/api/dump-bin";

export default function DumpBin() {
  const { toast } = useToast();
  const [goals, setGoals] = useState<DumpItem[]>([]);
  
  // MODAL STATES
  const [isFormModalOpen, setIsFormModalOpen] = useState(false); 
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false); 

  // FORM STATES
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [targetDisplay, setTargetDisplay] = useState(""); 
  const [targetRaw, setTargetRaw] = useState(0);        

  // CONTRIBUTE STATES
  const [selectedGoal, setSelectedGoal] = useState<DumpItem | null>(null);
  const [contributeRaw, setContributeRaw] = useState<number>(0);
  const [contributeDisplay, setContributeDisplay] = useState("0");
  const [sliderMax, setSliderMax] = useState(100000); 

  // --- 1. FETCH DATA DARI PYTHON (GET) ---
  const fetchGoals = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setGoals(data);
    } catch (error) {
      console.error("Gagal ambil data:", error);
      toast({ title: "Error", description: "Gagal terhubung ke server", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  // --- FORMATTER ---
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num);

  // --- HANDLERS ---
  const handleTargetChange = (val: string) => {
    const raw = Number(val.replace(/\D/g, ""));
    setTargetRaw(raw);
    setTargetDisplay(raw === 0 ? "" : formatNumber(raw));
  };

  const openContributeModal = (goal: DumpItem) => {
    setSelectedGoal(goal);
    const remaining = goal.target_amount - goal.current_amount;
    const newMax = Math.min(100000, remaining);
    setSliderMax(newMax);

    const initialVal = Math.min(20000, remaining);
    setContributeRaw(initialVal);
    setContributeDisplay(formatNumber(initialVal));
    setIsContributeModalOpen(true);
  };

  const handleContributeChange = (val: string) => {
    let raw = Number(val.replace(/\D/g, ""));
    if (raw > sliderMax) raw = sliderMax; 
    setContributeRaw(raw);
    setContributeDisplay(raw === 0 ? "" : formatNumber(raw));
  };

  // --- 2. SIMPAN TARGET BARU / EDIT (POST & PUT) ---
  const handleSaveTarget = async () => {
    if (!name || targetRaw <= 0) return;
    
    const payload = {
        name: name,
        target_amount: targetRaw,
        current_amount: 0,
        is_dump_bin: true
    };

    try {
        if (editingId) {
            // LOGIKA EDIT (PUT)
            // Kita perlu kirim data lengkap saat update
            const itemToUpdate = goals.find(g => g.id === editingId);
            if(itemToUpdate) {
                await fetch(`${API_URL}/${editingId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...itemToUpdate, name, target_amount: targetRaw })
                });
                toast({ title: "Update Berhasil", description: "Target diperbarui." });
            }
        } else {
            // LOGIKA BARU (POST)
            await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            toast({ title: "Target Dibuat", description: "Semangat menabung!" });
        }
        
        fetchGoals(); // Refresh data dari server
        setIsFormModalOpen(false);
        setEditingId(null); setName(""); setTargetDisplay(""); setTargetRaw(0);

    } catch (error) {
        toast({ title: "Gagal menyimpan", variant: "destructive" });
    }
  };

  // --- 3. NABUNG (UPDATE / PUT) ---
  const handleSubmitContribute = async () => {
    if (!selectedGoal || contributeRaw <= 0) return;

    const updatedGoal = { 
        ...selectedGoal, 
        current_amount: selectedGoal.current_amount + contributeRaw 
    };

    try {
        await fetch(`${API_URL}/${selectedGoal.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedGoal)
        });
        
        toast({ title: "Mantap!", description: `Berhasil nabung ${formatRupiah(contributeRaw)}` });
        fetchGoals(); // Refresh data
        setIsContributeModalOpen(false);
    } catch (error) {
        toast({ title: "Gagal menabung", variant: "destructive" });
    }
  };

  // --- 4. HAPUS / CLAIM (DELETE) ---
  const handleClaimOrDelete = async (id: number, isClaim: boolean) => {
    if(!isClaim && !confirm("Hapus target ini?")) return;

    try {
        await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        
        if (isClaim) {
             toast({ title: "Alhamdulillah! 🤲", description: "Barang berhasil terbeli." });
        } else {
             toast({ title: "Dihapus", description: "Target dihapus." });
        }
        fetchGoals(); // Refresh data agar hilang dari layar
    } catch (error) {
        toast({ title: "Gagal menghapus", variant: "destructive" });
    }
  };

  const openAddModal = () => {
    setEditingId(null); setName(""); setTargetDisplay(""); setTargetRaw(0);
    setIsFormModalOpen(true);
  };

  const openEditModal = (goal: DumpItem) => {
    setEditingId(goal.id); setName(goal.name);
    setTargetRaw(goal.target_amount);
    setTargetDisplay(formatNumber(goal.target_amount));
    setIsFormModalOpen(true);
  };

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6 max-w-lg mx-auto">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Dump Bin</h1>
          <p className="text-muted-foreground text-sm">Lempar sisa recehanmu.</p>
        </div>
        <Button size="sm" onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-1" /> Target Baru
        </Button>
      </div>

      {/* LIST ITEMS */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
        {goals.map((goal) => {
            const progress = (goal.current_amount / goal.target_amount) * 100;
            const isFull = goal.current_amount >= goal.target_amount;

            return (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)", transition: { duration: 0.4 } }}
                className={`relative group rounded-2xl border transition-all overflow-hidden ${
                    isFull 
                    ? "bg-gradient-to-r from-teal-900/40 to-emerald-900/40 border-teal-500/50 shadow-[0_0_20px_-5px_rgba(20,184,166,0.3)]" 
                    : "bg-card border-white/5 hover:border-white/10"
                }`}
              >
                {isFull && <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none" />}
                
                <div 
                    className={`absolute top-0 left-0 h-full opacity-10 transition-all duration-1000 ${isFull ? 'bg-emerald-400' : 'bg-white'}`} 
                    style={{ width: `${progress}%` }} 
                />

                <div className="p-4 flex items-center gap-4 relative z-10">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isFull ? "bg-emerald-500 text-white shadow-lg scale-110" : "bg-secondary/50 text-muted-foreground"
                    }`}>
                        {isFull ? <Sparkles className="w-6 h-6 animate-spin-slow" /> : <Archive className="w-6 h-6" />}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                             <h3 className="font-bold text-sm truncate pr-2">{goal.name}</h3>
                             {!isFull && (
                                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEditModal(goal)} className="p-1 hover:text-amber-400"><Edit2 className="w-3 h-3" /></button>
                                    <button onClick={() => handleClaimOrDelete(goal.id, false)} className="p-1 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                 </div>
                             )}
                        </div>
                        
                        <div className="flex justify-between items-end">
                            <p className="text-xs text-muted-foreground font-mono">
                                {formatRupiah(goal.current_amount)} 
                                <span className="mx-1 opacity-40">/</span> 
                                {formatRupiah(goal.target_amount)}
                            </p>
                        </div>
                        
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mt-2">
                            <motion.div 
                                className={`h-full ${isFull ? 'bg-emerald-400' : 'bg-primary'}`} 
                                initial={{ width: 0 }} 
                                animate={{ width: `${progress}%` }} 
                            />
                        </div>
                    </div>

                    <div className="shrink-0">
                        {isFull ? (
                            <Button 
                                size="sm" 
                                className="bg-emerald-500 hover:bg-emerald-400 text-white border-none font-bold shadow-lg shadow-emerald-900/20"
                                onClick={() => handleClaimOrDelete(goal.id, true)}
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                AMBIL
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-10 w-10 p-0 rounded-full border-primary/20 hover:bg-primary/10 hover:border-primary text-primary"
                                onClick={() => openContributeModal(goal)}
                            >
                                <Plus className="w-5 h-5" />
                            </Button>
                        )}
                    </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ... (MODAL FORM & CONTRIBUTE KODE SAMA SEPERTI SEBELUMNYA) ... */}
      {/* SAYA PERSINGKAT DISINI AGAR TIDAK KEPANJANGAN, TAPI PASTIKAN BAGIAN MODAL TETAP ADA YA */}
      {/* MODAL 1: FORM TARGET */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingId ? "Edit Target" : "Target Baru"}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">Nama Barang</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama..." className="font-medium mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">Harga Target</label>
            <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">Rp</span>
                <Input type="text" inputMode="numeric" value={targetDisplay} onChange={(e) => handleTargetChange(e.target.value)} className="pl-9 font-mono font-bold text-lg" />
            </div>
          </div>
          <Button className="w-full mt-2" onClick={handleSaveTarget}>{editingId ? "Simpan" : "Buat Target"}</Button>
        </div>
      </Modal>

      {/* MODAL 2: ISI CELENGAN */}
      <Modal
        isOpen={isContributeModalOpen}
        onClose={() => setIsContributeModalOpen(false)}
        title={`Isi Celengan: ${selectedGoal?.name}`}
      >
         <div className="space-y-6 pt-2">
            <div className="text-center">
                <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">Nominal Masuk</label>
                <div className="relative inline-block w-full">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xl font-bold">Rp</span>
                    <Input 
                        type="text" 
                        inputMode="numeric" 
                        value={contributeDisplay} 
                        onChange={(e) => handleContributeChange(e.target.value)} 
                        className="pl-12 text-3xl font-mono font-bold text-center h-16 bg-secondary/30 border-primary/30 focus:border-primary" 
                    />
                </div>
            </div>

            <div className="space-y-4">
                <input 
                    type="range" 
                    min="1000" 
                    max={sliderMax} 
                    step="1000" 
                    value={contributeRaw} 
                    onChange={(e) => {
                        const raw = Number(e.target.value);
                        setContributeRaw(raw);
                        setContributeDisplay(formatNumber(raw));
                    }}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono uppercase">
                    <span>1rb</span>
                    <span>{formatNumber(sliderMax)}</span>
                </div>
            </div>

            <Button className="w-full h-12 text-md shadow-lg" onClick={handleSubmitContribute}>
                <Coins className="w-5 h-5 mr-2" /> Masukkan
            </Button>
         </div>
      </Modal>

    </div>
  );
}