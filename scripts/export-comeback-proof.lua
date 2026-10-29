local root='art/prototypes/comeback/'
local inventory={}
for _,name in ipairs({'character','studio'}) do
 local s=app.open(root..name..'.aseprite')
 Image(s):saveAs(root..name..'.png')
 local entry={name=name,width=s.width,height=s.height,layers={}}
 for _,l in ipairs(s.layers) do
  local n=0
  for _,cel in ipairs(l.cels) do for it in cel.image:pixels() do if app.pixelColor.rgbaA(it())>0 then n=n+1 end end end
  entry.layers[#entry.layers+1]={name=l.name,visible=l.isVisible,pixels=n}
 end
 if name=='studio' then
  local previous={};for i,l in ipairs(s.layers) do previous[i]=l.isVisible;l.isVisible=l.name:find('^Architecture')~=nil or l.name:find('^Light')~=nil end
  Image(s):saveAs(root..'studio-workout.png')
  for _,l in ipairs(s.layers) do l.isVisible=l.name=='Workout / Side-view mat' end
  Image(s):saveAs(root..'studio-workout-mat.png')
  for i,l in ipairs(s.layers) do l.isVisible=previous[i] end
 end
 inventory[#inventory+1]=entry;s:close()
end
local f=io.open(root..'inventory.json','w');f:write(json.encode(inventory));f:close()
print('Exported the layered character, room and independent workout backdrop/mat. No master visibility or live asset changed.')