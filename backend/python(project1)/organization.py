import shutil

from bson import ObjectId
from pydantic import BaseModel, Field

from exceptions import CustomHTTPException
from models.service import MongoMixin, PyObjectId, db_organizations, db_invite_links, db_polls
from models.user import User


class Organization(BaseModel, MongoMixin):
    id: PyObjectId | None = Field(alias='_id')
    name: str = Field(max_length=25)
    owner: PyObjectId
    members: list[PyObjectId] = []
    organizers: list[PyObjectId] = []

    class Config:
        arbitrary_types_allowed = True
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}

    async def create(self) -> str:
        self.members.append(self.owner)
        if await Organization.find({'name': self.name}):
            raise CustomHTTPException(400, 'Organization already exists')

        organization = await db_organizations.insert_one(self.dict(exclude={'id'}))
        return str(organization.inserted_id)

    async def add_organizer(self, user: User):
        if user.id not in self.members:
            raise CustomHTTPException(400, 'User is not member yet')

        if user.id in self.organizers:
            raise CustomHTTPException(400, 'User is already organizer')

        if user.id == self.owner:
            raise CustomHTTPException(400, 'User is owner')

        results = await db_organizations.update_one(
            {'_id': self.id},
            {'$push': {'organizers': user.id}
             })
        return results.upserted_id

    async def add_member(self, user: User) -> list:
        if user.id in self.members:
            raise CustomHTTPException(400, 'Already in the organization')

        results = await db_organizations.update_one(
            {'_id': self.id},
            {'$push': {'members': user.id}
             })
        return results.upserted_id

    async def create_invite_link(self, max_joins=1) -> "InviteLink":
        link = await InviteLink(
            organization=self.id,
            max_available_joins=max_joins
        ).create()
        inserted_link = await InviteLink.find_one({'_id': link.inserted_id})
        return inserted_link

    async def delete(self):
        await db_organizations.delete_one({'_id': self.id})


class InviteLink(BaseModel, MongoMixin):
    id: PyObjectId | None = Field(default_factory=PyObjectId, alias='_id')
    organization: PyObjectId
    current_joins: int = 0
    max_available_joins: int = 1

    class Config:
        arbitrary_types_allowed = True
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}

    async def create(self):
        return await db_invite_links.insert_one(self.dict(exclude={'id'}))

    async def join(self, user: User):
        organization = (await Organization.find_one({'_id': self.organization}))

        await organization.add_member(user)
        self.current_joins += 1

        if not self.is_active:
            await self.delete()

        else:
            await db_invite_links.update_one({'_id': self.id}, {
                '$inc': {'current_joins': 1}
            })

    async def delete(self):
        await db_invite_links.delete_one({'_id': self.id})

    @property
    def is_active(self) -> bool:
        if self.max_available_joins <= 0:
            return True

        return self.current_joins < self.max_available_joins
