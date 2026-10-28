-- Derived review animation only; never creates or changes runtime poses/masters.
local pc=app.pixelColor
local body=app.open('public/art/hero-body.png');local bodyImage=Image(body);body:close()
local gear=app.open('public/art/hero-equipment.png');local gearImage=Image(gear);gear:close()
local review=Sprite(480,144,ColorMode.RGB);review.layers[1].name='Derived comparison - edit canonical masters instead'
for frame,col in ipairs({7,7,0,8,8,0})do
 if frame>1 then review:newEmptyFrame()end
 review.frames[frame].duration=.11
 local output=Image(480,144,ColorMode.RGB);output:clear(pc.rgba(17,45,38,255))
 for x=0,479 do output:drawPixel(x,128,pc.rgba(72,105,102,255))end
 for stage=0,2 do
  local pose=Image(96,128,ColorMode.RGB);pose:drawImage(bodyImage,Point(-col*96,0))
  if stage>0 then pose:drawImage(gearImage,Point(-col*96,-(stage-1)*128))end
  output:drawImage(pose,Point(stage*160+60,8))
  for y=0,63 do for x=0,47 do local color=pose:getPixel(x*2+1,y*2+1);if pc.rgbaA(color)>0 then output:drawPixel(stage*160+8+x,68+y,color)end end end
 end
 local cel=review.layers[1]:cel(frame);if cel then cel.image=output else review:newCel(review.layers[1],frame,output)end
end
review:saveAs('art/review/walk-animation.gif');review:close()
print('Derived walking review exported at native village/source sizes.')
