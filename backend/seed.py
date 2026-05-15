from models.models import User, Vehicle, Ride, Booking, Review
from core.database import SessionLocal
from sqlalchemy.orm import Session
import sys
import os
import uuid
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.abspath(__file__)))


def seed_db():
    db = SessionLocal()
    try:
        print("Starting seeding process...")
        # 1. Users
        mock_users = [
            {
                "id": "u1",
                "phone": "+994501234567",
                "first_name": "Elvin",
                "last_name": "Məmmədov",
                "role": "driver",
                "rating": 4.8,
            },
            {
                "id": "u2",
                "phone": "+994552345678",
                "first_name": "Aysel",
                "last_name": "Əliyeva",
                "role": "passenger",
                "rating": 4.6,
            },
            {
                "id": "u3",
                "phone": "+994703456789",
                "first_name": "Murad",
                "last_name": "Həsənov",
                "role": "driver",
                "rating": 4.9,
            },
            {
                "id": "u4",
                "phone": "+994514567890",
                "first_name": "Nigar",
                "last_name": "Rzayeva",
                "role": "passenger",
                "rating": 4.3,
            },
            {
                "id": "u5",
                "phone": "+994775678901",
                "first_name": "Kamran",
                "last_name": "Quliyev",
                "role": "driver",
                "rating": 4.5,
            },
            {
                "id": "u8",
                "phone": "+994708901234",
                "first_name": "Sanan",
                "last_name": "Aliyev",
                "role": "admin",
                "rating": 0.0,
            },
        ]
        user_map = {}
        for u_data in mock_users:
            user = db.query(User).filter(User.phone == u_data["phone"]).first()
            if not user:
                user = User(
                    id=uuid.uuid4(),
                    phone=u_data["phone"],
                    first_name=u_data["first_name"],
                    last_name=u_data["last_name"],
                    is_verified=True,
                    rating=u_data["rating"],
                )
                db.add(user)
                db.flush()
                print(f"User {u_data['phone']} created.")
            user_map[u_data["id"]] = user
        # 2. Vehicles for drivers
        vehicles_data = [
            {
                "id": "v1",
                "user_id": "u1",
                "brand": "Toyota",
                "model": "Prius",
                "year": 2015,
                "color": "White",
                "plate_number": "99-XX-001",
            },
            {
                "id": "v2",
                "user_id": "u3",
                "brand": "Hyundai",
                "model": "Elantra",
                "year": 2018,
                "color": "Silver",
                "plate_number": "77-YY-777",
            },
            {
                "id": "v3",
                "user_id": "u5",
                "brand": "Kia",
                "model": "Rio",
                "year": 2017,
                "color": "Blue",
                "plate_number": "10-ZZ-101",
            },
        ]
        vehicle_map = {}
        for v_data in vehicles_data:
            owner = user_map[v_data["user_id"]]
            vehicle = (
                db.query(Vehicle)
                .filter(Vehicle.plate_number == v_data["plate_number"])
                .first()
            )
            if not vehicle:
                vehicle = Vehicle(
                    id=uuid.uuid4(),
                    user_id=owner.id,
                    brand=v_data["brand"],
                    model=v_data["model"],
                    year=v_data["year"],
                    color=v_data["color"],
                    plate_number=v_data["plate_number"],
                )
                db.add(vehicle)
                db.flush()
                print(f"Vehicle {v_data['plate_number']} created.")
            vehicle_map[v_data["id"]] = vehicle
        # 3. Rides
        rides_data = [
            {
                "id": "t1",
                "driver_id": "u1",
                "vehicle_id": "v1",
                "origin": "Bakı",
                "dest": "Gəncə",
                "price": 15,
                "seats": 3,
                "origin_coords": "POINT(49.8671 40.4093)",
                "dest_coords": "POINT(46.3606 40.6828)",
            },
            {
                "id": "t2",
                "driver_id": "u3",
                "vehicle_id": "v2",
                "origin": "Bakı",
                "dest": "Quba",
                "price": 10,
                "seats": 4,
                "origin_coords": "POINT(49.8671 40.4093)",
                "dest_coords": "POINT(48.5134 41.3643)",
            },
            {
                "id": "t3",
                "driver_id": "u5",
                "vehicle_id": "v3",
                "origin": "Sumqayıt",
                "dest": "Bakı",
                "price": 8,
                "seats": 3,
                "origin_coords": "POINT(49.6667 40.5897)",
                "dest_coords": "POINT(49.8671 40.4093)",
            },
        ]
        for r_data in rides_data:
            driver = user_map[r_data["driver_id"]]
            vehicle = vehicle_map[r_data["vehicle_id"]]
            # Use current time + some days for active rides
            departure = datetime.now() + timedelta(days=2)
            ride = Ride(
                id=uuid.uuid4(),
                driver_id=driver.id,
                vehicle_id=vehicle.id,
                origin_location=r_data["origin_coords"],
                origin_city=r_data["origin"],
                destination_location=r_data["dest_coords"],
                destination_city=r_data["dest"],
                departure_time=departure,
                total_seats=r_data["seats"],
                available_seats=r_data["seats"],
                price_per_seat=r_data["price"],
                status="active",
            )
            db.add(ride)
            print(f"Ride {r_data['origin']} -> {r_data['dest']} created.")
        db.commit()
        print("Seeding completed successfully!")
    except Exception as e:
        print(f"An error occurred during seeding: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_db()
