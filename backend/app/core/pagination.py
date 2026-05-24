from typing import Generic, TypeVar, List
from pydantic import BaseModel
import math

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int
    pages: int


def create_paginated_response(
    items: List[T], total: int, page: int, size: int
) -> PaginatedResponse[T]:
    pages = math.ceil(total / size) if size > 0 else 0
    return PaginatedResponse(
        items=items, total=total, page=page, size=size, pages=pages
    )
