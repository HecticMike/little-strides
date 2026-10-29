-- Read-only native atlas export. Editable milestone and source masters remain untouched.
local root='art/prototypes/comeback/user-art/'
local studies='art/prototypes/comeback/stage-study/'
local out=studies..'five-stage/'
local pc=app.pixelColor
local stages={{id='starting',at=0},{id='rhythm',at=8},{id='form',at=24},{id='confident',at=48},{id='developed',at=96}}
local poses={{id='stand',x=0,w=96,h=128,purpose='character'},{id='march',x=96,w=96,h=128,purpose='exercise-still'},{id='calf',x=192,w=96,h=132,purpose='raised-position-only'},{id='heel-slide',x=288,w=192,h=128,purpose='exercise-still'},{id='supine',x=480,w=192,h=128,purpose='starting-position-only'},{id='bridge',x=672,w=192,h=128,purpose='raised-position-only'}}
local function read(path,w,h,predicate,offset)
 local s=app.open(path);local im=Image(w,h,ColorMode.RGB)
 for _,l in ipairs(s.layers) do if l.isVisible and not l.name:find('^Reference /') and not l.name:find('^Preview /') and (not predicate or predicate(l.name)) then local c=l:cel(1);if c then im:drawImage(c.image,Point(c.position.x,c.position.y+(offset or 0))) end end end;s:close();return im
end
local hs=app.open(root..'heads.aseprite');local heads=Image(hs);hs:close()
local function upright(im)for y=0,41 do for x=0,95 do im:drawPixel(x,y,heads:getPixel(x,y)) end end end
local junctions={}
junctions['heel-slide']=Image(192,128,ColorMode.RGB);junctions['heel-slide']:drawImage(heads,Point(0,-128))
for _,entry in ipairs({{'supine','supine-start'},{'bridge','bridge'}}) do junctions[entry[1]]=read(root..entry[2]..'.aseprite',192,128,function(name)return name:find('Intact head neck')~=nil end) end
local source={}
source.stand=read(root..'character.aseprite',96,128,function(name)return name:find('^Standing / Starting /')~=nil end);upright(source.stand)
source.march=read(root..'march.aseprite',96,128);upright(source.march)
source.calf=read(root..'calf.aseprite',96,132,function(name)return name:find('^Raised heels / Starting /')~=nil end);upright(source.calf)
source['heel-slide']=read(root..'character.aseprite',192,128,function(name)return name:find('^Heel slide / Starting /')~=nil end,-128);source['heel-slide']:drawImage(junctions['heel-slide'])
source.supine=read(root..'supine-start.aseprite',192,128);source.bridge=read(root..'bridge.aseprite',192,128)
local allowed={};for line in io.lines(root..'palette.gpl') do local r,g,b=line:match('^(%d+)%s+(%d+)%s+(%d+)');if r then allowed[pc.rgba(tonumber(r),tonumber(g),tonumber(b),255)]=true end end
local atlas=Image(864,660,ColorMode.RGB)
local report={schemaVersion=1,thresholds={0,8,24,48,96},width=864,height=660,rowHeight=132,clinicalStatus='unreviewed-illustrations',animation=false,headTransforms=false,frames={},shoulderWidths={stand={},march={}}}
local previous={}
for index,stage in ipairs(stages) do local rendered={}
 for _,pose in ipairs(poses) do
  local reference=source[pose.id];local im,path
  if stage.id=='starting' then im=Image(reference);path='user-art original source pose'
  else
   local stem=pose.id=='stand' and 'standing' or pose.id
   if stage.id=='developed' and pose.id=='stand' then stem='silhouette' end
   path=studies..stage.id..'-'..stem..'.aseprite';im=read(path,pose.w,pose.h)
   if pose.id=='calf' then for y=0,73 do for x=0,95 do im:drawPixel(x,y,rendered.stand:getPixel(x,y)) end end end
   if pose.w==96 then upright(im) else im:drawImage(junctions[pose.id]) end
  end
  rendered[pose.id]=im
  local r={stage=stage.id,threshold=stage.at,pose=pose.id,source=path,x=pose.x,y=(index-1)*132,w=pose.w,h=pose.h,artPurpose=pose.purpose,headDifference=0,protectedDifference=0,canonicalUpperDifference=0,partialAlphaPixels=0,brokenLogicalBlocks=0,changedPixels=0,adjacentDifference=0,footBaseline=-1,components={},paletteSize=0}
  local seen,colours={},{}
  for y=0,pose.h-1 do for x=0,pose.w-1 do
   local v,base=im:getPixel(x,y),reference:getPixel(x,y);local a=pc.rgbaA(v)
   if v~=base then r.changedPixels=r.changedPixels+1 end
   if previous[pose.id] and v~=previous[pose.id]:getPixel(x,y) then r.adjacentDifference=r.adjacentDifference+1 end
   if a>0 then assert(allowed[v],'Off-palette pixel '..stage.id..'/'..pose.id);colours[v]=true;r.footBaseline=y end
   if a>0 and a<255 then r.partialAlphaPixels=r.partialAlphaPixels+1 end
   local head=pose.w==96 and y<42 or (pose.w==192 and pc.rgbaA(junctions[pose.id]:getPixel(x,y))>0)
   if head and v~=base then r.headDifference=r.headDifference+1 end
   local protected=pose.w==96 and y>=(pose.id=='march' and 68 or 74) or (pose.w==192 and (x<(pose.id=='heel-slide' and 102 or 104) or y>=118))
   if protected and v~=base then r.protectedDifference=r.protectedDifference+1 end
   if pose.id=='calf' and y<74 and v~=rendered.stand:getPixel(x,y) then r.canonicalUpperDifference=r.canonicalUpperDifference+1 end
   if pose.w==96 and x%2==0 and y%2==0 and (v~=im:getPixel(x+1,y) or v~=im:getPixel(x,y+1) or v~=im:getPixel(x+1,y+1) or v~=im:getPixel(x,y+1)) then r.brokenLogicalBlocks=r.brokenLogicalBlocks+1 end
   local key=y*pose.w+x
   if a>0 and not seen[key] then local q={{x,y}};local i=1;seen[key]=true;while i<=#q do local p=q[i];i=i+1;for _,d in ipairs({{-1,0},{1,0},{0,-1},{0,1}}) do local nx,ny=p[1]+d[1],p[2]+d[2];local k=ny*pose.w+nx;if nx>=0 and ny>=0 and nx<pose.w and ny<pose.h and not seen[k] and pc.rgbaA(im:getPixel(nx,ny))>0 then seen[k]=true;q[#q+1]={nx,ny} end end end;r.components[#r.components+1]=#q end
  end end
  for _ in pairs(colours) do r.paletteSize=r.paletteSize+1 end
  assert(r.headDifference==0 and r.protectedDifference==0 and r.canonicalUpperDifference==0,'Protected anatomy changed '..stage.id..'/'..pose.id)
  assert(r.partialAlphaPixels==0 and r.brokenLogicalBlocks==0 and #r.components==1,'Pixel/silhouette regression '..stage.id..'/'..pose.id)
  assert(r.footBaseline==(pose.id=='calf' and 127 or pose.w==96 and 123 or 121),'Contact baseline changed')
  if index>1 then assert(r.adjacentDifference>0,'Duplicate stage artwork '..stage.id..'/'..pose.id) end
  if pose.id=='stand' or pose.id=='march' then local left,right=48,-1;for x=0,47 do if pc.rgbaA(im:getPixel(x*2,46))>0 then left=math.min(left,x);right=math.max(right,x) end end;report.shoulderWidths[pose.id][#report.shoulderWidths[pose.id]+1]=right-left+1 end
  im:saveAs(out..stage.id..'-'..pose.id..'.png');atlas:drawImage(im,Point(r.x,r.y));previous[pose.id]=im;report.frames[#report.frames+1]=r
 end
end
for _,widths in pairs(report.shoulderWidths) do for i=2,#widths do assert(widths[i]>widths[i-1],'Milestone shoulder range not increasing') end end
atlas:saveAs('public/art/comeback-stages.png');atlas:saveAs(out..'atlas.png')
local f=assert(io.open(out..'report.json','w'));f:write(json.encode(report));f:close()
print('Exported five native character stages /30 registered frames; pose anchors and shared identities verified.')
