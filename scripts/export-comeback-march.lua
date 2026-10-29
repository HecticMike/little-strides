-- Repeatable export; never modifies either source master or stored layer visibility.
local root='art/prototypes/comeback/user-art/'
local pc=app.pixelColor
for _,entry in ipairs({{stem='march',stage=0,appearance='starting',asset='comeback-march'},{stem='march-developed',stage=1,appearance='developed',asset='comeback-march-developed'}}) do
if app.fs.isFile(root..entry.stem..'.aseprite') then
local master=app.open(root..entry.stem..'.aseprite');local image=Image(96,128,ColorMode.RGB);local layerInfo={}
for _,layer in ipairs(master.layers) do local pixels=0;local cel=layer:cel(1);if cel then for p in cel.image:pixels() do if pc.rgbaA(p())>0 then pixels=pixels+1 end end;if layer.isVisible and not layer.name:find('^Preview /') then image:drawImage(cel.image,cel.position) end end;layerInfo[#layerInfo+1]={name=layer.name,pixels=pixels,visible=layer.isVisible} end
master:close()
local headMaster=app.open(root..'heads.aseprite');local heads=Image(headMaster);headMaster:close()
for y=0,41 do for x=0,95 do image:drawPixel(x,y,heads:getPixel(entry.stage*96+x,y)) end end
image:saveAs(root..entry.stem..'.png');image:saveAs('public/art/'..entry.asset..'.png')
local fitted=Image{fromFile=root..entry.stem..'-native-fit.png'};local bodyDifference=0
local partial,solid,x0,y0,x1,y1,headDifference=0,0,96,128,-1,-1,0;local colours={};local blocks=0
for y=0,127 do for x=0,95 do local v=image:getPixel(x,y);local a=pc.rgbaA(v);if y>=42 and v~=fitted:getPixel(x,y) then bodyDifference=bodyDifference+1 end;if a>0 and a<255 then partial=partial+1 end;if a>0 then solid=solid+1;x0=math.min(x0,x);y0=math.min(y0,y);x1=math.max(x1,x);y1=math.max(y1,y);colours[v]=true end;if y<42 and v~=heads:getPixel(entry.stage*96+x,y) then headDifference=headDifference+1 end;if x%2==0 and y%2==0 and (v~=image:getPixel(x+1,y) or v~=image:getPixel(x,y+1) or v~=image:getPixel(x+1,y+1)) then blocks=blocks+1 end end end
local count=0;for _ in pairs(colours) do count=count+1 end
local seen,components={},{}
for y=0,127 do for x=0,95 do local key=y*96+x;if not seen[key] and pc.rgbaA(image:getPixel(x,y))>0 then local queue,i={{x,y}},1;seen[key]=true;while i<=#queue do local p=queue[i];i=i+1;for _,d in ipairs({{-1,0},{1,0},{0,-1},{0,1}}) do local nx,ny=p[1]+d[1],p[2]+d[2];local k=ny*96+nx;if nx>=0 and ny>=0 and nx<96 and ny<128 and not seen[k] and pc.rgbaA(image:getPixel(nx,ny))>0 then seen[k]=true;queue[#queue+1]={nx,ny} end end end;components[#components+1]=#queue end end end
table.sort(components,function(a,b)return a>b end)
local report={exerciseId='march',appearance=entry.appearance,width=96,height=128,logicalWidth=48,logicalHeight=64,clinicalStatus='unreviewed-illustration',animation=false,headSource='heads.aseprite',headDifference=headDifference,sourceBodyDifference=bodyDifference,headRotationDegrees=0,layers=layerInfo,paletteSize=count,partialAlphaPixels=partial,solidPixels=solid,bounds={x=x0,y=y0,w=x1-x0+1,h=y1-y0+1},footBaseline=y1,brokenLogicalBlocks=blocks,components=components,structure='visible-pose-regions-with-shared-canonical-head-not-an-articulated-rig'}
local f=io.open(root..entry.stem..'-export.json','w');f:write(json.encode(report));f:close()
-- Compact standing/pose review at native mobile scale and enlarged; no new art is authored here.
local canonical=Image(96,128,ColorMode.RGB);canonical:drawImage(Image{fromFile=root..'character.png'},Point(-entry.stage*96,0));local review=Image(576,456,ColorMode.RGB);review:clear(pc.rgba(245,237,221,255))
for i,im in ipairs({canonical,image}) do for y=0,127 do for x=0,95 do local v=im:getPixel(x,y);if pc.rgbaA(v)>0 then for yy=0,2 do for xx=0,2 do review:drawPixel((i-1)*288+x*3+xx,y*3+yy,v) end end end end end;for y=0,63 do for x=0,47 do local v=im:getPixel(x*2,y*2);if pc.rgbaA(v)>0 then review:drawPixel((i-1)*288+120+x,388+y,v) end end end end
review:saveAs(root..entry.stem..'-comparison.png')
print('Exported static matching-stage march and shared-head/palette/registration report.')

end end
