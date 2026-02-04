# --- TAMBAHAN UNTUK AUTH ---
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from models import User # Jangan lupa import User!
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

# --- MODEL INPUT KHUSUS REGISTER ---
from pydantic import BaseModel

class RegisterInput(BaseModel):
    username: str
    password: str

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    print("Startup: Database Relasional Siap! 🚀")
    yield

app = FastAPI(lifespan=lifespan)

# --- KONFIGURASI KEAMANAN ---
SECRET_KEY = "rahasia_donk_jangan_disebar" # Nanti diganti kalau sudah pro
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30000 # Lama login (biar gak logat-logout terus saat dev)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/token")

# --- FUNGSI BANTUAN (TOOLS) ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Fungsi untuk mengecek: "Siapa User yang sedang akses ini?"
def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    with Session(engine) as session:
        user = session.exec(select(User).where(User.username == username)).first()
        if user is None:
            raise credentials_exception
        return user

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
# 0. AUTHENTICATION (Pintu Masuk) 🔐
# ==========================

# 1. REGISTER (Daftar User Baru)
# 1. REGISTER (Daftar User Baru)
@app.post("/api/register")
def register(data: RegisterInput):
    with Session(engine) as session:
        # Cek apakah username sudah ada?
        existing_user = session.exec(select(User).where(User.username == data.username)).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username sudah dipakai")
        
        # NAH INI DIA SOLUSINYA!
        # Kita ambil 'password' dari frontend, kita acak, lalu masukkan ke 'password_hash' di database
        hashed_password = get_password_hash(data.password)
        
        # Bikin object User baru
        new_user = User(username=data.username, password_hash=hashed_password)
        
        session.add(new_user)
        session.commit()
        
        return {"ok": True, "message": "User berhasil dibuat"}

# 2. LOGIN (Tukar Password dengan Token)
@app.post("/api/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    with Session(engine) as session:
        user = session.exec(select(User).where(User.username == form_data.username)).first()
        if not user or not verify_password(form_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Username atau Password salah",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Kalau sukses, bikin tiket (token)
        access_token = create_access_token(data={"sub": user.username})
        return {"access_token": access_token, "token_type": "bearer"}

# 3. CEK SAYA (Siapa saya?)
@app.get("/api/user")
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
# ==========================
@app.get("/api/dumpbins")
def get_dumpbins(current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        # Hanya ambil punya user yang login
        statement = select(DumpBin).where(DumpBin.user_id == current_user.id)
        return session.exec(statement).all()

@app.post("/api/dumpbins")
def create_dumpbin(dumpbin: DumpBin, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        dumpbin.user_id = current_user.id # Stempel kepemilikan
        session.add(dumpbin)
        session.commit()
        session.refresh(dumpbin)
        return dumpbin

@app.put("/api/dumpbins/{dumpbin_id}")
def update_dumpbin(dumpbin_id: int, updated_data: DumpBin, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        # Cari data yang ID-nya cocok DAN punya user ini
        db_dumpbin = session.exec(select(DumpBin).where(DumpBin.id == dumpbin_id, DumpBin.user_id == current_user.id)).first()
        if not db_dumpbin:
            raise HTTPException(status_code=404, detail="Data tidak ditemukan atau bukan milikmu")
        
        db_dumpbin.current_amount = updated_data.current_amount
        session.add(db_dumpbin)
        session.commit()
        session.refresh(db_dumpbin)
        return db_dumpbin

# ==========================
# ==========================
# 2. DEBT (Hutang) - PRIVATE
# ==========================
@app.get("/api/debts")
def get_debts(current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        statement = select(Debt).where(Debt.user_id == current_user.id)
        return session.exec(statement).all()

@app.post("/api/debts")
def create_debt(debt: Debt, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        debt.user_id = current_user.id
        session.add(debt)
        session.commit()
        session.refresh(debt)
        return debt

@app.put("/api/debts/{debt_id}")
def update_debt(debt_id: int, updated_data: Debt, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        db_debt = session.exec(select(Debt).where(Debt.id == debt_id, Debt.user_id == current_user.id)).first()
        if not db_debt:
            raise HTTPException(status_code=404, detail="Hutang tidak ditemukan")
        
        db_debt.remaining_amount = updated_data.remaining_amount
        session.add(db_debt)
        session.commit()
        session.refresh(db_debt)
        return db_debt

# ==========================
# 3. ALLOCATOR (Kategori) - PRIVATE
# ==========================
@app.get("/api/categories", response_model=List[CategoryRead])
def get_categories(current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        # Ambil kategori milik user beserta item-itemnya
        statement = select(Category).where(Category.user_id == current_user.id).options(selectinload(Category.items))
        results = session.exec(statement).all()
        return results

@app.post("/api/categories")
def create_category(category: Category, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        category.user_id = current_user.id
        session.add(category)
        session.commit()
        session.refresh(category)
        return category

@app.post("/api/categories/{cat_id}/items")
def create_item(cat_id: int, item: AllocationItem, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        # Pastikan kategori tujuan benar-benar milik user ini
        category = session.exec(select(Category).where(Category.id == cat_id, Category.user_id == current_user.id)).first()
        if not category:
             raise HTTPException(status_code=404, detail="Kategori tidak ditemukan")
        
        item.category_id = cat_id
        session.add(item)
        session.commit()
        session.refresh(item)
        return item
    

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