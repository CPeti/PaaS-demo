from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# Import all ORM models here so that Base.metadata.create_all picks them up
# and Alembic can detect them for migrations.
from app.models import user_orm, photo_orm  # noqa: F401, E402
