from app.domains.models import User, Vehicle, Ride, Booking, Review, Message
from app.core.database import SessionLocal
import sys
import os
import uuid
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def seed_db():
    db = SessionLocal()
    try:
        print("Starting seeding process...")

        mock_users = [
            {
                "id": "u1",
                "phone": "+994501234567",
                "first_name": "Elvin",
                "last_name": "Məmmədov",
                "role": "driver",
                "rating": 4.8,
                "avatar_url": "https://i.pravatar.cc/150?u=Elvin",
            },
            {
                "id": "u2",
                "phone": "+994552345678",
                "first_name": "Aysel",
                "last_name": "Əliyeva",
                "role": "passenger",
                "rating": 4.6,
                "avatar_url": "https://i.pravatar.cc/150?u=Aysel",
            },
            {
                "id": "u3",
                "phone": "+994703456789",
                "first_name": "Murad",
                "last_name": "Həsənov",
                "role": "driver",
                "rating": 4.9,
                "avatar_url": "https://i.pravatar.cc/150?u=Murad",
            },
            {
                "id": "u4",
                "phone": "+994514567890",
                "first_name": "Nigar",
                "last_name": "Rzayeva",
                "role": "passenger",
                "rating": 4.3,
                "avatar_url": "https://i.pravatar.cc/150?u=Nigar",
            },
            {
                "id": "u5",
                "phone": "+994775678901",
                "first_name": "Kamran",
                "last_name": "Quliyev",
                "role": "driver",
                "rating": 4.5,
                "avatar_url": "https://i.pravatar.cc/150?u=Kamran",
            },
            {
                "id": "u8",
                "phone": "+994708901234",
                "first_name": "Sanan",
                "last_name": "Aliyev",
                "role": "admin",
                "rating": 0.0,
                "avatar_url": "https://i.pravatar.cc/150?u=Sanan",
            },
        ]

        default_password_hash = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjIQqiRQYq"  # hardcoded 'password123' to bypass passlib bug
        user_map = {}
        for u_data in mock_users:
            user = db.query(User).filter(User.phone == u_data["phone"]).first()
            if not user:
                user = User(
                    id=uuid.uuid4(),
                    phone=u_data["phone"],
                    first_name=u_data["first_name"],
                    last_name=u_data["last_name"],
                    hashed_password=default_password_hash,
                    is_verified=True,
                    role=u_data["role"],
                    rating=u_data["rating"],
                    avatar_url=u_data.get("avatar_url"),
                )
                db.add(user)
                db.flush()
                print(f"User {u_data['phone']} created.")
            else:
                user.first_name = u_data["first_name"]  # type: ignore
                user.last_name = u_data["last_name"]  # type: ignore
                user.hashed_password = default_password_hash  # type: ignore
                user.is_verified = True  # type: ignore
                user.role = u_data["role"]  # type: ignore
                user.rating = u_data["rating"]  # type: ignore
                user.avatar_url = u_data.get("avatar_url")  # type: ignore
                print(f"User {u_data['phone']} updated.")
            user_map[u_data["id"]] = user

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
            else:
                vehicle.user_id = owner.id
                vehicle.brand = v_data["brand"]  # type: ignore
                vehicle.model = v_data["model"]  # type: ignore
                vehicle.year = v_data["year"]  # type: ignore
                vehicle.color = v_data["color"]  # type: ignore
                print(f"Vehicle {v_data['plate_number']} updated.")
            vehicle_map[v_data["id"]] = vehicle

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

            departure = datetime.now() + timedelta(days=2)
            ride = (
                db.query(Ride)
                .filter(
                    Ride.driver_id == driver.id,
                    Ride.vehicle_id == vehicle.id,
                    Ride.origin_city == r_data["origin"],
                    Ride.destination_city == r_data["dest"],
                    Ride.status == "active",
                )
                .first()
            )
            if not ride:
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
            else:
                ride.origin_location = r_data["origin_coords"]  # type: ignore
                ride.destination_location = r_data["dest_coords"]  # type: ignore
                ride.departure_time = departure  # type: ignore
                ride.total_seats = r_data["seats"]  # type: ignore
                ride.available_seats = max(  # type: ignore
                    0,
                    min(ride.available_seats, r_data["seats"]),  # type: ignore
                )
                ride.price_per_seat = r_data["price"]  # type: ignore
                print(f"Ride {r_data['origin']} -> {r_data['dest']} updated.")

        # Seed Booking, Review, and Gamification for Ride 1 (t1)
        driver_u1 = user_map["u1"]
        passenger_u2 = user_map["u2"]
        ride_t1 = db.query(Ride).filter(Ride.driver_id == driver_u1.id).first()

        if ride_t1:
            booking = (
                db.query(Booking)
                .filter(
                    Booking.ride_id == ride_t1.id,
                    Booking.passenger_id == passenger_u2.id,
                )
                .first()
            )
            if not booking:
                booking = Booking(
                    id=uuid.uuid4(),
                    ride_id=ride_t1.id,
                    passenger_id=passenger_u2.id,
                    seats_booked=1,
                    total_price=ride_t1.price_per_seat,
                    status="completed",
                )
                db.add(booking)
                print("Seeded Booking for Ride t1")

            review = (
                db.query(Review)
                .filter(
                    Review.target_id == driver_u1.id,
                    Review.author_id == passenger_u2.id,
                )
                .first()
            )
            if not review:
                review = Review(
                    id=uuid.uuid4(),
                    target_id=driver_u1.id,
                    author_id=passenger_u2.id,
                    ride_id=ride_t1.id,
                    rating=5,
                    comment="Əla gediş idi, təşəkkürlər!",
                )
                db.add(review)
                print("Seeded Review for Ride t1")

            msg = db.query(Message).filter(Message.ride_id == ride_t1.id).first()
            if not msg:
                msg = Message(
                    id=uuid.uuid4(),
                    sender_id=passenger_u2.id,
                    ride_id=ride_t1.id,
                    content="Salam, mən Qara Qarayev metrosunun yanındayam.",
                )
                db.add(msg)
                print("Seeded Message for Ride t1")

        db.commit()

        try:
            from app.domains.gamification.services import check_and_award_badge

            check_and_award_badge(db, driver_u1.id, "first_ride")  # type: ignore
            check_and_award_badge(db, driver_u1.id, "5_star")  # type: ignore
            check_and_award_badge(db, passenger_u2.id, "chatterbox")  # type: ignore
        except Exception as ex:
            print("Gamification seed skipped/error:", ex)

        print("Seeding completed successfully!")
    except Exception as e:
        print(f"An error occurred during seeding: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_db()
