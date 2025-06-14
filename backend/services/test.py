from SponsorshipService import *
from DatasetFunctions import find_url_core
import pandas as pd
import time
done = pd.read_csv("wyniki.csv")
linki = pd.read_csv("C:/Users/damia/OneDrive/Dokumenty/GitHub/Youtube_Sponsorship_Detector/Linki.csv")
for el in linki['link']:
    if el not in list(done['urls']):
        done = pd.concat([done, pd.DataFrame([{"urls":el, "timestamps": '"'+str(generate_sponsorship_timestamps(find_url_core(el)))+'"'}])], ignore_index=True)
        done.to_csv("wyniki.csv")
    else:
        continue
    time.sleep(25)
