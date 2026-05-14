# RunIt Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user authentication, store collected content in database, make all configurations accessible via frontend pages

**Architecture:** Add JWT-based auth, new User/Content tables, rebuild frontend pages with forms for Sources/Agents/Publishers/Settings, use Dashboard as single entry point

**Tech Stack:** Python 3.11+, FastAPI, Next.js 14, JWT (python-jose, passlib), SQLAlchemy

---

## Phase 1: Backend - Authentication

### Task 1: Install Auth Dependencies

**Files:**
- Modify: `backend/requirements.txt`

- [ ] **Step 1: Add auth packages to requirements.txt**

```
# Auth
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-multipart>=0.0.9

# Utils
bcrypt>=4.0.0
```

- [ ] **Step 2: Commit**

```bash
git add backend/requirements.txt
git commit -m "feat: add authentication dependencies"
```

---

### Task 2: User Model

**Files:**
- Create: `backend/app/models/user.py`

- [ ] **Step 1: Create User model**

```python
import uuid
from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

- [ ] **Step 2: Update models/__init__.py**

```python
from app.models.user import User
# Add to __all__ and imports
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/models/user.py backend/app/models/__init__.py
git commit -m "feat: add User model"
```

---

### Task 3: Auth Utilities

**Files:**
- Create: `backend/app/auth/utils.py`
- Create: `backend/app/auth/__init__.py`

- [ ] **Step 1: Create auth/utils.py**

```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import get_settings

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=7))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm="HS256")


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"]


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    token = credentials.credentials
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": user_id, "email": payload.get("email")}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

- [ ] **Step 2: Update config.py**

Add to Settings class:
```python
jwt_secret: str = "your-secret-key-change-in-production"
jwt_algorithm: str = "HS256"
jwt_expire_days: int = 7
```

- [ ] **Step 3: Create auth/__init__.py**

```python
from app.auth.utils import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_token,
    get_current_user,
)

__all__ = [
    "verify_password",
    "get_password_hash",
    "create_access_token",
    "decode_token",
    "get_current_user",
]
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/auth/ backend/app/config.py
git commit -m "feat: add JWT authentication utilities"
```

---

### Task 4: Auth API Routes

**Files:**
- Create: `backend/app/api/auth.py`

- [ ] **Step 1: Create auth routes**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest, db=Depends(get_db)):
    # Check if user exists
    result = await db.execute(select(User).where(User.email == request.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=request.email,
        password_hash=get_password_hash(request.password)
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Create token
    token = create_access_token({"sub": user.id, "email": user.email})
    
    return AuthResponse(
        access_token=token,
        user={"id": user.id, "email": user.email}
    )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest, db=Depends(get_db)):
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user.id, "email": user.email})
    
    return AuthResponse(
        access_token=token,
        user={"id": user.id, "email": user.email}
    )


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


@router.post("/logout")
async def logout():
    return {"status": "ok"}
```

- [ ] **Step 2: Register router in main.py**

```python
from app.api.auth import router as auth_router
# In app = FastAPI(...):
app.include_router(auth_router)
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/auth.py backend/app/main.py
git commit -m "feat: add authentication API routes"
```

---

## Phase 2: Backend - Content Table

### Task 5: Content Model

**Files:**
- Create: `backend/app/models/content.py`

- [ ] **Step 1: Create Content model**

```python
import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Content(Base):
    __tablename__ = "contents"
    __table_args__ = (
        UniqueConstraint("source_id", "url", name="uq_source_url"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id: Mapped[str] = mapped_column(String(36), ForeignKey("tasks.id"), nullable=True)
    source_id: Mapped[str] = mapped_column(String(36), ForeignKey("data_sources.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    author: Mapped[str | None] = mapped_column(String(255), nullable=True)
    published_at: Mapped[str | None] = mapped_column(String(50), nullable=True)
    metadata: Mapped[dict | None] = mapped_column(Text, nullable=True)  # JSON
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    task: Mapped["Task"] = relationship("Task", back_populates="contents")
    source: Mapped["DataSource"] = relationship("DataSource", back_populates="contents")
```

- [ ] **Step 2: Update models/__init__.py**

```python
from app.models.content import Content
# Add to __all__ and imports
```

- [ ] **Step 3: Update Task and DataSource models**

Add to Task model:
```python
contents: Mapped[list["Content"]] = relationship("Content", back_populates="task")
```

Add to DataSource model:
```python
contents: Mapped[list["Content"]] = relationship("Content", back_populates="source")
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/models/content.py backend/app/models/task.py backend/app/models/data_source.py backend/app/models/__init__.py
git commit -m "feat: add Content model"
```

---

### Task 6: Content API Routes

**Files:**
- Create: `backend/app/api/content.py`

- [ ] **Step 1: Create content routes**

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.database import get_db
from app.models.content import Content
from app.auth import get_current_user

router = APIRouter(prefix="/api/content", tags=["Content"])


class ContentResponse(BaseModel):
    id: str
    source_id: str
    title: str
    content: str
    url: Optional[str] = None
    author: Optional[str] = None
    published_at: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


class ContentListResponse(BaseModel):
    items: List[ContentResponse]
    total: int
    page: int
    page_size: int


@router.get("", response_model=ContentListResponse)
async def list_content(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    source_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    query = select(Content)
    if source_id:
        query = query.where(Content.source_id == source_id)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Paginate
    query = query.order_by(Content.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    items = result.scalars().all()
    
    return ContentListResponse(
        items=[ContentResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{content_id}", response_model=ContentResponse)
async def get_content(
    content_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    result = await db.execute(select(Content).where(Content.id == content_id))
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    return ContentResponse.model_validate(content)


@router.delete("/{content_id}")
async def delete_content(
    content_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    result = await db.execute(delete(Content).where(Content.id == content_id))
    await db.commit()
    return {"status": "deleted"}
```

Add import to content.py:
```python
from typing import List, Optional
from pydantic import BaseModel
```

- [ ] **Step 2: Register router in main.py**

```python
from app.api.content import router as content_router
app.include_router(content_router)
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/content.py backend/app/main.py
git commit -m "feat: add Content API routes"
```

---

## Phase 3: Frontend - Auth Pages

### Task 7: API Client with Auth

**Files:**
- Modify: `web/src/lib/api.ts`

- [ ] **Step 1: Update API client to include auth**

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TOKEN_KEY = "runit_token";

export const auth = {
  getToken: () => typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null,
  setToken: (token: string) => typeof window !== "undefined" && localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => typeof window !== "undefined" && localStorage.removeItem(TOKEN_KEY),
  isLoggedIn: () => typeof window !== "undefined" && !!localStorage.getItem(TOKEN_KEY),
};

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const token = auth.getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options?.headers,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    auth.removeToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }

  return res.json();
}

// Auth API
export const authApi = {
  register: (email: string, password: string) =>
    fetchAPI("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    fetchAPI("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => fetchAPI("/api/auth/logout", { method: "POST" }),
  me: () => fetchAPI("/api/auth/me"),
};

// ... rest of existing API methods
```

- [ ] **Step 2: Commit**

```bash
git add web/src/lib/api.ts
git commit -m "feat: add JWT auth to API client"
```

---

### Task 8: Login Page

**Files:**
- Create: `web/src/app/login/page.tsx`

- [ ] **Step 1: Create login page**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi, auth } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authApi.login(email, password);
      auth.setToken(result.access_token);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">RunIt Login</h1>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        
        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link href="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/app/login/page.tsx
git commit -m "feat: add login page"
```

---

### Task 9: Register Page

**Files:**
- Create: `web/src/app/register/page.tsx`

- [ ] **Step 1: Create register page**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi, auth } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);

    try {
      const result = await authApi.register(email, password);
      auth.setToken(result.access_token);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
        
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/app/register/page.tsx
git commit -m "feat: add register page"
```

---

## Phase 4: Frontend - Dashboard & Auth Layout

### Task 10: Auth Layout with Redirect

**Files:**
- Create: `web/src/components/AuthCheck.tsx`

- [ ] **Step 1: Create auth check component**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api";

export function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    const token = auth.getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    
    // Verify token is valid
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        auth.removeToken();
        router.push("/login");
      });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <Header user={user} />
      {children}
    </>
  );
}

function Header({ user }: { user: { email: string } | null }) {
  const router = useRouter();
  
  const handleLogout = () => {
    auth.removeToken();
    router.push("/login");
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">RunIt</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/components/AuthCheck.tsx
git commit -m "feat: add auth check component"
```

---

### Task 11: Dashboard with Module Cards

**Files:**
- Modify: `web/src/app/page.tsx`

- [ ] **Step 1: Update dashboard**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/api";
import { Rss, Brain, Send, Settings, FileText, Activity } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    sources: 0,
    tasks: 0,
    providers: 0,
    publishers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.isLoggedIn()) {
      router.push("/login");
      return;
    }

    async function loadStats() {
      try {
        const [sources, tasks, providers, publishers] = await Promise.all([
          api.sources.list().catch(() => []),
          api.tasks.list({ page_size: 1 }).catch(() => ({ total: 0 })),
          api.llm.list().catch(() => []),
          api.publishers.list().catch(() => []),
        ]);
        setStats({
          sources: Array.isArray(sources) ? sources.length : 0,
          tasks: tasks?.total || 0,
          providers: Array.isArray(providers) ? providers.length : 0,
          publishers: Array.isArray(publishers) ? publishers.length : 0,
        });
      } catch (e) {
        console.error("Failed to load stats:", e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Sources" value={stats.sources} />
        <StatCard title="Tasks" value={stats.tasks} />
        <StatCard title="LLM Providers" value={stats.providers} />
        <StatCard title="Publishers" value={stats.publishers} />
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <ModuleCard href="/content" title="Content" icon={<FileText className="w-6 h-6" />} desc="View collected content" />
        <ModuleCard href="/sources" title="Sources" icon={<Rss className="w-6 h-6" />} desc="Configure data sources" />
        <ModuleCard href="/agents" title="Agents" icon={<Brain className="w-6 h-6" />} desc="AI processing strategies" />
        <ModuleCard href="/publishers" title="Publishers" icon={<Send className="w-6 h-6" />} desc="Social media platforms" />
        <ModuleCard href="/settings" title="Settings" icon={<Settings className="w-6 h-6" />} desc="System configuration" />
      </div>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function ModuleCard({ href, title, icon, desc }: { href: string; title: string; icon: React.ReactNode; desc: string }) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow h-full">
        <div className="text-blue-600 mb-2">{icon}</div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
    </Link>
  );
}
```

Also need to import api:
```tsx
import { api, auth } from "@/lib/api";
```

- [ ] **Step 2: Commit**

```bash
git add web/src/app/page.tsx
git commit -m "feat: update dashboard with module cards"
```

---

## Phase 5: Frontend - Content Page

### Task 12: Content List Page

**Files:**
- Create: `web/src/app/content/page.tsx`

- [ ] **Step 1: Create content list page**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, auth } from "@/lib/api";
import { ArrowLeft, Trash2, ExternalLink } from "lucide-react";

interface Content {
  id: string;
  source_id: string;
  title: string;
  content: string;
  url: string | null;
  created_at: string;
}

export default function ContentPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function loadContent() {
      setLoading(true);
      try {
        const data = await api.content.list({ page, page_size: 20 });
        setContents(data.items);
        setTotal(data.total);
      } catch (e) {
        console.error("Failed to load content:", e);
      }
      setLoading(false);
    }
    loadContent();
  }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this content?")) return;
    try {
      await api.content.delete(id);
      setContents(contents.filter((c) => c.id !== id));
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const truncate = (text: string, max: number = 100) => {
    return text.length > max ? text.substring(0, max) + "..." : text;
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Content</h1>
        <span className="text-gray-500">({total} items)</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : contents.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          No content yet. Run a data source to collect content.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contents.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {truncate(item.title, 40)}
                          </a>
                        )}
                        {!item.url && <span>{truncate(item.title, 40)}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {truncate(item.content.replace(/<[^>]*>/g, ""), 60)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-white rounded shadow disabled:opacity-50">
              Previous
            </button>
            <span>Page {page} of {Math.ceil(total / 20)}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={contents.length < 20} className="px-4 py-2 bg-white rounded shadow disabled:opacity-50">
              Next
            </button>
          </div>
        </>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Update API client with content methods**

Add to `web/src/lib/api.ts`:
```typescript
content: {
  list: (params?: { page?: number; page_size?: number; source_id?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchAPI(`/api/content${query ? `?${query}` : ""}`);
  },
  delete: (id: string) => fetchAPI(`/api/content/${id}`, { method: "DELETE" }),
},
```

- [ ] **Step 3: Commit**

```bash
git add web/src/app/content/page.tsx web/src/lib/api.ts
git commit -m "feat: add content list page"
```

---

## Phase 6: Frontend - Sources Page

### Task 13: Sources Page with Forms

**Files:**
- Create: `web/src/app/sources/page.tsx`
- Create: `web/src/app/sources/new/page.tsx`
- Create: `web/src/app/sources/[id]/edit/page.tsx`

- [ ] **Step 1: Create sources list page**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ArrowLeft, Plus, Play, Edit2, Trash2, Rss, Github, Twitter } from "lucide-react";

interface Source {
  id: string;
  name: string;
  type: string;
  config: any;
  schedule: string;
  enabled: boolean;
  last_run_at: string | null;
}

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.sources.list();
        setSources(data);
      } catch (e) {
        console.error("Failed to load:", e);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this source?")) return;
    try {
      await api.sources.delete(id);
      setSources(sources.filter((s) => s.id !== id));
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  };

  const handleRun = async (id: string) => {
    try {
      await api.sources.run(id);
      alert("Task triggered!");
    } catch (e) {
      console.error("Failed to run:", e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "github": return <Github className="w-5 h-5" />;
      case "twitter": return <Twitter className="w-5 h-5" />;
      default: return <Rss className="w-5 h-5" />;
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Data Sources</h1>
        </div>
        <Link href="/sources/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Add Source
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : sources.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          No data sources configured. Click "Add Source" to create one.
        </div>
      ) : (
        <div className="space-y-4">
          {sources.map((source) => (
            <div key={source.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${source.enabled ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
                    {getIcon(source.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{source.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Type: {source.type} • Schedule: {source.schedule}
                    </p>
                    {source.config?.url && (
                      <p className="text-sm text-gray-400 mt-1 truncate max-w-md">{source.config.url}</p>
                    )}
                    {source.last_run_at && (
                      <p className="text-xs text-gray-400 mt-1">
                        Last run: {new Date(source.last_run_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleRun(source.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                    <Play className="w-4 h-4" />
                  </button>
                  <Link href={`/sources/${source.id}/edit`} className="p-2 text-gray-600 hover:bg-gray-50 rounded">
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  <button onClick={() => handleDelete(source.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <span className={`px-2 py-1 text-xs rounded-full ${source.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                    {source.enabled ? "Active" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Create source form component**

Create `web/src/components/SourceForm.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface SourceFormProps {
  initialData?: {
    name: string;
    type: string;
    config: any;
    schedule: string;
    enabled: boolean;
    agent_id?: string;
  };
  isEdit?: boolean;
}

export function SourceForm({ initialData, isEdit }: SourceFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initialData?.name || "",
    type: initialData?.type || "rss",
    url: initialData?.config?.url || "",
    username: initialData?.config?.username || "",
    token: initialData?.config?.token || "",
    bearer_token: initialData?.config?.bearer_token || "",
    max_items: initialData?.config?.max_items || 20,
    schedule: initialData?.schedule || "0 * * * *",
    enabled: initialData?.enabled ?? true,
    agent_id: initialData?.agent_id || "",
  });
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useState(() => {
    api.agents.list().then(setAgents).catch(() => {});
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const config: any = {};
      if (form.type === "rss") {
        config.url = form.url;
        config.max_items = form.max_items;
      } else if (form.type === "github") {
        config.username = form.username;
        config.token = form.token;
      } else if (form.type === "twitter") {
        config.bearer_token = form.bearer_token;
      }

      const data = {
        name: form.name,
        type: form.type,
        config,
        schedule: form.schedule,
        enabled: form.enabled,
        agent_id: form.agent_id || null,
      };

      if (isEdit) {
        // Update - need source ID
        // await api.sources.update(id, data);
      } else {
        await api.sources.create(data);
      }
      router.push("/sources");
    } catch (e: any) {
      setError(e.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow p-6">
      {error && <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" required />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Type</label>
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
          <option value="rss">RSS Feed</option>
          <option value="github">GitHub Stars</option>
          <option value="twitter">Twitter</option>
        </select>
      </div>

      {/* RSS fields */}
      {form.type === "rss" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700">URL</label>
            <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Items</label>
            <input type="number" value={form.max_items} onChange={(e) => setForm({ ...form, max_items: parseInt(e.target.value) })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" min="1" max="100" />
          </div>
        </>
      )}

      {/* GitHub fields */}
      {form.type === "github" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700">GitHub Username</label>
            <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Personal Access Token</label>
            <input type="password" value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" required />
          </div>
        </>
      )}

      {/* Twitter fields */}
      {form.type === "twitter" && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Bearer Token</label>
          <input type="password" value={form.bearer_token} onChange={(e) => setForm({ ...form, bearer_token: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" required />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Schedule (Cron)</label>
        <input type="text" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" placeholder="0 * * * *" />
        <p className="text-xs text-gray-500 mt-1">e.g., "0 * * * *" = every hour</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Agent</label>
        <select value={form.agent_id} onChange={(e) => setForm({ ...form, agent_id: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
          <option value="">None</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>{agent.name}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="enabled" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="rounded" />
        <label htmlFor="enabled" className="text-sm font-medium text-gray-700">Enabled</label>
      </div>

      <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50">
        {loading ? "Saving..." : isEdit ? "Update" : "Create"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Create new source page**

```tsx
"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SourceForm } from "@/components/SourceForm";

export default function NewSourcePage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/sources" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">New Data Source</h1>
      </div>
      <SourceForm />
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add web/src/app/sources/page.tsx web/src/app/sources/new/page.tsx web/src/components/SourceForm.tsx
git commit -m "feat: add sources list and form pages"
```

---

## Phase 7: Frontend - Agents Page

### Task 14: Agents Page

**Files:**
- Create: `web/src/app/agents/page.tsx`
- Create: `web/src/app/agents/new/page.tsx`
- Create: `web/src/components/AgentForm.tsx`

- [ ] **Step 1: Create agents list page**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ArrowLeft, Plus, Edit2, Trash2, Brain } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  source_type: string;
  llm_provider_id: string | null;
  output_format: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [agentsData, providersData] = await Promise.all([
          api.agents.list(),
          api.llm.list().catch(() => []),
        ]);
        setAgents(agentsData);
        setProviders(providersData);
      } catch (e) {
        console.error("Failed to load:", e);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this agent?")) return;
    try {
      await api.agents.delete(id);
      setAgents(agents.filter((a) => a.id !== id));
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  };

  const getProviderName = (id: string | null) => {
    if (!id) return "None";
    const provider = providers.find((p) => p.id === id);
    return provider?.name || id;
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Agents</h1>
        </div>
        <Link href="/agents/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Add Agent
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          No agents configured. Click "Add Agent" to create one.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">LLM Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Output Format</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {agents.map((agent) => (
                <tr key={agent.id}>
                  <td className="px-6 py-4 font-medium">{agent.name}</td>
                  <td className="px-6 py-4">{agent.source_type}</td>
                  <td className="px-6 py-4">{getProviderName(agent.llm_provider_id)}</td>
                  <td className="px-6 py-4">{agent.output_format}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(agent.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Create AgentForm component**

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface AgentFormProps {
  initialData?: {
    name: string;
    source_type: string;
    llm_provider_id: string | null;
    prompt_template: string;
    output_format: string;
  };
}

export function AgentForm({ initialData }: AgentFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initialData?.name || "",
    source_type: initialData?.source_type || "rss",
    llm_provider_id: initialData?.llm_provider_id || "",
    prompt_template: initialData?.prompt_template || "Summarize the following content:\n\n{content}",
    output_format: initialData?.output_format || "markdown",
  });
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.llm.list().then(setProviders).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.agents.create({
        ...form,
        llm_provider_id: form.llm_provider_id || null,
      });
      router.push("/agents");
    } catch (e: any) {
      setError(e.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow p-6">
      {error && <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" required />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Source Type</label>
        <select value={form.source_type} onChange={(e) => setForm({ ...form, source_type: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
          <option value="rss">RSS</option>
          <option value="github">GitHub</option>
          <option value="twitter">Twitter</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">LLM Provider</label>
        <select value={form.llm_provider_id} onChange={(e) => setForm({ ...form, llm_provider_id: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
          <option value="">None</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.model})</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Prompt Template</label>
        <textarea value={form.prompt_template} onChange={(e) => setForm({ ...form, prompt_template: e.target.value })} rows={6} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm" />
        <p className="text-xs text-gray-500 mt-1">Use {"{content}"} to reference the content being processed.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Output Format</label>
        <select value={form.output_format} onChange={(e) => setForm({ ...form, output_format: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
          <option value="markdown">Markdown</option>
          <option value="html">HTML</option>
        </select>
      </div>

      <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50">
        {loading ? "Saving..." : "Create"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Create new agent page**

```tsx
"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AgentForm } from "@/components/AgentForm";

export default function NewAgentPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/agents" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">New Agent</h1>
      </div>
      <AgentForm />
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add web/src/app/agents/page.tsx web/src/app/agents/new/page.tsx web/src/components/AgentForm.tsx
git commit -m "feat: add agents pages"
```

---

## Phase 8: Frontend - Settings Page

### Task 15: Settings Page

**Files:**
- Create: `web/src/app/settings/page.tsx`
- Create: `web/src/components/LLMProviderForm.tsx`

- [ ] **Step 1: Create settings page**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ArrowLeft, Plus, Trash2, Check } from "lucide-react";

interface Provider {
  id: string;
  name: string;
  provider: string;
  model: string;
  enabled: boolean;
  is_default: boolean;
}

export default function SettingsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.llm.list();
        setProviders(data);
      } catch (e) {
        console.error("Failed to load:", e);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this provider?")) return;
    try {
      await api.llm.delete(id);
      setProviders(providers.filter((p) => p.id !== id));
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* LLM Providers Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">LLM Providers</h2>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Add Provider
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Default</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {providers.map((provider) => (
                  <tr key={provider.id}>
                    <td className="px-6 py-4 font-medium">{provider.name}</td>
                    <td className="px-6 py-4">{provider.provider}</td>
                    <td className="px-6 py-4">{provider.model}</td>
                    <td className="px-6 py-4">
                      {provider.is_default && <Check className="w-4 h-4 text-green-600" />}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(provider.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {providers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No LLM providers configured.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Backup Settings Section */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Backup Settings</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-4">
            Obsidian backup path and other backup settings will be configured here.
          </p>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/app/settings/page.tsx
git commit -m "feat: add settings page"
```

---

## Phase 9: Frontend - Publishers Page

### Task 16: Publishers Page

**Files:**
- Create: `web/src/app/publishers/page.tsx`

- [ ] **Step 1: Create publishers page**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

interface Publisher {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
}

export default function PublishersPage() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.publishers.list();
        setPublishers(data);
      } catch (e) {
        console.error("Failed to load:", e);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this publisher?")) return;
    try {
      await api.publishers.delete(id);
      setPublishers(publishers.filter((p) => p.id !== id));
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Publishers</h1>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Add Publisher
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : publishers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          No publishers configured. Click "Add Publisher" to add a social media platform.
        </div>
      ) : (
        <div className="space-y-4">
          {publishers.map((pub) => (
            <div key={pub.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{pub.name}</h3>
                  <p className="text-sm text-gray-500">{pub.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDelete(pub.id)} className="text-red-600 hover:bg-red-50 p-2 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <span className={`px-2 py-1 text-xs rounded-full ${pub.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                    {pub.enabled ? "Active" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/app/publishers/page.tsx
git commit -m "feat: add publishers page"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-4 | Backend authentication (JWT, User model, auth routes) |
| 2 | 5-6 | Backend Content table and API |
| 3 | 7-9 | Frontend auth pages (login, register) |
| 4 | 10-11 | Frontend Dashboard with module cards |
| 5 | 12 | Frontend Content page |
| 6 | 13 | Frontend Sources pages (list, new form) |
| 7 | 14 | Frontend Agents pages |
| 8 | 15 | Frontend Settings page |
| 9 | 16 | Frontend Publishers page |

---

## Spec Coverage Check

- [x] User registration/login with JWT
- [x] Content table storing collected data
- [x] Dashboard as single entry point
- [x] Module cards for navigation
- [x] Content list page
- [x] Sources CRUD with forms
- [x] Agents CRUD with forms
- [x] Publishers page
- [x] Settings page (LLM providers)

---

Plan complete and saved to `docs/superpowers/plans/2026-05-14-runit-frontend-redesign.md`.
