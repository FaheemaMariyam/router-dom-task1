pip install fastapi uvicorn sqlalchemy psycopg2-binary python-dotenv passlib[bcrypt] python-jose pydantic[email] 

--.env
DB_URL=postgresql://postgres:root@localhost:5432/test_fastapi
SECRET_KEY=123456
ALGORITHM=HS256

--database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker,declarative_base

import os
from dotenv import load_dotenv

load_dotenv()

engine=create_engine(os.getenv("DB_URL"))
SessionLocal=sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base=declarative_base()

--models.py
from sqlalchemy import Column, Integer, String

from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    
    email = Column(String, unique=True, index=True)
    password =Column(String)

--schemas.py
from pydantic import BaseModel,EmailStr


class AuthSchema(BaseModel):
    email: EmailStr
    password: str
--auth.py
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
import os
from dotenv import load_dotenv  
load_dotenv()
pwt_context=CryptContext(schemes=["bcrypt"],deprecated="auto")
SECRET_KEY=os.getenv("SECRET_KEY")
ALGORITHM=os.getenv("ALGORITHM")

def hash_password(password:str):
    return pwt_context.hash(password)   
def verify_password(plain_password,hashed_password):
    return pwt_context.verify(plain_password,hashed_password)
def create_access_token(data):
    data.update({"exp":datetime.utcnow()+timedelta(minutes=30)})
    return jwt.encode(data,SECRET_KEY,algorithm=ALGORITHM)
def create_refresh_token(data):
    data.update({"exp":datetime.utcnow()+timedelta(days=7)})
    return jwt.encode(data,SECRET_KEY,algorithm=ALGORITHM)

--main.py
from fastapi import FastAPI, Depends, HTTPException,Request,Response,status
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import User
from schemas import AuthSchema
from auth import create_access_token, create_refresh_token,hash_password, verify_password
from jose import  jwt
import os

app = FastAPI()
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: AuthSchema, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()

    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    user = User(
        email=data.email,
        password=hash_password(data.password)
    )

    db.add(user)
    db.commit()

    return {"message": "User registered"}
@app.post("/login")
def login(data: AuthSchema, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    access = create_access_token({"sub": user.email})
    refresh = create_refresh_token({"sub": user.email})

    response.set_cookie(key="access_token", value=access, httponly=True)
    response.set_cookie(key="refresh_token", value=refresh, httponly=True)

    return {"message": "Login successful"}
@app.post("/refresh")
def refresh(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")

    payload = jwt.decode(
        refresh_token,
        os.getenv("SECRET_KEY"),
        algorithms=[os.getenv("ALGORITHM")]
    )

    new_access = create_access_token({"sub": payload["sub"]})

    response.set_cookie(key="access_token", value=new_access, httponly=True)

    return {"message": "Token refreshed"}
@app.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")

    return {"message": "Logged out"}
@app.get("/profile")
def profile(request: Request):
    token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = jwt.decode(
        token,
        os.getenv("SECRET_KEY"),
        algorithms=[os.getenv("ALGORITHM")]
    )

    return {"email": payload["sub"]}
