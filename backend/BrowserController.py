import asyncio
from fastapi import FastAPI, Query
from starlette.middleware.cors import CORSMiddleware
import services.SponsorshipService as ss

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],  # Zezwól na wszystkie metody (GET, POST, itp.)
    allow_headers=["*"],  # Zezwól na wszystkie nagłówki
)

# Asynchroniczny endpoint dla pobrania sekund

@app.get("/extension/Generate_Sponsorship_Timestamps")
async def generate_sponsorship_timestamps(yt_url: str = Query(..., description="Url strony do analizy")):
    data = await asyncio.to_thread(ss.generate_sponsorship_timestamps, yt_url)
    return data


"""
@app.get("/extension/Generate_Sponsorship_Timestamps")
async def generate_sponsorship_timestamps(yt_url: str = Query(..., description="Url strony do analizy")):
    return [1,1]
"""

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)