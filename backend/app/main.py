from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.domains.models
from app.domains.admin.router import router as admin_router
from app.domains.bookings.router import router as bookings_router
from app.domains.engagement.messages_router import router as messages_router
from app.domains.engagement.reviews_router import router as reviews_router
from app.domains.identity.auth_router import router as auth_router
from app.domains.identity.users_router import router as users_router
from app.domains.trips.rides_router import router as rides_router
from app.domains.trips.vehicles_router import router as vehicles_router

app = FastAPI(title="Yolustu API")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(users_router, prefix="/api/users", tags=["users"])
app.include_router(rides_router, prefix="/api/rides", tags=["rides"])
app.include_router(bookings_router, prefix="/api/bookings", tags=["bookings"])
app.include_router(vehicles_router, prefix="/api/vehicles", tags=["vehicles"])
app.include_router(reviews_router, prefix="/api/reviews", tags=["reviews"])
app.include_router(messages_router, prefix="/api/messages", tags=["messages"])
app.include_router(admin_router, prefix="/api/admin", tags=["admin"])


@app.get("/")
def read_root():
    return {"message": "Welcome to Yolustu API"}
