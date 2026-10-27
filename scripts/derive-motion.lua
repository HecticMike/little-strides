-- Refresh the blink only; preserve the registered, authored contact keys.
-- Existing exercise columns and all artist layers are preserved. Safe to repeat.
local pc=app.pixelColor
local W,H=96,128
local rgba=pc.rgba
local body=app.open("art/source/hero-body.aseprite")
local composite=Image(body)
local eyeBoxes={}
-- Only cream eye-white clusters inside the face can become closed eyes.
local seen={}
for y=20,37 do for x=37,69 do
 local key=y*W+x
 local c=composite:getPixel(x,y)
 if not seen[key] and pc.rgbaR(c)>230 and pc.rgbaG(c)>225 and pc.rgbaB(c)>185 then
  local q={{x,y}};seen[key]=true;local i=1
  local box={x,x,y,y}
  while i<=#q do
   local p=q[i];i=i+1;box[1]=math.min(box[1],p[1]);box[2]=math.max(box[2],p[1]);box[3]=math.min(box[3],p[2]);box[4]=math.max(box[4],p[2])
   for _,d in ipairs({{1,0},{-1,0},{0,1},{0,-1}}) do
    local nx,ny=p[1]+d[1],p[2]+d[2];local k=ny*W+nx
    if nx>=37 and nx<=69 and ny>=20 and ny<=37 and not seen[k] then
     local v=composite:getPixel(nx,ny)
     if pc.rgbaR(v)>230 and pc.rgbaG(v)>225 and pc.rgbaB(v)>185 then seen[k]=true;q[#q+1]={nx,ny} end
    end
   end
  end
  if #q>=2 then eyeBoxes[#eyeBoxes+1]=box end
 end
end end
local function process(sprite,equipment)
 for _,layer in ipairs(sprite.layers) do
  local cel=layer:cel(1)
  if cel then
   local original=Image(sprite.width,sprite.height,ColorMode.RGB)
   original:drawImage(cel.image,cel.position)
   local result=Image(original)
   for row=0,(equipment and 1 or 0) do
    for y=0,H-1 do for x=0,W-1 do
     result:drawPixel(9*W+x,row*H+y,original:getPixel(x,row*H+y))
    end end
   end
   if not equipment then
    for _,b in ipairs(eyeBoxes) do
     for y=b[3],b[4]+1 do for x=b[1]-1,b[2]+1 do
      local c=0
      if layer.name=="Skin and face" then
       c=rgba(247,193,140,255)
       if y==math.floor((b[3]+b[4])/2)+1 then c=rgba(25,51,54,255) end
      end
      result:drawPixel(9*W+x,y,c)
     end end
    end
   end
   cel.image=result;cel.position=Point(0,0)
  end
 end
 sprite:saveAs(sprite.filename)
end
process(body,false)
body:close()
local gear=app.open("art/source/hero-equipment.aseprite");process(gear,true);gear:close()
print("Authored contact keys preserved; blink refreshed. Eye-white clusters: "..#eyeBoxes)
