-- Read-only export of isolated study. No runtime exports or source writes.
local root='art/prototypes/comeback/user-art/'
local out='art/prototypes/comeback/stage-study/'
local pc=app.pixelColor
local s=app.open(root..'character.aseprite');local canonical=Image(s);s:close()
local hs=app.open(root..'heads.aseprite');local heads=Image(hs);hs:close();canonical:drawImage(heads)
local function exportStudy(name,threshold,reportName,reference,pose)
local originalImage=reference or canonical
local study=app.open(out..name..'.aseprite');local im=Image(96,128,ColorMode.RGB);local layers={}
for _,l in ipairs(study.layers) do local cel=l:cel(1);local count=0
 if cel then for p in cel.image:pixels() do if pc.rgbaA(p())>0 then count=count+1 end end
 if l.isVisible and not l.name:find('^Preview /') then im:drawImage(cel.image,cel.position) end end
 layers[#layers+1]={name=l.name,visible=l.isVisible,pixels=count}
end
study:close()
for y=0,41 do for x=0,95 do im:drawPixel(x,y,heads:getPixel(x,y)) end end
im:saveAs(out..name..'.png')
local report={integrated=false,clinicalStatus=pose and 'provisional-unreviewed-illustration' or 'not-an-exercise-demonstration',pose=pose or 'standing-idle',animation=false,thresholdProposal=threshold,logicalWidth=48,logicalHeight=64,layers=layers,changedLogicalPixels=0,changedSilhouettePixels=0,headDifference=0,lowerBodyDifference=0,brokenLogicalBlocks=0,partialAlphaPixels=0,palette={},components={},bodyRowWidths={}}
local colours={};local seen={}
for y=0,127 do for x=0,95 do local v=im:getPixel(x,y);local orig=originalImage:getPixel(x,y);local a=pc.rgbaA(v)
 if y<42 and v~=orig then report.headDifference=report.headDifference+1 end
 if y>=(pose and 68 or 74) and v~=orig then report.lowerBodyDifference=report.lowerBodyDifference+1 end
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
if not reference then for y=21,36 do local row={logicalY=y,widths={}};for stage=0,2 do local image=stage==1 and im or canonical;local offset=stage==2 and 96 or 0;local left,right=48,-1
 for x=0,47 do if pc.rgbaA(image:getPixel(offset+x*2,y*2))>0 then left=math.min(left,x);right=math.max(right,x) end end;row.widths[#row.widths+1]=right-left+1 end;report.bodyRowWidths[#report.bodyRowWidths+1]=row end end
local f=assert(io.open(out..reportName,'w'));f:write(json.encode(report));f:close()
return report,im
end
local finalReport,finalImage=exportStudy('developed-silhouette',96,'report.json')
local formReport,formImage=exportStudy('form-standing',24,'form-export.json')
-- Endpoint PNGs for registered, labelled, native/mobile-size review.
for stage=0,1 do local frame=Image(96,128,ColorMode.RGB);for y=0,127 do for x=0,95 do frame:drawPixel(x,y,canonical:getPixel(stage*96+x,y)) end end;frame:saveAs(out..(stage==0 and 'starting.png' or 'developed.png')) end
local range={integrated=false,pose='standing-idle',thresholds={0,24,96},logicalShoulderRow=23,shoulderWidths={},stages={
 {id='starting',threshold=0,asset='starting.png'},
 {id='form',threshold=24,asset='form-standing.png',report='form-export.json'},
 {id='developed-study',threshold=96,asset='developed-silhouette.png',report='report.json'}
},sharedHeadSource='user-art/heads.aseprite',exerciseDemonstration=false}
for _,im in ipairs({canonical,formImage,finalImage}) do local left,right=48,-1;for x=0,47 do if pc.rgbaA(im:getPixel(x*2,23*2))>0 then left=math.min(left,x);right=math.max(right,x) end end;range.shoulderWidths[#range.shoulderWidths+1]=right-left+1 end
local f=assert(io.open(out..'range-report.json','w'));f:write(json.encode(range));f:close()
print('Exported standing range: shoulder spans '..table.concat(range.shoulderWidths,' / ')..' logical pixels; canonical heads/anchors retained.')

local marchSource=Image{fromFile=root..'march.png'}
marchSource:saveAs(out..'starting-march.png')
local formMarch,formMarchImage=exportStudy('form-march',24,'form-march-export.json',marchSource,'march')
local developedMarch,developedMarchImage=exportStudy('developed-march',96,'developed-march-export.json',marchSource,'march')
local marchRange={integrated=false,pose='march',artStatus='provisional-unreviewed',animation=false,thresholds={0,24,96},shoulderRow=23,shoulderWidths={},source='user-art/march.aseprite',reports={'form-march-export.json','developed-march-export.json'}}
for _,im in ipairs({marchSource,formMarchImage,developedMarchImage}) do local left,right=48,-1;for x=0,47 do if pc.rgbaA(im:getPixel(x*2,23*2))>0 then left=math.min(left,x);right=math.max(right,x) end end;marchRange.shoulderWidths[#marchRange.shoulderWidths+1]=right-left+1 end
local f=assert(io.open(out..'march-report.json','w'));f:write(json.encode(marchRange));f:close()
print('Marching shoulder spans: '..table.concat(marchRange.shoulderWidths,' / ')..' logical pixels.')
