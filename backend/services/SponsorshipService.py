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
        video_title = "video" + str(yt_url.replace("https://www.youtube.com/watch?v=", ""))
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': f'{video_title}',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '64',
            }],
            'noplaylist': True,
            'overwrites': True
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(yt_url, download=False)
            ydl.download([yt_url])

        mp3_path = f'{video_title}.mp3'
        wav_path = f'{video_title}.wav'
        subprocess.run(['ffmpeg', '-i', mp3_path, '-ar', '16000', '-ac', '1', wav_path])
    except:
        print(f"Wystąpił błąd")
        return []

    audio = whisper.load_audio(f"{video_title}.wav")
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
        Your task is to detect sponsored content within a youtube video based on the timestamps of its English audio track. The audio track will be provided word by word in the format: [Time: (0.18, 0.56) Text:(Word1)]\n [Time: (0.18, 0.56) Text:(Word2)]\n.

        Sponsored content is defined as instances where the YouTuber shifts the topic of their video to advertise or promote a product.

        You need to identify and mark the entire timestamp range of this sponsored content. Advertisements often span multiple timestamps, so please ensure you capture the entire segment from the beginning to the end of the sponsored segment.

        Pay attention to keywords and phrases such as:
        sponsoring, sponsor, sponsor of our video, our code, and similar indications of sponsorship.

        Only return the detected sponsored content in the following format:
        300,325|452,321
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

    response_text = response.text.split('|')
    response_text = [a.split(',') for a in response_text]

    try:
        os.remove(f"{video_title}.mp3")
        os.remove(f"{video_title}.wav")
    except:
        print("wystąpił błąd")

    print(f"Proces zakończony w {time.time() - start}")
    print(f"Proces zwrócił: {response_text}")
    return response_text