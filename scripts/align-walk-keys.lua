local body=app.open("art/source/hero-body.aseprite")
for _,layer in ipairs(body.layers) do
 local cel=layer:cel(1);local source=Image(960,128,ColorMode.RGB);source:drawImage(cel.image,cel.position)
 local result=Image(source)
 for _,col in ipairs({7,8}) do for y=0,127 do for x=0,95 do
  local sx=col==7 and x or 104-x
  local c=source:getPixel(x,y)
  -- Forearms extend below the belt; never mirror them into floating extra hands.
  if y>=84 or (y>=74 and x>=36 and x<=69 and sx>=36 and sx<=69) then c=(sx>=0 and sx<96) and source:getPixel(7*96+sx,y) or 0 end
  result:drawPixel(col*96+x,y,c)
 end end end
 cel.image=result;cel.position=Point(0,0)
end
body:saveAs(body.filename)
local posed=Image(body);body:close()
local gear=app.open("art/source/hero-equipment.aseprite")
for _,l in ipairs(gear.layers) do if l.name:find("cloak") then
 local c=l:cel(1);local result=Image(c.image)
 for row=0,1 do for _,col in ipairs({7,8}) do for y=74,127 do for x=0,95 do
  if app.pixelColor.rgbaA(posed:getPixel(col*96+x,y))>0 then result:drawPixel(col*96+x,row*128+y,0) end
 end end end end
 c.image=result
end end
gear:saveAs(gear.filename);gear:close()
print("Walk contact keys retain canonical arms, upper body and baseline; lower-leg pivot registered.")
