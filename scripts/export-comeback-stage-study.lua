-- Read-only export of isolated study. No runtime exports or source writes.
local root='art/prototypes/comeback/user-art/'
local out='art/prototypes/comeback/stage-study/'
local pc=app.pixelColor
local s=app.open(root..'character.aseprite');local canonical=Image(s);s:close()
local hs=app.open(root..'heads.aseprite');local heads=Image(hs);hs:close();canonical:drawImage(heads)
local study=app.open(out..'developed-silhouette.aseprite');local im=Image(96,128,ColorMode.RGB);local layers={}
for _,l in ipairs(study.layers) do local cel=l:cel(1);local count=0
 if cel then for p in cel.image:pixels() do if pc.rgbaA(p())>0 then count=count+1 end end
 if l.isVisible and not l.name:find('^Preview /') then im:drawImage(cel.image,cel.position) end end
 layers[#layers+1]={name=l.name,visible=l.isVisible,pixels=count}
end
study:close()
for y=0,41 do for x=0,95 do im:drawPixel(x,y,heads:getPixel(x,y)) end end
im:saveAs(out..'developed-silhouette.png')
local report={integrated=false,clinicalStatus='not-an-exercise-demonstration',pose='standing-idle',thresholdProposal=96,logicalWidth=48,logicalHeight=64,layers=layers,changedLogicalPixels=0,changedSilhouettePixels=0,headDifference=0,lowerBodyDifference=0,brokenLogicalBlocks=0,partialAlphaPixels=0,palette={},components={},bodyRowWidths={}}
local colours={};local seen={}
for y=0,127 do for x=0,95 do local v=im:getPixel(x,y);local orig=canonical:getPixel(x,y);local a=pc.rgbaA(v)
 if y<42 and v~=orig then report.headDifference=report.headDifference+1 end
 if y>=74 and v~=orig then report.lowerBodyDifference=report.lowerBodyDifference+1 end
 if a>0 then local hex=string.format('%02x%02x%02x',pc.rgbaR(v),pc.rgbaG(v),pc.rgbaB(v));colours[hex]=true end
 if a>0 and a<255 then report.partialAlphaPixels=report.partialAlphaPixels+1 end
 if x%2==0 and y%2==0 then
 if v~=orig then report.changedLogicalPixels=report.changedLogicalPixels+1 end
 if (a>0)~=(pc.rgbaA(orig)>0) then report.changedSilhouettePixels=report.changedSilhouettePixels+1 end
 if v~=im:getPixel(x+1,y) or v~=im:getPixel(x,y+1) or v~=im:getPixel(x+1,y+1) then report.brokenLogicalBlocks=report.brokenLogicalBlocks+1 end end
 local key=y*96+x
 if a>0 and not seen[key] then local q={{x,y}};local i=1;seen[key]=true
 while i<=#q do local p=q[i];i=i+1;for _,d in ipairs({{-1,0},{1,0},{0,-1},{0,1}}) do local nx,ny=p[1]+d[1],p[2]+d[2];local k=ny*96+nx
 if nx>=0 and ny>=0 and nx<96 and ny<128 and not seen[k] and pc.rgbaA(im:getPixel(nx,ny))>0 then seen[k]=true;q[#q+1]={nx,ny} end end end
 report.components[#report.components+1]=#q end
end end
for hex in pairs(colours) do report.palette[#report.palette+1]=hex end;table.sort(report.palette)
for y=21,36 do local row={logicalY=y,widths={}};for stage=0,2 do local image=stage==1 and im or canonical;local offset=stage==2 and 96 or 0;local left,right=48,-1
 for x=0,47 do if pc.rgbaA(image:getPixel(offset+x*2,y*2))>0 then left=math.min(left,x);right=math.max(right,x) end end;row.widths[#row.widths+1]=right-left+1 end;report.bodyRowWidths[#report.bodyRowWidths+1]=row end
-- Endpoint PNGs for registered, labelled, native/mobile-size review.
for stage=0,1 do local frame=Image(96,128,ColorMode.RGB);for y=0,127 do for x=0,95 do frame:drawPixel(x,y,canonical:getPixel(stage*96+x,y)) end end;frame:saveAs(out..(stage==0 and 'starting.png' or 'developed.png')) end
local f=assert(io.open(out..'report.json','w'));f:write(json.encode(report));f:close()
print('Study exported: '..report.changedLogicalPixels..' changed logical pixels; head/lower-body differences '..report.headDifference..'/'..report.lowerBodyDifference..'.')
