-- Read-only export of the edited calf master, with authoritative canonical heads.
local root='art/prototypes/comeback/user-art/'
local pc=app.pixelColor;local s=app.open(root..'calf.aseprite');local atlas=Image(192,132,ColorMode.RGB);local layers={};local trainers={}
for _,layer in ipairs(s.layers) do local cel=layer:cel(1);local pixels=0;if cel then for p in cel.image:pixels() do if pc.rgbaA(p())>0 then pixels=pixels+1 end end;if layer.isVisible and not layer.name:find('^Preview /') then atlas:drawImage(cel.image,cel.position);if layer.name:find('trainer') then local im=Image(192,132,ColorMode.RGB);im:drawImage(cel.image,cel.position);trainers[layer.name]=im end end end;layers[#layers+1]={name=layer.name,visible=layer.isVisible,pixels=pixels} end;s:close()
local hs=app.open(root..'heads.aseprite');local head=Image(hs);hs:close();local canonical=Image{fromFile=root..'character.png'}
for stage=0,1 do for y=0,41 do for x=0,95 do atlas:drawPixel(stage*96+x,y,head:getPixel(stage*96+x,y)) end end end
atlas:saveAs(root..'calf.png');atlas:saveAs('public/art/comeback-calf.png')
local report={exerciseId='calf',width=192,height=132,frameWidth=96,frameHeight=132,logicalWidth=48,logicalHeight=66,artPurpose='raised-position-only',animation=false,clinicalStatus='unreviewed-illustration',headRotationDegrees=0,headSource='heads.aseprite',layers=layers,stages={}}
local review=Image(768,756,ColorMode.RGB);review:clear(pc.rgba(245,237,221,255))
local function drawPixel(im,x,y,v)if x>=0 and y>=0 and x<im.width and y<im.height then im:drawPixel(x,y,v) end end
local function drawCell(dest,src,sx,sy,w,h,dx,dy,scale)for y=0,h-1 do for x=0,w-1 do local v=src:getPixel(sx+x,sy+y);if pc.rgbaA(v)>0 then for yy=0,scale-1 do for xx=0,scale-1 do drawPixel(dest,dx+x*scale+xx,dy+y*scale+yy,v) end end end end end end
for stage=0,1 do
 local name=stage==0 and 'Starting' or 'Developed';local r={appearance=stage==0 and 'starting' or 'developed',headDifference=0,bodyDifference=0,partialAlphaPixels=0,brokenLogicalBlocks=0,paletteSize=0,components={},detachedPixels={},footBaseline=-1,heelContacts={}};local colours={};local seen={}
 for y=0,131 do for x=0,95 do local v=atlas:getPixel(stage*96+x,y);local a=pc.rgbaA(v);if a>0 and a<255 then r.partialAlphaPixels=r.partialAlphaPixels+1 end;if a>0 then colours[tostring(v)]=true;r.footBaseline=y end
  if y<42 and v~=head:getPixel(stage*96+x,y) then r.headDifference=r.headDifference+1 end
  if y<114 and v~=canonical:getPixel(stage*96+x,y) then r.bodyDifference=r.bodyDifference+1 end
  if x%2==0 and y%2==0 and (v~=atlas:getPixel(stage*96+x+1,y) or v~=atlas:getPixel(stage*96+x,y+1) or v~=atlas:getPixel(stage*96+x+1,y+1)) then r.brokenLogicalBlocks=r.brokenLogicalBlocks+1 end
  local key=y*96+x;if a>0 and not seen[key] then local queue,i={{x,y}},1;seen[key]=true;while i<=#queue do local q=queue[i];i=i+1;for _,d in ipairs({{-1,0},{1,0},{0,-1},{0,1}}) do local nx,ny=q[1]+d[1],q[2]+d[2];local k=ny*96+nx;if nx>=0 and ny>=0 and nx<96 and ny<132 and not seen[k] and pc.rgbaA(atlas:getPixel(stage*96+nx,ny))>0 then seen[k]=true;queue[#queue+1]={nx,ny} end end end;r.components[#r.components+1]=#queue;if #queue<8 then for _,q in ipairs(queue) do r.detachedPixels[#r.detachedPixels+1]={x=q[1],y=q[2]} end end end
 end end
 for _ in pairs(colours) do r.paletteSize=r.paletteSize+1 end;table.sort(r.components,function(a,b)return a>b end)
 for _,side in ipairs({'Near','Far'}) do local im=trainers['Raised heels / '..name..' / '..side..' trainer'];local toe,heel=-1,-1;local tx0,tx1,hx0,hx1;if side=='Near' then tx0,tx1,hx0,hx1=28,33,42,47 else tx0,tx1,hx0,hx1=64,69,54,59 end
  if im then for y=0,131 do for x=tx0,tx1 do if pc.rgbaA(im:getPixel(stage*96+x,y))>0 then toe=y end end;for x=hx0,hx1 do if pc.rgbaA(im:getPixel(stage*96+x,y))>0 then heel=y end end end end
  r.heelContacts[#r.heelContacts+1]={side=side,toeBaseline=toe,heelBaseline=heel,clearance=toe-heel}
 end
 report.stages[#report.stages+1]=r
 local origin=stage*384
 drawCell(review,canonical,stage*96,0,96,128,origin,16,2);drawCell(review,atlas,stage*96,0,96,132,origin+192,8,2)
 drawCell(review,canonical,stage*96+24,104,48,24,origin,316,4);drawCell(review,atlas,stage*96+24,104,48,28,origin+192,300,4)
 -- 48px village scale, then the actual 144px-wide mobile-workout sprite scale.
 for y=0,65 do for x=0,47 do for variant=0,1 do local sy=y*2;local v=variant==0 and (sy<128 and canonical:getPixel(stage*96+x*2,sy) or 0) or atlas:getPixel(stage*96+x*2,sy);if pc.rgbaA(v)>0 then for yy=0,2 do for xx=0,2 do review:drawPixel(origin+24+variant*192+x*3+xx,440+(variant==0 and 6 or 0)+y*3+yy,v) end end end end end end
 for y=0,65 do for x=0,47 do local v=atlas:getPixel(stage*96+x*2,y*2);if pc.rgbaA(v)>0 then review:drawPixel(origin+216+x,676+y,v) end end end
 for y=0,63 do for x=0,47 do local v=canonical:getPixel(stage*96+x*2,y*2);if pc.rgbaA(v)>0 then review:drawPixel(origin+24+x,678+y,v) end end end
end
review:saveAs(root..'calf-comparison.png');local f=io.open(root..'calf-export.json','w');f:write(json.encode(report));f:close();print(json.encode(report.stages))
