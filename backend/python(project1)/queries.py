from typing import TypeVar

from exceptions import NotFound
from models.service import PyObjectId

_T = TypeVar("_T")


async def find_by_id(obj: _T, object_id: PyObjectId, raise_not_found=True) -> _T | None:
    find_object = await obj.find_one({'_id': object_id})
    if not find_object and raise_not_found:
        raise NotFound

    return find_object
