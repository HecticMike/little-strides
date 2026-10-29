-- Undo rejected head transplantation. Preserve complete source-matched floor poses.
local root='art/prototypes/comeback/user-art/'
if app.fs.isFile(root..'source-pose-restoration.json') then error('Pose restoration already applied. Edit masters directly.') end
local pc=app.pixelColor
local colours={};for line in io.lines(root..'palette.gpl') do local r,g,b=line:match('^(%d+)%s+(%d+)%s+(%d+)');if r then colours[#colours+1]={tonumber(r),tonumber(g),tonumber(b)} end end
local function rgba(p)return pc.rgba(p[1],p[2],p[3],255)end
local memo={}
local function quant(v)
 if pc.rgbaA(v)<240 then return 0 end
 local key=v & 0xffffff;if memo[key] then return memo[key] end
 local r,g,b=pc.rgbaR(v),pc.rgbaG(v),pc.rgbaB(v);local best,dist=1,1e30
 for i,p in ipairs(colours) do local d=2*(r-p[1])^2+3*(g-p[2])^2+2*(b-p[3])^2;if d<dist then best,dist=i,d end end
 memo[key]=rgba(colours[best]);return memo[key]
end
local function read(path)local s=app.open(path);local im=Image(s);s:close();return im end
local function bounds(im)local x0,y0,x1,y1=im.width,im.height,0,0;for p in im:pixels() do if pc.rgbaA(p())>=240 then x0=math.min(x0,p.x);y0=math.min(y0,p.y);x1=math.max(x1,p.x);y1=math.max(y1,p.y) end end;return {x=x0,y=y0,w=x1-x0+1,h=y1-y0+1}end
local function add(s,name,im)local l=s:newLayer();l.name=name;s:newCel(l,1,im,Point(0,0));return l end
local function palette(s)local p=Palette(#colours+1);p:setColor(0,Color{r=0,g=0,b=0,a=0});for i,c in ipairs(colours) do p:setColor(i,Color{r=c[1],g=c[2],b=c[3],a=255}) end;s:setPalette(p)end
local previous=app.open(root..'character.aseprite');local oldHeads=app.open(root..'heads.aseprite');local oldHead=Image(oldHeads);oldHeads:close()
local s=Sprite(384,256,ColorMode.RGB);s:deleteLayer(s.layers[1])
-- Preserve all approved standing pixels; enlargement is exact nearest-neighbour.
for _,layer in ipairs(previous.layers) do if layer.name:find('^Standing') and not layer.name:find('/ Shared head') then
 local im=Image(384,256,ColorMode.RGB);local src=layer:cel(1).image;for y=0,63 do for x=0,95 do local v=src:getPixel(x,y);if pc.rgbaA(v)>0 then for yy=0,1 do for xx=0,1 do im:drawPixel(x*2+xx,y*2+yy,v) end end end end end;add(s,layer.name,im)
end end
previous:close()
local headMaster=Sprite(384,256,ColorMode.RGB);headMaster:deleteLayer(headMaster.layers[1])
local standing=Image(384,256,ColorMode.RGB)
for y=0,63 do for x=0,47 do local v=oldHead:getPixel(x,y);if pc.rgbaA(v)>0 then for yy=0,1 do for xx=0,1 do standing:drawPixel(x*2+xx,y*2+yy,v) end end end end end
add(headMaster,'Canonical standing head',standing)
local standingDev=Image(384,256,ColorMode.RGB);standingDev:drawImage(standing,Point(96,0));add(headMaster,'Canonical standing head - developed placement',standingDev)
local reference=Image(384,256,ColorMode.RGB)
local sourceBounds={}
local function material(v)
 local r,g,b=pc.rgbaR(v),pc.rgbaG(v),pc.rgbaB(v)
 if g>r*1.15 and b>r*1.1 then return 'Shirt and contours' end
 if r>g*1.15 then return 'Skin and limb contours' end
 return 'Shorts footwear and outlines'
end
for stage,name in ipairs({'starting-heel-slide','developed-heel-slide'}) do
 local src=read('art/direction/comeback-user/'..name..'.png');local b=bounds(src);sourceBounds[#sourceBounds+1]=b
 local scale=168/b.w;local im=Image(192,128,ColorMode.RGB)
 for y=0,127 do for x=0,191 do local sx=math.floor((x+.5-96)/scale+b.x+b.w/2);local sy=math.floor((y+.5-122)/scale+b.y+b.h)
  if sx>=0 and sy>=0 and sx<src.width and sy<src.height then im:drawPixel(x,y,quant(src:getPixel(sx,sy))) end
 end end
 local dx=(stage-1)*192;reference:drawImage(im,Point(dx,128))
 local parts={};local function part(n)if not parts[n] then parts[n]=Image(384,256,ColorMode.RGB) end;return parts[n]end
 local head=Image(384,256,ColorMode.RGB)
 for y=0,127 do for x=0,191 do local v=im:getPixel(x,y);if pc.rgbaA(v)>0 then
  -- Keep head/neck/shoulder junction together. No rotation, paste or invented bridge.
  if x>=132 then head:drawPixel(dx+x,128+y,v)
  else local n
   if x>=88 and y>=104 then n='Near arm and torso'
   elseif x<88 then n=y<104 and 'Bent leg and trainer' or 'Sliding leg and trainer'
   else n=material(v) end
   part(n):drawPixel(dx+x,128+y,v)
  end
 end end end
 local label=stage==1 and 'Starting' or 'Developed';local names={};for n in pairs(parts)do names[#names+1]=n end;table.sort(names)
 for _,n in ipairs(names)do add(s,'Heel slide / '..label..' / '..n,parts[n])end
 add(headMaster,'Source-matched '..label:lower()..' floor head neck and shoulder',head)
end
reference:saveAs(root..'registered-floor-source.png')
palette(s);palette(headMaster);s.gridBounds=Rectangle(0,0,96,128);headMaster.gridBounds=Rectangle(0,0,96,128)
s:saveAs(root..'character.aseprite');headMaster:saveAs(root..'heads.aseprite');s:close();headMaster:close()
local room=app.open('art/direction/comeback-user/sunlit-apartment-original.png');room.layers[1].name='Sunlit original - full-detail flattened source';room:saveAs(root..'studio.aseprite');room:close()
local metadata={schemaVersion=2,origin='user-generated-pixel-art-prepared-in-Aseprite',nativeAuthored=false,integrated=false,anatomyStatus='provisional-unreviewed',alphaThreshold=240,alphaOutput='binary',paletteSize=#colours,workingScale=2,standingHead={source='approved-standing-head',sameAcrossStages=true},floorHead={policy='complete source-matched head neck and shoulder; no transplantation',rotationDegrees=0,bridgeAdded=false},floorSourceBounds=sourceBounds,room={source='sunlit-apartment-original.png',width=1620,height=971,flattened=true,fullDetailPreserved=true},frames={{id='starting-stand',x=0,y=0,w=96,h=128},{id='developed-stand',x=96,y=0,w=96,h=128},{id='starting-heel-slide',x=0,y=128,w=192,h=128},{id='developed-heel-slide',x=192,y=128,w=192,h=128}}}
local f=io.open(root..'import.json','w');f:write(json.encode(metadata));f:close()
local f=io.open(root..'source-pose-restoration.json','w');f:write(json.encode({revision=2,rejectedRotationRemoved=true,artificialNeckBridgeRemoved=true,fullFloorPosePreserved=true,workingScale=2,room='Sunlit Pixel-Art Home Workout Room.png'}));f:close()
print('Restored complete source floor poses and the full-detail Sunlit room; no head rotation or neck bridge.')