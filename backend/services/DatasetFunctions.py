import pandas as pd
import ast

def find_url_core(url):
    if url[:11] == "https://www": # długi link
        core = url.replace("https://www.youtube.com/watch?v=", "")[:11]
    elif url[:11] == "https://you":
        core = url.replace("https://youtu.be/", "")[:11]
    else:
        return "does not recognize url"

    return core

def split_first_comma(line):
    parts = line.split(',', 1)  # Podział tylko na 2 części
    return parts

def convert_str_to_lst(string):
    try:
        tuple_list = ast.literal_eval(string)   # konwersja na listę krotek
        if isinstance(tuple_list, list) and all(isinstance(i, tuple) for i in tuple_list): # sprawdzenie czy to lista krotek
            return tuple_list
        else:
            print("Dane nie są listą krotek.")
    except (SyntaxError, ValueError):
        print("Błędny format stringa.")


def load_transform_csv(csv_path):
    with open(csv_path, 'r', encoding='utf-8') as file:
        rows = []
        lines = file.readlines()[1:]  # pomiń nagłówek jeśli istnieje
        for line in lines:
            line = line.strip()
            if not line:  # pomiń puste linie
                continue

            # Podziel linię na części
            parts = line.split(',', 2)  # dzielimy na max 3 części

            # Wyciągnij core URL
            url_core = find_url_core(parts[0])

            # Parsuj timestamps
            timestamps = []
            if len(parts) > 1:
                try:
                    timestamps = ast.literal_eval(parts[1]) if parts[1].strip() else []
                except:
                    timestamps = []

            # Parsuj like/dislike (domyślnie [0,0])
            likes_dislikes = [0, 0]
            if len(parts) > 2:
                try:
                    likes_dislikes = ast.literal_eval(parts[2]) if parts[2].strip() else [0, 0]
                except:
                    likes_dislikes = [0, 0]

            rows.append([url_core, timestamps, likes_dislikes])

    return pd.DataFrame(rows, columns=["link", "timestamps", "likes_dislikes"])

def is_url_processed(url, dataframe):
    if url in dataframe.iloc[:,0].values:
        return True
    else:
        return False