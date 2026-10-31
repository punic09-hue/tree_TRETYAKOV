"""Дополняет data/places.js описаниями из листа 21 (кто связан, события). События оставляются,
только если все упомянутые лица есть на сайте (persons.js уже без родившихся после 1925).
Запуск: python3 tools/make_places_info.py <путь к 21._Места_и_координаты.csv>"""
import csv,json,re,sys
P=open('data/persons.js',encoding='utf-8').read();P=json.loads(P[P.index('['):P.rindex(']')+1])
names={p['name'].replace('(','').replace(')','').strip() for p in P}
idx={p['name'].replace('(','').replace(')','').strip():p['id'] for p in P}
key=lambda n:' '.join(sorted(n.replace('(','').replace(')','').replace('ё','е').split()))
kidx={key(p['name']):p['id'] for p in P}
import os
A={r['Объект'].strip():r['Кто из рода связан'].strip() for r in csv.DictReader(open(os.path.join(os.path.dirname(sys.argv[1]),'11._Адреса_и_геопозиции.csv'),encoding='utf-8-sig'),delimiter=';')}
rows={r['ID']:r for r in csv.DictReader(open(sys.argv[1],encoding='utf-8-sig'),delimiter=';')}
s=open('data/places.js',encoding='utf-8').read();pre=s[:s.index('[')];d=json.loads(s[s.index('['):s.rindex(']')+1])
for p in d:
  r=rows.get(p['id']);
  if not r: continue
  ev=[]
  for l in r['События, привязанные к месту'].split('\n'):
    l=l.strip(' •\t')
    if ' — ' not in l or ':' not in l: continue
    date,rest=l.split(' — ',1)
    if ':' not in rest: continue
    typ,who=rest.split(':',1)
    ppl=[re.split(r',|\(',x)[0].replace('(','').replace(')','').strip() for x in re.split(r'\s+и\s+',who.split(',')[0] if typ.strip()!='Брак' else who)]
    ppl=[x for x in ppl if x]
    ids=[kidx.get(key(x)) for x in ppl]
    y=re.findall(r'(1[6-9]\d\d|20\d\d)',date); early=bool(y) and max(map(int,y))<=1925
    ok=bool(ppl) and (all(ids) or early)  # событие до 1925 г. — все участники родились до 1925
    ev.append({'d':date.strip().rstrip('-').strip(),'t':typ.strip(),'w':who.strip() if ok else '','ids':[i for i in ids if i] if ok else [],'hid':(not ok) and bool(y) and not early})  # лица после 1925 г.р. — без имён
  p['events']=ev;p['about']='' if 'ПОГРЕБ' in p['cat'] else A.get(p['name'].strip(),'');  # на кладбищах в описаниях есть родившиеся после 1925
  p['coord']=r['Откуда координаты'].strip();p['geo']=r['Строка для геокодера'].strip();p['src']=r['Источник'].strip()
  who=r['Кто из рода связан'].strip();m=re.match(r'(Персон[^.]*\.)',who);p['who']=m.group(1) if m else ''
open('data/places.js','w',encoding='utf-8').write(pre+json.dumps(d,ensure_ascii=False)+';\n')
print([(p['id'],len(p['events'])) for p in d if p['lat']])
