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


'''Idzie dwa razy w górę 
services -> backend
backend -> Youtube_Sponsorship_Detector'''
data_frame = load_transform_csv("../../Linki.txt")




def is_url_processed(url, dataframe):
    url = find_url_core(url)
    if url in dataframe.iloc[:,0].values:
        return True
    else:
        return False



####################################################################33
''' Jak to ma działać '''
# url = "https://www.youtube.com/watch?v=nE0LhKhTUQ0&ab_channel=SciShow" # przetworzony
# url = "https://youtu.be/n68z7e8YGGs" # dwie reklamy
url = "https://www.youtube.com/watch?v=cADjQkj0aIo" # nowy


if is_url_processed(url, data_frame) == True:
    url = find_url_core(url)
    value = data_frame.loc[data_frame.iloc[:, 0] == url, data_frame.columns[1]].values
    value = value[0]

    print(value)
    response_text = value # zwrócony finalny wynik jako lista krotek timestampów

else:
    # wykonujemy wszystko tak jak było tylko na końcu zapisuję do csv

    '''time_stamps = generate_sponsorship_timestamps(yt_url)'''
    '''url = yt_url'''
    time_stamps = [(11,12),(13,14)]
    url = find_url_core(url)

    new_line = f"https://youtu.be/{url},{time_stamps}"

    with open("../../Linki.txt", "a", encoding="utf-8") as file:
        file.write(new_line)



