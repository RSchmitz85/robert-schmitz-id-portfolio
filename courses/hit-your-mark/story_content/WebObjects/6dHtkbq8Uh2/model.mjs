// Pure mathematics and evidence functions. No browser, network, or dependencies.
export const VERSION = 7;
export const CORE = ['predict','roles','guided','diagnose','cue','independent','transfer'];
export class InputError extends Error {}
export function number(raw) {
  const s=String(raw??'').trim().replace(/−/g,'-');
  if(!s) throw new InputError('Enter a number. Zero is a valid number.');
  if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:\s*\/\s*[+-]?(?:\d+(?:\.\d*)?|\.\d+))?$/.test(s)) throw new InputError('Use a signed number, decimal, or fraction such as -3/4.');
  const p=s.split('/').map(x=>Number(x.trim()));
  if(p.length===2&&p[1]===0) throw new InputError('A fraction cannot have zero in its denominator.');
  const n=p.length===2?p[0]/p[1]:p[0];
  if(!Number.isFinite(n)||Math.abs(n)>1000) throw new InputError('Use a number between -1000 and 1000.');
  return n;
}
export const close=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<=1e-7*Math.max(1,Math.abs(a),Math.abs(b));
export const arrival=(b,speed)=>b/speed;
export const remaining=(b,speed,t)=>Math.max(0,b-speed*Math.max(0,t));
const mathFmt=n=>Number.isInteger(n)?String(n):Number(n.toFixed(3)).toString();
const exactCoefficient=m=>close(Math.abs(m),2/3)?'(2/3)':close(Math.abs(m),.75)?'(3/4)':close(Math.abs(m),.5)?'(1/2)':mathFmt(Math.abs(m));
export const equationText=(m,b)=>m===0?`y = ${mathFmt(b)}`:`y = ${m<0?'-':''}${Math.abs(m)===1?'':exactCoefficient(m)}x ${b<0?'-':'+'} ${mathFmt(Math.abs(b))}`;
export const spokenEquation=(m,b)=>{if(m===0)return `y equals ${mathFmt(b)}`;const magnitude=close(Math.abs(m),2/3)?'two thirds':close(Math.abs(m),.75)?'three fourths':close(Math.abs(m),.5)?'one half':mathFmt(Math.abs(m));return `y equals ${m<0?'negative ':''}${Math.abs(m)===1?'x':magnitude+' times x'} ${b<0?'minus':'plus'} ${mathFmt(Math.abs(b))}`;};
export const onLine=(x,y,m,b)=>close(y,m*x+b);
export function checkGraph(p,m,b,{intercept=true,xIntercept,direction}={}) {
  const first=intercept?p.x1===0&&close(p.y1,b):onLine(p.x1,p.y1,m,b);
  const distinct=p.x1!==p.x2;
  const second=onLine(p.x2,p.y2,m,b);
  const line=first&&distinct&&second;
  const actualX=m===0?null:-b/m;
  const xi=xIntercept===undefined?true:actualX===null?xIntercept===null:close(xIntercept,actualX);
  const dir=direction===undefined?true:direction===(m>0?'rises':m<0?'falls':'level');
  return {first,distinct,second,line,xIntercept:xi,direction:dir,correct:line&&xi&&dir};
}
export function checkCue(route,index,equation) {
  if(!['pace','start'].includes(route)||!Number.isInteger(index)||index<0||index>4) throw new InputError('Choose one of the five plans.');
  const speed=route==='pace'?[.5,.75,1,1.25,1.5][index]:.75;
  const b=route==='start'?[3,4.5,6,7.5,9][index]:6;
  const seconds=arrival(b,speed), timing=close(seconds,6);
  const equationMatches=equation&&close(equation.m,-speed)&&close(equation.b,b);
  return {route,index,speed,b,seconds,timing,equationMatches:!!equationMatches,correct:timing&&!!equationMatches};
}
export function checkTransfer({start,arrival:seconds,rate,domain}) {
  const result={start:close(start,5),arrival:close(seconds,10),rate:rate==='decrease',domain:domain==='segment'};
  return {...result,correct:Object.values(result).every(Boolean)};
}
export function initialState() {return {version:VERSION,evidenceSchema:2,context:null,section:0,records:{},drafts:{},miniRecords:{},miniDrafts:{},supports:{},cueExplored:[],createdAt:new Date().toISOString(),updatedAt:null};}
const clone=v=>JSON.parse(JSON.stringify(v));
export const isMathSupport=kind=>!['read-scene','text-alternative','captions','transcript'].includes(kind);
export const hasMathSupport=kinds=>(kinds||[]).some(isMathSupport);
export function addSupport(state,id,kind) {
  const next=clone(state); next.supports[id]??=[];
  if(!next.supports[id].includes(kind))next.supports[id].push(kind);
  return next;
}
export function submit(state,id,response,result,{supported=false}={}) {
  const next=clone(state), old=next.records[id];
  const kinds=clone(next.supports[id]||[]),assessed=!result.ungraded&&!supported;
  const checkedResult={...clone(result),...(supported?{ungraded:true}:{}),correct:assessed?!!result.correct:null};
  const attempt={response:clone(response),result:checkedResult,correct:assessed?!!result.correct:null,assessed,supports:kinds,supported:!!supported||hasMathSupport(kinds),usedWorkedComparison:!!supported,at:new Date().toISOString()};
  next.records[id]={first:old?.first||clone(attempt),latest:clone(attempt),attempts:(old?.attempts||0)+1,history:[...(old?.history||[]),clone(attempt)]};
  next.updatedAt=attempt.at; return next;
}
export const MINI_IDS=['rateMeaning','nextPoint','interceptMeaning','originalCue','transferSegment','horizontalCrossing'];
export function submitMini(state,id,response,result,opts) {
  if(!MINI_IDS.includes(id))throw new InputError('Unknown mini activity.');
  const next=clone(state), shadow=submit({...next,records:next.miniRecords||{}},id,response,result,opts);
  next.miniRecords=shadow.records;next.updatedAt=shadow.updatedAt;return next;
}
export function checkRateMeaning({sign,unit}){const parts={sign:sign==='negative',unit:unit==='meters-per-second'};return {...parts,correct:Object.values(parts).every(Boolean)};}
export const checkNextPoint=choice=>({correct:choice==='4,3'});
export function checkInterceptMeaning({atZeroTime,atZeroDistance}){const parts={atZeroTime:atZeroTime==='6meters',atZeroDistance:atZeroDistance==='8seconds'};return {...parts,correct:Object.values(parts).every(Boolean)};}
export const checkOriginalCue=choice=>({correct:choice==='late',originalArrival:8,cue:6});
export const checkHorizontalCrossing=choice=>({correct:choice==='never'});
export function segmentFromPrediction({start,arrival:seconds}){
  if(!Number.isFinite(start)||!Number.isFinite(seconds)||start<0||seconds<=0)throw new InputError('Use nonnegative starting meters and a positive arrival time to preview your segment.');
  return {x1:0,y1:start,x2:seconds,y2:0,m:-start/seconds,b:start};
}
export const miniEvidence=record=>!record?'Not yet tried':record.latest.result.ungraded?'Saved for comparison':evidence(record,record.latest.supports);
export function canViewExplanation(state,name){
  const core={'slope-swap':'diagnose','cue-change':'cue','positive-slope':'independent','horizontal-line':'practiceC'}[name];
  if(!core)return true;
  if(state.supports[core]?.includes('video-request:'+name))return true;
  if(name==='cue-change')return !!state.miniRecords?.originalCue&&!!state.records.cue;
  return !!state.records[core];
}
export function evidence(record,supports=[]) {
  if(!record)return 'Not yet submitted';
  if(hasMathSupport(supports)||record.latest.supported||hasMathSupport(record.latest.supports))return 'Support used';
  if(record.first.correct)return 'First attempt correct';
  if(record.latest.correct)return 'Revised after feedback';
  return 'Submitted — review feedback';
}
export const complete=state=>!!state.context&&CORE.every(id=>!!state.records[id]);
export const canOfferSupport=record=>!!record&&record.attempts>=2&&!record.latest.correct&&!(record.latest.usedWorkedComparison??!!(record.latest.result?.workedComparison||(record.latest.supported&&!record.latest.supports?.length)));
// Metadata migration keeps response/history content and timestamps intact while
// making earlier v7 support and ungraded flags unambiguous on restore/download.
export function normalizeStateEvidence(state){
  const next=clone(state);
  const normalize=a=>{
    if(!a)return a;
    const kinds=a.supports||[],worked=a.usedWorkedComparison??!!(a.result?.workedComparison||(a.supported&&kinds.length===0));
    const assessed=worked?false:(a.assessed??!a.result?.ungraded);
    return {...a,result:{...a.result,...(worked?{ungraded:true}:{}),correct:assessed?a.result?.correct??a.correct:null},correct:assessed?a.correct:null,assessed,supported:worked||hasMathSupport(kinds),usedWorkedComparison:worked};
  };
  for(const bucket of ['records','miniRecords'])for(const record of Object.values(next[bucket]||{})){
    record.first=normalize(record.first);record.latest=normalize(record.latest);record.history=(record.history||[]).map(normalize);
  }
  next.evidenceSchema=2;return next;
}
export const practice=[{id:'practiceA',title:'A · A new downward line',m:-2,b:4},{id:'practiceB',title:'B · A gentle rise',m:.5,b:-1},{id:'practiceC',title:'C · A constant value',m:0,b:3}];
