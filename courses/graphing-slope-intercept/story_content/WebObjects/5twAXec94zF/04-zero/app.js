'use strict';
// Self-contained Storyline Web Object. No network, tracking, or score changes.
const $=id=>document.getElementById(id), NS='http://www.w3.org/2000/svg';
let points=[];
function svg(tag,attrs,parent){const el=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));parent.append(el);return el;}
const sx=x=>280+x*40,sy=y=>280-y*40;
for(let n=-6;n<=6;n++){
  svg('line',{x1:sx(n),x2:sx(n),y1:40,y2:520,stroke:n===0?'#06254b':'#a89d80','stroke-width':n===0?2:1},$('grid'));
  svg('line',{y1:sy(n),y2:sy(n),x1:40,x2:520,stroke:n===0?'#06254b':'#a89d80','stroke-width':n===0?2:1},$('grid'));
  if(n!==0){svg('text',{x:sx(n),y:299,'text-anchor':'middle'},$('grid')).textContent=n;svg('text',{x:267,y:sy(n)+4,'text-anchor':'end'},$('grid')).textContent=n;}
}
svg('text',{x:267,y:299,'text-anchor':'end'},$('grid')).textContent='0';
svg('text',{x:541,y:284},$('grid')).textContent='x';
svg('text',{x:276,y:23},$('grid')).textContent='y';
function tell(title,body){$('feedback').replaceChildren();const h=document.createElement('h2'),p=document.createElement('p');h.textContent=title;p.textContent=body;$('feedback').append(h,p);stackFractions($('feedback'));}
function render(){
  document.querySelector('main').classList.remove('solved');
  $('points').replaceChildren();$('drawing').replaceChildren();
  if(points.length===2){
    const [a,b]=points,dx=b.x-a.x,dy=b.y-a.y;
    let hits=[];
    if(dx!==0)for(const x of [-6,6]){const y=a.y+(x-a.x)*dy/dx;if(y>=-6&&y<=6)hits.push({x,y});}
    if(dy!==0)for(const y of [-6,6]){const x=a.x+(y-a.y)*dx/dy;if(x>=-6&&x<=6&&!hits.some(p=>Math.abs(p.x-x)<1e-9&&Math.abs(p.y-y)<1e-9))hits.push({x,y});}
    if(hits.length>=2)svg('line',{x1:sx(hits[0].x),y1:sy(hits[0].y),x2:sx(hits[1].x),y2:sy(hits[1].y),stroke:'#17767a','stroke-width':3,'marker-start':'url(#arrow)','marker-end':'url(#arrow)'},$('drawing'));
  }
  points.forEach((p,i)=>{svg('circle',{cx:sx(p.x),cy:sy(p.y),r:7,fill:i===0?'#a85020':'#17767a',stroke:'#fffaf0','stroke-width':2},$('points'));});
  const description=points.length?points.map((p,i)=>`Point ${i+1}: (${p.x}, ${p.y})`).join('; '):'none yet';
  $('point-list').textContent='Your points: '+description+'.';
  $('graph-description').textContent='Coordinate plane from negative 6 to positive 6. '+description+(points.length===2?'. A straight line connects the points.':'');
  $('plot-prompt').textContent=['Plot the intercept','Add a second point','Check your line'][points.length];
  $('check').disabled=points.length!==2;$('undo').disabled=$('reset').disabled=points.length===0;
  $('plot').disabled=points.length===2;
  [1,2,3].forEach(n=>$('step'+n).classList.toggle('active',n===points.length+1));
}
function add(x,y){
  if(!Number.isInteger(x)||!Number.isInteger(y)||Math.abs(x)>6||Math.abs(y)>6){tell('Use a grid intersection.','Enter whole numbers from −6 to 6 for both coordinates.');return;}
  if(points.length===2){tell('Two points are already plotted.','Check your graph, or select Undo to replace your second point.');return;}
  if(points.some(p=>p.x===x&&p.y===y)){tell('Choose a different point.','A line needs two distinct points. Use the slope to move from your first point.');return;}
  points.push({x,y});render();
  if(points.length===1)tell('Now use the slope.',TASK.afterFirst);
  else tell('Your line is ready to check.','Look at where your line crosses the y-axis and how it changes from left to right. Then select Check my graph.');
}
$('graph').addEventListener('click',e=>{const p=new DOMPoint(e.clientX,e.clientY).matrixTransform($('graph').getScreenCTM().inverse());if(p.x<40||p.x>520||p.y<40||p.y>520)return;add(Math.round((p.x-280)/40),Math.round((280-p.y)/40));});
$('coordinates').addEventListener('submit',e=>{e.preventDefault();if($('x').value===''||$('y').value==='')return;add(Number($('x').value),Number($('y').value));});
$('check').addEventListener('click',()=>{
  if(points.length!==2)return;const [a,b]=points;
  if(a.x!==0||a.y!==TASK.b){tell('Check the intercept.',`Here b = ${TASK.b}. Start at (0, ${TASK.b}) on the y-axis. Select Reset to begin again.`);return;}
  if(b.x===a.x){tell('Your line is vertical.',TASK.num===0?'A zero slope makes a horizontal line. Move left or right without changing y. Select Undo.':'This equation needs a nonvertical line. Move horizontally using the slope, then try again with Undo.');return;}
  if(TASK.den*(b.y-a.y)!==TASK.num*(b.x-a.x)){tell('Check your slope.',TASK.hint+' Select Undo and try again.');return;}
  tell('You graphed it!',`Your line crosses at (0, ${TASK.b}) and has slope ${TASK.slope}. Both plotted points fit the equation.`);
  document.querySelector('main').classList.add('solved');

});
$('undo').addEventListener('click',()=>{points.pop();render();tell(points.length?'Try another second point.':'Start with b.',points.length?'Use the slope to find a different point on the line.':'Plot the y-intercept first, then use the slope.');});
$('reset').addEventListener('click',()=>{points=[];$('x').value=0;$('y').value=0;render();tell('A fresh start.','Plot the y-intercept first, then use the slope to find a second point.');});
render();

function stackFractions(root){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
 while(walker.nextNode())nodes.push(walker.currentNode);
 for(const node of nodes){
  const pattern=/([−-]?)(\d+)\/(\d+)/g,source=node.textContent;
  if(!pattern.test(source))continue;pattern.lastIndex=0;
  const fragment=document.createDocumentFragment();let last=0,match;
  while((match=pattern.exec(source))){
   fragment.append(document.createTextNode(source.slice(last,match.index)));
   const ns='http://www.w3.org/1998/Math/MathML',math=document.createElementNS(ns,'math');
   math.setAttribute('aria-label',(match[1]?'negative ':'')+match[2]+' over '+match[3]);
   const row=document.createElementNS(ns,'mrow');
   if(match[1]){const sign=document.createElementNS(ns,'mo');sign.textContent='−';row.append(sign);}
   const frac=document.createElementNS(ns,'mfrac');
   for(const value of [match[2],match[3]]){const number=document.createElementNS(ns,'mn');number.textContent=value;frac.append(number);}
   row.append(frac);math.append(row);fragment.append(math);last=pattern.lastIndex;
  }
  fragment.append(document.createTextNode(source.slice(last)));node.replaceWith(fragment);
 }
}
stackFractions(document.querySelector('.equation'));
stackFractions($('feedback'));
