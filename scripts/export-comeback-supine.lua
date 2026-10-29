-- Export only the authored visible layers; preserve masters and complete pose junction.
local root='art/prototypes/comeback/user-art/'
local pc=app.pixelColor
for _,entry in ipairs({{stem='supine-start',prefix='supine',asset='comeback-bracing',appearance='starting'},{stem='supine-developed',prefix='supine-developed',asset='comeback-bracing-developed',appearance='developed'}}) do
if app.fs.isFile(root..entry.stem..'.aseprite') then
local s=app.open(root..entry.stem..'.aseprite');local image=Image(192,128,ColorMode.RGB);local layers={}
for _,layer in ipairs(s.layers) do local cel=layer:cel(1);local pixels=0;if cel then for p in cel.image:pixels() do if pc.rgbaA(p())>0 then pixels=pixels+1 end end;if layer.isVisible and not layer.name:find('^Reference /') then image:drawImage(cel.image,cel.position) end end;layers[#layers+1]={name=layer.name,visible=layer.isVisible,pixels=pixels} end
s:close();image:saveAs(root..entry.stem..'.png');image:saveAs('public/art/'..entry.asset..'.png')
local reference=Image{fromFile=root..entry.prefix..'-registered-source.png'}
local partial,solid,difference,headDifference=0,0,0,0;local x0,y0,x1,y1=192,128,-1,-1;local colours={}
for y=0,127 do for x=0,191 do local v=image:getPixel(x,y);local a=pc.rgbaA(v);if a>0 and a<255 then partial=partial+1 end;if a>0 then solid=solid+1;x0=math.min(x0,x);y0=math.min(y0,y);x1=math.max(x1,x);y1=math.max(y1,y);colours[v]=true end;if v~=reference:getPixel(x,y) then difference=difference+1;if x>=128 then headDifference=headDifference+1 end end end end
local colourCount=0;for _ in pairs(colours) do colourCount=colourCount+1 end
local seen,components={},{}
for y=0,127 do for x=0,191 do local key=y*192+x;if not seen[key] and pc.rgbaA(image:getPixel(x,y))>0 then local queue,i={{x,y}},1;seen[key]=true;while i<=#queue do local p=queue[i];i=i+1;for _,d in ipairs({{-1,0},{1,0},{0,-1},{0,1}}) do local nx,ny=p[1]+d[1],p[2]+d[2];local k=ny*192+nx;if nx>=0 and ny>=0 and nx<192 and ny<128 and not seen[k] and pc.rgbaA(image:getPixel(nx,ny))>0 then seen[k]=true;queue[#queue+1]={nx,ny} end end end;components[#components+1]=#queue end end end
table.sort(components,function(a,b)return a>b end)
local report={characterId='little-strides-comeback',exerciseId='abdominal-bracing',startingPositionUses={'abdominal-bracing','pelvic-tilt'},movementDepicted=false,appearance=entry.appearance,width=192,height=128,artPurpose='starting-position-only',clinicalStatus='unreviewed-illustration',animation=false,headPolicy='complete source-matched head neck and shoulder; no transplantation',headRotationDegrees=0,neckBridgeAdded=false,sourceDifference=difference,headJunctionDifference=headDifference,farArm='occluded in supplied view; no hidden anatomy invented',layers=layers,partialAlphaPixels=partial,solidPixels=solid,paletteSize=colourCount,bounds={x=x0,y=y0,w=x1-x0+1,h=y1-y0+1},supportBaseline=y1,components=components}
local f=io.open(root..entry.prefix..'-export.json','w');f:write(json.encode(report));f:close()
-- Derived review on a contrasting background, including native working-size art.
local review=Image(768,320,ColorMode.RGB);review:clear(pc.rgba(245,237,221,255))
for y=0,127 do for x=0,191 do local v=image:getPixel(x,y);if pc.rgbaA(v)>0 then for yy=0,3 do for xx=0,3 do local dy=y*4+yy-220;if dy>=0 and dy<320 then review:drawPixel(x*4+xx,dy,v) end end end;local dy=y-66;if dy>=0 then review:drawPixel(x+288,dy+252,v) end end end end
review:saveAs(root..entry.prefix..'-comparison.png');print('Exported unreviewed supine starting-position illustration with source-matched anatomy.')

end end
