from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from api.auth import router as auth_router

from api.users import router as users_router

from api.rides import router as rides_router

from api.bookings import router as bookings_router

from api.vehicles import router as vehicles_router

from api.reviews import router as reviews_router

app = FastAPI(title="Yolüstü API")

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

@app.get("/")

def read_root():

    return {"message": "Welcome to Yolüstü API"}

