import React,{useEffect,useRef,useState,useMemo} from 'react';
import {chapterState,PROJECTS,CHAPTERS} from './gameplay.mjs';
import {sceneImage,loadArt,drawProp,sceneryTime} from './world-art.mjs';
import {Icon} from './Icon.jsx';

export function WorldView({world,count=0,project,hero=false,label='Your current Hearthwood'}){
 const ref=useRef(),[failed,setFailed]=useState(false);
 useEffect(()=>{let disposed=false;sceneImage(world,count).then(image=>{if(disposed)return;const ctx=ref.current.getContext('2d');ctx.imageSmoothingEnabled=false;
 if(hero)ctx.drawImage(image,0,project?.id==='garden'?140:project?.id==='workshop'?12:65,320,125,0,0,640,250);else ctx.drawImage(image,0,0,640,576);
 ref.current.dataset.ready='true';setFailed(false);}).catch(()=>{if(!disposed)setFailed(true);});return()=>{disposed=true;};},[world,count,hero,project?.id]);
 return <>{failed&&<span className="art-fallback">Village artwork unavailable; your progress is saved.</span>}<canvas ref={ref} className={hero?'world-window':'world-review'} width={640} height={hero?250:576} role="img" aria-label={label} data-world-time={sceneryTime()} data-world-projects={world.projects.length}/></>;
}
export function PropArt({frame=0,label,className='',portrait=false}){
 const ref=useRef();useEffect(()=>{let live=true;loadArt(frame===-1?'./art/buildings.png':'./art/chapter-props.png').then(image=>{if(live){const ctx=ref.current.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,96,96);if(frame===-1)ctx.drawImage(image,560,0,280,300,3,0,90,96);else if(portrait)ctx.drawImage(image,frame%4*96+20,Math.floor(frame/4)*96+2,56,60,3,0,90,96);else drawProp(ctx,image,frame,0,0,96);}}).catch(()=>{});return()=>{live=false;};},[frame,portrait]);
 return <canvas className={'prop-art '+className} width={96} height={96} ref={ref} role="img" aria-label={label}/>;
}
const names={fern:'Fern crest',star:'Star crest',flowers:'Wildflowers',ferns:'Woodland ferns'};
export function ProjectCard({chapter,onBuy,busy=false,compact=false}){
 const [choice,setChoice]=useState(null),[reveal,setReveal]=useState(null),p=chapter.next;
 const selected=choice&&p?.choices?.includes(choice)?choice:null;
 const preview=useMemo(()=>!p?chapter.world:p.id==='workshop'?{...chapter.world,workshop:{...chapter.world.workshop,stage:1}}:{...chapter.world,projects:[...chapter.world.projects,{id:p.id,choice:selected||p.choices?.[0]||null}]},[chapter.world,p,selected]);
 const frame=p?.id==='banner'?(selected==='star'?1:0):p?.id==='garden'?(selected==='ferns'?3:2):p?.frame===0?-1:p?.frame;
 if(!p)return <section className="card paper chapter-finished"><p className="eyebrow">CHAPTER I · HOME</p><h2>A place to return to</h2><p>Hearthwood is welcoming, and your progress is yours to keep. Revisit its discoveries whenever you like.</p><p className="small">Further chapters are planned, not yet released. No countdown; no progress expires.</p></section>;
 async function buy(){const done=await onBuy(p.id,selected);if(done){setReveal({world:preview,project:p});setChoice(null);}}
 return <aside className={'project-card paper '+(compact?'compact ':'')+(reveal?'project-reveal':'')} aria-label="Current village project" data-project={p.id}>
 {reveal&&<div className="saved-reveal" role="status"><strong>{reveal.project.name} · saved</strong><button className="text-button" aria-label="Dismiss restoration view" onClick={()=>setReveal(null)}>Close</button><div className="project-scene"><WorldView world={reveal.world} project={reveal.project} hero label="Your saved restoration"/></div></div>}<div className="project-heading"><PropArt frame={frame} label={'Preview: '+p.name}/><div><p className="eyebrow">CHAPTER I · HOME · {chapter.completed+1}/6</p><h2>{p.name}</h2><p>{p.description}</p></div></div>
 <div className="project-scene"><WorldView world={preview} project={p} hero label={'Preview in your village: '+p.name}/><span>PROJECT PREVIEW</span></div>
 {p.choices&&<div className="project-choices" aria-label={'Style for '+p.name}>{p.choices.map((value,i)=><button key={value} aria-label={names[value]} aria-pressed={selected===value} onClick={()=>setChoice(value)} disabled={busy}><PropArt frame={p.id==='banner'?i:2+i} label={names[value]}/>{names[value]}</button>)}</div>}
 <div className="project-cost"><span><Icon index={6}/>{p.cost} timber · {chapter.balance} available</span><span>{Math.max(0,p.cost-chapter.balance)} more needed</span></div>
 <button className="primary project-purchase" disabled={busy||chapter.balance<p.cost||!!p.choices&&!selected} onClick={buy}>{chapter.balance<p.cost?'Need '+(p.cost-chapter.balance)+' more timber':p.choices&&!selected?'Choose your style':p.name+' · '+p.cost+' timber'}</button>
 <p className="small project-footnote">One whole eligible session, including a 3-minute step, earns 1 timber. No daily deadline.</p>
 </aside>;
}
const STORIES={
 workshop:{title:'Rowan opens the shutters',speaker:'Rowan · carpenter',frame:6,text:'“A roof, a workbench, and a little light. That is enough to begin.” Rowan leaves a smooth wooden token by the door. The workshop is yours to return to.'},
 banner:{title:'A sign of your own',speaker:'Rowan · carpenter',frame:6,text:'Your chosen crest catches the afternoon light. Rowan notices it from the path: “Now a traveller will know where they are welcome.”'},
 garden:{title:'A quiet corner',speaker:'Mira · traveller',frame:7,text:'There is room on the bench, and nothing you need to hurry towards. Mira leaves a pressed leaf between the pages of your journal.'},
 lanterns:{title:'The path stays warm',speaker:'Rowan · carpenter',frame:6,text:'Evening settles among the trees. The lanterns make small islands of light. They will still be here whenever you return.'},
 board:{title:'Beyond the gate',speaker:'Mira · traveller',frame:7,text:'Mira pins a map to the board. A woodland pond and an old watchtower wait beyond the trees. Choose a first discovery; there is no wrong road.'},
 gathering:{title:'A place to return to',speaker:'Rowan and Mira',frame:7,text:'Bread, two cups, and stories from the path. Hearthwood has become a home through many small steps. Nothing here asks you to hurry. Chapter I is complete.'},
};
export function Discoveries({chapter,onRead,onChoose,busy=false,journal=false}){
 const [open,setOpen]=useState(null),storyRef=useRef(),world=chapter.world,available=PROJECTS.slice(0,chapter.completed),story=STORIES[open],destination=world.discovery.destination;
 useEffect(()=>{if(open)storyRef.current?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});},[open]);
 if(!available.length)return null;
 return <section className="card discovery-library" aria-label="Hearthwood memories"><div className="row between"><h2>{journal?'Pages from Hearthwood':'Letters from Hearthwood'}</h2><span className="pill">{available.filter(p=>!world.discovery.seen.includes(p.id)).length} unread</span></div>
 <p className="small muted">Your stories wait for you. No deadlines, no lost progress.</p>
 <div className="memory-list">{available.map(p=><button key={p.id} onClick={()=>setOpen(open===p.id?null:p.id)} aria-expanded={open===p.id}>{STORIES[p.id].title}<span>{world.discovery.seen.includes(p.id)?'Read again':'Open letter'}</span></button>)}</div>
 {story&&<article ref={storyRef} className="story-card paper" aria-label={story.title}>
 {(open==='board'||open==='gathering')&&<img className="discovery-landscape" src={'./art/discovery-'+(destination||'pond')+'.png'} alt={destination==='watchtower'?'The old watchtower above a wooded valley':'A quiet woodland pond and stone footbridge'}/>}
 <div className="story-speaker"><PropArt frame={story.frame} label={story.speaker} portrait/><div><p className="eyebrow">HEARTHWOOD · A MEMORY</p><h3>{story.title}</h3><p className="small">{story.speaker}</p></div></div><p>{story.text}</p>
 {open==='banner'&&<p className="small">Your crest: {names[world.projects.find(p=>p.id==='banner')?.choice]}.</p>}
 {open==='garden'&&<p className="small">Your garden: {names[world.projects.find(p=>p.id==='garden')?.choice]}.</p>}
 {open==='board'&&!destination&&<div className="destination-choices">{[['pond','Woodland pond'],['watchtower','Old watchtower']].map(([id,name])=><button key={id} disabled={busy} onClick={()=>onChoose(id)}><img src={'./art/discovery-'+id+'.png'} alt=""/>{name}</button>)}</div>}
 {destination&&(open==='board'||open==='gathering')&&<p className="keepsake">Keepsake: {destination==='pond'?'a smooth blue river stone':'a brass watchtower token'}. Saved with your village.</p>}
 <p className="small">{new Date(open==='workshop'?world.workshop.restoredAt:world.projects.find(p=>p.id===open)?.completedAt).toLocaleDateString()} · Kept in your journal.</p>
 <button disabled={busy} onClick={async()=>{await onRead(open);setOpen(null);}}>Keep this memory</button></article>}
 {chapter.complete&&<p className="chapter-roadmap">{CHAPTERS.map(c=>c.name+(c.available?' · complete':' · planned')).join(' / ')}</p>}
 </section>;
}
