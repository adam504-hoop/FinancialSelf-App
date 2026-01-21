import { useState, useEffect } from "react";
import { Button, Input, Modal } from "@/components/ui-components";
import { Archive, Plus, Coins, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

// Tipe Data untuk Dump Bin
type DumpItem = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  isDumpBin: boolean;
};

export default function DumpBin() {
  const { toast } = useToast();
  
  // STATE DATA (LocalStorage)
  const [goals, setGoals] = useState<DumpItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // STATE FORM INPUT
  const [name, setName] = useState("");
  const [targetDisplay, setTargetDisplay] = useState(""); // Tampilan (Ada Titik)
  const [targetRaw, setTargetRaw] = useState(0);        // Angka Murni

  // 1. LOAD DATA (Otomatis saat buka)
  useEffect(() => {
    const saved = localStorage.getItem("my-dumpbin");
    if (saved) {
        setGoals(JSON.parse(saved));
    }
  }, []);

  // 2. SIMPAN DATA (Helper)
  const saveToLocal = (newGoals: DumpItem[]) => {
    setGoals(newGoals);
    localStorage.setItem("my-dumpbin", JSON.stringify(newGoals));
  };

  // --- LOGIKA AUTO-FORMAT RUPIAH (Fitur Tadi) ---
  const handleMoneyChange = (value: string) => {
    const rawValue = value.replace(/\D/g, "");
    if (rawValue === "") {
        setTargetDisplay("");
        setTargetRaw(0);
    } else {
        const formatted = new Intl.NumberFormat('id-ID').format(Number(rawValue));
        setTargetDisplay(formatted);
        setTargetRaw(Number(rawValue));
    }
  };

  // --- ACTIONS ---

  // TAMBAH ITEM BARU
  const handleCreate = () => {
    if (!name || targetRaw <= 0) return;

    const newGoal: DumpItem = {
        id: Date.now().toString(),
        name: name,
        targetAmount: targetRaw,
        currentAmount: 0, // Awalnya nol
        isDumpBin: true
    };

    const updatedGoals = [...goals, newGoal];
    saveToLocal(updatedGoals);
    
    // Reset & Tutup
    setIsModalOpen(false);
    setName("");
    setTargetDisplay("");
    setTargetRaw(0);
    toast({ title: "Target Dibuat", description: "Mulai kumpulkan recehanmu!" });
  };

  // SISA BENSIN (Quick Add 20rb)
  const handleQuickAdd = (id: string) => {
    const updatedGoals = goals.map(g => {
        if (g.id === id) {
            // Tambah 20.000, tapi jangan lebih dari target
            const newCurrent = Math.min(g.targetAmount, g.currentAmount + 20000);
            return { ...g, currentAmount: newCurrent };
        }
        return g;
    });
    saveToLocal(updatedGoals);
    toast({ title: "Sisa Bensin Masuk!", description: "+ Rp 20.000" });
  };

  // HAPUS ITEM
  const handleDelete = (id: string) => {
    if(confirm("Yakin hapus target ini?")) {
        const updatedGoals = goals.filter(g => g.id !== id);
        saveToLocal(updatedGoals);
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6 max-w-lg mx-auto">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold">Dump Bin</h1>
          <p className="text-muted-foreground text-sm">
            Lempar sisa recehanmu ke sini.
          </p>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Target Baru
        </Button>
      </div>

      {/* LIST ITEMS */}
      <div className="grid grid-cols-2 gap-4">
        {goals.map((goal) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const isFull = goal.currentAmount >= goal.targetAmount;

            return (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`border rounded-3xl p-4 flex flex-col justify-between h-52 relative group ${
                    isFull ? "bg-teal-900/20 border-teal-500/50" : "bg-card border-white/5"
                }`}
              >
                <button
                  onClick={() => handleDelete(goal.id)}
                  className="absolute top-3 right-3 text-muted-foreground/50 hover:text-red-500 transition-colors z-10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${
                      isFull ? "bg-teal-500 text-white shadow-lg shadow-teal-500/50" : "bg-teal-500/10 text-teal-500"
                  }`}>
                    <Archive className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm leading-tight mb-1 truncate pr-4">
                    {goal.name}
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    {formatRupiah(goal.currentAmount)} /{" "}
                    {formatRupiah(goal.targetAmount)}
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-teal-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                  
                  {/* Quick Action Button */}
                  {isFull ? (
                      <Button size="sm" variant="outline" className="w-full text-[10px] h-8 border-teal-500 text-teal-500" disabled>
                        Tercapai! 🎉
                      </Button>
                  ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-[10px] h-8 border-teal-500/30 hover:bg-teal-500/10 hover:text-teal-500 transition-all"
                        onClick={() => handleQuickAdd(goal.id)}
                      >
                        <Coins className="w-3 h-3 mr-1" /> Sisa Bensin (20rb)
                      </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
      </div>

      {/* TAMPILAN KOSONG */}
      {goals.length === 0 && (
        <div className="text-center py-20 opacity-50 border-2 border-dashed border-white/10 rounded-3xl m-4 bg-white/5">
          <Archive className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm">Belum ada target (Contoh: Keyboard, Mouse?).</p>
        </div>
      )}

      {/* MODAL INPUT MANUAL (Tanpa Library Form Ribet) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Target Wishlist"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Nama Barang
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Keyboard Mechanical"
              className="font-medium"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Harga Target
            </label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">Rp</span>
                
                {/* INPUT PINTAR (FORMATTER) */}
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={targetDisplay} 
                  onChange={(e) => handleMoneyChange(e.target.value)} 
                  className="pl-9 font-mono font-bold text-lg"
                />
            </div>
          </div>
          
          <Button
            className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-900/20"
            onClick={handleCreate}
          >
            Buat Target
          </Button>
        </div>
      </Modal>
    </div>
  );
}