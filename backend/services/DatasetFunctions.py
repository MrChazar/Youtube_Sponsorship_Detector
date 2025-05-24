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
        lines = file.readlines()[1:]         # nagłówki
        for line in lines:
            row = split_first_comma(line.strip())
            row[0] = find_url_core(row[0])
            row[1] = convert_str_to_lst(row[1])
            rows.append(row)

    df = pd.DataFrame(rows, columns=["link", "timestamps"])
    return df

def is_url_processed(url, dataframe):
    if url in dataframe.iloc[:,0].values:
        return True
    else:
        return False