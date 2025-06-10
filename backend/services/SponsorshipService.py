import os
import yt_dlp
import pandas as pd
import matplotlib.pyplot as plt
import subprocess
import soundfile as sf
import time
import torch
import whisper_timestamped as whisper
# Inicjalizacja Api
from google import genai
from google.genai import types

client = genai.Client(api_key="AIzaSyDQrnZwXb0mVx0sViSweNKs_9gWsH9T-u0")

def generate_sponsorship_timestamps(yt_url):

    start = time.time()
    try:
        video_title = "video" + yt_url
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': f'../videos/{video_title}.%(ext)s',  # zmienna zastąpiona rzeczywistym rozszerzeniem pliku
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'wav'
            }],
            'noplaylist': True,
            'quiet': True,
            'no_warnings': True
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download(["youtube.com/watch?v="+yt_url])

        mp3_path = f'../videos/{video_title}.mp3'
        wav_path = f'../videos/{video_title}.wav'
        subprocess.run(['ffmpeg', '-i', mp3_path, '-ar', '16000', '-ac', '1', wav_path])
    except:
        print(f"Wystąpił błąd")
        return []

    audio = whisper.load_audio(f"../videos/{video_title}.wav")
    if torch.cuda.is_available():
        model = whisper.load_model("tiny", device="cuda")
    else:
        model = whisper.load_model("tiny", device="cpu")

    result = whisper.transcribe(model, audio, language="en")

    text = ""
    for word_row in result["segments"]:
        for row in word_row['words']:
            text += f"Time: ({row['start']}, {row['end']}) Text:({row['text']})\n"
    sys_instruct = """
        Detect sponsored content within a youtube video based on the timestamps of its english audio track. The audio track will be provided word by word in the format: [Time: (0.18, 0.56) Text:(Word1)]\n [Time: (0.18, 0.56) Text:(Word2)]\n.

        Sponsored content is defined as instances where the YouTuber shifts the topic of their video to advertise or promote a product.

        You need to identify and mark the entire timestamp range of this sponsored content. Advertisements often span multiple timestamps, so please ensure you capture the entire segment from the beginning to the end of the sponsored segment.

        Pretty please pay attention to the words associated with the ads, and take into account any kind of introduction to the ad that makes the ad fit more into the video.
       

        I beg you return only the detected sponsored content in the following format when you are 100 percent sure:
        300,325|326,350
        
        If you are not 100 percent sure that video contains sponsored content please just return
        ''
        
        examples of return format:
        300,325|327,389
        ''
        100,123
        23,67|70,120
        2,12|14,25|123,200
        ''
        2,25|51,210
        ''
        45,214|323,521|533,600
        ''
        """

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=text,
        config=types.GenerateContentConfig(
            max_output_tokens=500,
            temperature=0.1,
            system_instruction=sys_instruct
        )
    )
    print(f"Gemini zwrócił {response.text}")
    response_text = []
    if response.text != "''":
        response_text = response.text.split('|')
        response_text = [a.split(',') for a in response_text]

    try:
        for file in os.listdir("../videos"):
            if video_title in file:
                file_path = os.path.join("../videos", file)
                if os.path.isfile(file_path):
                    os.remove(file_path)
                    print(f"Usunięto plik: {file_path}")
                else:
                    print(f"{file_path} nie jest plikiem")
    except FileNotFoundError:
        print(f"Folder videos nie istnieje")
    except Exception as e:
        print(f"Błąd: {e}")

    print(f"Proces zakończony w {time.time() - start}")
    print(f"Proces zwrócił: {response_text}")
    return response_text