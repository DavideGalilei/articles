from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from tortoise import fields
from tortoise.contrib.fastapi import RegisterTortoise
from tortoise.expressions import F
from tortoise.models import Model

# Want to see the SQL queries that are being executed?
# import logging
# logging.basicConfig(level=logging.DEBUG)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    async with RegisterTortoise(
        app,
        db_url="postgres://postgres:password@database:5432/race_condition_test",
        modules={"models": ["worker"]},
        generate_schemas=True,
    ):
        try:
            print("Creating test user...")
            await Player.create(id=1, name="Alice", money=1000, level=1)
            print("Test user created")
        except Exception:
            print("User already exists")

        yield


app = FastAPI(
    lifespan=lifespan,
    debug=True,
)


class Player(Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=255)
    money = fields.IntField(default=0)
    level = fields.IntField(default=1)

    class Meta:
        table = "players"


@app.get("/player/{player_id}")
async def get_info(player_id: int):
    player = await Player.get(id=player_id)
    return {"name": player.name, "money": player.money, "level": player.level}


# But what if we instead the user had to use his money to buy something?
# We would need to check if the user has enough money before we can proceed
# we would never want to have a negative balance


COST = 150


# Slow, but safe
"""
@app.post("/upgrade/{player_id}")
async def upgrade_level(player_id: int):
    # Slow, but safe
    # row level locking
    async with in_transaction() as conn:
        player = await Player.filter(id=player_id).select_for_update().get()

        if player.money < COST:
            return {"error": "Not enough money"}

        await Player.filter(id=player.id).update(
            level=F("level") + 1,
            money=F("money") - COST,
        )
        await player.refresh_from_db()

        return {"user_id": player.id, "money": player.money, "level": player.level}
"""


# Fast and safe
@app.post("/upgrade/{player_id}")
async def upgrade_level(player_id: int):
    # Fast and safe

    rows_updated = await Player.filter(
        id=player_id,
        money_gte=COST,
    ).update(
        level=F("level") + 1,
        money=F("money") - COST,
    )

    if rows_updated == 0:
        return {"error": "Not enough money"}

    player = await Player.get(id=player_id)

    return {"user_id": player.id, "money": player.money, "level": player.level}
