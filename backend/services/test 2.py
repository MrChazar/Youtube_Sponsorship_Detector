import pandas as pd
import seaborn as sns
import numpy as np
import matplotlib.pyplot as plt

def med(lst):
    n = len(lst)
    if n%2==0:
        return sum(lst[int(n/2)-1:int(n/2)+1])/2
    return lst[n//2]

def przedzialy_model(ts):
    bufor = ts[2:-2].replace('"',"")
    if bufor.count('[') > 0:
        res = []
        for i in range(bufor.count('[')):
            res.append(bufor[bufor.index('[')+1:bufor.index(']')-1].replace("'", "").split(','))
            try:
                res[-1] = [float(res[-1][0]),float(res[-1][1])]
            except:
                return [-1]
                
            bufor = bufor[bufor.index(']')+3:]
        if len(res) == 1:
            res = res[0]
    else:
        res = ""
    return(res)

def przedzialy_real(ts):
    bufor = ts.replace(" ", "")
    if bufor.count('(')>0:
        res = []
        for i in range(bufor.count('(')):
            res.append(bufor[bufor.index('(')+1:bufor.index(')')].split(','))
            res[-1] = [float(res[-1][0]), float(res[-1][1])]
            bufor = bufor[bufor.index(')')+1:]
        if len(res) == 1:
            res = res[0]
    else:
        res = ""
    return res

def licz_jakosc_max(dat):
    rp = dat[el]['real'][0]
    rk = dat[el]['real'][1]
    mp = dat[el]['model'][0][0]
    mk = dat[el]['model'][-1][1]
    return (max(0,(min(rk, mk)-max(rp, mp))) - min(0, mp-rp) - min(0, mk-rk))/(rk-rp)
    

def licz_jakosc(dat):
    b = []
    if type(dat[el]['real'][0]) != list:
        rp = dat[el]['real'][0]
        rk = dat[el]['real'][1]
        mp = dat[el]['model'][0]
        mk = dat[el]['model'][1]
        return (max(0,(min(rk, mk)-max(rp, mp))) - min(0, mp-rp) - min(0, mk-rk))/(rk-rp)
    else:
        sum = 0
        num = 0
        for i in range(len(dat[el]['real'])):
            rp = dat[el]['real'][i][0]
            rk = dat[el]['real'][i][1]
            mp = dat[el]['model'][i][0]
            mk = dat[el]['model'][i][1]
            sum += (max(0,(min(rk, mk)-max(rp, mp))) - min(0, mp-rp) - min(0, mk-rk))/(rk-rp)
            num +=1
        return sum/num

linki = pd.read_csv("C:/Users/damia/OneDrive/Dokumenty/GitHub/Youtube_Sponsorship_Detector/Linki.csv")
w = pd.read_csv("wyniki.csv").to_dict()

comp = {}
for el in w['urls'].keys():
    comp[w['urls'][el]] = {}

for el in linki['link'].keys():
    comp[str(linki['link'][el])]['real']=(przedzialy_real(linki[' timestamps'][el]))

for el in w['urls'].keys():
    comp[w['urls'][el]]['model']=(przedzialy_model(w['timestamps'][el]))

TP = 0
FP = 0
TN = 0
FN = 0
c = 0
e = 0
b = 0
acc = []
acc2 = []
for el in comp:
    if comp[el]['model']:
        l_m = len(comp[el]['model'])
        if type(comp[el]['model'][0]) != list:
            l_m = 1
    else:
        l_m = 0
    if comp[el]['real']:
        l_r = len(comp[el]['real'])
        if type(comp[el]['real'][0]) != list:
            l_r = 1
    else:
        l_r = 0
    if comp[el]['model'] != [-1]:
        if l_r == 0 and l_m == 0:
            TN +=1
        elif l_r > 0 and l_m > 0:
            TP +=1
        elif l_r > 0 and l_m == 0:
            FN +=1
        elif l_r == 0 and l_m > 0:
            FP +=1
        if l_r == l_m:
            c +=1
        if l_r > 0 and l_m > 0 and l_r==l_m:
            acc.append(licz_jakosc(comp))
            
        if l_r == 1 and l_m > 1:
            acc2.append(licz_jakosc_max(comp))
    else:
        e +=1
print(sum(acc)/(len(acc)))
print(sum(acc2)/len(acc2))
print("TN", TN)
print("TP", TP)
print("FN", FN)
print("FP", FP)
print(c/len(comp))
print(e)
cm = np.array([[TN, FP],[FN, TP]])
sns.heatmap(cm, annot=True)
plt.show()