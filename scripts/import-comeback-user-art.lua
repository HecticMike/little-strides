-- Explicit, one-time grid fitting of USER-supplied pixel-art references.
-- Normal export only reads the masters. This is not native-authored artwork or a rig.
local root='art/prototypes/comeback/user-art/'
if app.fs.isFile(root..'character.aseprite') or app.fs.isFile(root..'studio.aseprite') then error('User-art masters exist; edit them in Aseprite, never repeat import.') end
local pc=app.pixelColor
local ramps={
 {'Outline','10232c','20343c'},
 {'Hair','3e281f','58382b','785039','a36d49','c38b60'},
 {'Skin','b66d48','d88e59','efa96c','ffc481','ffdda5'},
 {'Shorts','29343f','3c4754','535f6c','727c85','969c9f'},
 {'Trainers','52656c','8b9995','bec5b6','e3e4cf','fff3da'},
 {'Shirt','153f49','215861','307a7e','48979a','72b1ad'}
}
local palette={};for _,ramp in ipairs(ramps) do for i=2,#ramp do local h=ramp[i];palette[#palette+1]={role=ramp[1],r=tonumber(h:sub(1,2),16),g=tonumber(h:sub(3,4),16),b=tonumber(h:sub(5,6),16)} end end
local function rgba(p)return pc.rgba(p.r,p.g,p.b,255)end
local cache={}
local function quant(v)
 local a=pc.rgbaA(v);if a<240 then return 0,nil end
 local rgb=v & 0xffffff
 if cache[rgb] then return cache[rgb][1],cache[rgb][2] end
 local r,g,b=pc.rgbaR(v),pc.rgbaG(v),pc.rgbaB(v);local best,dist=1,1e30
 for i,p in ipairs(palette) do local d=2*(r-p.r)^2+3*(g-p.g)^2+2*(b-p.b)^2;if d<dist then best,dist=i,d end end
 local p=palette[best];local c=rgba(p);cache[rgb]={c,p.role};return c,p.role
end
local function read(path)local s=app.open(path);local im=Image(s);s:close();return im end
local function bounds(im)
 local x0,y0,x1,y1=im.width,im.height,-1,-1
 for p in im:pixels() do if pc.rgbaA(p())>=240 then x0=math.min(x0,p.x);y0=math.min(y0,p.y);x1=math.max(x1,p.x);y1=math.max(y1,p.y) end end
 return {x=x0,y=y0,w=x1-x0+1,h=y1-y0+1}
end
local function clean(im)
 -- Remove disconnected alpha specks only; preserve internal single-pixel face details.
 local seen={};local erase={};local count=0
 for y=0,im.height-1 do for x=0,im.width-1 do local key=y*im.width+x
 if not seen[key] and pc.rgbaA(im:getPixel(x,y))>0 then
  local q={{x,y}};local head=1;seen[key]=true
  while head<=#q do local p=q[head];head=head+1;for _,d in ipairs({{-1,0},{1,0},{0,-1},{0,1}}) do local nx,ny=p[1]+d[1],p[2]+d[2];local k=ny*im.width+nx;if nx>=0 and ny>=0 and nx<im.width and ny<im.height and not seen[k] and pc.rgbaA(im:getPixel(nx,ny))>0 then seen[k]=true;q[#q+1]={nx,ny} end end end
  if #q<=2 then for _,p in ipairs(q) do erase[#erase+1]=p end end
 end end end
 for _,p in ipairs(erase) do im:drawPixel(p[1],p[2],0);count=count+1 end;return count
end
local function fit(src,standing)
 local b=bounds(src);local im=Image(standing and 48 or 96,64,ColorMode.RGB)
 local scale=standing and (60/b.h) or (84/b.w)
 local cx=standing and 24 or 48;local sourceCX=b.x+b.w/2;local bottom=standing and 62 or 61
 for y=0,63 do for x=0,im.width-1 do
  local sx=math.floor((x+.5-cx)/scale+sourceCX);local sy=math.floor((y+.5-bottom)/scale+b.y+b.h)
  if sx>=0 and sy>=0 and sx<src.width and sy<src.height then local c=quant(src:getPixel(sx,sy));im:drawPixel(x,y,c) end
 end end
 return im,b,clean(im)
end
local files={'starting-standing','developed-standing','starting-heel-slide','developed-heel-slide'}
local raw,fitImages,sourceBounds={}, {}, {};local removed=0
for i,name in ipairs(files) do raw[i]=read('art/direction/comeback-user/'..name..'.png');local n;fitImages[i],sourceBounds[i],n=fit(raw[i],i<=2);removed=removed+n end
-- Canonical standing face/hair: same supplied head, no change to its game proportions.
local standingHead=Image(48,64,ColorMode.RGB)
for y=0,20 do for x=0,47 do standingHead:drawPixel(x,y,fitImages[1]:getPixel(x,y));fitImages[1]:drawPixel(x,y,0);fitImages[2]:drawPixel(x,y,0) end end
-- Isolate the uploaded floor head, rigidly rotate it to face upward, then register.
-- Work from the original pixels, not an invented/repainted independent character.
local headSrc=raw[3];local b=sourceBounds[3]
local hx=b.x+math.floor(b.w*.735);local hy=b.y+math.floor(b.h*.11)
local hw=b.x+b.w-hx;local hh=b.y+b.h-hy
local floorHead=Image(96,64,ColorMode.RGB)
local angle=math.rad(45);local co,si=math.cos(angle),math.sin(angle)
local hs=25/math.max(hw,hh);local centerX,centerY=hx+hw/2,hy+hh/2
local rotated={};local minX,minY,maxX,maxY=1000,1000,-1,-1
for y=-24,24 do for x=-24,24 do
 local sx=math.floor((co*x+si*y)/hs+centerX);local sy=math.floor((-si*x+co*y)/hs+centerY)
 if sx>=hx and sy>=hy and sx<headSrc.width and sy<headSrc.height then
  local c,role=quant(headSrc:getPixel(sx,sy))
  if c~=0 and (role=='Skin' or role=='Hair' or role=='Outline' or role=='Trainers') then
   rotated[#rotated+1]={x,y,c};minX=math.min(minX,x);maxX=math.max(maxX,x);minY=math.min(minY,y);maxY=math.max(maxY,y)
  end
 end
end end
local headRight,headBottom=92,59
for _,p in ipairs(rotated) do local x,y=p[1]+headRight-maxX,p[2]+headBottom-maxY;if x>=0 and x<96 and y>=0 and y<64 then floorHead:drawPixel(x,y,p[3]) end end
clean(floorHead)
for i=3,4 do
 -- Preserve torso shape; remove the independently generated old head and neckline.
 local im=fitImages[i]
 for y=0,63 do for x=68,95 do local v=im:getPixel(x,y);if pc.rgbaA(v)>0 then local _,role=quant(v);if role~='Shirt' then im:drawPixel(x,y,0) end end end end
 -- A short editable neck joins the common head to the shirt, rather than floating.
 for y=55,57 do for x=69,73 do im:drawPixel(x,y,rgba(palette[9])) end end
end
local sprite=Sprite(192,128,ColorMode.RGB);sprite:deleteLayer(sprite.layers[1])
local partitions={}
local function part(name)
 if not partitions[name] then partitions[name]={image=Image(192,128,ColorMode.RGB)} end;return partitions[name].image
end
local function classify(x,y,role,standing)
 if standing then
  if y<=22 and x>=18 and x<=31 then return 'Neck support' end
  if role=='Shirt' then return 'Teal shirt' end
  if role=='Shorts' then return 'Shorts and pelvis' end
  if y>=57 then return x<25 and 'Near trainer' or 'Far trainer' end
  if y>=44 then return x<25 and 'Near leg' or 'Far leg' end
  if x<20 then return 'Near arm and hand' elseif x>30 then return 'Far arm and hand' end
  return 'Torso contours'
 end
 if role=='Shirt' then return 'Teal shirt' end
 if x>=44 and y>=52 and role=='Skin' then return 'Near arm hand and neck' end
 if x>=34 and role=='Shorts' then return 'Shorts and pelvis' end
 if x<34 and (role=='Trainers' or role=='Shorts') then return x<18 and 'Sliding trainer' or 'Bent-leg trainer' end
 if x<44 then return y<52 and 'Bent leg' or 'Sliding leg' end
 return 'Torso and limb contours'
end
for i,im in ipairs(fitImages) do
 local standing=i<=2;local stage=(i==1 or i==3) and 'Starting' or 'Developed';local dx=standing and ((i-1)*48) or ((i-3)*96);local dy=standing and 0 or 64
 for y=0,63 do for x=0,im.width-1 do local v=im:getPixel(x,y);if pc.rgbaA(v)>0 then local _,role=quant(v);part((standing and 'Standing' or 'Heel slide')..' / '..stage..' / '..classify(x,y,role,standing)):drawPixel(dx+x,dy+y,v) end end end
end
local names={};for name in pairs(partitions) do names[#names+1]=name end;table.sort(names)
for _,name in ipairs(names) do local l=sprite:newLayer();l.name=name;sprite:newCel(l,1,partitions[name].image,Point(0,0)) end
for i=1,4 do local standing=i<=2;local stage=(i==1 or i==3) and 'Starting' or 'Developed';local l=sprite:newLayer();l.name=(standing and 'Standing' or 'Heel slide')..' / '..stage..' / Shared head';local im=Image(192,128,ColorMode.RGB);im:drawImage(standing and standingHead or floorHead,Point(standing and ((i-1)*48) or ((i-3)*96),standing and 0 or 64));sprite:newCel(l,1,im,Point(0,0)) end
local pal=Palette(#palette+1);pal:setColor(0,Color{r=0,g=0,b=0,a=0});for i,p in ipairs(palette) do pal:setColor(i,Color{r=p.r,g=p.g,b=p.b,a=255}) end;sprite:setPalette(pal)
sprite.gridBounds=Rectangle(0,0,48,64);sprite:saveAs(root..'character.aseprite');Image(sprite):saveAs(root..'character.png');sprite:close()
-- Honest flattened source background; no claim of separately reconstructed furniture.
sprite=app.open('art/direction/comeback-user/apartment.png');sprite.layers[1].name='Flattened user apartment - 64 colour source';sprite:saveAs(root..'studio.aseprite');Image(sprite):saveAs(root..'studio.png');sprite:close()
local metadata={schemaVersion=1,origin='user-generated-pixel-art-grid-fitted-in-Aseprite',nativeAuthored=false,integrated=false,anatomyStatus='provisional-unreviewed',alphaThreshold=240,alphaOutput='binary',paletteSize=#palette,sourceBounds=sourceBounds,disconnectedPixelsRemoved=removed,standingHead={source='starting-standing',sameAcrossStages=true},floorHead={source='starting-heel-slide',sameAcrossStages=true,rotationDegrees=45,ground=59,right=92},frames={{id='starting-stand',x=0,y=0,w=48,h=64},{id='developed-stand',x=48,y=0,w=48,h=64},{id='starting-heel-slide',x=0,y=64,w=96,h=64},{id='developed-heel-slide',x=96,y=64,w=96,h=64}}}
local f=io.open(root..'import.json','w');f:write(json.encode(metadata));f:close()
local f=io.open(root..'palette.gpl','w');f:write('GIMP Palette\nName: Little Strides user character\nColumns: 8\n# Shared material ramps, imported art\n');for _,p in ipairs(palette) do f:write(p.r..' '..p.g..' '..p.b..' '..p.role..'\n') end;f:close()
print('Prepared imported character parts and the honest flattened apartment source; original PNGs unchanged.')