from fastapi import APIRouter, Body, Depends, status

from models.organization import Organization, InviteLink
from models.user import User
from models.service import PyObjectId
from dependencies.auth import validate_token
from dependencies.queries import find_by_id
from exceptions import Forbidden, NotFound

router = APIRouter(prefix='/organization', tags=['Organizations'])


@router.post('/create', response_model=Organization, response_model_include={'id', 'name'}, status_code=status.HTTP_201_CREATED)
async def create_organization(name: str = Body(embed=True), user: User = Depends(validate_token)):
    organization = await Organization(name=name, owner=user.id).create()
    return await find_by_id(Organization, PyObjectId(organization))


@router.delete('/{organization}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_organization(organization: PyObjectId, user: User = Depends(validate_token)):
    organization = await find_by_id(Organization, organization)

    if organization.owner != user.id:
        raise Forbidden

    await organization.delete()


@router.put('/{organization}/organizer', status_code=status.HTTP_204_NO_CONTENT)
async def add_organizer(organization: PyObjectId, new_organizer: str = Body(embed=True, alias='username'),
                        user: User = Depends(validate_token)):
    organization = await find_by_id(Organization, organization)
    if not organization.owner == user.id:
        raise Forbidden

    organizer = await User.find_one({'username': new_organizer})
    if not organizer:
        raise NotFound

    await organization.add_organizer(organizer)


@router.get('/ownership', response_model=list[Organization], response_model_exclude={'owner', 'organizers'})
async def my_organizations(user: User = Depends(validate_token)):
    return await Organization.find({'$or': [
        {'owner': user.id},
        {'organizers': user.id}
    ]})


@router.post('/{organization}/link', response_model=InviteLink, status_code=status.HTTP_201_CREATED)
async def create_invite(organization: str, max_joins=1, user: User = Depends(validate_token)):
    organization = await Organization.find_one({'name': organization,
                                                '$or': [{'owner': user.id}, {'organizers': user.id}]
                                                })
    if not organization:
        raise NotFound

    return await organization.create_invite_link(max_joins)


@router.delete('/{organization}/link/{link}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_invite(organization: PyObjectId, link: str, user: User = Depends(validate_token)):
    organization = await find_by_id(Organization, organization)

    if user.id != organization.owner and user.id not in organization.organizers:
        raise Forbidden

    link = await InviteLink.find_one({'_id': PyObjectId(link), 'organization': organization.id})
    if not link:
        raise NotFound

    await link.delete()


@router.get('/join/{link}', status_code=status.HTTP_204_NO_CONTENT)
async def join_organization_by_link(link: PyObjectId, user: User = Depends(validate_token)):
    invites = await find_by_id(InviteLink, link)
    await invites.join(user)

