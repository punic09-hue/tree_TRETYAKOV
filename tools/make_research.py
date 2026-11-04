# -*- coding: utf-8 -*-
"""Обновляет data/research.csv/js: место погребения и «что известно» из базы (csv 2) и таблицы «Все Третьяковы».
Запуск: python3 tools/make_research.py <папка csv базы> <Третьяковы_все_найденные.xlsx>  (из корня сайта)."""
import csv,glob,os,sys,json,re
from openpyxl import load_workbook
CSV,XL=sys.argv[1],sys.argv[2]
P={r['ID']:r for r in csv.DictReader(open(glob.glob(os.path.join(CSV,'2._*.csv'))[0],encoding='utf-8-sig'),delimiter=';')}
num={r['id']:r['num'] for r in csv.DictReader(open('data/persons.csv',encoding='utf-8-sig'),delimiter=';')}
know={}
for r in load_workbook(XL,read_only=True).worksheets[0].iter_rows(min_row=2,values_only=True):
    if r[1] and r[0] and r[0].startswith('в древе'): know[r[1]]=r[16] or ''
rows=list(csv.DictReader(open('data/research.csv',encoding='utf-8-sig'),delimiter=';')); H=list(rows[0].keys())
byn={r['num']:r for r in rows}; ch=0
for t,p in P.items():
    n=num.get(t)
    if not n or n not in byn: continue
    y=re.findall(r'\d{4}',p['Родился'] or '')
    if y and int(y[0])>1925: continue
    r=byn[n]; nb=p['Место погребения'] or ''; nn=(know.get(t) or p['Примечание'] or '')
    if r['burial']!=nb or r['note']!=nn: r['burial']=nb; r['note']=nn; ch+=1
w=csv.DictWriter(open('data/research.csv','w',encoding='utf-8-sig',newline=''),fieldnames=H,delimiter=';'); w.writeheader(); w.writerows(rows)
J={}
old=open('data/research.js',encoding='utf-8').read()
d=json.loads(old.split('window.TREE_RESEARCH=',1)[1].rstrip().rstrip(';'))
for n,v in d.items():
    if n in byn: v['burial']=byn[n]['burial']; v['note']=byn[n]['note']
open('data/research.js','w',encoding='utf-8').write(old.split('window.TREE_RESEARCH=',1)[0]+'window.TREE_RESEARCH='+json.dumps(d,ensure_ascii=False)+';\n')
print('изменено',ch)
