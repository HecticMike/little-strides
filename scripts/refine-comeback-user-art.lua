-- Bounded pixel cleanup after fitting the user-supplied character; never reimport.
local root='art/prototypes/comeback/user-art/'
if app.fs.isFile(root..'refinement.json') then error('User-art join refinement already applied; edit the masters directly.') end
local s=app.open(root..'character.aseprite');local pc=app.pixelColor
local function rgb(r,g,b)return pc.rgba(r,g,b,255)end
local skin=rgb(239,169,108);local skinShade=rgb(182,109,72);local skinMid=rgb(216,142,89);local skinLight=rgb(255,196,129);local hair=rgb(62,40,31);local hairMid=rgb(88,56,43);local eye=rgb(255,243,218);local ink=rgb(16,35,44)
for _,l in ipairs(s.layers) do
 if l.name:find('Heel slide') and l.name:find('/ Shared head') then
  local cel=l:cel(1);local im=Image(cel.image);local dx=l.name:find('/ Developed /') and 96 or 0
  -- Keep an intentional eye cluster rather than the resampling cross shape.
  im:drawPixel(dx+79,64+45,skin);im:drawPixel(dx+77,64+45,eye);im:drawPixel(dx+78,64+45,ink);im:drawPixel(dx+77,64+46,eye);im:drawPixel(dx+78,64+46,eye)
  -- Round the supported occiput instead of leaving sparse rotated hair pixels.
  for y=57,59 do for x=63,95 do im:drawPixel(dx+x,64+y,0) end end
  for x=75,88 do im:drawPixel(dx+x,64+57,hair) end
  for x=77,86 do im:drawPixel(dx+x,64+58,hair) end
  for x=80,84 do im:drawPixel(dx+x,64+59,hair) end
  for x=78,83 do im:drawPixel(dx+x,64+57,hairMid) end
  cel.image=im
 elseif l.name:find('Heel slide') and l.name:find('Near arm hand and neck') then
  local cel=l:cel(1);local im=Image(cel.image);local dx=l.name:find('/ Developed /') and 96 or 0
  for y=54,58 do for x=68,74 do im:drawPixel(dx+x,64+y,0) end end;cel.image=im
 end
end
for _,stage in ipairs({'Starting','Developed'}) do
 local dx=stage=='Starting' and 0 or 96;local l=s:newLayer();l.name='Heel slide / '..stage..' / Neck support refinement';l.stackIndex=1;local im=Image(192,128,ColorMode.RGB)
 for y=54,58 do for x=66,74 do if (y>=55 or x<=70) and (y<=57 or x<=72) then im:drawPixel(dx+x,64+y,skinShade) end end end
 for y=55,57 do for x=67,73 do im:drawPixel(dx+x,64+y,skinMid) end end
 for x=68,71 do im:drawPixel(dx+x,64+55,skinLight) end
 s:newCel(l,1,im,Point(0,0))
end
s:saveAs(root..'character.aseprite');s:close()
local f=io.open(root..'refinement.json','w');f:write(json.encode({revision=1,headSourcePreserved=true,neckJoin='registered pixel bridge behind head and shirt',occiput='rounded support contour',eye='cleaned pixel cluster',anatomyStatus='provisional-unreviewed'}));f:close()
print('Refined the floor head support, eye cluster and neck join from the supplied artwork.')