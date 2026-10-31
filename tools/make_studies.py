"""Собирает data/studies.js из csv-листов исследования. Запуск: python3 tools/make_studies.py <папка csv>"""
import csv, json, sys, glob, os
SHEETS=[('origin','25.','🧭','Происхождение рода'),('audit','12.','⚠️','Расхождения'),('plan','9.','📝','Задачи поиска'),
 ('circle','8.','🤝','Круг рода'),('city','15.','🏙️','Третьяковы в городе'),('outside','18.','🔗','Линии вне древа'),
 ('history','20.','📜','Историческая справка'),('maps','22.','🖼️','Карты и фото')]
d=sys.argv[1]; out={}
for k,pre,ico,t in SHEETS:
    f=glob.glob(os.path.join(d,pre+'_*.csv'))[0]
    rows=list(csv.reader(open(f,encoding='utf-8-sig'),delimiter=';'))
    rows=[r for r in rows if any(c.strip() for c in r)]
    out[k]={'ico':ico,'title':t,'cols':rows[0],'rows':rows[1:]}
open('data/studies.js','w',encoding='utf-8').write('/* Разделы исследования (из листов xlsx). Ведёт Claude. */\nwindow.TREE_STUDIES='+json.dumps(out,ensure_ascii=False)+';\n')
print({k:len(v['rows']) for k,v in out.items()})
