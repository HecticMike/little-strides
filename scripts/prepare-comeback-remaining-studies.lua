-- Guarded pose-specific floor studies and shared-body calf variants. Never writes live art.
local root='art/prototypes/comeback/user-art/'
local out='art/prototypes/comeback/stage-study/'
local pc=app.pixelColor
for _,pose in ipairs({'supine','bridge','calf'}) do for _,stage in ipairs({'form','developed'}) do assert(not app.fs.isFile(out..stage..'-'..pose..'.aseprite'),'Study exists: edit native layers instead of reimporting.') end end
local function colour(h)return pc.rgba(tonumber(h:sub(1,2),16),tonumber(h:sub(3,4),16),tonumber(h:sub(5,6),16),255)end
local o='10232c';local skin='efa96c';local hi='ffc481';local shadow='d88e59';local tee='307a7e';local dark='215861';local light='48979a'
for _,entry in ipairs({{pose='supine',source='supine-start'},{pose='bridge',source='bridge'}}) do
 local source=app.open(root..entry.source..'.aseprite');local junction=Image(192,128,ColorMode.RGB)
 for _,l in ipairs(source.layers) do if l.name:find('Intact head neck') then local c=l:cel(1);junction:drawImage(c.image,c.position) end end
 for stage=1,2 do
  local s=Sprite(192,128,ColorMode.RGB);s:deleteLayer(s.layers[1]);s:setPalette(source.palettes[1]);s.gridBounds=Rectangle(0,0,1,1)
  for _,l in ipairs(source.layers) do if not l.name:find('^Reference /') then local c=l:cel(1);local im=Image(192,128,ColorMode.RGB);im:drawImage(c.image,c.position);local target=s:newLayer();target.name='Base / '..l.name;s:newCel(target,1,im,Point(0,0)) end end
  local function patch(name,runs)
   local im=Image(192,128,ColorMode.RGB)
   for _,r in ipairs(runs) do for i,h in ipairs(r[3]) do local x,y=r[2]+i-1,r[1];assert(x>=104 and x<128 and y<118,'Protected limb/contact region.');assert(pc.rgbaA(junction:getPixel(x,y))==0,'Protected head/neck/shoulder junction.');im:drawPixel(x,y,colour(h)) end end
   local l=s:newLayer();l.name='Study / '..name;s:newCel(l,1,im,Point(0,0))
  end
  local top=entry.pose=='supine' and 108 or 109
  if stage==1 then
   patch('Intermediate pose-specific arm form',{
    {top-2,115,{o,o,o}}, {top-1,114,{o,hi,skin,shadow,o}},
    {top,114,{hi,skin,skin,shadow,shadow}}, {top+1,115,{skin,skin,shadow}},
    {115,115,{skin,shadow,shadow}}
   })
   patch('Intermediate shirt planes',entry.pose=='supine' and {
    {97,111,{light,tee,tee}}, {98,113,{tee,light,tee}}, {101,116,{tee,dark,dark}}, {103,122,{dark,tee}}
   } or {
    {91,106,{light,tee,tee}}, {93,110,{tee,light,tee}}, {97,115,{tee,dark,dark}}, {103,122,{dark,tee}}
   })
  else
   patch('Developed pose-specific arm form',{
    {top-4,115,{o,o,o}}, {top-3,114,{o,hi,skin,shadow,o}},
    {top-2,113,{o,hi,skin,skin,skin,shadow,o}},
    {top-1,113,{o,hi,skin,skin,skin,shadow,o}},
    {top,114,{hi,skin,skin,shadow,shadow}}, {top+1,115,{skin,skin,shadow}},
    {114,115,{skin,shadow,shadow}}, {115,114,{shadow,shadow,shadow,shadow}},
    {116,115,{'b66d48',shadow,shadow}}
   })
   patch('Developed shirt planes',entry.pose=='supine' and {
    {96,111,{light,light,tee}}, {97,110,{light,light,tee,tee}},
    {98,112,{tee,light,tee,tee}}, {100,115,{dark,tee,dark,dark}},
    {101,116,{tee,dark,dark,dark}}, {103,122,{dark,tee}}, {104,124,{dark,tee}}
   } or {
    {90,106,{light,light,tee}}, {91,105,{light,light,tee,tee}},
    {93,109,{tee,light,tee,tee}}, {96,114,{dark,tee,dark,dark}},
    {97,115,{tee,dark,dark,dark}}, {101,120,{dark,tee}}, {103,123,{dark,tee}}
   })
  end
  s:saveAs(out..(stage==1 and 'form' or 'developed')..'-'..entry.pose..'.aseprite');s:close()
 end
 source:close()
end
-- Calf shares the current standing upper body authoritatively; edit only lower pose regions here.
local source=app.open(root..'calf.aseprite')
for _,stage in ipairs({'form','developed'}) do
 local s=Sprite(96,132,ColorMode.RGB);s:deleteLayer(s.layers[1]);s:setPalette(source.palettes[1]);s.gridBounds=Rectangle(0,0,2,2)
 for _,l in ipairs(source.layers) do if l.name:find('^Raised heels / Starting /') then local c=l:cel(1);local im=Image(96,132,ColorMode.RGB);local n=0
  for y=74,131 do for x=0,95 do local sx,sy=x-c.position.x,y-c.position.y;if sx>=0 and sy>=0 and sx<c.image.width and sy<c.image.height then local v=c.image:getPixel(sx,sy);im:drawPixel(x,y,v);if pc.rgbaA(v)>0 then n=n+1 end end end end
  if n>0 then local target=s:newLayer();target.name='Lower pose / '..l.name:gsub('^Raised heels / Starting / ','');s:newCel(target,1,im,Point(0,0)) end
 end end
 local canonical=Image{fromFile=out..(stage=='form' and 'form-standing' or 'developed-silhouette')..'.png'};local preview=Image(96,132,ColorMode.RGB)
 for y=0,73 do for x=0,95 do preview:drawPixel(x,y,canonical:getPixel(x,y)) end end
 local l=s:newLayer();l.name='Preview / Shared standing upper body - edit standing master';s:newCel(l,1,preview,Point(0,0))
 s:saveAs(out..stage..'-calf.aseprite');s:close()
end
source:close();print('Prepared neutral supine, raised bridge and shared-body calf studies. No live/source masters changed.')
