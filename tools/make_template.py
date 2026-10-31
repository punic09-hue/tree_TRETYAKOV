"""Собирает шаблон сайта для другого рода: код и оформление как у этого сайта, данные — демонстрационные.
Запуск из корня репозитория: python3 tools/make_template.py <папка_для_архива>
Результат: Шаблон_сайта_родословия_ГГГГ-ММ-ДД_ЧЧ-ММ.zip (имена в UTF-8)."""
import json,os,sys,zipfile,datetime
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));OUT=sys.argv[1] if len(sys.argv)>1 else '.'
J=lambda v:json.dumps(v,ensure_ascii=False,indent=1)
def P(i,num,name,sex,gen,b,d,father='',mother='',spouses=(),pri=False,places=()):
    return dict(id=i,pri=pri,name=name,sex=sex,gen=gen,branch='Родоначальная семья',b=b,d=d,father=father,mother=mother,fam='',spouses=list(spouses),
      parish='',burial='',estate='',quality='',note='',src='Пример',verbatim='',ev=[],num=num,bplace='',dplace='',hiddenKids=0,places=list(places))
persons=[P('T001','1','Иванов Пётр Сидорович','М','I','1800','1860',spouses=['T002'],pri=True,places=['A01']),
         P('T002','2','(Иванова) Мария Ивановна','Ж','I','1805','1870',spouses=['T001']),
         P('T003','3','Иванов Иван Петрович','М','II','1830','1890',father='T001',mother='T002',pri=True,places=['A01'])]
persons[2]['ev']=[{'kind':'рождение','date':'01.01.1830','res':'✔ документ найден','fam':'Иванов Пётр Сидорович и Мария Ивановна','code':'Архив ф.1 оп.1 д.1 л.1','no':'1','note':''}]
families=[dict(id='F01',gen='I',branch='Родоначальная семья',h='T001',w='T002',date='1825',note='')]
sources=[dict(n='1',res='ПОЛОЖИТЕЛЬНЫЙ',type='Метрическая книга',ref='Архив ф.1 оп.1 д.1',yr='1830',what='Ивановы, село N',got='рождение: Иванов Иван Петрович',where='',date='01.01.2026')]
research={'3':dict(pri=True,branch='Родоначальная семья',gen='II',parish='',burial='',estate='',quality='',note='Пример исследовательской заметки',src='Архив ф.1',verbatim='')}
places=[dict(id='A01',name='Церковь села N',addr='село N',lat='55.75',lon='37.62',url='',exact=True,cat='ЯДРО РОДА',period='XIX в.',
   events=[dict(d='01.01.1830',t='Рождение',w='Иванов Иван Петрович',ids=['T003'],hid=False)],coord='Пример',src='',geo='',about='Приход рода',who='')]
studies={'origin':dict(ico='🧭',title='Происхождение рода',cols=['Версия','Суть','За','Против'],rows=[['А','Пример версии','…','…']]),
         'maps':dict(ico='🖼️',title='Карты и фото',cols=['Результат','Тип','Объект','Что это','Датировка','Ссылка'],rows=[['+','Карта','Село N','Пример','1900','https://pastvu.com/']])}
config=dict(title='Род ИВАНОВЫХ',subtitle='Место — город',contact=dict(name='Имя',email='mail@example.com'),short='Ивановы',pageTitle='Родословие Ивановых',
   kicker='Родословие · Место · Город',heading='Род Ивановых',heroArt='dam',levels=dict(viz='Село / завод',ekb='Город',ru='Россия',world='Мир'),
   mapCenter=[55.75,37.62],mapZoom=11,updated='ДД.ММ.ГГГГ',cutoff=1925,rootNum='1',focusNum='3')
data={'config.js':'/* Настройки сайта. Всё, что относится к конкретному роду, задаётся здесь (номера персон — из GEDKeeper). */\nwindow.TREE_CONFIG='+J(config)+';\n',
 'persons.js':'window.TREE_PERSONS='+J(persons)+';\n','families.js':'window.TREE_FAMILIES='+J(families)+';\n',
 'sources.js':'window.TREE_SOURCES='+J(sources)+';\n','research.js':'window.TREE_RESEARCH='+J(research)+';\n',
 'places.js':'window.TREE_PLACES='+J(places)+';\n','studies.js':'window.TREE_STUDIES='+J(studies)+';\n',
 'milestones.js':"""(function(){const w=t=>'https://ru.wikipedia.org/w/index.php?search='+encodeURIComponent(t);
window.TREE_MILESTONES=[{who:'Пётр Сидорович и Мария Ивановна',ids:['1','2'],years:'1800 — 1870',intro:'Описание поколения.',
 ev:[{y:'1812',l:'ru',t:'Отечественная война',u:w('Отечественная война 1812 года')},{y:'1830',l:'viz',t:'Родился сын Иван'}]},
 {who:'Иван Петрович',ids:['3'],years:'1830 — 1890',intro:'Описание поколения.',ev:[{y:'1861',l:'ru',t:'Отмена крепостного права',u:w('Крестьянская реформа 1861 года')}]}];})();
"""}
SKIP={'.git','persons.csv','families.csv','places.csv','research.csv','sources.csv','ИНСТРУКЦИЯ.docx'}
ts=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5))).strftime('%Y-%m-%d_%H-%M')
zp=os.path.join(OUT,f'Шаблон_сайта_родословия_{ts}.zip');now=datetime.datetime.now().timetuple()[:6]
def add(z,arc,b):
    zi=zipfile.ZipInfo('сайт/'+arc if not arc.startswith('ПРОМПТ') else arc,date_time=now);zi.compress_type=zipfile.ZIP_DEFLATED;zi.flag_bits|=0x800;z.writestr(zi,b)
with zipfile.ZipFile(zp,'w') as z:
    for d,ds,fs in os.walk(R):
        ds[:]=[x for x in ds if x not in SKIP]
        for f in sorted(fs):
            rel=os.path.relpath(os.path.join(d,f),R)
            if f in SKIP or rel.startswith('photos/') and f.lower().endswith(('.jpg','.jpeg','.png')): continue
            if rel.startswith('data/'):
                if f in data: add(z,rel,data[f].encode())
                continue
            b=open(os.path.join(d,f),'rb').read()
            if f.endswith(('.md','.html','.py')):
                t=b.decode('utf-8')
                for a,c in [('Третьяковых','[рода]'),('Третьяковы','[Фамилия]'),('Третьякова','[Фамилия]'),('Третьяков','[Фамилия]'),('tree_TRETYAKOV','[репозиторий]')]: t=t.replace(a,c)
                b=t.encode('utf-8')
            add(z,rel,b)
    add(z,'ПРОМПТ_новый_род.md',open(os.path.join(R,'tools','ПРОМПТ_шаблона.md'),'rb').read())
print(zp)
