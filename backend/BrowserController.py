import asyncio
from fastapi import FastAPI, Query
from starlette.middleware.cors import CORSMiddleware
import services.SponsorshipService as ss
import services.DatasetFunctions as ds

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
    print(f"STRZAŁ DLA LINKU: {yt_url}")
    data_frame = ds.load_transform_csv("../Linki.txt")
    processed_url = ds.find_url_core(yt_url)
    if ds.is_url_processed(processed_url, data_frame) == True:     #link został przetworzony
        value = data_frame.loc[data_frame.iloc[:, 0] == processed_url, data_frame.columns[1]].values
        value = value[0]

        data = value
        return data

    else:
        data = await asyncio.to_thread(ss.generate_sponsorship_timestamps, processed_url)

        time_stamps = []
        for elem in data:
            ad = (int(float(elem[0])), int(float(elem[1])))
            time_stamps.append(ad)

        url = ds.find_url_core(yt_url)

        new_line = f"https://youtube.com/watch?v={url},{time_stamps}\n"

        with open("../Linki.txt", "a", encoding="utf-8") as file:
            file.write(new_line)


        return data

# Ten sam endpoint do sztywnego testowania dodatku
"""
@app.get("/extension/Generate_Sponsorship_Timestamps")
async def generate_sponsorship_timestamps(yt_url: str = Query(..., description="Url strony do analizy")):
    return [[300, 500]]
"""



if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)