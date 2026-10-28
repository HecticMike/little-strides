-- Preserve the canonical model; edit only the existing two walk columns.
local pc=app.pixelColor;local W,H=96,128
local body=app.open('art/source/hero-body.aseprite');assert(body.width==960 and body.height==H,'Unexpected canonical sheet')
-- Grow the canonical skin masks into their existing outlines/cuffs. The former
-- polygon cutouts missed finger edges, leaving a second resting-arm outline.
local canonical=Image(body);local skin=Image(body.width,H,ColorMode.RGB)
for _,layer in ipairs(body.layers)do if layer.name=='Skin and face'then local cel=layer:cel(1);skin:drawImage(cel.image,cel.position)end end
local masks={{},{}}
for y=49,85 do for x=0,95 do if pc.rgbaA(skin:getPixel(x,y))>0 and(x<=42 or x>=63)then
 local which=x<51 and 1 or 2
 for dy=-2,2 do for dx=-2,2 do local xx,yy=x+dx,y+dy
  if xx>=0 and xx<W and yy>=49 and yy<=87 and(which==1 and xx<=42 or which==2 and xx>=63)and pc.rgbaA(canonical:getPixel(xx,yy))>0 then masks[which][yy*W+xx]=true end
 end end
end end end
for _,layer in ipairs(body.layers)do
 local cel=layer:cel(1);local original=Image(body.width,H,ColorMode.RGB);original:drawImage(cel.image,cel.position);local result=Image(original)
 for _,col in ipairs({7,8})do
  for y=0,H-1 do for x=0,W-1 do result:drawPixel(col*W+x,y,0)end end
  for y=0,83 do for x=0,W-1 do if not masks[1][y*W+x]and not masks[2][y*W+x]then result:drawPixel(col*W+x,y,original:getPixel(x,y))end end end
  -- Near leg is painted last. Boots translate rigidly rather than shearing.
  for _,leg in ipairs({2,1})do
   local swing=(col==7 and leg==2)or(col==8 and leg==1)
   for y=84,119 do for x=(leg==1 and 0 or 51),(leg==1 and 50 or 95)do
    local color=original:getPixel(x,y)
    if pc.rgbaA(color)>0 and not masks[1][y*W+x]and not masks[2][y*W+x]then
     local blend=math.min(1,(y-84)/15);local dx=math.floor((swing and 6 or -5)*blend+.5);local dy=swing and -math.floor(4*blend+.5)or 0
     if x+dx>=0 and x+dx<W then result:drawPixel(col*W+x+dx,y+dy,color)end
    end
   end end
  end
  for _,which in ipairs({2,1})do
   local angle=math.rad(((col==7 and which==1)or(col==8 and which==2))and 16 or -16)
   local px,py=which==1 and 33 or 69,51;local co,si=math.cos(angle),math.sin(angle)
   for y=43,89 do for x=10,92 do
    local dx,dy=x-px,y-py;local sx,sy=math.floor(co*dx+si*dy+px+.5),math.floor(-si*dx+co*dy+py+.5)
    if sx>=0 and sx<W and sy>=0 and sy<H and masks[which][sy*W+sx]then local color=original:getPixel(sx,sy);if pc.rgbaA(color)>0 then result:drawPixel(col*W+x,y,color)end end
   end end
  end
  for y=42,73 do for x=43,62 do result:drawPixel(col*W+x,y,original:getPixel(x,y))end end
 end
 cel.image=result;cel.position=Point(0,0)
end
-- Reconstruct the small trouser edge previously hidden by the resting hands.
-- Keep it independently editable behind the original body/arm pixels.
local cloth=Image(body.width,H,ColorMode.RGB);local patchLayer
for _,layer in ipairs(body.layers)do
 if layer.name=='Outfit and boots'then local cel=layer:cel(1);cloth:drawImage(cel.image,cel.position)end
 if layer.name=='Walk - revealed trouser edges'then patchLayer=layer end
end
local patch=Image(body.width,H,ColorMode.RGB);local left={39,39,38,38,37,37,36,36,35,35};local right={63,63,64,64,64,64,64,64,65,65}
for _,col in ipairs({7,8})do for y=74,83 do
 local a,b=left[y-73],right[y-73]
 for x=a,b do
  local sx=x<44 and 43+x-a or x>60 and 60-b+x or x
  local color=(x==a or x==b)and cloth:getPixel(35,86)or cloth:getPixel(sx,y)
  if pc.rgbaA(color)>0 then patch:drawPixel(col*W+x,y,color)end
 end
end end
if not patchLayer then patchLayer=body:newLayer();patchLayer.name='Walk - revealed trouser edges'end
patchLayer.stackIndex=1;local cel=patchLayer:cel(1);if cel then cel.image=patch;cel.position=Point(0,0)else body:newCel(patchLayer,1,patch)end
body:saveAs(body.filename);body:close()
print('Walk A/B: complete canonical arm cutouts and rigid boot contacts; all other poses untouched.')
