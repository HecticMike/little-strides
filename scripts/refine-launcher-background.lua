-- Targeted edit of the launcher's existing background/frame layers only.
local s=app.open("art/source/app-icon.aseprite");local pc=app.pixelColor
for _,layer in ipairs(s.layers) do
 if layer.name=="Forest enamel" then
  local image=Image(64,64,ColorMode.RGB)
  for y=0,63 do for x=0,63 do local step=math.min(6,math.floor(math.sqrt((x-22)^2+(y-16)^2)/9));local r,g,b=24-step,57-step*3,47-step*2;image:drawPixel(x,y,pc.rgba(r,g,b,255));if (x*11+y*7)%67==0 then image:drawPixel(x,y,pc.rgba(r+3,g+5,b+3,255)) end end end
  s:newCel(layer,1,image,Point(0,0))
 elseif layer.name=="Brass frame" then
  local image=Image(layer:cel(1).image)
  for p in image:pixels() do local c=p();if pc.rgbaR(c)==17 and pc.rgbaG(c)==45 and pc.rgbaB(c)==38 then p(0) end end
  layer:cel(1).image=image
 end
end
s:saveAs("art/source/app-icon.aseprite");s:close()
