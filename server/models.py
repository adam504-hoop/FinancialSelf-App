from typing import List, Optional
from sqlmodel import Field, SQLModel, Relationship

# 1. DUMP BIN (Tabungan Receh)
class DumpBin(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    target_amount: int
    current_amount: int = 0
    is_dump_bin: bool = True

# 2. DEBT (Hutang)
class Debt(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    total_amount: int
    remaining_amount: int
    target_date: Optional[str] = None

# --- BAGIAN INI YANG KITA PERBAIKI (Hanya ada 1 versi sekarang) ---

# 3. KATEGORI (Laci)
class Category(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    color: str
    
    # "items" ini akan menunjuk ke anak-anaknya.
    # back_populates="category_link" artinya nyambung ke variable 'category_link' di tabel anak.
    items: List["AllocationItem"] = Relationship(back_populates="category_link", sa_relationship_kwargs={"cascade": "all, delete"})

# 4. ITEM ALOKASI (Isi Laci)
class AllocationItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    amount: int
    # Menunjuk ID Laci
    category_id: Optional[int] = Field(default=None, foreign_key="category.id")
    
    # Variable ini bernama 'category_link', sesuai dengan panggilan dari ortunya di atas
    category_link: Optional[Category] = Relationship(back_populates="items")

# 5. MODEL BACA (Untuk JSON ke React)
class CategoryRead(SQLModel):
    id: int
    name: str
    color: str
    items: List[AllocationItem] = []