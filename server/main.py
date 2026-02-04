from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from contextlib import asynccontextmanager
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from database import create_db_and_tables, engine
# --- 1. TAMBAH IMPORT INI (Mantra Ajaib) ---
from sqlalchemy.orm import selectinload 
# Cari baris ini:
from models import DumpBin, Debt, Category, AllocationItem, CategoryRead
# Pastikan CategoryRead ada di situ ^^

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    print("Startup: Database Relasional Siap! 🚀")
    yield

app = FastAPI(lifespan=lifespan)

origins = ["http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# @app.get("/")
# def read_root():
#     return {"status": "Server Online", "db": "Allocation Relational Ready"}

# ==========================
# 1. DUMP BIN (Tabungan)
# ==========================
@app.get("/api/dump-bin")
def get_dump_items():
    with Session(engine) as session:
        return session.exec(select(DumpBin)).all()

@app.post("/api/dump-bin")
def create_dump_item(item: DumpBin):
    with Session(engine) as session:
        session.add(item)
        session.commit()
        session.refresh(item)
        return item

@app.put("/api/dump-bin/{item_id}")
def update_dump_item(item_id: int, item: DumpBin):
    with Session(engine) as session:
        db_item = session.get(DumpBin, item_id)
        if not db_item: raise HTTPException(404)
        db_item.name = item.name
        db_item.target_amount = item.target_amount
        db_item.current_amount = item.current_amount
        session.add(db_item)
        session.commit()
        session.refresh(db_item)
        return db_item

@app.delete("/api/dump-bin/{item_id}")
def delete_dump_item(item_id: int):
    with Session(engine) as session:
        item = session.get(DumpBin, item_id)
        if item:
            session.delete(item)
            session.commit()
        return {"ok": True}

# ==========================
# 2. DEBT (Hutang)
# ==========================
@app.get("/api/debts")
def get_debts():
    with Session(engine) as session:
        return session.exec(select(Debt)).all()

@app.post("/api/debts")
def create_debt(item: Debt):
    with Session(engine) as session:
        session.add(item)
        session.commit()
        session.refresh(item)
        return item

@app.put("/api/debts/{item_id}")
def update_debt(item_id: int, item: Debt):
    with Session(engine) as session:
        db_item = session.get(Debt, item_id)
        if not db_item: raise HTTPException(404)
        db_item.name = item.name
        db_item.total_amount = item.total_amount
        db_item.remaining_amount = item.remaining_amount
        session.add(db_item)
        session.commit()
        session.refresh(db_item)
        return db_item

@app.delete("/api/debts/{item_id}")
def delete_debt(item_id: int):
    with Session(engine) as session:
        item = session.get(Debt, item_id)
        if item:
            session.delete(item)
            session.commit()
        return {"ok": True}

# =================================================
# 3. ALLOCATOR RELASIONAL (Kategori & Item) 🚀
# =================================================

# --- A. KELOLA KATEGORI (LACI) ---

# Ambil semua kategori BESERTA item di dalamnya
@app.get("/api/categories", response_model=List[CategoryRead])
def get_categories():
    with Session(engine) as session:
        # --- 2. PERBAIKAN DISINI ---
        # Kita pakai .options(selectinload(...))
        # Artinya: "Tolong ambil Kategori SEKALIGUS ambil Items di dalamnya"
        statement = select(Category).options(selectinload(Category.items))
        
        results = session.exec(statement).all()
        return results

@app.post("/api/categories")
def create_category(category: Category):
    with Session(engine) as session:
        session.add(category)
        session.commit()
        session.refresh(category)
        return category

@app.put("/api/categories/{cat_id}")
def update_category(cat_id: int, data: Category):
    with Session(engine) as session:
        cat = session.get(Category, cat_id)
        if not cat: raise HTTPException(404)
        cat.name = data.name
        cat.color = data.color
        session.add(cat)
        session.commit()
        session.refresh(cat)
        return cat

@app.delete("/api/categories/{cat_id}")
def delete_category(cat_id: int):
    with Session(engine) as session:
        cat = session.get(Category, cat_id)
        if not cat: raise HTTPException(404)
        session.delete(cat)
        session.commit()
        return {"ok": True}

# --- B. KELOLA ITEM (BARANG DI DALAM LACI) ---

@app.post("/api/allocations")
def create_item(item: AllocationItem):
    with Session(engine) as session:
        session.add(item)
        session.commit()
        session.refresh(item)
        return item

@app.put("/api/allocations/{item_id}")
def update_item(item_id: int, data: AllocationItem):
    with Session(engine) as session:
        item = session.get(AllocationItem, item_id)
        if not item: raise HTTPException(404)
        item.name = data.name
        item.amount = data.amount
        session.add(item)
        session.commit()
        session.refresh(item)
        return item

@app.delete("/api/allocations/{item_id}")
def delete_item(item_id: int):
    with Session(engine) as session:
        item = session.get(AllocationItem, item_id)
        if item:
            session.delete(item)
            session.commit()
        return {"ok": True}
    

client_dist = os.path.join(os.path.dirname(__file__), "..", "client", "dist")

if os.path.exists(client_dist):
    # 1. Mount folder assets (CSS/JS/Images hasil build)
    app.mount("/assets", StaticFiles(directory=os.path.join(client_dist, "assets")), name="assets")

    # 2. Catch-All Route: Apapun URL yang diketik user (kecuali API), kirim index.html React
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        # Jangan ganggu jalur API!
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="Not Found")
        
        # Cek jika user meminta file spesifik (misal: favicon.png, robots.txt)
        file_path = os.path.join(client_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # Default: Kirim index.html (Agar React Router bekerja)
        return FileResponse(os.path.join(client_dist, "index.html"))
else:
    print("⚠️ Warning: Folder 'client/dist' tidak ditemukan. Jalankan 'npm run build' dulu.")