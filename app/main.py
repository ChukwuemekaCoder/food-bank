from fastapi import FastAPI

from app.routers import auth, donors, inventory_items, volunteers, shifts, recipients, routes, notifications

app = FastAPI(
    title="Food Bank Platform API",
    description="Backend API for donor management, inventory, volunteers, routes, and notifications.",
    version="0.1.0",
)

app.include_router(auth.router)
app.include_router(donors.router)
app.include_router(inventory_items.router)
app.include_router(volunteers.router)
app.include_router(shifts.router)
app.include_router(recipients.router)
app.include_router(routes.router)
app.include_router(notifications.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
