-- One-time, lossless workshop separation. Does not regenerate approved artwork.
local pc=app.pixelColor
local function rgb(s) if s.colorMode~=ColorMode.RGB then app.command.ChangePixelFormat{ui=false,format="rgb"} end return Image(s) end
local function inside(x,y,poly)
 local hit=false
 for i=1,#poly do local a,b=poly[i],poly[i%#poly+1]
  if (a[2]>y)~=(b[2]>y) and x<(b[1]-a[1])*(y-a[2])/(b[2]-a[2])+a[1] then hit=not hit end
 end
 return hit
end
local source=app.open("art/source/buildings.aseprite")
assert(#source.layers==1,"Workshop is already separated; preserve manual edits.")
local palette=Palette(#source.palettes[1])
for i=0,#palette-1 do palette:setColor(i,source.palettes[1]:getColor(i)) end
local sheet=rgb(source)
local groundSource=app.open("art/source/village-ground.aseprite")
local ground=rgb(groundSource)
local originalGround=Image(ground)
local original=Image(sheet,Rectangle(280,0,280,300))
local restored=Image(sheet,Rectangle(560,0,280,300))
local outline={{30,110},{54,62},{126,31},{163,25},{169,17},{208,17},{210,46},{231,49},{256,89},{277,125},{267,144},{257,151},{256,191},{218,202},{185,199},{157,198},{133,201},{103,204},{71,199},{47,186},{39,156}}
local tablePoly={{139,190},{164,186},{204,195},{204,226},{182,237},{139,233},{132,213}}
local function structural(x,y) return inside(x,y,outline) and not inside(x,y,tablePoly) and not (x>=70 and x<111 and y>=178 and y<215) end
local function master(name,w,h,entries)
 local s=Sprite(w,h,ColorMode.RGB)
 local emitted=0
 for i,e in ipairs(entries) do
  local nonempty=false;for pixel in e[2]:pixels() do if pc.rgbaA(pixel())>0 then nonempty=true;break end end
  if nonempty then
  emitted=emitted+1
  local l
  if emitted==1 then l=s.layers[1];s.cels[1].image=e[2] else l=s:newLayer();s:newCel(l,1,e[2],Point(0,0)) end
  l.name=e[1]
  end
 end
 s:setPalette(palette)
 app.command.ChangePixelFormat{ui=false,format="indexed",dithering="none",rgbmap="octree"}
 s:saveAs("art/source/"..name..".aseprite");s:close()
end
local context,yard,fence=Image(280,300,ColorMode.RGB),Image(280,300,ColorMode.RGB),Image(280,300,ColorMode.RGB)
local entries={{"Lodge reference - not used at runtime",Image(840,300,ColorMode.RGB)}}
entries[1][2]:drawImage(Image(sheet,Rectangle(0,0,280,300)),Point(0,0))
for _,stage in ipairs({"Original","Restored"}) do
 for _,part in ipairs({"Roof","Walls and doorway","Chimney","Timber and canvas","Window and banner"}) do entries[#entries+1]={stage.." - "..part,Image(840,300,ColorMode.RGB)} end
end
local function partFor(stage,x,y)
 if x>=169 and x<213 and y<90 then return 3 end
 if stage==1 and x>=120 and x<249 and y>=37 and y<144 then return 4 end
 if stage==2 and x>=184 and x<253 and y>=133 and y<193 then return 5 end
 return y<139 and 1 or 2
end
local changed=0
for y=0,299 do for x=0,279 do
 local c=original:getPixel(x,y)
 -- The old backdrop must match the original patch before separating it.
 assert(c==ground:getPixel(360+x,24+y),"Original workshop registration mismatch")
 ground:drawPixel(360+x,24+y,0)
 if structural(x,y) then
  local p=partFor(1,x,y);entries[1+p][2]:drawPixel(280+x,y,c)
  p=partFor(2,x,y);entries[6+p][2]:drawPixel(560+x,y,restored:getPixel(x,y))
  if c~=restored:getPixel(x,y) then changed=changed+1 end
 else
  local target=context
  if inside(x,y,tablePoly) or (x>=70 and x<111 and y>=178 and y<215) then target=yard
  elseif y>=229 and y<279 and x>=21 then target=fence end
  target:drawPixel(x,y,c)
 end
end end
assert(changed>5000,"Restoration must change substantial real artwork")
-- Pixel-for-pixel reconstruction: no gaps, overlap, or changed neighbouring terrain.
local reconstructed=Image(ground)
reconstructed:drawImage(context,Point(360,24));reconstructed:drawImage(yard,Point(360,24));reconstructed:drawImage(fence,Point(360,24))
for i=2,6 do reconstructed:drawImage(Image(entries[i][2],Rectangle(280,0,280,300)),Point(360,24)) end
for y=0,575 do for x=0,639 do assert(reconstructed:getPixel(x,y)==originalGround:getPixel(x,y),"Lossless reconstruction failed") end end
source:close();groundSource:close()
master("workshop-context",280,300,{{"Approach terrain and foliage",context},{"Workbench tools and barrels",yard},{"Front fence and stored stone",fence}})
master("village-ground",640,576,{{"Painted terrain and lodge - workshop removed",ground}})
master("buildings",840,300,entries)
print("Separated workshop roof, walls, chimney, canvas/banner, common yard and terrain. Exact original reconstruction; "..changed.." restored pixels differ.")
