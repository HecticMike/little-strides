-- One-time import; normal export never rebuilds or flattens an edited master.
local ids={"abdominal-bracing","pelvic-tilt","heel-slide","glute-bridge"}
for _,id in ipairs(ids) do local f=io.open("art/source/hero-core-"..id..".aseprite","rb");if f then f:close();error("Core masters already exist. Edit them and run art:export.") end end
local pc=app.pixelColor
local palette={}
for line in io.lines("art/palette.gpl") do local r,g,b=line:match("^%s*(%d+)%s+(%d+)%s+(%d+)");if r then palette[#palette+1]={tonumber(r),tonumber(g),tonumber(b)} end end
local function nearest(c)
 local r,g,b=pc.rgbaR(c),pc.rgbaG(c),pc.rgbaB(c);local best,distance=1,1e20
 for i,v in ipairs(palette) do local d=(r-v[1])^2+(g-v[2])^2+(b-v[3])^2;if d<distance then best,distance=i,d end end
 local v=palette[best];return pc.rgba(v[1],v[2],v[3],255),best
end
local W,H,SCALE=192,128,10
for _,id in ipairs(ids) do
 local original=app.open("art/direction/core-illustrations/"..id..".png");local source=Image(original)
 -- Find opaque character pixels, excluding generator's translucent halo.
 local x0,y0,x1,y1=source.width,source.height,0,0
 for p in source:pixels() do if pc.rgbaA(p())>=240 then x0=math.min(x0,p.x);y0=math.min(y0,p.y);x1=math.max(x1,p.x);y1=math.max(y1,p.y) end end
 local w,h=math.ceil((x1-x0+1)/SCALE),math.ceil((y1-y0+1)/SCALE)
 assert(w<=W-12,"Generated sprite does not fit the shared scale: "..id)
 local sprite=Sprite(W,H,ColorMode.RGB);local initial=sprite.layers[1]
 local names={"Trousers and footwear","Teal training shirt","Skin and face","Chestnut hair","Pose outline and details","Adventurer cuffs","Veteran cuffs"}
 local images,layers={},{}
 for _,name in ipairs(names) do local l=sprite:newLayer();l.name=name;layers[name]=l;images[name]=Image(W,H,ColorMode.RGB) end
 sprite:deleteLayer(initial)
 local shirt={}
 for y=0,h-1 do for x=0,w-1 do
  local sx,sy=math.min(x1,x0+x*SCALE+SCALE//2),math.min(y1,y0+y*SCALE+SCALE//2)
  local c=source:getPixel(sx,sy)
  if pc.rgbaA(c)>=240 then
   local col,index=nearest(c);local r,g,b=pc.rgbaR(c),pc.rgbaG(c),pc.rgbaB(c)
   local name="Pose outline and details"
   if r>g*1.18 and g>b*1.08 then
    if x<38 then name="Chestnut hair" else name="Trousers and footwear" end
    if index>=25 and index<=30 then name="Skin and face" end
   elseif g>r*1.05 and b>r*1.05 then name="Teal training shirt";shirt[#shirt+1]={x+6,y+110-h} end
   local dx,dy=x+6,y+110-h
   images[name]:drawPixel(dx,dy,col)
  end
 end end
 -- Derive stage-only shirt seam accents from the same pose, without changing anatomy.
 for _,v in ipairs(shirt) do
  local x,y=v[1],v[2]
  if x>=47 and x<=50 and y>=91 and y<=96 then
   images["Adventurer cuffs"]:drawPixel(x,y,pc.rgba(214,158,75,255))
   images["Veteran cuffs"]:drawPixel(x,y,pc.rgba(255,218,136,255))
  end
 end
 for _,name in ipairs(names) do sprite:newCel(layers[name],1,images[name],Point(0,0)) end
 layers["Adventurer cuffs"].isVisible=false;layers["Veteran cuffs"].isVisible=false
 sprite:saveAs("art/source/hero-core-"..id..".aseprite");sprite:close();original:close()
 print("Imported layered core illustration: "..id.." "..w.."x"..h)
end
