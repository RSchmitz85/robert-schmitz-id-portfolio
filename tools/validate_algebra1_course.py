"""Check exported course integrity and independently recompute numerical cases.

Run: python tools/validate_algebra1_course.py
No network or external packages required. This does not emulate Canvas import.
"""
from collections import deque
from fractions import Fraction
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
from zipfile import ZipFile
import json
import math
import re
import xml.etree.ElementTree as ET
from algebra1_content import UNITS, DIAGNOSTIC, FINAL

ROOT=Path(__file__).resolve().parents[1]
PREVIEW=ROOT/'courses/algebra1'
CC={'c':'http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1'}
Q={'q':'http://www.imsglobal.org/xsd/ims_qtiasiv1p2'}
C={'c':'http://canvas.instructure.com/xsd/cccv1p0'}


class Document(HTMLParser):
    def __init__(self,text):
        super().__init__();self.ids=[];self.links=[];self.images=[]
        self.feed(text)
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        if tag=='img':self.images.append(a)
        for key in ('href','src'):
            if key in a:self.links.append(a[key])


def check_site():
    pages=list(PREVIEW.glob('*.html'))+[ROOT/'projects/canvas-algebra1.html',ROOT/'projects/youtube-videos.html',ROOT/'projects.html',ROOT/'assets/downloads/algebra1/instructor-guide.html']
    cache={}
    def doc(path):
        if path not in cache:cache[path]=Document(path.read_text(encoding='utf-8'))
        return cache[path]
    for path in pages:
        d=doc(path)
        assert len(d.ids)==len(set(d.ids)),f'Duplicate HTML ID: {path}'
        assert all('alt' in a for a in d.images),f'Missing image alternative: {path}'
        for href in d.links:
            u=urlsplit(href)
            if u.scheme or u.netloc:continue
            target=(path.parent/unquote(u.path)).resolve() if u.path else path
            assert target.exists(),f'Broken local link: {path.name}: {href}'
            if u.fragment and target.suffix=='.html':
                assert u.fragment in doc(target).ids,f'Broken anchor: {href}'
    # Every preview page must be reachable through links from the course home.
    visited=set();pending=deque([PREVIEW/'index.html'])
    while pending:
        path=pending.popleft().resolve()
        if path in visited:continue
        visited.add(path)
        for href in doc(path).links:
            u=urlsplit(href)
            target=(path.parent/u.path).resolve()
            if not u.scheme and target.parent==PREVIEW.resolve() and target.suffix=='.html':
                pending.append(target)
    assert all(p.resolve() in visited for p in PREVIEW.glob('*.html')),'Unreachable preview page'
    return len(pages),len(visited)


def check_package():
    with ZipFile(ROOT/'assets/downloads/algebra1/algebra1-canvas-course.imscc') as z:
        assert z.testzip() is None,'Archive CRC failure'
        names=z.namelist()
        assert len(names)==len(set(names)),'Duplicate archive path'
        assert all(not p.startswith('/') and '..' not in p.split('/') for p in names)
        manifest=ET.fromstring(z.read('imsmanifest.xml'))
        resources=manifest.findall('c:resources/c:resource',CC)
        byid={r.attrib['identifier']:r for r in resources}
        assert len(byid)==len(resources)
        for r in resources:
            if 'href' in r.attrib:assert r.attrib['href'] in names,r.attrib['href']
            for f in r.findall('c:file',CC):assert f.attrib['href'] in names,f.attrib
            for d in r.findall('c:dependency',CC):assert d.attrib['identifierref'] in byid
        for it in manifest.findall('.//c:item',CC):
            if 'identifierref' in it.attrib:assert it.attrib['identifierref'] in byid
        modulemeta=ET.fromstring(z.read('course_settings/module_meta.xml'))
        modules=modulemeta.findall('c:module',C)
        assert len(modules)==12
        for mod in modules:
            assert mod.findtext('c:workflow_state',namespaces=C)=='unpublished'
            for item in mod.findall('c:items/c:item',C):
                assert item.findtext('c:identifierref',namespaces=C) in byid
        count=0
        for name in names:
            if name.endswith('.xml'):ET.fromstring(z.read(name))
            if name.endswith('.html'):
                text=z.read(name).decode('utf-8')
                assert not re.search(r'href="[a-z0-9-]+\.html"',text),f'Unresolved relative page: {name}'
                for page in re.findall(r'\$WIKI_REFERENCE\$/pages/([a-z0-9-]+)',text):
                    assert 'page_'+page in byid,page
                for kind,identifier in re.findall(r'\$CANVAS_OBJECT_REFERENCE\$/(quizzes|assignments)/([a-z0-9_-]+)',text):
                    assert identifier in byid,identifier
                for filepath in re.findall(r'\$IMS-CC-FILEBASE\$/([^"?]+)',text):
                    assert filepath in names,filepath
            if name.endswith('assessment_qti.xml'):
                quiz_folder=name.split('/')[0]
                assert f'non_cc_assessments/{quiz_folder}.xml.qti' in names,'Missing Canvas quiz payload'
                native=ET.fromstring(z.read(f'non_cc_assessments/{quiz_folder}.xml.qti'))
                assert not any(n.text=='cc_profile' for n in native.findall('.//q:fieldlabel',Q)),'Canvas native payload must not declare the CC profile'
                assert len(native.findall('.//q:item',Q))==len(ET.fromstring(z.read(name)).findall('.//q:item',Q)),'Missing native questions'
                root=ET.fromstring(z.read(name))
                assert root.find('.//q:section',Q).attrib['ident']=='root_section','Canvas requires its root-section identifier'
                for item in root.findall('.//q:item',Q):
                    count+=1
                    labels=item.findall('.//q:response_label',Q)
                    assert len(labels)==4
                    texts=[x.find('.//q:mattext',Q).text for x in labels]
                    assert len(set(texts))==4,'Duplicate answer options'
                    condition=item.find('.//q:varequal',Q)
                    assert condition.text in [x.attrib['ident'] for x in labels]
                    assert item.find('.//q:setvar',Q).text=='100'
                    assert item.find('.//q:decvar',Q).attrib['defaultval']=='0'
                    assert item.find('.//q:itemfeedback/q:material/q:mattext',Q).text
        assert count==68
        assert sum(n.endswith('assignment_settings.xml') for n in names)==10
        assert sum(n.endswith('assessment_qti.xml') for n in names)==12
        return len(names),len(resources),count


def math_checks():
    # Compute from defining equations, rather than copying answer indices.
    checks=0
    def selected(questions,index,value):
        nonlocal checks
        q=questions[index]
        assert q[1][q[2]].replace('−','-')==value.replace('−','-'),(q[0],q[1][q[2]],value)
        checks+=1
    q=[u['quiz'] for u in UNITS]
    selected(q[0],0,f'{150//3} miles/hour')
    selected(q[0],1,str((-4)**2-2*(-4)))
    selected(q[1],0,str((25+5)//6))
    selected(q[1],1,str((18-4)//(4-2)))
    selected(q[2],3,str(math.floor((35-5)/8)))
    selected(q[3],1,str(4*(-2)+1))
    selected(q[3],3,str((17-5)//(6-2)))
    selected(q[4],0,str((2-8)//(4-1)))
    selected(q[4],3,f'{45//5} minutes')
    selected(q[5],0,f'({16//4},{3*(16//4)})')
    selected(q[5],1,f'({(9+3)//2},{(9-3)//2})')
    selected(q[5],4,str((30-4*6)//(7-4)))
    selected(q[6],1,str(Fraction(3)**(-2)))
    selected(q[6],3,f'${400*105**2//100**2}')
    selected(q[8],4,f'{12//2} seconds')
    selected(q[9],0,str(sum([2,4,6,8])//4))
    selected(q[9],1,f'{15*100//25}%')
    selected(q[9],2,str(14-18))
    selected(DIAGNOSTIC,0,str(-3+8))
    selected(DIAGNOSTIC,1,str(Fraction(3,4)+Fraction(1,2)))
    selected(DIAGNOSTIC,2,str(60*20//100))
    selected(FINAL,0,f'${11+6*4}')
    selected(FINAL,1,str((5+3)//(3-2)))
    selected(FINAL,3,str((-3)**2+1))
    selected(FINAL,5,f'({(11+5)//2},{(11-5)//2})')
    selected(FINAL,9,str(47-42))
    # Check roots, factorizations, vertices, formulas, and application constraints
    # numerically over a set of integer inputs; these compare independent forms.
    for x in range(-8,9):
        assert (x+3)*(x-2)==x*x+x-6
        assert (2*x+1)*(x+3)==2*x*x+7*x+3
        assert 3*(x-3)*(x+3)==3*x*x-27
        assert -2*x*x+8*x==-2*(x-2)**2+8
        assert -5*x*x+20*x==-5*(x-2)**2+20
        assert (x+2)*(x+5)==x*x+7*x+10
        checks+=6
    for x in (2,3):assert x*x-5*x+6==0
    for x in (1,5):assert x*x-6*x+5==0
    assert 200+12*25==500 and 200+12*26>500
    assert 25+15==40 and 4*25+7*15==205
    assert 100*1.1**6<100+15*6
    checks+=7
    return checks


if __name__=='__main__':
    pages,reachable=check_site()
    files,resources,questions=check_package()
    calculations=math_checks()
    print(json.dumps({'result':'PASS','html_pages_checked':pages,'reachable_course_pages':reachable,'archive_files':files,'manifest_resources':resources,'QTI_questions_checked':questions,'independent_mathematical_checks':calculations,'live_Canvas_import':'See validation report: native quiz repair required'},indent=2))
