// Pure mathematics and evidence functions. No browser, network, or dependencies.
export const VERSION = 8;
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
// Each setting has its own model. Stage: distance remaining to the mark falls to zero
// (negative slope; the x-intercept is the arrival time). Pool: distance from the start
// wall rises to the far wall (positive slope; solve y = 12 for the arrival time).
export const POOL_LENGTH=12;
export const SCENARIOS={
  stage:{id:'stage',kind:'remaining',m:-.75,b:6,target:0,arrival:8,
    predict:{start:6,change:3,after:4,at4:3},
    guided:{b:9,arrival:12},
    diagnose:{m:-4/3,point:[3,2],arrival:4.5,run:4,rise:3},
    nextPoint:'4,3',
    cue:{goal:6,original:8,timing:'late',pace:[.5,.75,1,1.25,1.5],start:[3,4.5,6,7.5,9],paceIndex:1,startIndex:2,fixSpeed:1,fixStart:4.5},
    transfer:{m:-.5,b:5,arrival:10,target:0}},
  pool:{id:'pool',kind:'traveled',m:1.5,b:3,target:POOL_LENGTH,arrival:6,
    predict:{start:3,change:6,after:4,at4:9},
    guided:{b:0,arrival:8},
    diagnose:{m:2/3,point:[3,5],arrival:13.5,run:2,rise:3},
    nextPoint:'2,6',
    cue:{goal:5,original:6,timing:'late',pace:[.9,1.2,1.5,1.8,2.1],start:[1.5,3,4.5,6,7.5],paceIndex:2,startIndex:1,fixSpeed:1.8,fixStart:4.5},
    transfer:{m:.8,b:4,arrival:10,target:POOL_LENGTH}}
};
export const scenario=id=>SCENARIOS[id]||SCENARIOS.stage;
// Signed slope for a steady speed in this setting.
export const slopeFor=(sc,speed)=>sc.kind==='remaining'?-speed:speed;
// Seconds until the model reaches its target value (zero remaining, or the far wall).
export const arrivalFor=(sc,b,speed)=>sc.kind==='remaining'?b/speed:(sc.target-b)/speed;
// Model value at time t, held at the target after arrival.
export const positionAt=(sc,b,speed,t)=>sc.kind==='remaining'?remaining(b,speed,t):Math.min(sc.target,b+speed*Math.max(0,t));
const mathFmt=n=>Number.isInteger(n)?String(n):Number(n.toFixed(3)).toString();
const exactCoefficient=m=>close(Math.abs(m),2/3)?'(2/3)':close(Math.abs(m),.75)?'(3/4)':close(Math.abs(m),.5)?'(1/2)':close(Math.abs(m),1.5)?'(3/2)':close(Math.abs(m),.8)?'(4/5)':mathFmt(Math.abs(m));
export const equationText=(m,b)=>m===0?`y = ${mathFmt(b)}`:`y = ${m<0?'-':''}${Math.abs(m)===1?'':exactCoefficient(m)}x ${b<0?'-':'+'} ${mathFmt(Math.abs(b))}`;
export const spokenEquation=(m,b)=>{if(m===0)return `y equals ${mathFmt(b)}`;const magnitude=close(Math.abs(m),2/3)?'two thirds':close(Math.abs(m),.75)?'three fourths':close(Math.abs(m),.5)?'one half':close(Math.abs(m),1.5)?'three halves':close(Math.abs(m),.8)?'four fifths':mathFmt(Math.abs(m));return `y equals ${m<0?'negative ':''}${Math.abs(m)===1?'x':magnitude+' times x'} ${b<0?'minus':'plus'} ${mathFmt(Math.abs(b))}`;};
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
export function checkCue(route,index,equation,sc=SCENARIOS.stage) {
  if(!['pace','start'].includes(route)||!Number.isInteger(index)||index<0||index>4) throw new InputError('Choose one of the five plans.');
  const speed=route==='pace'?sc.cue.pace[index]:Math.abs(sc.m);
  const b=route==='start'?sc.cue.start[index]:sc.b;
  const seconds=arrivalFor(sc,b,speed), timing=close(seconds,sc.cue.goal);
  const equationMatches=equation&&close(equation.m,slopeFor(sc,speed))&&close(equation.b,b);
  return {route,index,speed,b,seconds,timing,equationMatches:!!equationMatches,correct:timing&&!!equationMatches};
}
export function checkTransfer({start,arrival:seconds,rate,domain},sc=SCENARIOS.stage) {
  const t=sc.transfer,result={start:close(start,t.b),arrival:close(seconds,t.arrival),rate:rate===(t.m<0?'decrease':'increase'),domain:domain==='segment'};
  return {...result,correct:Object.values(result).every(Boolean)};
}
export function initialState() {return {version:VERSION,evidenceSchema:2,context:null,section:0,records:{},drafts:{},miniRecords:{},miniDrafts:{},supports:{},cueExplored:[],createdAt:new Date().toISOString(),updatedAt:null};}
const clone=v=>JSON.parse(JSON.stringify(v));
// The two settings use different numbers, so work is kept per setting. Moving to the
// other setting parks the current setting's work and restores any saved work for it.
export const PER_CONTEXT=['records','drafts','miniRecords','miniDrafts','supports','cueExplored'];
export function switchContext(state,context){
  const next=clone(state);if(next.context===context)return next;
  if(next.context){next.parked??={};next.parked[next.context]=Object.fromEntries(PER_CONTEXT.map(k=>[k,next[k]]));}
  const restore=next.parked?.[context],fresh=initialState();
  for(const k of PER_CONTEXT)next[k]=restore?.[k]??fresh[k];
  if(next.parked)delete next.parked[context];
  next.context=context;return next;
}
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
export function checkRateMeaning({sign,unit},sc=SCENARIOS.stage){const parts={sign:sign===(sc.m<0?'negative':'positive'),unit:unit==='meters-per-second'};return {...parts,correct:Object.values(parts).every(Boolean)};}
export const checkNextPoint=(choice,sc=SCENARIOS.stage)=>({correct:choice===sc.nextPoint});
// atZeroDistance holds the arrival reading: x at y = 0 (stage) or x at y = 12 (pool).
export function checkInterceptMeaning({atZeroTime,atZeroDistance},sc=SCENARIOS.stage){const parts={atZeroTime:atZeroTime===sc.b+'meters',atZeroDistance:atZeroDistance===sc.arrival+'seconds'};return {...parts,correct:Object.values(parts).every(Boolean)};}
export const checkOriginalCue=(choice,sc=SCENARIOS.stage)=>({correct:choice===sc.cue.timing,originalArrival:sc.cue.original,cue:sc.cue.goal});
export const checkHorizontalCrossing=choice=>({correct:choice==='never'});
export function segmentFromPrediction({start,arrival:seconds},sc=SCENARIOS.stage){
  if(!Number.isFinite(start)||!Number.isFinite(seconds)||start<0||seconds<=0)throw new InputError('Use nonnegative starting meters and a positive arrival time to preview your segment.');
  const end=sc.transfer.target;return {x1:0,y1:start,x2:seconds,y2:end,m:(end-start)/seconds,b:start};
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
// Every learner does both settings, in this order: the stage first, then the pool.
export const ORDER=['stage','pool'];
export function startSequence(state){return state.context?state:switchContext(state,ORDER[0]);}
// Work for the setting in use lives at the top level; the other setting's work is parked.
export const partWork=(state,ctx)=>state.context===ctx?{records:state.records,supports:state.supports}:{records:state.parked?.[ctx]?.records||{},supports:state.parked?.[ctx]?.supports||{}};
export const partComplete=(state,ctx)=>CORE.every(id=>!!partWork(state,ctx).records[id]);
// The next setting still to finish after this one, in lesson order (null when both are done).
export const nextPart=state=>ORDER.find(ctx=>ctx!==state.context&&!partComplete(state,ctx))??null;
export const complete=state=>!!state.context&&ORDER.every(ctx=>partComplete(state,ctx));
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
