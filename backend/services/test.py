from SponsorshipService import *
urls = [
'https://www.youtube.com/watch?v=rmx3FBPzDuk',
'https://www.youtube.com/watch?v=rgMB-RiIz0Q',
'https://www.youtube.com/watch?v=1OxBv9Q7Uxo',
'https://www.youtube.com/watch?v=nO2KCkQdhjc',
'https://www.youtube.com/watch?v=YOrRQtA8BsY',
'https://youtu.be/q-QPuhtgrAo',
'https://www.youtube.com/watch?v=ES1KMDHEUFM',
'https://www.youtube.com/watch?v=PY9UFX1ikAE',
'https://youtu.be/J2JCig4u-qE',
'https://youtu.be/luyg3plGujg',
'https://youtu.be/8vXfcO1xZyM',
'https://youtu.be/WolmBrbo9-U',
'https://youtu.be/CW4BEqDS_wM',
'https://youtu.be/n84A3ykGya0',
'https://youtu.be/4wWAlaSeDOs',
'https://youtu.be/vjDYfvPW4mA',
'https://youtu.be/RTK9x1T4kmg',
'https://youtu.be/Wb8CPlfyAQ0',
'https://www.youtube.com/watch?v=nE0LhKhTUQ0',
'https://youtu.be/n68z7e8YGGs',
'https://youtu.be/FNF_L-ONgt',
'https://youtu.be/Q0Mec-QKx9o',
]

for url in urls:
    try:
        with open('results.txt', 'a') as file:
            res = generate_sponsorship_timestamps(url)
            print(res)
            line = ""
            for el in res:
                line+=str(el[0])+ ' : '+str(el[1]) + ' '
            file.write(line+'\n')
    except Exception as e:
        print("error", e)