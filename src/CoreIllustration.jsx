import React,{useEffect,useRef,useState} from 'react';
import {CHARACTER,CORE_ILLUSTRATIONS} from './art-spec.mjs';
import {avatarAtlas,avatarFingerprint,coreIllustrationAtlas,coreIllustrationFrame} from './avatar.mjs';
export function CoreIllustration({id,name,stage}){
 const ref=useRef(),[failed,setFailed]=useState(false),view=CORE_ILLUSTRATIONS.viewport,width=view.widths[id];
 useEffect(()=>{let disposed=false;const canvas=ref.current,ctx=canvas.getContext('2d');canvas.dataset.ready='false';ctx.clearRect(0,0,canvas.width,canvas.height);
  Promise.all([coreIllustrationAtlas(),avatarAtlas()]).then(([atlas,canonical])=>{
   if(disposed)return;const f=coreIllustrationFrame(id,stage);ctx.imageSmoothingEnabled=false;ctx.drawImage(atlas,f.x,f.y+view.top,width,view.height,0,0,width,view.height);
   canvas.dataset.avatarFingerprint=avatarFingerprint(canonical,stage);canvas.dataset.ready='true';setFailed(false);
  }).catch(()=>{if(!disposed)setFailed(true);});return()=>{disposed=true;};
 },[id,stage]);
 return <><canvas ref={ref} className="core-illustration" width={width} height={view.height} role="img" aria-label={`${CHARACTER.stages[stage].name} wayfarer: ${name} illustration`} data-avatar-id={CHARACTER.id} data-avatar-stage={CHARACTER.stages[stage].id} data-exercise-id={id}/>{failed&&<span className="art-fallback">Illustration unavailable. Follow the written instructions.</span>}</>;
}
