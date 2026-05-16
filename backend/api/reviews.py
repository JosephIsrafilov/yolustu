from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from core.database import get_db
from api.deps import get_current_user
from models.models import Review, User, Ride, Booking
from schemas.schemas import ReviewCreate, ReviewResponse

router = APIRouter()

@router.post("/", response_model=ReviewResponse)
def create_review(review_in: ReviewCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ride = db.query(Ride).filter(Ride.id == review_in.ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    is_driver = ride.driver_id == current_user.id
    is_passenger = db.query(Booking).filter(
        Booking.ride_id == ride.id, 
        Booking.passenger_id == current_user.id,
        Booking.status == "accepted"
    ).first() is not None
    
    if not (is_driver or is_passenger):
        raise HTTPException(status_code=403, detail="Only participants can leave reviews")
    
    target_is_driver = ride.driver_id == review_in.target_id
    target_is_passenger = db.query(Booking).filter(
        Booking.ride_id == ride.id, 
        Booking.passenger_id == review_in.target_id,
        Booking.status == "accepted"
    ).first() is not None
    
    if not (target_is_driver or target_is_passenger):
        raise HTTPException(status_code=400, detail="Target user was not part of this ride")
    
    if current_user.id == review_in.target_id:
        raise HTTPException(status_code=400, detail="You cannot review yourself")
    
    new_review = Review(
        author_id=current_user.id,
        target_id=review_in.target_id,
        ride_id=review_in.ride_id,
        rating=review_in.rating,
        comment=review_in.comment
    )
    db.add(new_review)
    
    
    target_user = db.query(User).filter(User.id == review_in.target_id).first()
    all_reviews = db.query(Review).filter(Review.target_id == review_in.target_id).all()
    total_rating = sum([r.rating for r in all_reviews]) + review_in.rating
    target_user.rating = total_rating / (len(all_reviews) + 1)
    
    db.commit()
    db.refresh(new_review)
    return new_review

@router.get("/user/{user_id}", response_model=List[ReviewResponse])
def get_user_reviews(user_id: UUID, db: Session = Depends(get_db)):
    return db.query(Review).filter(Review.target_id == user_id).all()
