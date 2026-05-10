from fastapi import FastAPI, Request
# from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from snippets import posts

app = FastAPI()

templates = Jinja2Templates(directory="templates")

# @app.get("/",response_class=HTMLResponse,include_in_schema=False)
# @app.get("/posts", response_class=HTMLResponse,include_in_schema=False)
@app.get("/", include_in_schema=False)
@app.get("/posts", include_in_schema=False)
def home(request: Request):
    return templates.TemplateResponse(request,"home.html",{"posts": posts, "title": "Home"})

@app.get("/api/posts")

def get_posts():
    return f"<h1>{posts[0]['title']}</h1>"