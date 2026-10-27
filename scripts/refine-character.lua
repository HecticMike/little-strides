local protected=io.open("art/source/hero-training-outfit.aseprite","rb")
if protected then protected:close();error("Character pass already applied. Edit the existing masters; use art:export.") end
-- Focused one-time edit of existing character pixels. Village artwork is untouched.
local pc=app.pixelColor
local rgba=pc.rgba
local W,H=96,128
local function inside(x,y,poly)
 local hit=false
 for i=1,#poly do local a,b=poly[i],poly[i%#poly+1]
  if (a[2]>y)~=(b[2]>y) and x<(b[1]-a[1])*(y-a[2])/(b[2]-a[2])+a[1] then hit=not hit end
 end
 return hit
end
local head={{31,6},{68,6},{72,18},{71,34},{61,41},{43,41},{31,32}}
local body=app.open("art/source/hero-body.aseprite")
local before=Image(body)
local poses={}
for i=0,9 do poses[i]=Image(before,Rectangle(i*W,0,W,H)) end
local stand=poses[0]
local march=Image(W,H,ColorMode.RGB);march:drawImage(poses[1],Point(2,0))
local oldMarch=Image(march)
local right={{64,43},{74,43},{85,49},{86,82},{68,83},{63,63}}
local left={{22,43},{36,43},{41,53},{38,70},{36,82},{23,82},{20,64}}
local bent={{64,44},{73,44},{82,48},{86,57},{83,66},{72,70},{64,64}}
-- Clear the old near down-arm; reuse the existing bent far-arm on the opposite side.
for y=42,83 do for x=18,88 do
 if inside(x,y,left) then march:drawPixel(x,y,0) end
 if inside(x,y,right) then
  local c=stand:getPixel(x,y)
  local old=oldMarch:getPixel(x,y)
  -- Keep the raised thigh in front of the relaxed far arm.
  if y>=72 and pc.rgbaA(old)>0 and pc.rgbaR(old)>pc.rgbaG(old)*1.18 then c=old end
  march:drawPixel(x,y,c)
 end
end end
for y=43,70 do for x=63,87 do
 if inside(x,y,bent) then
  local target=104-x
  local c=oldMarch:getPixel(x,y)
  if pc.rgbaA(c)>0 then march:drawPixel(target,y,c) end
 end
end end
poses[1]=march
-- Stable upper body and head across idle/contact keys; retain the existing leg artwork.
for _,index in ipairs({7,8}) do
 local result=Image(stand)
 for y=74,127 do for x=0,95 do
  local sx=index==7 and x or 104-x -- mirror about the actual hip centre, not canvas centre
  result:drawPixel(x,y,(sx>=0 and sx<96) and poses[7]:getPixel(sx,y) or 0)
 end end
 poses[index]=result
end
-- One exact head/face/hair key; preserve raised hands outside this anatomical mask.
for _,index in ipairs({1,4,5,7,8}) do
 for y=0,42 do for x=25,75 do if inside(x,y,head) then poses[index]:drawPixel(x,y,stand:getPixel(x,y)) end end end
end
local layers={}
for _,layer in ipairs(body.layers) do layers[layer.name]=Image(960,128,ColorMode.RGB) end
for col=0,9 do for p in poses[col]:pixels() do
 local c=p();if pc.rgbaA(c)>0 then
  local r,g,b=pc.rgbaR(c),pc.rgbaG(c),pc.rgbaB(c)
  local name="Outfit and boots"
  if r>g*1.2 and r>140 and g>b*1.13 then name="Skin and face" end
  if inside(p.x,p.y,head) and pc.rgbaA(body.layers[3]:cel(1).image:getPixel(p.x,p.y))>0 then name="Chestnut hair" end
  layers[name]:drawPixel(col*W+p.x,p.y,c)
 end
end end
for _,layer in ipairs(body.layers) do layer:cel(1).image=layers[layer.name];layer:cel(1).position=Point(0,0) end
body:saveAs(body.filename)
local combined=Image(body)
local gear=app.open("art/source/hero-equipment.aseprite")
for _,layer in ipairs(gear.layers) do
 local cel=layer:cel(1);local original=Image(960,256,ColorMode.RGB);original:drawImage(cel.image,cel.position)
 local result=Image(original)
 for row=0,1 do
  for _,col in ipairs({7,8}) do for y=0,127 do for x=0,95 do
   local c=original:getPixel(x,row*H+y)
   if layer.name:find("cloak") and (y>=58 or x<38 or x>66) and pc.rgbaA(poses[col]:getPixel(x,y))>0 then c=0 end
   result:drawPixel(col*W+x,row*H+y,c)
  end end end
  -- Keep the new march forearm and raised knee visible through the cloak mask.
  if layer.name:find("cloak") then for y=43,127 do for x=0,95 do
   if (y>=58 or x<38 or x>66) and pc.rgbaA(poses[1]:getPixel(x,y))>0 then result:drawPixel(W+x,row*H+y,0) end
  end end end
 end
 cel.image=result;cel.position=Point(0,0)
end
gear:saveAs(gear.filename);gear:close()
local palette=Palette(#body.palettes[1]);for i=0,#palette-1 do palette:setColor(i,body.palettes[1]:getColor(i)) end
local function master(name,w,h,entries)
 local s=Sprite(w,h,ColorMode.RGB)
 for i,e in ipairs(entries) do
  local l
  if i==1 then l=s.layers[1];s.cels[1].image=e[2] else l=s:newLayer();s:newCel(l,1,e[2],Point(0,0)) end
  l.name=e[1];if e[3]==false then l.isVisible=false end
 end
 s:setPalette(palette);s:saveAs("art/source/"..name..".aseprite");s:close()
end
local accents={rgba(214,158,75,255),rgba(237,189,102,255),rgba(255,218,136,255)}
local function gold(c)
 local r,g,b=pc.rgbaR(c),pc.rgbaG(c),pc.rgbaB(c)
 return pc.rgbaA(c)>0 and r>140 and g>95 and b<145 and r<g*1.56 and g>b*1.6
end
local trim,cuffs=Image(960,384,ColorMode.RGB),Image(960,384,ColorMode.RGB)
for row=0,2 do for col=0,9 do if col~=2 and col~=3 and col~=6 then
 local pose=poses[col]
 for y=40,127 do for x=0,95 do
  local c=pose:getPixel(x,y)
  if y<73 and gold(c) then trim:drawPixel(col*W+x,row*H+y,accents[row+1]) end
 end end
 -- Existing boots keep their sole/foot silhouette. Only the upper cuff becomes soft fabric.
 for x=15,85 do
  local top=nil
  for y=76,119 do
   local c=pose:getPixel(x,y);local r,g,b=pc.rgbaR(c),pc.rgbaG(c),pc.rgbaB(c)
   local boot=pc.rgbaA(c)>0 and g>=r and math.abs(g-b)<18 and g<140
   if boot and not top then top=y end
   if boot and top and y<top+3 and r>35 then cuffs:drawPixel(col*W+x,row*H+y,rgba(112,71,44,255)) end
  end
 end
end end end
master("hero-training-outfit",960,384,{{"Soft trouser cuffs - shared footwear shape",cuffs},{"Stage seam and buckle accents",trim}})
-- A wider review-only lying canvas avoids the archived 48px crop/foreshortening.
local input=Image{fromFile="art/direction/core-study-v1.png"}
local minX,minY,maxX,maxY=input.width,input.height,0,0
for p in input:pixels() do if pc.rgbaA(p())>=180 then minX=math.min(minX,p.x);minY=math.min(minY,p.y);maxX=math.max(maxX,p.x);maxY=math.max(maxY,p.y) end end
local scale=130/(maxX-minX+1)
local core=Image(160,96,ColorMode.RGB)
local rgb={}
for i=1,#palette-1 do local c=palette:getColor(i);rgb[#rgb+1]={c.red,c.green,c.blue} end
local memo={}
local function quant(c)
 if pc.rgbaA(c)<180 then return 0 end
 if memo[c] then return memo[c] end
 local r,g,b=pc.rgbaR(c),pc.rgbaG(c),pc.rgbaB(c);local best,d=nil,math.huge
 for _,v in ipairs(rgb) do local q=2*(r-v[1])^2+3*(g-v[2])^2+(b-v[3])^2;if q<d then best,d=rgba(v[1],v[2],v[3],255),q end end
 memo[c]=best;return best
end
for y=0,95 do for x=0,159 do
 local sx=math.floor((x-15)/scale+minX);local sy=math.floor((y-86)/scale+maxY+1)
 if sx>=0 and sx<input.width and sy>=0 and sy<input.height then core:drawPixel(x,y,quant(input:getPixel(sx,sy))) end
end end
local hair,torso,arms,legs=Image(160,96,ColorMode.RGB),Image(160,96,ColorMode.RGB),Image(160,96,ColorMode.RGB),Image(160,96,ColorMode.RGB)
for p in core:pixels() do
 local c=p();local target=torso
 if p.x<52 then target=hair
 elseif p.x>=108 or (p.x>=88 and p.y<80) then target=legs
 elseif p.y>=69 or (p.x>80 and p.y>=58) then target=arms end
 target:drawPixel(p.x,p.y,c)
end
local a,v=Image(160,96,ColorMode.RGB),Image(160,96,ColorMode.RGB)
for y=0,95 do for x=48,91 do local c=core:getPixel(x,y);if gold(c) then a:drawPixel(x,y,accents[2]);v:drawPixel(x,y,accents[3]) end end end
master("hero-core-study",160,96,{{"Head and hair - support needs review",hair},{"Torso - back contact needs review",torso},{"Near and far arms - hand overlap needs review",arms},{"Bent legs and feet - contact needs review",legs},{"Adventurer trim",a,false},{"Veteran trim",v,false}})
body:close()
print("Character head registration, contact keys, opposed march arm, training outfit and review-only core study prepared.")
