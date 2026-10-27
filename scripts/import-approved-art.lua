-- Current masters have lossless workshop layers; never flatten them accidentally.
local protected=io.open("art/source/workshop-context.aseprite","rb")
if protected then protected:close();error("Approved sources are already refined. Edit existing masters; use art:export.") end
-- Approved concept import. Explicit, destructive bootstrap: never called by art:export.
-- All raster processing happens in Aseprite. Preserve generated originals in art/direction.
local pc=app.pixelColor
local function rgba(r,g,b,a) return pc.rgba(r,g,b,a or 255) end
local paletteHex={
"102629","193336","254041","345454","486966","648881","86a69a",
"1c2a2b","2b3939","3f4b47","55625b","788477",
"382c23","503525","70472c","925e35","b37a45","d49757","eeb974",
"452f24","614431","805a3b","9c714b","b38b5e",
"9b5b40","b7734f","d58f61","e9aa78","f7c18c","ffdaa8",
"173b3b","24504e","32655f","437970","578d80","75a496",
"78502d","ad7339","d69e4b","edbd66","ffda88","f6ebc8","244539","436748","30543f"}
local colors={}
for _,h in ipairs(paletteHex) do
 colors[#colors+1]={tonumber(h:sub(1,2),16),tonumber(h:sub(3,4),16),tonumber(h:sub(5,6),16)}
end
local memo={}
local function quant(c)
 if pc.rgbaA(c)<180 then return 0 end
 local key=c & 0xffffff
 if memo[key] then return memo[key] end
 local r,g,b=pc.rgbaR(c),pc.rgbaG(c),pc.rgbaB(c)
 local best,dist=nil,math.huge
 for _,v in ipairs(colors) do
  local d=2*(r-v[1])^2+3*(g-v[2])^2+(b-v[3])^2
  if d<dist then best,dist=rgba(v[1],v[2],v[3]),d end
 end
 memo[key]=best
 return best
end
local function image(path) return Image{fromFile=path} end
local function nearest(src,w,h)
 local out=Image(w,h,ColorMode.RGB)
 for y=0,h-1 do for x=0,w-1 do
  out:drawPixel(x,y,src:getPixel(math.min(src.width-1,math.floor((x+.5)*src.width/w)),math.min(src.height-1,math.floor((y+.5)*src.height/h))))
 end end
 return out
end
local function character(path)
 local src=image(path)
 local top,bottom=src.height,0
 for p in src:pixels() do if pc.rgbaA(p())>=180 then top=math.min(top,p.y);bottom=math.max(bottom,p.y) end end
 local scale=112/(bottom-top+1)
 local out=Image(96,128,ColorMode.RGB)
 for y=0,127 do for x=0,95 do
  local sx=math.floor((x-48)/scale+src.width/2)
  local sy=math.floor((y-120)/scale+bottom+1)
  if sx>=0 and sx<src.width and sy>=0 and sy<src.height then out:drawPixel(x,y,quant(src:getPixel(sx,sy))) end
 end end
 return out
end
local function put(dst,src,dx,dy)
 dst:drawImage(src,Point(dx,dy))
end
local worldPalette=nil
local function master(name,w,h,layers)
 local s=Sprite(w,h,ColorMode.RGB)
 for i,entry in ipairs(layers) do
  local layer
  if i==1 then layer=s.layers[1];s.cels[1].image=entry[2] else layer=s:newLayer();s:newCel(layer,1,entry[2],Point(0,0)) end
  layer.name=entry[1]
 end
 s.gridBounds=Rectangle(0,0,name:find("hero") and 96 or 32,name:find("hero") and 128 or 32)
 local pal=Palette(#colors+1);pal:setColor(0,Color{r=0,g=0,b=0,a=0})
 for i,c in ipairs(colors) do pal:setColor(i,Color{r=c[1],g=c[2],b=c[3],a=255}) end
 if name:find("hero") then s:setPalette(pal) else s:setPalette(worldPalette or pal);if worldPalette then app.command.ChangePixelFormat{ui=false,format="indexed",dithering="none",rgbmap="octree"} end end
 s:saveAs("art/source/"..name..".aseprite");s:close()
end
local stand=character("art/direction/beginner-character-v1.png")
local march=character("art/direction/march-v1.png")
local calf=character("art/direction/calf-v1.png")
local reach=character("art/direction/reach-v1.png")
local walk=character("art/direction/walk-v1.png")
local reverse=Image(walk)
-- Second contact key is derived from this same character, without mirroring face/outfit.
for y=76,127 do for x=0,95 do reverse:drawPixel(x,y,walk:getPixel(95-x,y)) end end
local blink=Image(stand)
-- Eye positions are refined in derive-motion.lua; keep neutral identity at bootstrap.
local blank=Image(96,128,ColorMode.RGB)
local poses={stand,march,blank,blank,calf,reach,blank,walk,reverse,blink}
local skin,hair,outfit=Image(960,128,ColorMode.RGB),Image(960,128,ColorMode.RGB),Image(960,128,ColorMode.RGB)
for i,pose in ipairs(poses) do
 for p in pose:pixels() do
  local c=p();if pc.rgbaA(c)>0 then
   local r,g,b=pc.rgbaR(c),pc.rgbaG(c),pc.rgbaB(c)
   local dst=outfit
   if r>g*1.2 and r>150 and g>b*1.13 then dst=skin
   elseif p.y<42 and r>g*1.05 and g>b*1.05 then dst=hair end
   dst:drawPixel((i-1)*96+p.x,p.y,c)
  end
 end
end
master("hero-body",960,128,{{"Outfit and boots",outfit},{"Skin and face",skin},{"Chestnut hair",hair}})
-- Stage equipment is an editable overlay on the SAME body, for BOTH renderers.
local capes,packs,scarves=Image(960,256,ColorMode.RGB),Image(960,256,ColorMode.RGB),Image(960,256,ColorMode.RGB)
local stageSources={character("art/direction/adventurer-v1.png"),character("art/direction/veteran-v1.png")}
local function gold(c)
 local r,g,b=pc.rgbaR(c),pc.rgbaG(c),pc.rgbaB(c)
 return pc.rgbaA(c)>0 and r>140 and g>95 and b<145 and r<g*1.56 and g>b*1.6
end
local function skinPixel(c)
 local r,g,b=pc.rgbaR(c),pc.rgbaG(c),pc.rgbaB(c)
 return r>180 and r>g*1.15 and g>b*1.12
end
local function green(c)
 local r,g,b=pc.rgbaR(c),pc.rgbaG(c),pc.rgbaB(c)
 return pc.rgbaA(c)>0 and g>r*1.1 and g>b*1.15
end
local function baseCloth(c)
 return pc.rgbaA(c)>0 and pc.rgbaG(c)>pc.rgbaR(c)*1.12 and pc.rgbaB(c)>pc.rgbaR(c)*.95
end
for row=0,1 do
 local src=stageSources[row+1]
 local bounds={}
 if row==1 then for y=37,101 do
  local left,right=96,-1
  for x=10,85 do local c=src:getPixel(x,y);if green(c) or gold(c) then left=math.min(left,x);right=math.max(right,x) end end
  if right-left>12 then bounds[y]={left,right} end
 end end
 for i,pose in ipairs(poses) do if i~=3 and i~=4 and i~=7 then
  local dx,dy=(i-1)*96,row*128
  for y=37,101 do for x=10,85 do
   local c=src:getPixel(x,y)
   local base=pose:getPixel(x,y)
   -- Extract actual shaded cloth, not geometric replacement clothing.
   if row==1 then
    local b=bounds[y]
    if b and x>=b[1] and x<=b[2] and pc.rgbaA(base)==0 then
     local fabric=c
     if not green(c) and not gold(c) then
      local fold=math.floor((x-b[1])/5)%4
      fabric=fold==0 and rgba(25,51,54) or fold==1 and rgba(36,69,57) or fold==2 and rgba(48,84,63) or rgba(67,103,72)
     end
     capes:drawPixel(dx+x,dy+y,fabric)
    elseif pc.rgbaA(c)>0 and not skinPixel(c) then
     if pc.rgbaA(stand:getPixel(x,y))==0 and pc.rgbaA(base)==0 then capes:drawPixel(dx+x,dy+y,c)
     elseif y<57 and green(c) and baseCloth(base) then capes:drawPixel(dx+x,dy+y,c) end
    end
   end
   if y>=40 and y<=70 and (x>=21 and x<=38 or x>=58 and x<=67) and pc.rgbaA(c)>0 then
    local r,g,b=pc.rgbaR(c),pc.rgbaG(c),pc.rgbaB(c)
    if r<190 and r>g*1.2 and g>b*1.15 and (pc.rgbaA(base)==0 or baseCloth(base)) then packs:drawPixel(dx+x,dy+y,c) end
   end
   if x>=34 and x<=66 and y>=37 and y<=61 then
    local inside=gold(c)
    if not inside and not skinPixel(c) then
     for _,d in ipairs({{1,0},{-1,0},{0,1},{0,-1}}) do
      if gold(src:getPixel(x+d[1],y+d[2])) then inside=true end
     end
    end
    if inside then scarves:drawPixel(dx+x,dy+y,c) end
   end
  end end
 end end
end
master("hero-equipment",960,256,{{"Veteran cloak behind silhouette",capes},{"Leather pack and straps",packs},{"Shaded ochre scarf",scarves}})
local world=nearest(image("art/direction/village-courtyard-v1.png"),640,576)
local restored=nearest(image("art/direction/village-restored-v1.png"),640,576)
-- One shared palette for original/restored scenery keeps patch seams coherent and PNGs small.
local scratch=Sprite(1280,576,ColorMode.RGB)
local combined=Image(1280,576,ColorMode.RGB);put(combined,world,0,0);put(combined,restored,640,0)
scratch.cels[1].image=combined
app.command.ColorQuantization{ui=false,withAlpha=false,maxColors=192,useRange=false,algorithm="octree"}
local generated=scratch.palettes[1]
worldPalette=Palette(#generated+1);worldPalette:setColor(0,Color{r=0,g=0,b=0,a=0})
for i=0,#generated-1 do worldPalette:setColor(i+1,generated:getColor(i)) end
scratch:setPalette(worldPalette)
app.command.ChangePixelFormat{ui=false,format="indexed",dithering="none",rgbmap="octree"}
app.command.ChangePixelFormat{ui=false,format="rgb"}
local clustered=Image(scratch)
world=Image(clustered,Rectangle(0,0,640,576));restored=Image(clustered,Rectangle(640,0,640,576))
scratch:close()
master("village-ground",640,576,{{"Approved painted courtyard - structures baked",world}})
local sheet=Image(840,300,ColorMode.RGB)
put(sheet,Image(world,Rectangle(0,0,280,300)),0,0)
put(sheet,Image(world,Rectangle(360,24,280,300)),280,0)
put(sheet,Image(restored,Rectangle(360,24,280,300)),560,0)
master("buildings",840,300,{{"Lodge - original workshop - restored workshop",sheet}})
local canopy,fence=Image(640,576,ColorMode.RGB),Image(640,576,ColorMode.RGB)
for y=300,575 do for x=0,639 do
 local a=((x-525)/80)^2+((y-390)/82)^2<1
 local b=((x-595)/64)^2+((y-489)/91)^2<1
 local c=((x-85)/92)^2+((y-528)/63)^2<1
 if a or b or c then canopy:drawPixel(x,y,world:getPixel(x,y)) end
 if x>=241 and x<=282 and y>=385 and y<=449 then
  local c=world:getPixel(x,y)
  if pc.rgbaR(c)>pc.rgbaG(c)*1.15 then fence:drawPixel(x,y,c) end
 end
end end
master("village-foreground",640,576,{{"Canopy occlusion",canopy},{"Garden fence occlusion",fence}})
master("vista",640,288,{{"Courtyard entrance",Image(world,Rectangle(0,130,640,288))}})
master("training",640,448,{{"Quiet courtyard crop",Image(world,Rectangle(0,110,640,448))}})
print("Approved artwork imported: shared 96x128 character, layered equipment, 640x576 courtyard, registered workshop patch.")
