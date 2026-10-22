"""Build the public Algebra 1 preview and Canvas-flavored Common Cartridge.

Run from anywhere: python tools/build_algebra1_course.py
Uses only Python's standard library. Source content is algebra1_content.py.
"""
from pathlib import Path
from html import escape as e
import json
import math
import copy
import zipfile
import xml.etree.ElementTree as ET

from algebra1_content import UNITS, DIAGNOSTIC, FINAL

ROOT = Path(__file__).resolve().parents[1]
PREVIEW = ROOT / 'courses/algebra1'
DOWNLOADS = ROOT / 'assets/downloads/algebra1'
PREVIEW.mkdir(parents=True, exist_ok=True)
DOWNLOADS.mkdir(parents=True, exist_ok=True)
CC = 'http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1'
CANVAS = 'http://canvas.instructure.com/xsd/cccv1p0'
QTI = 'http://www.imsglobal.org/xsd/ims_qtiasiv1p2'
LOR = 'associatedcontent/imscc_xmlv1p1/learning-application-resource'
PACKAGE = {}
PAGES = {}
MODULES = []
ASSESSMENTS = []
ASSIGNMENTS = []
BRAND_IMAGE = ROOT / 'assets/images/studio/guided-notes-transparent.webp'


def canvas_brand():
    """Inline styling travels with course content without an account-level theme."""
    return '''<div style="background-color:#0c1b31;color:#ffffff;border-bottom:5px solid #d05515;padding:20px;border-radius:10px;margin-bottom:24px;font-family:Arial,sans-serif;">
<p style="color:#ffd5b8;font-size:12px;letter-spacing:2px;margin:0 0 6px;">REM · ALGEBRA 1</p>
<p style="color:#ffffff;font-size:22px;font-weight:bold;margin:0;">Real Engagement with Mathematics</p>
<p style="color:#dfe6ef;margin:6px 0 0;">Notice a pattern. Explain your thinking. Make the next move.</p></div>'''


def p(text):
    return '<p>' + e(text) + '</p>'


def list_html(items, ordered=False):
    tag = 'ol' if ordered else 'ul'
    return f'<{tag}>' + ''.join('<li>' + e(x) + '</li>' for x in items) + f'</{tag}>'


def link(name, label):
    return f'<a href="{e(name, quote=True)}.html">{e(label)}</a>'


def xml(root):
    ET.indent(root, space='  ')
    return ET.tostring(root, encoding='utf-8', xml_declaration=True)


def child(parent, tag, value=None, **attrs):
    element = ET.SubElement(parent, tag, {k: str(v) for k, v in attrs.items()})
    if value is not None:
        element.text = str(value)
    return element


def page(name, title, body, module=None):
    PAGES[name] = (title, body)
    if module is not None:
        module.append((name, title, 'WikiPage'))
    # Canvas has its own page title. Keep the exported body starting at h2.
    exported = f'''<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>{e(title)}</title><meta name="identifier" content="page_{name}">
<meta name="workflow_state" content="unpublished"><meta name="editing_roles" content="teachers">
<meta name="front_page" content="{'true' if name == 'index' else 'false'}"></head>
<body>{body}</body></html>'''
    # Use Canvas's documented migration tokens for links between imported pages.
    for target in ['index', 'start', 'course-map', 'help'] + [f'u{n:02d}' for n in range(1, 11)] + [f'u{n:02d}-l{k}' for n in range(1, 11) for k in range(1, 5)]:
        exported = exported.replace(f'href="{target}.html"', f'href="$WIKI_REFERENCE$/pages/{target}"')
    PACKAGE[f'wiki_content/{name}.html'] = exported.encode('utf-8')


RUBRIC = '''<table><caption>Application task rubric · 12 points</caption>
<thead><tr><th scope="col">Criterion</th><th scope="col">3 points</th><th scope="col">2 points</th><th scope="col">1 point</th><th scope="col">0 points</th></tr></thead><tbody>
<tr><th scope="row">Model and representations</th><td>Accurate model, variables, and requested representations</td><td>Model is usable with a minor omission</td><td>Partial model with a major mismatch</td><td>No interpretable model</td></tr>
<tr><th scope="row">Mathematical accuracy</th><td>Accurate computation and solution</td><td>Minor arithmetic error; sound method</td><td>Major error or incomplete method</td><td>No relevant computation</td></tr>
<tr><th scope="row">Reasoning and verification</th><td>Steps justified and result checked</td><td>Reasoning mostly clear; check incomplete</td><td>Claims with little support</td><td>No reasoning or check</td></tr>
<tr><th scope="row">Interpretation and limits</th><td>Units, domain, and limitations addressed</td><td>One relevant element omitted</td><td>Interpretation is vague or inconsistent</td><td>No contextual interpretation</td></tr>
</tbody></table>'''


def graph(points, title, description, xlim, ylim, connect=True):
    """Original accessible coordinate plot; no remotely loaded assets."""
    w, h, pad = 640, 380, 48
    sx = lambda x: pad + (x-xlim[0])/(xlim[1]-xlim[0])*(w-2*pad)
    sy = lambda y: h-pad-(y-ylim[0])/(ylim[1]-ylim[0])*(h-2*pad)
    paths = []
    for x in range(math.ceil(xlim[0]), math.floor(xlim[1])+1):
        paths.append(f'<line x1="{sx(x):.2f}" y1="{pad}" x2="{sx(x):.2f}" y2="{h-pad}" stroke="#dce3e8"/>')
        paths.append(f'<text x="{sx(x):.2f}" y="{h-pad+20}" text-anchor="middle" font-size="12">{x}</text>')
    step = max(1, math.ceil((ylim[1]-ylim[0])/10))
    for y in range(math.ceil(ylim[0]), math.floor(ylim[1])+1, step):
        paths.append(f'<line x1="{pad}" y1="{sy(y):.2f}" x2="{w-pad}" y2="{sy(y):.2f}" stroke="#dce3e8"/>')
        paths.append(f'<text x="{pad-9}" y="{sy(y)+4:.2f}" text-anchor="end" font-size="12">{y}</text>')
    if xlim[0] <= 0 <= xlim[1]:
        paths.append(f'<line x1="{sx(0)}" y1="{pad}" x2="{sx(0)}" y2="{h-pad}" stroke="#173249" stroke-width="2"/>')
    if ylim[0] <= 0 <= ylim[1]:
        paths.append(f'<line x1="{pad}" y1="{sy(0)}" x2="{w-pad}" y2="{sy(0)}" stroke="#173249" stroke-width="2"/>')
    if connect:
        poly = ' '.join(f'{sx(x):.2f},{sy(y):.2f}' for x, y in points)
        paths.append(f'<polyline points="{poly}" fill="none" stroke="#087f75" stroke-width="3"/>')
    for x, y in points:
        if len(points) <= 20:
            paths.append(f'<circle cx="{sx(x):.2f}" cy="{sy(y):.2f}" r="5" fill="#b44918"/>')
    return f'''<figure><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-label="{e(title,quote=True)}"><title>{e(title)}</title><desc>{e(description)}</desc><rect width="640" height="380" fill="#fff"/>{''.join(paths)}<text x="{w-23}" y="{h-pad+5}" font-size="16">x</text><text x="{pad-5}" y="22" font-size="16">y</text></svg><figcaption>{e(description)}</figcaption></figure>'''


GRAPHS = {
 'u04-l3': graph([(n,3*n) for n in range(6)], 'Discrete notebook cost', 'Each whole notebook costs $3. The points (0,0), (1,3), (2,6), (3,9), (4,12), (5,15) are separate because notebook counts are whole numbers. The horizontal axis is notebooks; the vertical axis is dollars.', (0,5),(0,15),False),
 'u05-l2': graph([(-1,5),(0,3),(1,1),(2,-1),(3,-3)], 'Line y equals negative two x plus three', 'The line y = −2x + 3 crosses the y-axis at (0,3). Moving right one decreases y by two. Shown points include (−1,5), (0,3), (1,1), (2,−1), and (3,−3).',(-1,3),(-3,5)),
 'u09-l1': graph([(n/10,(n/10-2)**2-4) for n in range(0,41)], 'Parabola y equals x minus two squared minus four', 'The parabola y = (x−2)²−4 opens upward, with vertex (2,−4), zeros (0,0) and (4,0), and symmetric points (1,−3) and (3,−3).',(0,4),(-4,1)),
 'u10-l3': graph([(1,56),(2,58),(3,67),(4,76),(5,74),(6,81)], 'Simulated practice-time scatter plot', 'Simulated observations: (1,56), (2,58), (3,67), (4,76), (5,74), (6,81). Horizontal values are practice hours; vertical values are points. The pattern generally rises, but the points are not all on one line.',(0,6),(50,90),False)
}


def material(parent, text):
    return child(child(parent, 'material'), 'mattext', text, texttype='text/html')


def meta(parent, label, value):
    field = child(parent, 'qtimetadatafield')
    child(field, 'fieldlabel', label)
    child(field, 'fieldentry', value)


def quiz(name, title, questions, module):
    ASSESSMENTS.append((name,title,questions))
    module.append((name,title,'Quizzes::Quiz'))
    root = ET.Element('questestinterop', {'xmlns':QTI,'xmlns:xsi':'http://www.w3.org/2001/XMLSchema-instance','xsi:schemaLocation':QTI+' http://www.imsglobal.org/xsd/ims_qtiasiv1p2p1.xsd'})
    assessment = child(root, 'assessment', ident='quiz_'+name, title=title)
    metadata = child(assessment, 'qtimetadata')
    meta(metadata, 'cc_profile', 'cc.exam.v0p1')
    meta(metadata, 'cc_maxattempts', 'unlimited')
    section = child(assessment, 'section', ident='root_section')
    body = p('This is a self-check. Write your reasoning before choosing an answer. Feedback appears after checking; this public preview does not save grades.')
    body += '<form class="self-check">'
    for i,(prompt,options,correct,feedback) in enumerate(questions,1):
        ident = f'{name}_q{i}'
        item = child(section,'item',ident=ident,title=prompt)
        itemmeta = child(child(item,'itemmetadata'),'qtimetadata')
        meta(itemmeta,'question_type','multiple_choice_question')
        meta(itemmeta,'points_possible','1')
        meta(itemmeta,'cc_profile','cc.multiple_choice.v0p1')
        presentation = child(item,'presentation')
        material(presentation,p(prompt))
        response = child(presentation,'response_lid',ident='response1',rcardinality='Single')
        choice = child(response,'render_choice')
        body += f'<fieldset data-answer="{correct}"><legend>{i}. {e(prompt)}</legend>'
        for j,option in enumerate(options):
            label = child(choice,'response_label',ident=f'answer{j}')
            material(label,p(option))
            body += f'<label class="choice"><input type="radio" name="q{i}" value="{j}"> <span>{e(option)}</span></label>'
        body += f'<p class="feedback" hidden>{e(feedback)}</p></fieldset>'
        processing = child(item,'resprocessing')
        outcomes = child(processing,'outcomes')
        child(outcomes,'decvar',varname='SCORE',vartype='Decimal',minvalue='0',maxvalue='100',defaultval='0')
        # General feedback is independent of score and applies to every submitted answer.
        general = child(processing,'respcondition')
        general.set('continue','Yes')
        child(child(general,'conditionvar'),'other')
        child(general,'displayfeedback',feedbacktype='Response',linkrefid='general')
        condition = child(processing,'respcondition')
        condition.set('continue','No')
        child(child(condition,'conditionvar'),'varequal',f'answer{correct}',respident='response1')
        child(condition,'setvar','100',varname='SCORE',action='Set')
        material(child(item,'itemfeedback',ident='general'),p(feedback))
    body += '<button type="submit">Check my answers</button><button type="reset" class="secondary">Try again</button><p class="quiz-result" role="status" tabindex="-1"></p></form>'
    body += p('Use the unit lessons to review errors, then try again. Answer explanations are deliberately inspectable in this portfolio preview.')
    if name.startswith('u'):
        body += '<nav aria-label="Next steps">'+link(name[:3],'Review the unit')+' · '+link(name[:3]+'-apply','Complete the application task →')+'</nav>'
    elif name == 'readiness':
        body += link('u01','Begin Unit 1 →')
    else:
        body += link('reflection','Reflect on your progress →')
    PAGES[name] = (title, body)
    PACKAGE[f'quiz_{name}/assessment_qti.xml'] = xml(root)
    # Canvas-flavored cartridges read quiz content from this separate folder.
    # The standards-based assessment resource alone is ignored by that importer.
    native=copy.deepcopy(root)
    for metadata_node in native.iter('qtimetadata'):
        for field in list(metadata_node):
            if field.findtext('fieldlabel')=='cc_profile':
                metadata_node.remove(field)
    PACKAGE[f'non_cc_assessments/quiz_{name}.xml.qti'] = xml(native)
    settings = ET.Element('quiz', {'xmlns':CANVAS,'identifier':'quiz_'+name})
    for tag, value in [('title',title),('description',canvas_brand()+'<p>Show your reasoning, answer each question, and use feedback to revise. This is a formative self-check.</p>'),('quiz_type','practice_quiz'),('points_possible',len(questions)),('allowed_attempts',-1),('scoring_policy','keep_highest'),('show_correct_answers','true'),('shuffle_answers','true'),('one_question_at_a_time','false'),('available','false')]:
        child(settings,tag,value)
    PACKAGE[f'quiz_{name}/assessment_meta.xml'] = xml(settings)


def assignment(name,title,task,module):
    body = '<h2>Your challenge</h2>' + p(task)
    body += '<h2>What to submit</h2>' + list_html(['A clearly labeled model with defined variables and units.','Your calculations and any requested tables or graphs.','A check of the result and a short explanation of assumptions or limitations.','A revision note explaining one check or change you made.'])
    body += p('Submit typed work or a legible scan/photo through the Canvas assignment after import. In this preview, use paper or a document; no work is uploaded or saved here.')
    body += RUBRIC + '<h2>Before submitting</h2>' + list_html(['Did I answer every part of the task?','Does my result satisfy the original conditions?','Can someone else follow my reasoning?'])
    body += '<nav aria-label="Next steps">'+link(name[:3],'Back to unit overview')+'</nav>'
    PAGES[name] = (title,body)
    ASSIGNMENTS.append((name,title,body))
    module.append((name,title,'Assignment'))
    PACKAGE[f'assignment_{name}/assignment.html'] = ('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>'+e(title)+'</title></head><body>'+body+'</body></html>').encode('utf-8')
    settings = ET.Element('assignment',{'xmlns':CANVAS,'identifier':'assignment_'+name})
    for tag, value in [('title',title),('workflow_state','unpublished'),('points_possible',12),('grading_type','points'),('submission_types','online_text_entry,online_upload'),('allowed_extensions','pdf,docx,png,jpg,jpeg'),('allowed_attempts',-1),('position',len(ASSIGNMENTS)),('omit_from_final_grade','false')]:
        child(settings,tag,value)
    PACKAGE[f'assignment_{name}/assignment_settings.xml'] = xml(settings)


def build_pages():
    orientation = []
    MODULES.append(('Start here',orientation))
    page('start','Start here: how to learn in this course', '''<h2>Welcome to Algebra 1</h2>'''+p('You will use symbols, graphs, equations, and data to describe relationships and defend conclusions. This original course draft is for learners beginning Algebra 1, typically grades 8–9. It assumes arithmetic with signed numbers, fractions, and basic ratios.')+
         '<h2>Your learning routine</h2>'+list_html(['Read the objective and make a first attempt.','Work through the model, explaining why each step is allowed.','Attempt the three practice questions before opening their explanations.','Repair the misconception, then take the unit self-check.','Complete the application task and revise using the rubric.'],True)+
         '<h2>Materials and working expectations</h2>'+p('Use paper or a digital notebook, a pencil, graph paper, and a basic calculator for numerical checks. Graphing technology is optional. Show the method before relying on a calculator result. Record units, define variables, and explain why a solution fits its context.')+
         '<h2>Feedback and support</h2>'+p('Practice explanations are available for self-correction. If you miss two or more unit quiz questions, return to the related lessons, write an error correction, and try again. Ask your instructor to review your explanation when the method remains unclear. No time limits or dates are built into this draft.')+
         '<h2>Begin</h2>'+p('Take the readiness check to identify review needs. Its result is diagnostic, not an entrance requirement.')+link('readiness','Take the readiness check →')+' · '+link('course-map','See the course map'),orientation)
    quiz('readiness','Algebra readiness self-check',DIAGNOSTIC,orientation)
    page('help','Learning tools and help', '<h2>Make the work readable</h2>'+list_html(['Use parentheses when substituting negative numbers.','Write one mathematical transformation per line.','Say what an ordered pair means and label both axes.','Use units to check a model; give exact answers before rounding.','Read x² as x squared, √a as the principal square root of a, and ≤ as less than or equal to.'])+
         '<h2>If you are stuck</h2>'+list_html(['Name the known quantities and the quantity requested.','Try a small input or substitute a proposed solution.','Compare your work with the model one step at a time.','Describe the first step you do not understand when requesting help.'])+
         '<h2>Access</h2>'+p('The preview supports keyboard navigation and browser zoom. Explanations use selectable text, and plotted examples include descriptions. No task requires color recognition, sound, or dragging. After Canvas import, the instructor should check screen-reader reading order, mathematical notation, zoom, and assignment submission in Student View.'),orientation)
    for u,unit in enumerate(UNITS,1):
        prefix=f'u{u:02d}'
        items=[]
        MODULES.append((f'Unit {u:02d} · '+unit['title'],items))
        overview='<h2>Essential question</h2>'+p(unit['question'])+'<h2>Learning targets</h2>'+list_html([x['objective'] for x in unit['lessons']])
        overview+='<h2>Lesson sequence</h2><ol>'+''.join('<li>'+link(f'{prefix}-l{k}',l['title'])+'</li>' for k,l in enumerate(unit['lessons'],1))+'</ol>'
        overview+='<h2>Apply and check your learning</h2>'+link(prefix+'-quiz','Take the unit self-check')+' · '+link(prefix+'-apply','Complete the application task')
        overview+='<h2>Plan your time</h2>'+p('Suggested unit allocation: about 3 weeks, adjusted after the readiness check and classroom evidence. The four core lessons are starting points for instruction; use additional meetings for discussion, spaced practice, reteaching, the application task, and revision.')
        overview+='<h2>Standards connections</h2>'+p(', '.join(unit['standards']))+p('These are selected Common Core connections, not a claim of exhaustive state-specific alignment. See the course map for scope and sources.')
        page(prefix,f'Unit {u}: '+unit['title'],overview,items)
        for k,l in enumerate(unit['lessons'],1):
            name=f'{prefix}-l{k}'
            body='<h2>Learning target</h2>'+p(l['objective'])+'<h2>Think about the idea</h2>'+p(l['idea'])
            body+='<h2>Worked example</h2>'+p(l['example'])+list_html(l['steps'],True)+GRAPHS.get(name,'')
            body+='<h2>Spot and repair an error</h2>'+p(l['error'])+p('Before revealing the explanation, identify the first incorrect step and propose a repair.')+'<details><summary>Compare your repair</summary>'+p(l['repair'])+'</details>'
            body+='<h2>Your turn</h2>'+p('Work each question independently. Include a method or explanation, then compare your reasoning.')
            for number,(prompt,answer) in enumerate(l['practice'],1):
                body+=f'<section><h3>Practice {number}</h3>'+p(prompt)+'<details><summary>Check the reasoning</summary>'+p(answer)+'</details></section>'
            body+='<h2>Reflect before moving on</h2>'+p('Explain one decision you made and how you checked it. If your answer changed after checking, record the original error and your corrected reasoning.')
            nav=link(prefix,'Back to unit overview')
            if k<4:
                nav+=' · '+link(f'{prefix}-l{k+1}','Next lesson: '+unit['lessons'][k]['title'])
            else:
                nav+=' · '+link(f'{prefix}-quiz','Take the unit self-check')
            body+='<nav aria-label="Lesson navigation">'+nav+'</nav>'
            page(name,f'{u}.{k} · '+l['title'],body,items)
        quiz(prefix+'-quiz',f'Unit {u} self-check · '+unit['title'],unit['quiz'],items)
        assignment(prefix+'-apply',f'Unit {u} application · '+unit['title'],unit['task'],items)
    finish=[]
    MODULES.append(('Synthesize and reflect',finish))
    quiz('final','Cumulative Algebra 1 self-check',FINAL,finish)
    page('reflection','Final reflection and next steps','<h2>Show what changed</h2>'+list_html(['Choose one early solution and a recent solution. Explain a difference in your reasoning.','Connect one situation to an equation, graph, table, and verbal explanation.','Choose two missed cumulative questions; explain each misconception and solve a fresh example.','Identify one topic for further practice and describe how you will check improvement.'])+p('Review this reflection with an instructor. A self-check score alone does not establish readiness for a later course.'),finish)
    rows=''.join(f'<tr><th scope="row">{i:02d}</th><td>{e(u["title"])}</td><td>{e(", ".join(u["standards"]))}</td><td>3 weeks</td></tr>' for i,u in enumerate(UNITS,1))
    page('course-map','Course map and pacing', '<h2>A full-year planning structure</h2>'+p('Suggested allocation: 2 weeks for orientation, readiness, and prerequisite review; 30 weeks across ten units; and 4 flexible weeks for cumulative practice, reteaching, application revisions, and synthesis. This is a 36-week planning draft, not a district pacing mandate. Forty core lessons need teacher-led practice and adaptation to fill a full instructional year.')+
         '<div class="table-scroll"><table><caption>Ten-unit sequence and selected standards connections</caption><thead><tr><th scope="col">Unit</th><th scope="col">Focus</th><th scope="col">Common Core connections</th><th scope="col">Suggested time</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
         '<h2>Scope boundaries</h2>'+p('The draft emphasizes Algebra 1 equations, inequalities, functions, linear and exponential change, polynomial structure, quadratics, and introductory statistics. It does not claim coverage of every high-school standard. Absolute-value and piecewise functions, more extensive transformations, regression technology, formal standard-deviation calculations, and additional graph-based investigations require local decisions and supplementary lessons.')+
         '<h2>Standards sources</h2><ul><li><a href="https://www.thecorestandards.org/Math/Content/HSA/">Common Core: Algebra</a></li><li><a href="https://www.thecorestandards.org/Math/Content/HSF/">Common Core: Functions</a></li><li><a href="https://www.thecorestandards.org/Math/Content/HSN/Q/">Common Core: Quantities</a></li><li><a href="https://www.thecorestandards.org/Math/Content/HSN/RN/">Common Core: Real Number System</a></li><li><a href="https://www.thecorestandards.org/Math/Content/HSS/ID/">Common Core: Interpreting Data</a></li></ul>'+p('Original explanations, tasks, and assessment questions are authored for this portfolio. The links identify standards references; this course does not reproduce a commercial textbook.'))
    cards=''.join(f'<a class="unit-card" href="u{i:02d}.html"><span>Unit {i:02d}</span><h3>{e(u["title"])}</h3><p>{e(u["question"])}</p><strong>Explore four lessons →</strong></a>' for i,u in enumerate(UNITS,1))
    home='<section class="course-welcome"><div class="welcome-copy"><p class="kicker">Real Engagement with Mathematics</p><h2>Make a claim.<br>Show why<br>it works.</h2>'+p('Explore Algebra 1 with Scribble. Notice patterns, test ideas, and use feedback to explain your next move.')+'<div class="actions">'+link('start','Start here →')+link('course-map','Course map')+'</div></div><figure class="scribble-guide"><img src="../../assets/images/studio/guided-notes-transparent.webp" width="512" height="640" alt="Scribble, the REM course guide, wearing glasses and a teal cardigan while writing in a notebook."><figcaption>Your next idea starts with a little curiosity.</figcaption></figure></section>'
    home+='<h2>Choose a unit</h2><div class="unit-grid">'+cards+'</div><h2>Bring it together</h2>'+link('final','Try the cumulative self-check')+' · '+link('reflection','Reflect on your progress')
    page('index','Algebra 1 · Patterns, decisions, and evidence',home)


CSS = '''
:root{font-family:Inter,"Segoe UI",Arial,sans-serif;color:#173249;background:#f3f6f8;line-height:1.65;font-size:17px}
*{box-sizing:border-box}body{margin:0}a{color:#076d65;text-underline-offset:.18em}a:hover{color:#a74415}button,input,summary,a{touch-action:manipulation}a:focus-visible,button:focus-visible,summary:focus-visible,input:focus-visible{outline:3px solid #bb4b16;outline-offset:4px}
.skip{position:absolute;top:-5rem;left:1rem;background:white;padding:.7rem;z-index:5}.skip:focus{top:1rem}.course-top{background:#102a40;color:#fff;padding:1rem max(1.2rem,calc((100vw - 1180px)/2));display:flex;justify-content:space-between;align-items:center;gap:1rem}.course-top a{color:#fff}.brand{text-decoration:none;font-weight:750;letter-spacing:.02em}.brand small{display:block;font-size:.74rem;font-weight:400;color:#c5d7df}.draft-banner{background:#e6f1ef;padding:.6rem 1.2rem;text-align:center;font-size:.83rem;color:#244b48}
.layout{max-width:1180px;margin:2rem auto 4rem;display:grid;grid-template-columns:230px minmax(0,1fr);gap:2rem;padding:0 1.2rem}.course-nav{align-self:start;position:sticky;top:1rem;font-size:.86rem}.course-nav a{display:block;padding:.5rem .6rem;text-decoration:none;border-radius:5px}.course-nav a[aria-current=page]{background:#dcebe7;color:#104d48;font-weight:700}.course-nav h2{font-size:.8rem;letter-spacing:.08em;text-transform:uppercase;margin:1.4rem 0 .4rem;color:#597080}
main{min-width:0;background:white;border:1px solid #d8e2e8;border-radius:12px;padding:clamp(1.2rem,4vw,3rem)}h1{font-size:clamp(1.8rem,3.2vw,2.7rem);line-height:1.16;letter-spacing:-.035em;margin:.3rem 0 1.8rem}h2{font-size:1.35rem;line-height:1.3;margin:2rem 0 .7rem}h3{font-size:1.08rem;line-height:1.4}p,li{max-width:74ch}li{margin:.4rem 0}.breadcrumb{font-size:.83rem;margin:0 0 1rem}.course-welcome{background:#102a40;color:white;margin:-.3rem -.3rem 2rem;padding:clamp(1.3rem,3vw,2.5rem);border-radius:8px}.course-welcome h2{font-size:clamp(2rem,4vw,3.2rem);line-height:1.08;margin:.6rem 0 1.3rem;letter-spacing:-.04em}.kicker{text-transform:uppercase;font-size:.75rem;letter-spacing:.1em;color:#a9d7d1}.actions{display:flex;flex-wrap:wrap;gap:.8rem;margin-top:1.5rem}.actions a{display:inline-block;padding:.7rem 1rem;background:white;color:#14384b;border-radius:5px;text-decoration:none;font-weight:700}.actions a+a{background:#1e4b5a;color:white}
.unit-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.unit-card{border:1px solid #d1dfdf;border-top:4px solid #087f75;border-radius:8px;padding:1.25rem;text-decoration:none;color:inherit;background:#f9fbfb;display:flex;flex-direction:column}.unit-card:hover{background:#edf6f4;color:inherit}.unit-card span{color:#906024;font-size:.75rem;text-transform:uppercase;letter-spacing:.08em}.unit-card h3{margin:.45rem 0 .6rem}.unit-card p{font-size:.88rem;margin:0 0 1rem}.unit-card strong{margin-top:auto;font-size:.82rem;color:#076d65}
details{border:1px solid #cddedb;border-radius:6px;margin:1rem 0;padding:.85rem 1rem;background:#f5faf8}summary{cursor:pointer;font-weight:650}table{border-collapse:collapse;max-width:100%;font-size:.84rem}th,td{border:1px solid #cbd8df;text-align:left;vertical-align:top;padding:.65rem}th{background:#edf3f5}caption{text-align:left;font-weight:700;padding:.5rem 0}.table-scroll{overflow-x:auto}main>table{display:block;overflow-x:auto}figure{margin:1.5rem 0}svg{width:100%;height:auto;max-width:640px;border:1px solid #dce3e8;border-radius:6px}figcaption{font-size:.85rem;color:#4c6575;margin-top:.5rem}fieldset{border:1px solid #ccdbe3;border-radius:8px;padding:1rem;margin:1.3rem 0}legend{font-weight:700;padding:0 .35rem}.choice{display:flex;align-items:baseline;gap:.55rem;padding:.5rem;cursor:pointer}.choice:hover{background:#eff6f5}input[type=radio]{width:1.1rem;height:1.1rem;flex-shrink:0}.feedback{background:#edf6f4;padding:.8rem;border-left:4px solid #087f75}.feedback.wrong{border-color:#b44918;background:#fff5ed}button{font:inherit;font-weight:700;border:1px solid #08766d;border-radius:5px;background:#08766d;color:white;padding:.7rem 1rem;cursor:pointer;margin:.3rem .5rem .3rem 0}.secondary{background:white;color:#173249}.quiz-result{font-weight:700}footer{max-width:1180px;margin:0 auto 2rem;padding:0 1.2rem;font-size:.8rem;color:#4c6575}
@media(max-width:800px){.layout{grid-template-columns:1fr;gap:1rem;margin-top:1rem}.course-nav{position:static}.course-nav details{margin:0;background:white}.course-nav nav{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.2rem}.course-nav nav h2{grid-column:1/-1}.course-top{align-items:flex-start}.course-top>a:last-child{font-size:.8rem}.unit-grid{grid-template-columns:1fr}}
@media print{.course-top,.course-nav,.draft-banner,.skip,footer,.self-check button{display:none}.layout{display:block;margin:0;padding:0}main{border:none;padding:0}.unit-grid{display:block}details>*{display:block!important}a{color:inherit}}
'''

# REM's established portfolio palette, applied only to this course.
CSS += '''
:root{color:#14213a;background:#f3f6fa}a{color:#a43d0b}.course-top{background:#0c1b31;border-bottom:4px solid #d05515}.brand{display:flex;align-items:center;gap:.8rem}.rem-mark{display:grid;place-items:center;background:#d05515;color:#fff;border-radius:7px;width:54px;height:48px;font-size:.9rem;font-weight:800;letter-spacing:.04em;flex-shrink:0}.brand small{color:#dfe6ef;letter-spacing:0}.brand-title{font-size:1.05rem}.draft-banner{background:#faeee5;color:#783916}.course-nav a[aria-current=page]{background:#faeee5;color:#84330e}.course-nav>details{background:transparent;border-color:#dfe6ef}.course-welcome{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,.8fr);gap:1rem;align-items:center;background:radial-gradient(ellipse at 95% 30%,#234b83 0%,#0c1b31 65%);border-bottom:5px solid #d05515;padding:1.8rem}.course-welcome .kicker{color:#ffd5b8;font-size:.66rem;letter-spacing:.1em}.course-welcome h2{font-size:clamp(2rem,3.5vw,3rem);margin:.8rem 0 1.1rem}.course-welcome p{font-size:.93rem}.course-welcome .actions{gap:.6rem}.course-welcome .actions a{padding:.65rem .8rem;font-size:.85rem}.course-welcome .actions a:first-child{background:#d05515;color:#fff}.course-welcome .actions a+a{background:#1a3a66;color:#fff}.scribble-guide{margin:0;text-align:center}.scribble-guide img{display:block;width:100%;height:auto;max-width:240px;margin:0 auto;filter:drop-shadow(0 16px 14px #0004)}.scribble-guide figcaption{color:#dfe6ef;font-size:.73rem;line-height:1.5;margin:.6rem auto 0;max-width:24ch}.unit-card{border-top-color:#d05515;background:#fff}.unit-card:hover{background:#fff7f1}.unit-card strong{color:#a43d0b}.unit-card span{color:#92400e}details{border-color:#dfe6ef;background:#f3f6fa}button{background:#b04510;border-color:#b04510}.secondary{background:#fff}.choice:hover{background:#fff4ec}
@media(max-width:1000px) and (min-width:801px){.course-welcome{grid-template-columns:1fr}.scribble-guide{display:none}.course-welcome h2 br:last-of-type{display:none}}
@media(max-width:600px){.course-welcome{grid-template-columns:1fr;padding:1.4rem}.course-welcome h2 br:last-of-type{display:none}.scribble-guide{display:flex;align-items:center;justify-content:center;gap:1rem}.scribble-guide img{max-width:125px;margin:0}.scribble-guide figcaption{max-width:15ch;margin:0;text-align:left}.brand-title{font-size:.9rem}.brand small{font-size:.63rem}.rem-mark{width:43px;height:42px;font-size:.75rem}.course-top{gap:.5rem}}
'''

JS = '''
const courseNavigation=document.querySelector('.course-nav details');
if(courseNavigation&&window.matchMedia('(max-width:800px)').matches)courseNavigation.open=false;
document.querySelectorAll('.self-check').forEach(form=>{
 const result=form.querySelector('.quiz-result');
 form.addEventListener('submit',event=>{
  event.preventDefault();let score=0,answered=0;
  const fields=[...form.querySelectorAll('fieldset')];
  fields.forEach(field=>{
   const selected=field.querySelector('input:checked');
   const feedback=field.querySelector('.feedback');
   if(!feedback.dataset.explanation)feedback.dataset.explanation=feedback.textContent;
   feedback.hidden=false;feedback.classList.remove('wrong');
   if(!selected){feedback.textContent='Choose an answer, then check again.';feedback.classList.add('wrong');return;}
   answered++;const correct=selected.value===field.dataset.answer;
   if(correct)score++;else feedback.classList.add('wrong');
   feedback.textContent=(correct?'Correct. ':'Review this answer. ')+feedback.dataset.explanation;
  });
  result.textContent=`${score} of ${fields.length} correct. ${answered} answered. Review the explanations and try again; results are not saved.`;
  result.focus();
 });
 form.addEventListener('reset',()=>{
  form.querySelectorAll('.feedback').forEach(feedback=>{feedback.hidden=true;if(feedback.dataset.explanation)feedback.textContent=feedback.dataset.explanation;});
  result.textContent='';
 });
});
'''


def write_preview():
    (PREVIEW/'course.css').write_text(CSS,encoding='utf-8')
    (PREVIEW/'course.js').write_text(JS,encoding='utf-8')
    for name,(title,body) in PAGES.items():
        heading='Algebra 1' if name=='index' else title
        links=[('index','Course home'),('start','Start here'),('course-map','Course map'),('help','Learning tools and help')]+[(f'u{i:02d}',f'{i:02d} · '+u['title']) for i,u in enumerate(UNITS,1)]+[('final','Cumulative self-check')]
        nav=''.join(f'<a href="{slug}.html"'+(' aria-current="page"' if name==slug else '')+'>'+e(label)+'</a>' for slug,label in links)
        html=f'''<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(title)} | REM</title><meta name="description" content="Original Algebra 1 course draft: {e(title,quote=True)}"><link rel="icon" href="../../assets/images/rem-algebra1-mark.svg" type="image/svg+xml"><link rel="stylesheet" href="course.css"><script src="course.js" defer></script></head><body><a class="skip" href="#main">Skip to lesson</a><header class="course-top"><a class="brand" href="index.html"><span class="rem-mark" aria-hidden="true">REM</span><span class="brand-title">Algebra 1<small>Real Engagement with Mathematics</small></span></a><a href="../../projects/canvas-algebra1.html">Back to portfolio ↗</a></header><div class="draft-banner">Public course preview · Original course draft · Live Canvas course configured · Learner testing pending</div><div class="layout"><aside class="course-nav"><details open><summary>Course navigation</summary><nav aria-label="Course">{nav}</nav></details></aside><main id="main" tabindex="-1"><p class="breadcrumb"><a href="index.html">Algebra 1</a> / {e(heading)}</p><h1>{e(heading)}</h1>{body}</main></div><footer>Real Engagement with Mathematics · Robert Schmitz · This preview saves no submissions or grades. Canvas is a product of Instructure; this is an independently authored course.</footer></body></html>'''
        (PREVIEW/(name+'.html')).write_text(html,encoding='utf-8')


def write_package():
    # Resolve all internal preview links after pages, quizzes, and assignments exist.
    import re
    quiz_names={q[0] for q in ASSESSMENTS}
    assignment_names={a[0] for a in ASSIGNMENTS}
    def imported_link(match):
        target=match.group(1)
        if target in quiz_names:
            return f'href="$CANVAS_OBJECT_REFERENCE$/quizzes/quiz_{target}"'
        if target in assignment_names:
            return f'href="$CANVAS_OBJECT_REFERENCE$/assignments/assignment_{target}"'
        if target in PAGES:
            return f'href="$WIKI_REFERENCE$/pages/{target}"'
        raise ValueError('Unresolved package page link: '+target)
    for path,data in list(PACKAGE.items()):
        if path.endswith('.html'):
            html=re.sub(r'href="([a-z0-9-]+)\.html"',imported_link,data.decode('utf-8'))
            html=html.replace('<body>','<body>'+canvas_brand())
            html=html.replace('src="../../assets/images/studio/guided-notes-transparent.webp"','src="$IMS-CC-FILEBASE$/web_resources/scribble-guide.webp"')
            if path=='wiki_content/index.html':
                # The homepage uses a readable light-background layout in Canvas;
                # the portable banner above supplies the branded dark header.
                html=html.replace('class="scribble-guide"','class="scribble-guide" style="text-align:center;margin:20px 0;"').replace('width="512" height="640"','width="200" height="250" style="max-width:100%;height:auto;"')
            PACKAGE[path]=html.encode('utf-8')
    manifest=ET.Element('manifest',{'xmlns':CC,'identifier':'robert_schmitz_algebra1_v1'})
    metadata=child(manifest,'metadata')
    child(metadata,'schema','IMS Common Cartridge')
    child(metadata,'schemaversion','1.1.0')
    organizations=child(manifest,'organizations')
    org=child(organizations,'organization',identifier='org_1',structure='rooted-hierarchy')
    rootitem=child(org,'item',identifier='learning_modules')
    child(rootitem,'title','Algebra 1')
    resources=child(manifest,'resources')
    for name,(title,_) in PAGES.items():
        if f'wiki_content/{name}.html' not in PACKAGE:
            continue
        res=child(resources,'resource',identifier='page_'+name,type='webcontent',href=f'wiki_content/{name}.html')
        child(res,'file',href=f'wiki_content/{name}.html')
    modulemeta=ET.Element('modules',{'xmlns':CANVAS})
    for position,(title,items) in enumerate(MODULES,1):
        modid=f'module_{position:02d}'
        mod=child(modulemeta,'module',identifier=modid)
        for tag,value in [('title',title),('workflow_state','unpublished'),('position',position),('require_sequential_progress','false')]:
            child(mod,tag,value)
        moditems=child(mod,'items')
        orgitem=child(rootitem,'item',identifier=modid)
        child(orgitem,'title',title)
        for j,(name,label,kind) in enumerate(items,1):
            ref=('page_' if kind=='WikiPage' else 'quiz_' if kind=='Quizzes::Quiz' else 'assignment_')+name
            itemid=f'{modid}_item_{j}'
            it=child(moditems,'item',identifier=itemid)
            for tag,value in [('content_type',kind),('workflow_state','unpublished'),('title',label),('identifierref',ref),('position',j),('new_tab','false'),('indent',0)]:
                child(it,tag,value)
            oit=child(orgitem,'item',identifier=itemid,identifierref=ref)
            child(oit,'title',label)
    PACKAGE['course_settings/module_meta.xml']=xml(modulemeta)
    course=ET.Element('course',{'xmlns':CANVAS,'identifier':'course_algebra1'})
    for tag,value in [('title','Algebra 1 · Patterns, Decisions, and Evidence'),('course_code','ALG1-PORTFOLIO'),('default_view','wiki'),('public_syllabus','false')]:
        child(course,tag,value)
    PACKAGE['course_settings/course_settings.xml']=xml(course)
    PACKAGE['course_settings/canvas_export.txt']=b'Canvas-flavored Common Cartridge authored for Robert Schmitz. Import validation pending.\n'
    settings=child(resources,'resource',identifier='canvas_settings',type=LOR,href='course_settings/canvas_export.txt')
    for path in ['course_settings/canvas_export.txt','course_settings/course_settings.xml','course_settings/module_meta.xml']:
        child(settings,'file',href=path)
    for name,title,questions in ASSESSMENTS:
        res=child(resources,'resource',identifier='quiz_'+name,type='imsqti_xmlv1p2/imscc_xmlv1p1/assessment')
        child(res,'file',href=f'quiz_{name}/assessment_qti.xml')
        child(res,'dependency',identifierref='quiz_meta_'+name)
        metares=child(resources,'resource',identifier='quiz_meta_'+name,type=LOR,href=f'quiz_{name}/assessment_meta.xml')
        child(metares,'file',href=f'quiz_{name}/assessment_meta.xml')
        child(metares,'file',href=f'non_cc_assessments/quiz_{name}.xml.qti')
    for name,title,body in ASSIGNMENTS:
        res=child(resources,'resource',identifier='assignment_'+name,type=LOR,href=f'assignment_{name}/assignment.html')
        child(res,'file',href=f'assignment_{name}/assignment.html')
        child(res,'file',href=f'assignment_{name}/assignment_settings.xml')
    PACKAGE['imsmanifest.xml']=xml(manifest)
    # Keep portable graph SVGs as inline markup in preview. Canvas sanitizers vary:
    # export each as an image file with full equivalent text retained below it.
    for name,graph_html in GRAPHS.items():
        svg=re.search(r'<svg\b.*?</svg>',graph_html,re.S).group(0)
        graphpath=f'web_resources/{name}.svg'
        PACKAGE[graphpath]=svg.encode('utf-8')
        path=f'wiki_content/{name}.html'
        html=PACKAGE[path].decode('utf-8')
        html=html.replace(svg,f'<img src="$IMS-CC-FILEBASE$/{graphpath}" alt="{e(PAGES[name][0],quote=True)} coordinate plot; full description follows" width="640" height="380">')
        PACKAGE[path]=html.encode('utf-8')
        res=child(resources,'resource',identifier='graph_'+name,type='webcontent',href=graphpath)
        child(res,'file',href=graphpath)
    PACKAGE['web_resources/scribble-guide.webp']=BRAND_IMAGE.read_bytes()
    brandres=child(resources,'resource',identifier='brand_scribble',type='webcontent',href='web_resources/scribble-guide.webp')
    child(brandres,'file',href='web_resources/scribble-guide.webp')
    # Resource additions above change the manifest tree.
    PACKAGE['imsmanifest.xml']=xml(manifest)
    with zipfile.ZipFile(DOWNLOADS/'algebra1-canvas-course.imscc','w',zipfile.ZIP_DEFLATED) as out:
        for path,data in sorted(PACKAGE.items()):
            info=zipfile.ZipInfo(path,(2026,10,22,0,0,0))
            info.compress_type=zipfile.ZIP_DEFLATED
            out.writestr(info,data)


def write_teacher_guide():
    body='<h1>Algebra 1 · Instructor and import guide</h1>'+p('Original course draft for Robert Schmitz’s portfolio. Built October 22, 2026. This file includes application-task guidance and assessment keys. The public preview is for inspection and formative practice; its questions and answers are not a secure test bank.')
    body+='<h2>What is included</h2>'+list_html(['10 instructional units with 40 core lessons.','120 practice questions with explanations and 40 error-repair prompts.','12 QTI 1.2 self-checks: readiness (8 questions), ten unit quizzes (5 each), and cumulative review (10); 68 questions total.','10 Canvas assignment resources, 12 points each, with an embedded four-criterion rubric.','12 ordered modules: orientation, ten units, and synthesis.','A course home, pacing map, learning-support page, and text alternatives for plotted examples.'])
    body+='<h2>Import into a new empty course</h2>'+list_html(['Use a Canvas account that permits course creation and content import. Instructure offers individual access through Canvas Lite; confirm the current features for your account.','Create an empty Algebra 1 course; keep it unpublished during review.','Open Settings → Import Course Content. Select Common Cartridge 1.x Package, choose algebra1-canvas-course.imscc, and import all content. If your instance directs Canvas-flavored packages to Canvas Course Export Package, use that option.','Review the import job for warnings. Confirm the home page, 12 modules, 40 lessons, 12 quizzes, and 10 assignments. The package marks pages, modules, and assignments unpublished; review the resulting quiz availability too.','If the home page is not selected automatically, mark the imported course home as Front Page and choose Pages Front Page as the course home.','In Student View, inspect internal links, plots, quiz feedback and scoring, and assignment submissions. No dates, enrollment, or secure exam rules are configured.','Set dates, local grade policy, accommodation settings, and visibility. The rubric is embedded in each assignment description; create a native SpeedGrader rubric if desired.','Publish only after the mathematical, accessibility, and import review is complete.'],True)
    body+='<h2>Validation boundary</h2>'+p('Package structure, identifiers, links, question scoring declarations, and source-content arithmetic are checked offline. This is not an export from a live Canvas instance. No successful Canvas import, screen-reader audit, or learner pilot is claimed. The preview is a separate static website, not a Canvas interface or gradebook.')
    body+='<h2>Pacing and instruction</h2>'+p('Use 2 weeks for readiness and prerequisite support, 3 weeks per unit (30 weeks), and 4 flexible weeks for review, applications, and synthesis. Each unit has four compact core lessons, so allocate other meetings to worked discussion, additional practice, conferences, and revision. Local standards may require additional topics. Select supplementary tasks after inspecting student work; do not equate reading the pages with mastery.')
    body+='<h2>Suggested lesson routine</h2>'+list_html(['5 minutes: prerequisite retrieval and launch.','10–15 minutes: model and discuss the worked example.','10 minutes: analyze the misconception with a partner.','15–20 minutes: independent practice and explanation checks.','5 minutes: exit explanation, teacher observation, and next-step grouping.'])
    body+='<h2>Differentiation</h2>'+list_html(['Support: annotate operations and units; use signed-number or fraction examples before symbolic generalization.','Language: preteach input, output, intercept, constraint, and residual with examples and nonexamples.','Extension: change a condition, compare methods, or construct a counterexample; do not merely increase the size of the numbers.','Formative response: use errors to decide between a short individual conference, a small-group model, and additional independent practice.'])
    body+='<h2>Application scoring</h2>'+RUBRIC+p('Use the four criteria as analytic feedback, 0–3 each, totaling 12. Allow revision after feedback. Native Canvas rubric associations are not configured in the package; the rubric travels as readable assignment content.')
    for i,u in enumerate(UNITS,1):
        body+=f'<h2>Unit {i} · {e(u["title"])}</h2><h3>Application task guidance</h3>'+p(u['teacher'])+'<h3>Quiz key and explanations</h3>'
        body+=list_html([q[1][q[2]]+' — '+q[3] for q in u['quiz']],True)
    for title,questions in [('Readiness check',DIAGNOSTIC),('Cumulative check',FINAL)]:
        body+='<h2>'+title+'</h2>'+list_html([q[1][q[2]]+' — '+q[3] for q in questions],True)
    body+='<h2>Source references</h2><ul><li><a href="https://www.instructure.com/try-canvas">Instructure: Canvas Lite</a></li><li><a href="https://community.instructure.com/en/kb/articles/660732-unknown">Instructure: Common Cartridge import</a></li><li><a href="https://github.com/instructure/canvas-lms/tree/master/lib/cc">Instructure: Common Cartridge exporter source, for package structure reference</a></li><li><a href="https://www.thecorestandards.org/Math/Content/HSA/">Common Core Algebra</a></li><li><a href="https://www.thecorestandards.org/Math/Content/HSF/">Common Core Functions</a></li><li><a href="https://www.thecorestandards.org/Math/Content/HSS/ID/">Common Core Data</a></li></ul>'
    (DOWNLOADS/'instructor-guide.html').write_text('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Algebra 1 instructor guide</title><style>'+CSS+'</style></head><body><main style="max-width:960px;margin:2rem auto">'+body+'</main></body></html>',encoding='utf-8')


if __name__ == '__main__':
    build_pages()
    write_preview()
    write_package()
    write_teacher_guide()
    print(json.dumps({'preview_pages':len(PAGES),'units':len(UNITS),'lessons':sum(len(u['lessons']) for u in UNITS),'practice_questions':sum(len(l['practice']) for u in UNITS for l in u['lessons']),'quizzes':len(ASSESSMENTS),'quiz_questions':sum(len(q[2]) for q in ASSESSMENTS),'application_assignments':len(ASSIGNMENTS),'modules':len(MODULES),'package_files':len(PACKAGE)},indent=2))
