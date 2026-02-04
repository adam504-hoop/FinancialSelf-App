from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

# ==========================
# 1. USER (Pengguna) 🔐
# ==========================
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    password_hash: str

# ==========================
# 2. ALLOCATOR (Keuangan Bulanan)
# ==========================

# Item di dalam Laci (Kategori)
class AllocationItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    amount: int
    
    # Relasi ke Kategori
    category_id: Optional[int] = Field(default=None, foreign_key="category.id")
    category: Optional["Category"] = Relationship(back_populates="items")

# Laci (Kategori)
class Category(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # MILIK SIAPA? (Baru!)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
    name: str
    color: str
    items: List["AllocationItem"] = Relationship(back_populates="category", sa_relationship_kwargs={"cascade": "all, delete"})

# Model Khusus untuk Membaca Data (Frontend Friendly)
class CategoryRead(SQLModel):
    id: int
    name: str
    color: str
    items: List[AllocationItem] = []

# ==========================
# 3. FITUR LAIN (Hutang & Tabungan)
# ==========================
class DumpBin(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # MILIK SIAPA? (Baru!)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
    name: str
    target_amount: int
    current_amount: int

class Debt(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # MILIK SIAPA? (Baru!)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
    name: str
    total_amount: int
    remaining_amount: int