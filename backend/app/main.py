from __future__ import annotations
import os
from contextlib import asynccontextmanager

import aiosqlite
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import router
from .cpp_index_wrapper import CppIndexEngine
from .storage import init_db

DATA_DIR = os.environ.get("DATA_DIR", "./data")


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(os.path.join(DATA_DIR, "uploads"), exist_ok=True)
    db_path = os.path.join(DATA_DIR, "flashindex.db")
    async with aiosqlite.connect(db_path) as db:
        await init_db(db)
        app.state.db = db
        app.state.cpp_engine = CppIndexEngine()
        yield


app = FastAPI(title="FlashIndex API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://frontend"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
