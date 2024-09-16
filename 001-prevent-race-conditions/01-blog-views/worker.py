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
            print("Creating test blog post...")
            await Post.create(id=1, title="Example blog post", content="Hello! This is a blog post", views=0)
            print("Test blog post created")
        except Exception:
            print("Blog post already exists")

        yield


app = FastAPI(lifespan=lifespan, debug=True)


class Post(Model):
    id = fields.IntField(pk=True)
    title = fields.CharField(max_length=255)
    content = fields.TextField(max_length=4096)
    views = fields.BigIntField(default=0)

    class Meta:
        table = "posts"


@app.get("/post/{post_id}")
async def get_post(post_id: int):
    post = await Post.get(id=post_id)
    return {
        "post_id": post.id,
        "title": post.title,
        "content": post.content,
        "views": post.views,
    }


# UNSAFE!! DO NOT USE
"""
@app.post("/view/{post_id}")
async def view_post(post_id: int):
    post = await Post.get(id=post_id)
    post.views += 1
    await post.save(update_fields=["views"])
    return {"current_views": post.views}
"""

# UNSAFE!! DO NOT USE
# The lock is instantly released after the statement is executed
# because we are not using the in_transaction context manager
"""
@app.post("/view/{post_id}")
async def view_post(post_id: int):
    post = await Post.filter(id=post_id).select_for_update().get()
    post.views += 1
    await post.save(update_fields=["views"])
    return {"current_views": post.views}
"""

# Safe, but slow
"""
@app.post("/view/{post_id}")
async def view_post(post_id: int):
    async with in_transaction():
        post = await Post.filter(id=post_id).select_for_update().get()
        post.views += 1
        await post.save(update_fields=["views"])
        return {"current_views": post.views}
"""


# Safe and fast!
@app.post("/view/{post_id}")
async def view_post(post_id: int):
    await Post.filter(id=post_id).update(views=F("views") + 1)
    post = await Post.filter(id=post_id).get()
    return {"current_views": post.views}
