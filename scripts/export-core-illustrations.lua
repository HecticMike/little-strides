local ids={"abdominal-bracing","pelvic-tilt","heel-slide","glute-bridge"}
local W,H=192,128
local output=Image(W*#ids,H*3,ColorMode.RGB)
for col,id in ipairs(ids) do
 local s=app.open("art/source/hero-core-"..id..".aseprite");assert(s.width==W and s.height==H,"Core frame dimensions changed")
 for row=0,2 do
  for _,l in ipairs(s.layers) do if l.name=="Adventurer cuffs" then l.isVisible=row==1 end;if l.name=="Veteran cuffs" then l.isVisible=row==2 end end
  output:drawImage(Image(s),Point((col-1)*W,row*H))
 end
 s:close()
end
output:saveAs("public/art/hero-core-poses.png")
print("Exported four core illustrations / three canonical stages.")
