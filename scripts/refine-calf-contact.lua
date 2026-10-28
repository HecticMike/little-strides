-- Correct the existing raised calf position using canonical standing pixels.
-- No new frame, exercise, character design or timing system.
local pc=app.pixelColor;local W,H,COL,LIFT=96,128,4,4
local check=app.open('art/source/hero-training-outfit.aseprite');for _,l in ipairs(check.layers)do assert(l.name~='Calf - forefoot contacts','Preserve the refined calf master; do not repeat this authoring edit.')end;check:close()
local body=app.open('art/source/hero-body.aseprite');local base=Image(body);body:close()
local toe=0;for y=109,119 do for x=51,95 do if pc.rgbaA(base:getPixel(x,y))>0 then toe=math.max(toe,x)end end end
local a=math.rad(15);local co,si=math.cos(a),math.sin(a)
local function footSample(x,y)
 local dx,dy=x-toe,y-119
 return math.floor(co*dx+si*dy+toe+.5),math.floor(-si*dx+co*dy+119+.5)
end
local low=0;for y=96,127 do for x=51,95 do local sx,sy=footSample(x,y);if sx>=51 and sx<96 and sy>=109 and sy<=119 and pc.rgbaA(base:getPixel(sx,sy))>0 then low=math.max(low,y)end end end
local settle=119-low
local function calf(source,row)
 local out=Image(W,H,ColorMode.RGB)
 for y=0,108 do for x=0,95 do if y>=LIFT then out:drawPixel(x,y-LIFT,source:getPixel(x,row*H+y))end end end
 -- The front-facing boot changes foreshortening; its toe contact stays fixed.
 for y=105,119 do for x=0,50 do
  local sy=y>=115 and y or math.floor(115-(115-y)*6/10+.5)
  if sy>=109 and sy<=119 then out:drawPixel(x,y,source:getPixel(x,row*H+sy))end
 end end
 -- The side-facing sole pivots as one rigid part about its forefoot.
 for y=96,123 do for x=51,95 do
  local sx,sy=footSample(x,y-settle)
  if sx>=51 and sx<W and sy>=109 and sy<=119 then local c=source:getPixel(sx,row*H+sy);if pc.rgbaA(c)>0 then out:drawPixel(x,y,c)end end
 end end
 return out
end
for _,name in ipairs({'hero-body','hero-equipment','hero-training-outfit'})do
 local s=app.open('art/source/'..name..'.aseprite')
 assert(s.width==960,'Unexpected canonical grid')
 for _,layer in ipairs(s.layers)do
  assert(layer.name~='Calf - forefoot contacts','Calf correction already applied; preserve artist edits.')
  local cel=layer:cel(1);local original=Image(s.width,s.height,ColorMode.RGB);original:drawImage(cel.image,cel.position);local result=Image(original)
  for row=0,s.height//H-1 do
   for y=0,H-1 do for x=0,W-1 do result:drawPixel(COL*W+x,row*H+y,0)end end
   result:drawImage(calf(original,row),Point(COL*W,row*H))
  end
  cel.image=result;cel.position=Point(0,0)
 end
 if name=='hero-body'then
  local foot=calf(base,0);local sole=Image(s.width,s.height,ColorMode.RGB)
  for x=toe-5,toe do local bottom
   for y=119,115,-1 do if pc.rgbaA(foot:getPixel(x,y))>0 then bottom=y;break end end
   if bottom then for y=bottom+1,119 do sole:drawPixel(COL*W+x,y,base:getPixel(math.min(x,toe-5),y==119 and 119 or 118))end end
  end
  local l=s:newLayer();l.name='Calf - forefoot sole';s:newCel(l,1,sole,Point(0,0))
 end
 if name=='hero-training-outfit'then
  local contacts=Image(s.width,s.height,ColorMode.RGB);local framed=calf(base,0);local first,last=51,-1
  for x=0,50 do if pc.rgbaA(framed:getPixel(x,119))>0 then first=math.min(first,x);last=math.max(last,x)end end
  for row=0,2 do for y=120,122 do for _,span in ipairs({{first-1,last+1},{toe-6,toe+1}})do local inset=y==121 and 0 or 2;for x=span[1]+inset,span[2]-inset do contacts:drawPixel(COL*W+x,row*H+y,pc.rgba(16,38,41,y==121 and 75 or 40))end end end end
  local l=s:newLayer();l.name='Calf - forefoot contacts';s:newCel(l,1,contacts,Point(0,0))
 end
 s:saveAs(s.filename);s:close()
end
print('Existing calf key: four-pixel body rise, raised side heel, fixed forefoot contacts; source face and palette reused.')
