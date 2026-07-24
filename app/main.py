from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, donors, inventory_items, volunteers, shifts, recipients, routes, notifications, receipts

app = FastAPI(
    title="Food Bank Platform API",
    description="Backend API for donor management, inventory, volunteers, routes, and notifications.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(donors.router)
app.include_router(inventory_items.router)
app.include_router(volunteers.router)
app.include_router(shifts.router)
app.include_router(recipients.router)
app.include_router(routes.router)
app.include_router(notifications.router)
app.include_router(receipts.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
