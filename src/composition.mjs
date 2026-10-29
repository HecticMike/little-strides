import {planningMetadata} from './catalog.mjs';
// Deterministic bounded search: hard capacity checks are supplied by the planner.
// Scores express product preferences, never medical effectiveness or force estimates.
export const COMPOSITION_WEIGHTS = Object.freeze({duplicate:-150,positionChange:-60,newMovement:8,blockCost:-5,restPer15:-2});
const BEAM=4;
export function compose(minutes,pool,initial,config,settings,focus,{fits,add,variety={}}) {
  if(!pool.length)return null;
  const recent=variety;
  const small=minutes===3, setup=small?30:15, finish=small?30:15;
  const target=minutes*60,meta=new Map(pool.map(e=>[e.id,planningMetadata(e,settings)]));
  const buckets=Array.from({length:target/15+1},()=>[]),minimumActive=target*(small?.5:.60);
  const start={time:setup,score:0,blocks:[],load:{used:{...initial.used},strength:{...initial.strength},jointUsed:{...initial.jointUsed}},counts:{},totals:{strength:0,activation:0,mobility:0,aerobic:0},active:0};
  buckets[setup/15].push(start);let best=null;
  function contribution(e,before,seconds){
    const kind=e.loadKind,first=Math.min(seconds,Math.max(0,(kind==='aerobic'?Math.min(focus==='cardio'?600:360,target*(focus==='cardio'?.7:.4)):90)-before));
    const weights=focus==='cardio'?{strength:4,activation:1,mobility:2,aerobic:12}:focus==='core'?{strength:16,activation:5,mobility:3,aerobic:0}:focus==='recovery'?{strength:0,activation:5,mobility:5,aerobic:0}:{strength:e.muscles?.includes('trunk')?30:13,activation:3,mobility:3,aerobic:10};
    return (first*weights[kind]+(seconds-first)*(kind==='strength'?weights[kind]:kind==='aerobic'?3:.5))/15;
  }
  for(let slot=1;slot<buckets.length;slot++){
    const unique=new Map();
    for(const node of buckets[slot]){
      const last=node.blocks.at(-1),key=pool.map(e=>(node.load.used[e.id]||0)+':'+(node.counts[e.id]||0)).join(',')+'|'+(last?.e.id||'');
      if(!unique.has(key)||unique.get(key).score<node.score)unique.set(key,node);
    }
    const groups=new Map();
    for(const n of unique.values()){const key=(n.blocks[0]?.e.position||'setup')+':'+(n.blocks.at(-1)?.e.position||'setup');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(n);}
    const nodes=[...groups.values()].flatMap(group=>group.sort((a,b)=>b.score-a.score).slice(0,BEAM));
    // Discard processed paths to keep mobile memory bounded.
    buckets[slot]=[];
    for(const node of nodes){
      const last=node.blocks.at(-1);
      if(node.time+finish===target&&node.active>=minimumActive&&last?.e.loadKind!=='strength'){
        const cardioShare=node.totals.aerobic/node.active;
        if(focus==='cardio'&&(node.totals.aerobic<120||cardioShare<.4))continue;
        const arranged=arrange(node.blocks),duplicates=blocks=>blocks.filter((b,i)=>i&&b.e.id===blocks[i-1].e.id).length;
        const score=node.score+(duplicates(node.blocks)-duplicates(arranged))*-COMPOSITION_WEIGHTS.duplicate;
        if(!best||score>best.score)best={...node,blocks:arranged,score};
      }
      for(const e of pool){
        const m=meta.get(e.id),count=node.counts[e.id]||0;
        if(!last&&e.loadKind==='strength')continue;
        if(count>=m.maxBlocks)continue;
        const change=last&&last.e.position!==e.position;
        if(small&&change)continue;
        if(settings.exerciseProfile&&change&&node.blocks.some(b=>b.change))continue;
        const gap=last?Math.max(meta.get(last.e.id).restSeconds,change?m.transitionSeconds:0):(!small&&e.position==='floor'?30:0);
        const maximum=node.blocks.length?m.maxSeconds:Math.min(60,m.maxSeconds);
        const options=[...new Set([m.minSeconds,m.preferredSeconds,maximum,45,60,90,120,180])].filter(s=>s>=m.minSeconds&&s<=maximum&&s%15===0);
        // Exact final blocks may be shorter than the preferred continuous period.
        const exact=target-finish-node.time-gap;if(exact>=m.minSeconds&&exact<=maximum&&exact%15===0&&!options.includes(exact))options.push(exact);
        for(const seconds of options){
          const time=node.time+gap+seconds;if(time===target-finish&&e.loadKind==='strength')continue;
          if(time>target-finish||!fits(e,seconds*1000,node.load,config))continue;
          const load={used:{...node.load.used},strength:{...node.load.strength},jointUsed:{...node.load.jointUsed}};add(e,seconds*1000,load);
          const totals={...node.totals,[e.loadKind]:node.totals[e.loadKind]+seconds};
          if(time===target-finish&&(node.active+seconds<minimumActive||focus==='cardio'&&(totals.aerobic<120||totals.aerobic/(node.active+seconds)<.4)))continue;
          let score=node.score+contribution(e,node.totals[e.loadKind],seconds)+COMPOSITION_WEIGHTS.blockCost+gap/15*COMPOSITION_WEIGHTS.restPer15;
          if(!count)score+=COMPOSITION_WEIGHTS.newMovement-(recent[e.id]||0);
          if(settings.exerciseProfile?.coreEmphasis&&focus==='balanced'&&e.focus==='core'&&!count)score+=45;
          if(!last&&e.loadKind==='aerobic')score+=10;
          if(e.loadKind==='strength'&&!count&&focus!=='cardio')score+=e.muscles?.includes('trunk')?100:20;
          if(last?.e.id===e.id)score+=COMPOSITION_WEIGHTS.duplicate;
          if(change)score+=COMPOSITION_WEIGHTS.positionChange;
          if(count>1&&e.loadKind!=='aerobic')score-=(count-1)*12;
          score-=Math.abs(seconds-m.preferredSeconds)/60;
          buckets[time/15].push({time,score,blocks:[...node.blocks,{e,seconds,gap,change,interval:last?.e.id===e.id}],load,counts:{...node.counts,[e.id]:count+1},totals,active:node.active+seconds});
        }
      }
    }
  }
  if(!best)return null;
  best.blocks=best.blocks.map((b,i,blocks)=>{const prior=blocks[i-1],change=prior&&prior.e.position!==b.e.position;return {...b,change,gap:prior?Math.max(meta.get(prior.e.id).restSeconds,change?meta.get(b.e.id).transitionSeconds:0):(!small&&b.e.position==='floor'?30:0),interval:prior?.e.id===b.e.id};});
  const segments=[{kind:'prepare',exerciseId:null,durationMs:(setup+best.blocks[0].gap)*1000,label:'Check your space and get ready'}];
  best.blocks.forEach((b,i)=>{
    if(i&&b.gap)segments.push({kind:'rest',exerciseId:null,durationMs:b.gap*1000,label:b.change?'Change position comfortably':'Rest before the next movement',transition:!!b.change,nextExerciseId:b.e.id});
    const first=i===0,last=i===best.blocks.length-1;
    // Split only the displayed phase of a continuous final period; no extra rest or load.
    if(last&&b.seconds>60){
      segments.push({kind:'work',exerciseId:b.e.id,durationMs:(b.seconds-30)*1000,phase:'activity',continuousPeriod:true});
      segments.push({kind:'work',exerciseId:b.e.id,durationMs:30000,phase:'winddown',intentionalContinuation:true});
    }else segments.push({kind:'work',exerciseId:b.e.id,durationMs:b.seconds*1000,phase:first?'warmup':last?'winddown':'activity',...(b.interval?{intentionalInterval:true}:{})});
  });
  segments.push({kind:'cooldown',exerciseId:null,durationMs:finish*1000,label:'Movement finished; settle comfortably'});
  return {segments,score:Math.round(best.score*100)/100};
}

// Reorder within position groups only. Same blocks/caps, same total rests, fixed endpoints.
function arrange(blocks){
  const result=[];
  for(let start=0;start<blocks.length;){
    let end=start+1;while(end<blocks.length&&blocks[end].e.position===blocks[start].e.position)end++;
    const run=blocks.slice(start,end),head=start===0?run.shift():null,tail=end===blocks.length?run.pop():null,failed=new Set();
    function search(left,last){
      if(!left.length)return !tail||tail.e.id!==last?[]:null;
      const key=left.map(b=>b.e.id+':'+b.seconds).join(',')+'|'+last;if(failed.has(key))return null;
      const tried=new Set();
      for(let i=0;i<left.length;i++){const b=left[i];if(b.e.id===last||tried.has(b.e.id))continue;tried.add(b.e.id);const rest=search(left.filter((_,j)=>i!==j),b.e.id);if(rest)return [b,...rest];}
      failed.add(key);return null;
    }
    const ordered=search(run,head?.e.id||null);
    result.push(...(ordered?[...(head?[head]:[]),...ordered,...(tail?[tail]:[])]:blocks.slice(start,end)));
    start=end;
  }return result;
}
