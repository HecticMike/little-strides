-- Diagnostic still only: existing standing parts with rotated trainers and fixed toe contact.
local root='art/prototypes/comeback/user-art/'
local pc=app.pixelColor
local s=app.open(root..'character.aseprite');local heads=app.open(root..'heads.aseprite');local hi=Image(heads);heads:close()
local function layerImage(layer,stage)
 local im=Image(48,66,ColorMode.RGB);local cel=layer:cel(1);if not cel then return im end
 for y=0,63 do for x=0,47 do local sx=x*2+stage*96-cel.position.x;local sy=y*2-cel.position.y;if sx>=0 and sx<cel.image.width and sy>=0 and sy<cel.image.height then im:drawPixel(x,y,cel.image:getPixel(sx,sy)) end end end;return im
end
local function box(im)local b={x=48,y=66,x1=-1,y1=-1};for p in im:pixels() do if pc.rgbaA(p())>0 then b.x=math.min(b.x,p.x);b.y=math.min(b.y,p.y);b.x1=math.max(b.x1,p.x);b.y1=math.max(b.y1,p.y) end end;return b end
local function round(n)return math.floor(n+.5)end
local review=Image(768,576,ColorMode.RGB);review:clear(pc.rgba(245,237,221,255));local summaries={}
for stage=0,1 do
 local body=Image(48,66,ColorMode.RGB);local shoes={}
 for _,layer in ipairs(s.layers) do if layer.name:find('^Standing / '..(stage==0 and 'Starting' or 'Developed')..' / ') then local im=layerImage(layer,stage);if layer.name:find('trainer') then shoes[#shoes+1]={name=layer.name,image=im,bounds=box(im)} else body:drawImage(im,Point(0,0)) end end end
 for y=0,20 do for x=0,47 do body:drawPixel(x,y,hi:getPixel(stage*96+x*2,y*2)) end end
 local angle=math.rad(15);local info={stage=stage,trainers={}}
 for _,shoe in ipairs(shoes) do
  local b=shoe.bounds;local near=shoe.name:find('Near')~=nil;local px=near and b.x or b.x1;local py=b.y1;local dy=2;local co,si=math.cos(angle),math.sin(near and -angle or angle);local out=Image(48,66,ColorMode.RGB)
  for y=0,65 do for x=0,47 do local dx,yy=x-px,y-(py+dy);local sx=round(co*dx+si*yy+px);local sy=round(-si*dx+co*yy+py);if sx>=0 and sx<48 and sy>=0 and sy<66 and y<=py+dy then out:drawPixel(x,y,shoe.image:getPixel(sx,sy)) end end end
  body:drawImage(out,Point(0,0));info.trainers[#info.trainers+1]={name=shoe.name,sourceBounds=b,toeX=px,toeY=py+dy,angleDegrees=near and -15 or 15}
 end
 local full=Image(96,132,ColorMode.RGB);for y=0,65 do for x=0,47 do local v=body:getPixel(x,y);for yy=0,1 do for xx=0,1 do full:drawPixel(x*2+xx,y*2+yy,v) end end end end
 full:saveAs(root..'calf-fit-'..stage..'.png')
 local canonical=Image{fromFile=root..'character.png'}
 for variant=0,1 do local originX=stage*384+variant*192;local scale=2
  for y=0,131 do for x=0,95 do local v=variant==0 and (y<128 and canonical:getPixel(stage*96+x,y) or 0) or full:getPixel(x,y);if pc.rgbaA(v)>0 then for yy=0,1 do for xx=0,1 do review:drawPixel(originX+x*2+xx,8+(variant==0 and 8 or 0)+y*2+yy,v) end end end end end
 end
 -- Enlarged footwear row, sole ground line aligned across the neutral and raised poses.
 for variant=0,1 do local originX=stage*384+variant*192
  for y=104,131 do for x=24,71 do local v=variant==0 and (y<128 and canonical:getPixel(stage*96+x,y) or 0) or full:getPixel(x,y);if pc.rgbaA(v)>0 then for yy=0,3 do for xx=0,3 do review:drawPixel(originX+(x-24)*4+xx,300+(variant==0 and 16 or 0)+(y-104)*4+yy,v) end end end end end
 end
 summaries[#summaries+1]=info
end
s:close();review:saveAs(root..'calf-fit-review.png');local f=io.open(root..'calf-fit.json','w');f:write(json.encode({status='diagnostic-only',stages=summaries,workingFrame={w=96,h=132},logicalFrame={w=48,h=66}}));f:close();print(json.encode(summaries))
