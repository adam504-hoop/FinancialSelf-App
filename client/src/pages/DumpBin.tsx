import { useState, useEffect } from "react";
import { Button, Input, Modal } from "@/components/ui-components";
import { Archive, Plus, Trash2, Edit2, Coins, Sparkles, CheckCircle2 } from "lucide-react"; 
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

// HAPUS import confetti karena kita pakai animasi native

type DumpItem = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  isDumpBin: boolean;
};

export default function DumpBin() {
  const { toast } = useToast();
  
  // STATE DATA
  const [goals, setGoals] = useState<DumpItem[]>([]);
  
  // MODAL STATES
  const [isFormModalOpen, setIsFormModalOpen] = useState(false); 
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false); 

  // STATE: FORM CREATE/EDIT
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [targetDisplay, setTargetDisplay] = useState(""); 
  const [targetRaw, setTargetRaw] = useState(0);        

  // STATE: NABUNG (CONTRIBUTE)
  const [selectedGoal, setSelectedGoal] = useState<DumpItem | null>(null);
  const [contributeRaw, setContributeRaw] = useState<number>(0);
  const [contributeDisplay, setContributeDisplay] = useState("0");
  const [sliderMax, setSliderMax] = useState(100000); 

  // 1. LOAD DATA
  useEffect(() => {
    const saved = localStorage.getItem("my-dumpbin");
    if (saved) setGoals(JSON.parse(saved));
  }, []);

  // 2. SIMPAN DATA
  const saveToLocal = (newGoals: DumpItem[]) => {
    setGoals(newGoals);
    localStorage.setItem("my-dumpbin", JSON.stringify(newGoals));
  };

  // --- LOGIKA FORMATTER ---
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num);

  // --- LOGIKA FORM INPUT ---
  const handleTargetChange = (val: string) => {
    const raw = Number(val.replace(/\D/g, ""));
    setTargetRaw(raw);
    setTargetDisplay(raw === 0 ? "" : formatNumber(raw));
  };

  // --- LOGIKA CONTRIBUTE (SLIDER DINAMIS) ---
  const openContributeModal = (goal: DumpItem) => {
    setSelectedGoal(goal);
    const remaining = goal.targetAmount - goal.currentAmount;
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

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = Number(e.target.value);
    setContributeRaw(raw);
    setContributeDisplay(formatNumber(raw));
  };

  // --- ACTIONS ---
  const handleSaveTarget = () => {
    if (!name || targetRaw <= 0) return;
    
    if (editingId) {
        const updated = goals.map(g => g.id === editingId ? { ...g, name, targetAmount: targetRaw } : g);
        saveToLocal(updated);
        toast({ title: "Update Berhasil", description: "Target diperbarui." });
    } else {
        const newGoal = { id: Date.now().toString(), name, targetAmount: targetRaw, currentAmount: 0, isDumpBin: true };
        saveToLocal([...goals, newGoal]);
        toast({ title: "Target Dibuat", description: "Semangat menabung!" });
    }
    setIsFormModalOpen(false);
    setEditingId(null); setName(""); setTargetDisplay(""); setTargetRaw(0);
  };

  const handleSubmitContribute = () => {
    if (!selectedGoal || contributeRaw <= 0) return;
    const updated = goals.map(g => {
        if (g.id === selectedGoal.id) {
            return { ...g, currentAmount: g.currentAmount + contributeRaw };
        }
        return g;
    });
    saveToLocal(updated);
    toast({ title: "Mantap!", description: `Berhasil nabung ${formatRupiah(contributeRaw)}` });
    setIsContributeModalOpen(false);
  };

  // --- LOGIKA CLAIM (ANIMASI NATIVE) ---
  const handleClaim = (id: string) => {
    // Kita langsung hapus data.
    // AnimatePresence akan menangani animasi 'exit' secara otomatis
    const updated = goals.filter(g => g.id !== id);
    saveToLocal(updated);
    toast({ title: "Alhamdulillah! 🤲", description: "Barang berhasil terbeli." });
  };

  const openAddModal = () => {
    setEditingId(null); setName(""); setTargetDisplay(""); setTargetRaw(0);
    setIsFormModalOpen(true);
  };

  const openEditModal = (goal: DumpItem) => {
    setEditingId(goal.id); setName(goal.name);
    setTargetRaw(goal.targetAmount);
    setTargetDisplay(formatNumber(goal.targetAmount));
    setIsFormModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if(confirm("Hapus target ini?")) saveToLocal(goals.filter(g => g.id !== id));
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

      {/* LIST ITEMS (LAYOUT BARU: VERTICAL LIST) */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
        {goals.map((goal) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const isFull = goal.currentAmount >= goal.targetAmount;

            return (
              <motion.div
                key={goal.id}
                layout
                // 1. ANIMASI MASUK (Slide Up)
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                
                // 2. ANIMASI KELUAR / TERCAPAI (Zoom Out & Fade & Blur)
                exit={{ 
                    opacity: 0, 
                    scale: 1.1,         // Membesar sedikit
                    filter: "blur(10px)", // Nge-blur
                    transition: { duration: 0.4 } 
                }}
                
                className={`relative group rounded-2xl border transition-all overflow-hidden ${
                    isFull 
                    ? "bg-gradient-to-r from-teal-900/40 to-emerald-900/40 border-teal-500/50 shadow-[0_0_20px_-5px_rgba(20,184,166,0.3)]" 
                    : "bg-card border-white/5 hover:border-white/10"
                }`}
              >
                {/* EFEK SHIMMER / MENGKILAP JIKA LUNAS */}
                {isFull && (
                    <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none" />
                )}

                {/* BACKGROUND PROGRESS */}
                <div 
                    className={`absolute top-0 left-0 h-full opacity-10 transition-all duration-1000 ${isFull ? 'bg-emerald-400' : 'bg-white'}`} 
                    style={{ width: `${progress}%` }} 
                />

                <div className="p-4 flex items-center gap-4 relative z-10">
                    
                    {/* ICON */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isFull ? "bg-emerald-500 text-white shadow-lg scale-110" : "bg-secondary/50 text-muted-foreground"
                    }`}>
                        {isFull ? <Sparkles className="w-6 h-6 animate-spin-slow" /> : <Archive className="w-6 h-6" />}
                    </div>

                    {/* TEXT */}
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                             <h3 className="font-bold text-sm truncate pr-2">{goal.name}</h3>
                             {!isFull && (
                                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEditModal(goal)} className="p-1 hover:text-amber-400"><Edit2 className="w-3 h-3" /></button>
                                    <button onClick={() => handleDelete(goal.id)} className="p-1 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                 </div>
                             )}
                        </div>
                        
                        <div className="flex justify-between items-end">
                            <p className="text-xs text-muted-foreground font-mono">
                                {formatRupiah(goal.currentAmount)} 
                                <span className="mx-1 opacity-40">/</span> 
                                {formatRupiah(goal.targetAmount)}
                            </p>
                        </div>
                        
                        {/* THIN PROGRESS BAR */}
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mt-2">
                            <motion.div 
                                className={`h-full ${isFull ? 'bg-emerald-400' : 'bg-primary'}`} 
                                initial={{ width: 0 }} 
                                animate={{ width: `${progress}%` }} 
                            />
                        </div>
                    </div>

                    {/* ACTION BUTTON */}
                    <div className="shrink-0">
                        {isFull ? (
                            <Button 
                                size="sm" 
                                className="bg-emerald-500 hover:bg-emerald-400 text-white border-none font-bold shadow-lg shadow-emerald-900/20"
                                onClick={() => handleClaim(goal.id)}
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

      {/* EMPTY STATE */}
      {goals.length === 0 && (
        <div className="text-center py-20 opacity-50 border-2 border-dashed border-white/10 rounded-3xl m-4 bg-white/5">
          <Archive className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm">Dump Bin Kosong.</p>
        </div>
      )}

      {/* --- MODAL 1: FORM TARGET --- */}
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

      {/* --- MODAL 2: ISI CELENGAN --- */}
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
                    onChange={handleSliderChange}
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