from fastapi import FastAPI, Query
import services.DatasetFunctions as ds
import services.SponsorshipService as ss
import asyncio
import pandas as pd

app = FastAPI()


def update_likes_dislikes(url: str, like_change: int = 0, dislike_change: int = 0):
    """Aktualizuje liczbę like'ów i dislike'ów dla danego URL"""
    # Wczytanie danych z pliku
    with open("../Linki.txt", "r", encoding="utf-8") as file:
        lines = file.readlines()

    # Przetworzenie każdej linii
    updated_lines = []
    url_core = ds.find_url_core(url)
    found = False

    for line in lines:
        if url_core in line:
            found = True
            # Podział linii na części
            parts = line.strip().rsplit(',', 1)

            if len(parts) == 1:
                # Jeśli brakuje like/dislike, dodajemy [0,0]
                line = line.strip() + ",[0,0]\n"
                parts = line.strip().rsplit(',', 1)

            # Aktualizacja like/dislike
            likes_dislikes = eval(parts[1])
            likes_dislikes[0] += like_change
            likes_dislikes[1] += dislike_change
            updated_line = f"{parts[0]},{likes_dislikes}\n"
            updated_lines.append(updated_line)
        else:
            updated_lines.append(line)

    # Jeśli URL nie został znaleziony, dodaj nowy wpis
    if not found:
        new_line = f"https://youtube.com/watch?v={url_core},[],[0,0]\n"
        updated_lines.append(new_line)
        # Aktualizacja wartości dla nowego wpisu
        return update_likes_dislikes(url, like_change, dislike_change)

    # Zapisanie zaktualizowanych danych
    with open("../Linki.txt", "w", encoding="utf-8") as file:
        file.writelines(updated_lines)

    return [likes_dislikes[0], likes_dislikes[1]]


@app.get("/extension/like")
async def like_timestamp(yt_url: str = Query(..., description="Url strony do analizy")):
    print(f"Like DLA LINKU: {yt_url}")
    likes, dislikes = update_likes_dislikes(yt_url, like_change=1)
    return {"message": "Like dodany", "likes": likes, "dislikes": dislikes}


@app.get("/extension/dislike")
async def dislike_timestamp(yt_url: str = Query(..., description="Url strony do analizy")):
    print(f"Dislike DLA LINKU: {yt_url}")
    likes, dislikes = update_likes_dislikes(yt_url, dislike_change=1)
    return {"message": "Dislike dodany", "likes": likes, "dislikes": dislikes}


@app.get("/extension/Generate_Sponsorship_Timestamps")
async def generate_sponsorship_timestamps(yt_url: str = Query(..., description="Url strony do analizy")):
    print(f"STRZAŁ DLA LINKU: {yt_url}")
    data_frame = ds.load_transform_csv("../Linki.txt")
    processed_url = ds.find_url_core(yt_url)

    if ds.is_url_processed(processed_url, data_frame):
        # Pobierz dane z pliku
        with open("../Linki.txt", "r", encoding="utf-8") as file:
            for line in file:
                if processed_url in line:
                    parts = line.strip().rsplit(',', 1)
                    if len(parts) == 2:
                        likes_dislikes = eval(parts[1])
                    else:
                        likes_dislikes = [0, 0]
                    break

        value = data_frame.loc[data_frame.iloc[:, 0] == processed_url, data_frame.columns[1]].values
        value = value[0]
        return {"data": value, "likes_dislikes": likes_dislikes}
    else:
        data, likes = await asyncio.to_thread(ss.generate_sponsorship_timestamps, processed_url)

        time_stamps = []
        for elem in data:
            ad = (int(float(elem[0])), int(float(elem[1])))
            time_stamps.append(ad)

        url = ds.find_url_core(yt_url)
        new_line = f"https://youtube.com/watch?v={url},{time_stamps},[0,0]\n"

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