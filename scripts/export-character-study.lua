local s=app.open("art/source/hero-core-study.aseprite")
local output=Image(160,288,ColorMode.RGB)
for row=0,2 do
 for _,l in ipairs(s.layers) do
  if l.name=="Adventurer trim" then l.isVisible=row==1 end
  if l.name=="Veteran trim" then l.isVisible=row==2 end
 end
 output:drawImage(Image(s),Point(0,row*96))
end
output:saveAs("art/review/core-study.png");s:close()
print("Review-only core stages exported; no workout mapping changed.")
