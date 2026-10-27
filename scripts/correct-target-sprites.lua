-- Targeted edits only. Existing pixels, palette, source dimensions and export path.
local pc=app.pixelColor
local function inside(x,y,p)
 local hit=false;for i=1,#p do local a,b=p[i],p[i%#p+1]
 if (a[2]>y)~=(b[2]>y) and x<(b[1]-a[1])*(y-a[2])/(b[2]-a[2])+a[1] then hit=not hit end end;return hit
end
local function rigid(src,mask,angle,pivot,target,w,h,minY)
 local out=Image(w,h,ColorMode.RGB);local a=math.rad(angle);local co,si=math.cos(a),math.sin(a)
 for y=minY or 0,h-1 do for x=0,w-1 do
  local dx,dy=x-target[1],y-target[2]
  local sx,sy=math.floor(co*dx+si*dy+pivot[1]+.5),math.floor(-si*dx+co*dy+pivot[2]+.5)
  if sx>=0 and sx<src.width and sy>=0 and sy<src.height and mask(sx,sy) then out:drawPixel(x,y,src:getPixel(sx,sy)) end
 end end
 return out
end
local function shifted(src,mask,fn,w,h)
 local out=Image(w,h,ColorMode.RGB)
 for p in src:pixels() do if pc.rgbaA(p())>0 and mask(p.x,p.y) then
  local x,y=fn(p.x,p.y);x=math.floor(x+.5);y=math.floor(y+.5)
  if x>=0 and x<w and y>=0 and y<h then out:drawPixel(x,y,p()) end
 end end;return out
end
local function saveMaster(name,w,h,entries,palette)
 local s=Sprite(w,h,ColorMode.RGB)
 for i,e in ipairs(entries) do local l
  if i==1 then l=s.layers[1];s.cels[1].image=e[2] else l=s:newLayer();s:newCel(l,1,e[2],Point(0,0)) end
  l.name=e[1];if e[3]==false then l.isVisible=false end
 end
 s:setPalette(palette);s:saveAs("art/source/"..name..".aseprite");s:close()
end
local core=app.open("art/source/hero-core-study.aseprite")
assert(core.layers[1].name=="Head and hair - support needs review","Corrections already applied; preserve current master.")
local pal=Palette(#core.palettes[1]);for i=0,#pal-1 do pal:setColor(i,core.palettes[1]:getColor(i)) end
local base=Image(core)
local trimA,trimV=Image(core.layers[5]:cel(1).image),Image(core.layers[6]:cel(1).image)
local isHead=function(x,y) return x<52 and y<67 end
local nearPoly={{51,68},{58,68},{64,72},{80,74},{93,75},{101,77},{105,81},{103,85},{95,85},{78,84},{60,82},{52,77}}
local farPoly={{83,66},{101,43},{111,33},{119,35},{127,45},{136,58},{146,63},{146,71},{128,74},{117,58},{110,48},{100,59},{92,73}}
local skin={}
for _,c in ipairs({{155,91,64},{183,115,79},{213,143,97},{233,170,120},{247,193,140},{255,218,168}}) do skin[pc.rgba(c[1],c[2],c[3],255)]=true end
local function nearArm(x,y) return inside(x,y,nearPoly) end
local function torsoShift(x,y) return x,y+math.max(3,math.min(9,math.floor(9-(x-48)*.1+.5))) end
-- Lower and rotate the existing head as one rigid part; no face redrawing.
local head=rigid(base,isHead,-28,{49,63},{49,63},160,96)
local bottom=0;for p in head:pixels() do if pc.rgbaA(p())>0 then bottom=math.max(bottom,p.y) end end
local lowered=Image(160,96,ColorMode.RGB);lowered:drawImage(head,Point(0,85-bottom));head=lowered
local function torsoMask(x,y)
 if isHead(x,y) or nearArm(x,y) then return false end
 if x>=88 then return false end
 if y<69 and skin[base:getPixel(x,y)] and x>60 then return false end -- old hidden far arm
 return true
end
local torso=shifted(base,torsoMask,torsoShift,160,96)
-- Complete the occluded underside with existing cloth shades, never stretched skin.
for y=68,95 do for x=55,81 do
 if skin[torso:getPixel(x,y)] then torso:drawPixel(x,y,0) end
end end
for x=49,88 do
 local found=nil
 for y=85,55,-1 do
  local c=torso:getPixel(x,y)
  local cloth=pc.rgbaA(c)>0 and (x>=82 or (pc.rgbaG(c)>=pc.rgbaR(c) and pc.rgbaB(c)>=pc.rgbaR(c)))
  if cloth then found=y;break end
 end
 if found then
  local c=torso:getPixel(x,found)
  for y=found+1,84 do torso:drawPixel(x,y,c) end
  torso:drawPixel(x,85,x<82 and pc.rgba(25,51,54,255) or pc.rgba(56,44,35,255))
 end
end
local nearArmImage=Image(160,96,ColorMode.RGB)
for y=0,95 do for x=0,159 do
 local factor=.78+.22*math.min(1,math.max(0,(x-52)/28))
 local sy=math.floor(85-(85-y)/factor+.5)
 if sy>=0 and sy<96 and nearArm(x,sy) then nearArmImage:drawPixel(x,y,base:getPixel(x,sy)) end
end end
local farArm=Image(160,96,ColorMode.RGB)
local shade={[pc.rgba(255,218,168,255)]=pc.rgba(247,193,140,255),[pc.rgba(247,193,140,255)]=pc.rgba(233,170,120,255),[pc.rgba(233,170,120,255)]=pc.rgba(213,143,97,255)}
for p in nearArmImage:pixels() do if pc.rgbaA(p())>0 and p.x+4<160 and p.y>=16 then farArm:drawPixel(p.x+4,p.y-16,shade[p()] or p()) end end
local farLeg=shifted(base,function(x,y) return x>=83 and inside(x,y,farPoly) end,function(x,y)return x+7,y+9 end,160,96)
local nearLegPoly={{83,63},{93,56},{101,47},{107,43},{113,46},{118,57},{125,69},{128,76},{140,79},{143,84},{137,87},{122,87},{116,82},{113,72},{108,61},{101,68},{94,77},{89,81},{83,80}}
local nearLeg=shifted(base,function(x,y)return inside(x,y,nearLegPoly) and not nearArm(x,y) end,function(x,y)return x,y+math.max(0,math.floor((106-x)/6+.5)) end,160,96)
-- Existing collar/skin supplies the small neck connection between the lowered head and shirt.
for y=72,77 do for x=48,52 do
 if pc.rgbaA(torso:getPixel(x,y))==0 then torso:drawPixel(x,y,base:getPixel(47+((x-48)%3),62+((y-72)%3))) end
end end
local trims={}
for i,src in ipairs({trimA,trimV}) do
 local out=Image(160,96,ColorMode.RGB)
 local h=rigid(src,isHead,-28,{49,63},{49,63},160,96)
 out:drawImage(h,Point(0,85-bottom))
 out:drawImage(shifted(src,function(x,y)return not isHead(x,y) end,function(x,y)
  if x>=88 then return x,y+math.max(0,math.floor((106-x)/6+.5)) end
  return torsoShift(x,y)
 end,160,96),Point(0,0));trims[i]=out
end
core:close()
saveMaster("hero-core-study",160,96,{
 {"Far forearm - separated",farArm},{"Far bent leg and planted foot",farLeg},
 {"Torso upper-back and pelvis support",torso},{"Near bent leg and planted foot",nearLeg},
 {"Head and neck - lowered rigid key",head},{"Near forearm and hand - separated",nearArmImage},
 {"Adventurer trim",trims[1],false},{"Veteran trim",trims[2],false}},pal)
-- Existing standing boot pixels retain their shape/lighting in both contact keys.
local body=app.open("art/source/hero-body.aseprite");local whole=Image(body)
local limbs={
 {hip={44,78},knee={41,91},ankle={37,104},toe={27,119},angle=-12,x1=24,x2=50},
 {hip={59,78},knee={61,91},ankle={62,104},toe={72,119},angle=12,x1=51,x2=78}
}
local function distance(a,b)return math.sqrt((a[1]-b[1])^2+(a[2]-b[2])^2)end
local function atan(y,x)return math.atan(y,x)end
local function posedLeg(src,leg,active)
 local out=Image(96,128,ColorMode.RGB);local a=math.rad(active and leg.angle or 0);local co,si=math.cos(a),math.sin(a)
 local ax,ay=leg.ankle[1]-leg.toe[1],leg.ankle[2]-leg.toe[2]
 local ankle={leg.toe[1]+co*ax-si*ay,leg.toe[2]+si*ax+co*ay}
 local knee={leg.knee[1],leg.knee[2]}
 if active then
  local l1,l2=distance(leg.hip,leg.knee),distance(leg.knee,leg.ankle)
  local dx,dy=ankle[1]-leg.hip[1],ankle[2]-leg.hip[2];local d=math.sqrt(dx*dx+dy*dy)
  local k=(l1*l1-l2*l2+d*d)/(2*d);local h=math.sqrt(math.max(0,l1*l1-k*k));local sign=leg.angle>0 and 1 or -1
  knee={leg.hip[1]+dx*k/d+sign*dy*h/d,leg.hip[2]+dy*k/d-sign*dx*h/d}
 end
 local thighAngle=math.deg(atan(knee[2]-leg.hip[2],knee[1]-leg.hip[1])-atan(leg.knee[2]-leg.hip[2],leg.knee[1]-leg.hip[1]))
 local shinAngle=math.deg(atan(ankle[2]-knee[2],ankle[1]-knee[1])-atan(leg.ankle[2]-leg.knee[2],leg.ankle[1]-leg.knee[1]))
 local function region(y1,y2)return function(x,y)return x>=leg.x1 and x<=leg.x2 and y>=y1 and y<=y2 end end
 out:drawImage(rigid(src,region(84,94),thighAngle,leg.hip,leg.hip,96,128,84),Point(0,0))
 out:drawImage(rigid(src,region(92,104),shinAngle,leg.knee,knee,96,128,84),Point(0,0))
 out:drawImage(rigid(src,region(101,119),active and leg.angle or 0,leg.toe,leg.toe,96,128,84),Point(0,0))
 return out
end
for _,layer in ipairs(body.layers) do
 local cel=layer:cel(1);local old=Image(960,128,ColorMode.RGB);old:drawImage(cel.image,cel.position)
 local stand=Image(old,Rectangle(0,0,96,128));local result=Image(old)
 for _,col in ipairs({7,8}) do
  local frame=Image(stand)
  for y=84,127 do for x=0,95 do frame:drawPixel(x,y,0) end end
  frame:drawImage(posedLeg(stand,limbs[1],col==8),Point(0,0));frame:drawImage(posedLeg(stand,limbs[2],col==7),Point(0,0))
  for y=0,127 do for x=0,95 do result:drawPixel(col*96+x,y,frame:getPixel(x,y)) end end
 end
 cel.image=result;cel.position=Point(0,0)
end
body:saveAs(body.filename);whole=Image(body);body:close()
local gear=app.open("art/source/hero-equipment.aseprite")
for _,l in ipairs(gear.layers) do
 local cel=l:cel(1);local old=Image(cel.image);local result=Image(old)
 for row=0,1 do for _,col in ipairs({7,8}) do for y=84,127 do for x=0,95 do
  local c=old:getPixel(x,row*128+y)
  if l.name:find("cloak") and pc.rgbaA(whole:getPixel(col*96+x,y))>0 then c=0 end
  result:drawPixel(col*96+x,row*128+y,c)
 end end end end
 cel.image=result
end
gear:saveAs(gear.filename);gear:close()
local training=app.open("art/source/hero-training-outfit.aseprite")
for _,l in ipairs(training.layers) do if l.name:find("cuff") then
 local cel=l:cel(1);local old=Image(cel.image);local result=Image(old)
 for row=0,2 do
  local source=Image(old,Rectangle(0,row*128,96,128))
  for _,col in ipairs({7,8}) do
   local frame=Image(source)
   for y=84,127 do for x=0,95 do frame:drawPixel(x,y,0) end end
   frame:drawImage(posedLeg(source,limbs[1],col==8),Point(0,0));frame:drawImage(posedLeg(source,limbs[2],col==7),Point(0,0))
   for y=0,127 do for x=0,95 do result:drawPixel(col*96+x,row*128+y,frame:getPixel(x,y)) end end
  end
 end
 cel.image=result
end end
training:saveAs(training.filename);training:close()
print("Core support corrected with existing pixels; alternating supported/toe-off walk keys retain canonical boots and registration.")
