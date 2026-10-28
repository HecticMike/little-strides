import Phaser from 'phaser';
import { avatarAtlas, avatarFrame, avatarFingerprint, CHARACTER, POSES } from './avatar.mjs';
import { WORLD } from './art-spec.mjs';
import {worldProps,sceneryTime} from './world-art.mjs';
import { destinations, route, walkable } from './village-path.mjs';
export { route } from './village-path.mjs';
export async function createVillage(parent, stage, completed, onInteract, initialWorkshopStage = 0, initialWorld = {workshop:{stage:initialWorkshopStage},projects:[]}) {
  const atlas = await avatarAtlas(), reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  class Village extends Phaser.Scene {
    preload() {
      for (const name of ['village-ground','village-foreground','workshop-context']) this.load.image(name,`./art/${name}.png`);
      this.load.spritesheet('buildings','./art/buildings.png',{ frameWidth:WORLD.buildingFrameWidth,frameHeight:WORLD.buildingFrameHeight });
      this.load.spritesheet('chapter-banner','./art/chapter-banner.png',{frameWidth:60,frameHeight:64});
      this.load.spritesheet('chapter-props','./art/chapter-props.png',{frameWidth:96,frameHeight:96});
      this.load.spritesheet('icons','./art/icons.png',{ frameWidth:24,frameHeight:24 });
    }
    create() {
      this.add.image(0,0,'village-ground').setOrigin(0).setScale(1/WORLD.textureScale);
      // Workshop terrain and structure have disjoint pixels; the original is absent from the base.
      this.add.image(WORLD.workshopX,WORLD.workshopY,'workshop-context').setOrigin(0).setScale(1/WORLD.textureScale).setDepth(1);
      this.workshopStage = initialWorkshopStage;
      this.workshop = this.add.image(WORLD.workshopX,WORLD.workshopY,'buildings',initialWorkshopStage ? 2 : 1).setOrigin(0).setScale(1/WORLD.textureScale).setDepth(2);
      this.add.image(0,0,'village-foreground').setOrigin(0).setScale(1/WORLD.textureScale).setDepth(1000);
      for (let i=0;i<Math.min(12,completed);i++) this.add.image(43+i%6*8,209+Math.floor(i/6)*8,'icons',7).setScale(1/3).setDepth(260);
      const texture = this.textures.addCanvas('hero',atlas);
      POSES.forEach(pose=>{const f=avatarFrame(pose,stage);texture.add(pose,0,f.x,f.y,f.w,f.h);});
      this.player = this.add.image(168,216,'hero','stand').setOrigin(.5,CHARACTER.feetY/CHARACTER.frameHeight).setScale(1/WORLD.textureScale).setDepth(216);
      this.shadow=this.add.ellipse(168,216,22,5,0x183732,.28).setDepth(215);
      this.marker = this.add.image(228,104,'icons',5).setScale(7/15).setDepth(510);
      parent.dataset.iconFrameSize=String(this.marker.frame.width);
      this.focus = this.add.graphics().setDepth(505);
      this.path=[];this.pending=null;
      this.game.events.on('visit',name=>this.visit(name));
      this.chapterObjects=[];this.world=initialWorld;this.showWorld(initialWorld);
      this.game.events.on('workshop-stage',value=>this.showWorkshop(value));
      this.game.events.on('chapter-world',value=>this.showWorld(value));
      this.game.events.on('dismiss-interaction',()=>{this.pending=null;parent.dataset.interaction='idle';this.focus.clear();});
      this.input.on('pointerdown',p=>{
        if(p.y<145&&p.y>20&&p.x<135)return this.visit('Training green');
        if(p.y<152&&p.y>20&&p.x>180)return this.visit('Workshop');
        if(p.x<145&&p.y>164)return this.visit('Garden');
        if(!walkable(Math.floor(p.x/16),Math.floor(p.y/16))){parent.dataset.moveResult='blocked';return;}
        this.pending=null;this.path=route([this.player.x,this.player.y],[p.x,p.y]);parent.dataset.moveResult='accepted';
        if(reduced&&this.path.length){this.player.setPosition(...this.path.at(-1));this.path=[];}
        this.publish();
      });
      if(!reduced){
        // Light flickers at the painted lanterns; no duplicate smoke/prop sprites.
        for(const [x,y] of [[142,95],[224,94]]){
          const glow=this.add.ellipse(x,y,7,8,0xffd172,.1).setDepth(500);
          this.tweens.add({targets:glow,alpha:.23,duration:1900,yoyo:true,repeat:-1});
        }
      }
      this.foliage=this.add.image(32,244,'chapter-props',9).setOrigin(0).setScale(.5).setDepth(1001);
      parent.dataset.avatarId=CHARACTER.id;parent.dataset.avatarStage=CHARACTER.stages[stage].id;
      parent.dataset.avatarFingerprint=avatarFingerprint(atlas,stage);parent.dataset.buildingStage=this.workshopStage?'restored':'original';
      parent.dataset.ready='true';this.publish();onInteract({place:'Training green',phase:'idle'});
    }
    showWorld(world){
      this.world=world;
      for(const obj of this.chapterObjects||[]){this.tweens.killTweensOf(obj);obj.destroy();}this.chapterObjects=[];
      for(const prop of worldProps(world)){
        this.chapterObjects.push(this.add.image(prop.x,prop.y,prop.texture||'chapter-props',prop.frame).setOrigin(0).setScale((prop.size||48)/96).setDepth(prop.y+(prop.size||48)*.9));
        if(prop.id.startsWith('lantern')&&sceneryTime()==='evening'){
          const glow=this.add.ellipse(prop.x+23,prop.y+18,20,16,0xffd172,.18).setDepth(prop.y+44);this.chapterObjects.push(glow);
          if(!reduced)this.tweens.add({targets:glow,alpha:.08,duration:2100,yoyo:true,repeat:-1});
        }
      }
      parent.dataset.chapterProjects=String(world.projects.length);parent.dataset.worldTime=sceneryTime();
      parent.dataset.banner=world.projects.find(p=>p.id==='banner')?.choice||'none';
      parent.dataset.gardenStyle=world.projects.find(p=>p.id==='garden')?.choice||'none';
    }
    publish(){
      this.shadow?.setPosition(this.player.x,this.player.y).setDepth(Math.round(this.player.y)-1);
      const values={playerX:String(Math.round(this.player.x)),playerY:String(Math.round(this.player.y)),motion:this.path.length?'walking':'idle',animationFrame:this.player.frame.name};
      for(const [key,value] of Object.entries(values))if(parent.dataset[key]!==value)parent.dataset[key]=value;
    }
    visit(name){
      if(!destinations[name])return;
      this.pending=name;this.path=route([this.player.x,this.player.y],destinations[name]);
      parent.dataset.interactionTarget=name;parent.dataset.interaction='approaching';
      const [x,y]=destinations[name];this.focus.clear().lineStyle(1,0xe4ad55,.9).strokeRect(x-9,y-4,18,8);
      onInteract({place:name,phase:'approaching'});
      if(reduced&&this.path.length){this.player.setPosition(...this.path.at(-1));this.path=[];}
      if(!this.path.length)this.arrive();this.publish();
    }
    arrive(){
      if(!this.pending)return;
      const place=this.pending;this.pending=null;parent.dataset.interaction='arrived';
      onInteract({place,phase:'arrived'});
    }
    showWorkshop(stage){
      if(stage===this.workshopStage)return;
      this.workshopStage=stage;
      if(!stage||reduced){this.workshop.setFrame(stage?2:1);parent.dataset.buildingStage=stage?'restored':'original';return;}
      parent.dataset.buildingStage='restoring';
      const scaffold=this.add.graphics().setDepth(501).lineStyle(2,0xd3b879,1);
      for(const x of [219,250,282])scaffold.lineBetween(x,105,x,148);
      for(const y of [115,135])scaffold.lineBetween(217,y,286,y);
      for(let i=0;i<8;i++){
        const fleck=this.add.rectangle(220+i*8,132,2,2,i%2?0xe4ad55:0xd3b879).setDepth(502);
        this.tweens.add({targets:fleck,y:116-i%3*5,x:fleck.x+(i%2?7:-7),alpha:0,duration:700,onComplete:()=>fleck.destroy()});
      }
      this.time.delayedCall(550,()=>{scaffold.destroy();this.workshop.setFrame(2);parent.dataset.buildingStage='restored';});
    }
    update(time,delta){
      if(!this.player)return;
      if(!reduced)this.foliage?.setFrame(Math.floor(time/1400)%2?10:9);
      if(!this.path.length){this.player.setDepth(Math.round(this.player.y)).setFrame(!reduced&&time%3800>3630?'idle-blink':'stand');this.arrive();this.publish();return;}
      const [x,y]=this.path[0],dx=x-this.player.x,dy=y-this.player.y,distance=Math.hypot(dx,dy),step=Math.min(delta,50)*.11;
      if(distance<=step||reduced){this.player.setPosition(x,y);this.path.shift();}
      else{this.player.x+=dx/distance*step;this.player.y+=dy/distance*step;}
      if(Math.abs(dx)>1)this.player.setFlipX(dx<0);
      this.player.setDepth(Math.round(this.player.y)).setFrame(reduced?'stand':['walk-a','stand','walk-b','stand'][Math.floor(time/170)%4]);
      this.publish();
    }
  }
  return new Phaser.Game({type:Phaser.CANVAS,parent,width:WORLD.width,height:WORLD.height,pixelArt:true,roundPixels:true,antialias:false,backgroundColor:'#344e48',fps:{target:30,forceSetTimeOut:true},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:Village,audio:{noAudio:true},banner:false});
}