-- Read-only export: never creates/rewrites masters or live assets.
local root='art/prototypes/comeback/user-art/'
local out='art/prototypes/comeback/stage-study/'
local pc=app.pixelColor
local src=app.open(root..'character.aseprite');local source=Image(src);src:close()
local hs=app.open(root..'heads.aseprite');local heads=Image(hs);hs:close();source:drawImage(heads)
local starting=Image(192,128,ColorMode.RGB);starting:drawImage(source,Point(0,-128));starting:saveAs(out..'starting-heel-slide.png')
local junction=Image(192,128,ColorMode.RGB);junction:drawImage(heads,Point(0,-128))
local all={integrated=false,pose='heel-slide',artStatus='provisional-unreviewed',headPolicy='intact source-matched floor junction; no rotation or transplant',thresholds={0,24,96},width=192,height=128,stages={}}
local skin={};for _,h in ipairs({'b66d48','d88e59','efa96c','ffc481','ffdda5'}) do skin[pc.rgba(tonumber(h:sub(1,2),16),tonumber(h:sub(3,4),16),tonumber(h:sub(5,6),16),255)]=true end
local function measure(im,name,threshold,layers)
 local r={id=name,threshold=threshold,layers=layers,changedPixels=0,changedSilhouettePixels=0,junctionDifference=0,legsAndHandsDifference=0,floorContactDifference=0,partialAlphaPixels=0,palette={},components={},armSectionSkinPixels=0,bounds={x=192,y=128,right=-1,bottom=-1}}
 local seen,colours={},{}
 for y=0,127 do for x=0,191 do local v=im:getPixel(x,y);local a=pc.rgbaA(v);local original=starting:getPixel(x,y)
 if v~=original then r.changedPixels=r.changedPixels+1 end
 if (a>0)~=(pc.rgbaA(original)>0) then r.changedSilhouettePixels=r.changedSilhouettePixels+1 end
 if pc.rgbaA(junction:getPixel(x,y))>0 and v~=original then r.junctionDifference=r.junctionDifference+1 end
 if x<102 and v~=original then r.legsAndHandsDifference=r.legsAndHandsDifference+1 end
 if y>=118 and v~=original then r.floorContactDifference=r.floorContactDifference+1 end
 if a>0 and a<255 then r.partialAlphaPixels=r.partialAlphaPixels+1 end
 if a>0 then colours[string.format('%02x%02x%02x',pc.rgbaR(v),pc.rgbaG(v),pc.rgbaB(v))]=true;r.bounds.x=math.min(r.bounds.x,x);r.bounds.y=math.min(r.bounds.y,y);r.bounds.right=math.max(r.bounds.right,x);r.bounds.bottom=math.max(r.bounds.bottom,y) end
 if x==116 and y>=104 and y<=117 and skin[v] then r.armSectionSkinPixels=r.armSectionSkinPixels+1 end
 local key=y*192+x;if a>0 and not seen[key] then local q={{x,y}};local i=1;seen[key]=true
 while i<=#q do local p=q[i];i=i+1;for _,d in ipairs({{-1,0},{1,0},{0,-1},{0,1}}) do local nx,ny=p[1]+d[1],p[2]+d[2];local k=ny*192+nx;if nx>=0 and ny>=0 and nx<192 and ny<128 and not seen[k] and pc.rgbaA(im:getPixel(nx,ny))>0 then seen[k]=true;q[#q+1]={nx,ny} end end end
 r.components[#r.components+1]=#q end
 end end
 for h in pairs(colours) do r.palette[#r.palette+1]=h end;table.sort(r.palette);return r
end
all.stages[1]=measure(starting,'starting',0,{})
for i,name in ipairs({'form-heel-slide','developed-heel-slide'}) do
 local s=app.open(out..name..'.aseprite');local im=Image(192,128,ColorMode.RGB);local layers={}
 for _,l in ipairs(s.layers) do local cel=l:cel(1);local n=0;if cel then for p in cel.image:pixels() do if pc.rgbaA(p())>0 then n=n+1 end end;if l.isVisible and not l.name:find('^Preview /') then im:drawImage(cel.image,cel.position) end end;layers[#layers+1]={name=l.name,visible=l.isVisible,pixels=n} end;s:close()
 im:drawImage(junction);im:saveAs(out..name..'.png');all.stages[#all.stages+1]=measure(im,name,i==1 and 24 or 96,layers)
end
local f=assert(io.open(out..'heel-report.json','w'));f:write(json.encode(all));f:close()
print('Exported heel-slide studies with intact head/neck and source support contacts.')
