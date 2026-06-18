from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
import uuid


async def get_or_404(db: AsyncSession, model, record_id: uuid.UUID, detail: str = "Not found"):
    result = await db.execute(select(model).where(model.id == record_id))
    instance = result.scalar_one_or_none()
    if not instance:
        raise HTTPException(status_code=404, detail=detail)
    return instance


def apply_updates(instance, data):
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(instance, k, v)


async def create_and_refresh(db: AsyncSession, instance):
    db.add(instance)
    await db.commit()
    await db.refresh(instance)
    return instance
