from fastapi import FastAPI


app = FastAPI(title="AI Study Assistant")


@app.get("/")
async def read_root():
    return {"message": "AI Study Assistant API is running"}
