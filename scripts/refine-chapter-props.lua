-- Explicit one-time refinement. Does not run in normal art:export.
-- Generated originals remain flattened; useful material masks are separated here.
local pc=app.pixelColor
local function rgbImage(path)
 local sprite=app.open(path)
 if sprite.colorMode~=ColorMode.RGB then app.activeSprite=sprite;app.command.ChangePixelFormat{format='rgb',ui=false}end
 local image=Image(sprite);sprite:close();return image
end
local src=Image{fromFile='art/direction/chapter-one/prop-atlas.png'}
local old=app.open('art/source/chapter-props.aseprite');for _,l in ipairs(old.layers)do if l.name=='Mira traveller - structure or clothing' and app.params['refresh']~='yes' then old:close();error('Refined masters already exist. Edit in Aseprite and run art:export.')end end;local previous=Image(old);old:close()
local palette={};for line in io.lines('art/palette.gpl')do local r,g,b=line:match('^%s*(%d+)%s+(%d+)%s+(%d+)');if r then palette[#palette+1]={tonumber(r),tonumber(g),tonumber(b)}end end
local ground=rgbImage('public/art/village-ground.png');local counts={}
for p in ground:pixels()do if pc.rgbaA(p())>240 then counts[p()]=(counts[p()]or 0)+1 end end
local colors={};for c,n in pairs(counts)do colors[#colors+1]={c,n}end;table.sort(colors,function(a,b)return a[2]>b[2]end)
for i=1,math.min(160,#colors)do local c=colors[i][1];palette[#palette+1]={pc.rgbaR(c),pc.rgbaG(c),pc.rgbaB(c)}end
local memo={};local function quant(c)if memo[c]then return memo[c]end;local r,g,b=pc.rgbaR(c),pc.rgbaG(c),pc.rgbaB(c);local best,dist=palette[1],1e20;for _,v in ipairs(palette)do local d=2*(r-v[1])^2+3*(g-v[2])^2+(b-v[3])^2;if d<dist then best,dist=v,d end end;local out=pc.rgba(best[1],best[2],best[3],255);memo[c]=out;return out end
local crops={{49,9,356,351},{471,9,776,350},{823,39,1274,354},{11,411,510,738},{541,364,730,737},{831,389,1270,757},{119,738,342,1193},{467,752,694,1193},{777,804,1274,1178}}
local names={'Fern banner','Star banner','Flower bench','Fern bench','Path lantern','Travellers noticeboard','Rowan carpenter','Mira traveller','Gathering table'}
local maxes={{64,78},{64,78},{90,70},{90,70},{48,88},{90,80},{48,90},{48,90},{92,78}}
local s=Sprite(384,288,ColorMode.RGB);local initial=s.layers[1]
for index,crop in ipairs(crops)do
 local frame=index-1;local fw,fh=crop[3]-crop[1],crop[4]-crop[2];local factor=math.min(maxes[index][1]/fw,maxes[index][2]/fh);local w,h=math.floor(fw*factor),math.floor(fh*factor);local ox=(frame%4)*96+math.floor((96-w)/2);local oy=math.floor(frame/4)*96+94-h
 local images={Image(384,288,ColorMode.RGB),Image(384,288,ColorMode.RGB),Image(384,288,ColorMode.RGB)}
 for y=0,h-1 do for x=0,w-1 do local c=src:getPixel(crop[1]+math.min(fw-1,math.floor((x+.5)/factor)),crop[2]+math.min(fh-1,math.floor((y+.5)/factor)));if pc.rgbaA(c)>=230 then
  local r,g,b=pc.rgbaR(c),pc.rgbaG(c),pc.rgbaB(c);local part=1
  if index==7 or index==8 then if y<h*.42 and r>g*1.15 and g>b*1.1 and r>120 then part=2 elseif y<h*.3 then part=3 end
  elseif g>r*1.05 then part=2 elseif r>150 and g>95 and b<g*.8 then part=3 end
  images[part]:drawPixel(ox+x,oy+y,quant(c))
 end end end
 for i,image in ipairs(images)do local l=s:newLayer();l.name=names[index]..' - '..({'structure or clothing','planting or skin','metal light or hair'})[i];s:newCel(l,1,image)end
end
-- Retain the small native environmental keys and their stable atlas slots.
local environment=Image(384,288,ColorMode.RGB);for y=192,287 do for x=96,383 do environment:drawPixel(x,y,previous:getPixel(x,y))end end
local l=s:newLayer();l.name='Native foliage keys and chimney wisp';s:newCel(l,1,environment);s:deleteLayer(initial);s:saveAs('art/source/chapter-props.aseprite');s:close()
-- Lossless architectural patch: the chosen star replaces the actual painted fern.
-- It does not add a second banner elsewhere in the world.
local buildings=rgbImage('public/art/buildings.png');local s=Sprite(120,64,ColorMode.RGB);local initial=s.layers[1]
for frame=0,1 do local image=Image(120,64,ColorMode.RGB);for y=0,63 do for x=0,59 do image:drawPixel(frame*60+x,y,buildings:getPixel(560+190+x,126+y))end end
 if frame==1 then
  for y=142,168 do for x=207,224 do local c=buildings:getPixel(560+x,y);local r,g,b=pc.rgbaR(c),pc.rgbaG(c),pc.rgbaB(c);if r>g*1.06 and g>b*1.12 then image:drawPixel(60+x-190,y-126,buildings:getPixel(560+207,y))end end end
  for d=-7,7 do local span=math.floor((7-math.abs(d))/2);for x=-span,span do image:drawPixel(60+215-190+x,154-126+d,pc.rgba(237,189,102,255))end end
  for d=-5,5 do image:drawPixel(60+215-190+d,154-126,pc.rgba(255,218,136,255))end
 end
 local l=s:newLayer();l.name=frame==0 and 'Original fern - registered painted wall' or 'Star crest - registered painted wall';s:newCel(l,1,image)
end
s:deleteLayer(initial);s:saveAs('art/source/chapter-banner.aseprite');s:close()
print('Refined chapter props with registered material masks and a lossless banner patch.')
