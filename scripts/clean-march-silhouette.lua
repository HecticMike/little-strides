-- Final local march cleanup: reuse canonical shoulder/bicep pixels, not new art.
local pc=app.pixelColor
local function inside(x,y,poly)
 local hit=false
 for i=1,#poly do local a,b=poly[i],poly[i%#poly+1]
  if (a[2]>y)~=(b[2]>y) and x<(b[1]-a[1])*(y-a[2])/(b[2]-a[2])+a[1] then hit=not hit end
 end
 return hit
end
local shoulder={{33,39},{43,42},{42,49},{35,54},{28,51},{29,45}}
local bicep={{31,50},{37,51},{38,61},{33,66},{28,61},{28,54}}
local s=app.open("art/source/hero-body.aseprite")
for _,l in ipairs(s.layers) do
 local c=l:cel(1);local original=Image(c.image);local image=Image(original)
 for y=39,66 do for x=27,44 do
  if inside(x,y,shoulder) or inside(x,y,bicep) then
   local value=original:getPixel(x,y)
   if x<=34 and y>=50 and pc.rgbaA(original:getPixel(96+x,y))>0 then value=original:getPixel(96+x,y) end
   image:drawPixel(96+x,y,value)
  end
 end end
 image:drawPixel(96+37,76,0)
 c.image=image
end
s:saveAs(s.filename)
local body=Image(s);s:close()
local training=app.open("art/source/hero-training-outfit.aseprite")
local accents={pc.rgba(214,158,75,255),pc.rgba(237,189,102,255),pc.rgba(255,218,136,255)}
for _,l in ipairs(training.layers) do if l.name=="Stage seam and buckle accents" then
 local c=l:cel(1);local image=Image(c.image)
 for row=0,2 do for y=0,127 do for x=0,95 do
  local colour=body:getPixel(96+x,y);local r,g,b=pc.rgbaR(colour),pc.rgbaG(colour),pc.rgbaB(colour)
  local gold=y>=40 and y<73 and pc.rgbaA(colour)>0 and r>140 and g>95 and b<145 and r<g*1.56 and g>b*1.6
  image:drawPixel(96+x,row*128+y,gold and accents[row+1] or 0)
 end end end
 c.image=image
end end
training:saveAs(training.filename);training:close()
local gear=app.open("art/source/hero-equipment.aseprite")
for _,l in ipairs(gear.layers) do if l.name:find("cloak") then
 local c=l:cel(1);local image=Image(c.image)
 for row=0,1 do for y=43,127 do for x=0,95 do
  if (y>=58 or x<38 or x>66) and pc.rgbaA(body:getPixel(96+x,y))>0 then image:drawPixel(96+x,row*128+y,0) end
 end end end
 c.image=image
end end
gear:saveAs(gear.filename);gear:close()
print("March shoulder connected with canonical sleeve/bicep; isolated residual pixel removed.")
