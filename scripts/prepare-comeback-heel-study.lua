-- Guarded pose-specific native edits; no upright-part transplant or live export.
local root='art/prototypes/comeback/user-art/'
local out='art/prototypes/comeback/stage-study/'
for _,name in ipairs({'form-heel-slide','developed-heel-slide'}) do assert(not app.fs.isFile(out..name..'.aseprite'),'Study exists; edit its native layers instead of reimporting.') end
local pc=app.pixelColor
local function colour(h)return pc.rgba(tonumber(h:sub(1,2),16),tonumber(h:sub(3,4),16),tonumber(h:sub(5,6),16),255)end
local hs=app.open(root..'heads.aseprite');local heads=Image(hs);hs:close()
local junction=Image(192,128,ColorMode.RGB);junction:drawImage(heads,Point(0,-128))
local src=app.open(root..'character.aseprite')
for stage=1,2 do
 local sprite=Sprite(192,128,ColorMode.RGB);sprite:deleteLayer(sprite.layers[1]);sprite:setPalette(src.palettes[1]);sprite.gridBounds=Rectangle(0,0,1,1)
 for _,l in ipairs(src.layers) do if l.name:find('^Heel slide / Starting / ') then
  local cel=l:cel(1);local im=Image(192,128,ColorMode.RGB);im:drawImage(cel.image,Point(cel.position.x,cel.position.y-128))
  local target=sprite:newLayer();target.name=l.name:gsub('Heel slide / Starting','Base / Starting heel slide');sprite:newCel(target,1,im,Point(0,0))
 end end
 local function patch(name,runs)
  local im=Image(192,128,ColorMode.RGB)
  for _,r in ipairs(runs) do local y,x,hexes=r[1],r[2],r[3];for i,h in ipairs(hexes) do local px=x+i-1
   assert(px>=102 and px<132 and y<118,'Edit would touch protected hand/leg/contact region.')
   assert(pc.rgbaA(junction:getPixel(px,y))==0,'Edit would alter the protected floor junction.')
   im:drawPixel(px,y,colour(h))
  end end
  local l=sprite:newLayer();l.name='Study / '..name;sprite:newCel(l,1,im,Point(0,0))
 end
 local o='10232c';local skin='efa96c';local hi='ffc481';local shadow='d88e59';local tee='307a7e';local dark='215861';local light='48979a'
 if stage==1 then
  patch('Intermediate upper-arm contour',{
   {107,115,{o,o,o}},
   {108,113,{o,hi,skin,skin,skin,shadow,o}},
   {109,113,{hi,hi,skin,skin,skin,shadow,shadow}},
   {110,113,{hi,skin,skin,skin,skin,shadow,shadow}},
   {114,116,{skin,skin,shadow,shadow}},
   {115,117,{shadow,shadow,shadow}}
  })
  patch('Intermediate shirt light and folds',{
   {98,116,{light,light,tee,tee}},
   {99,115,{tee,light,tee,tee}},
   {102,115,{tee,tee,dark,dark}},
   {103,116,{tee,dark,dark}},
   {104,120,{dark,tee,tee}}
  })
 else
  patch('Developed upper-arm contour',{
   {105,115,{o,o,o}},
   {106,113,{o,hi,hi,skin,skin,shadow,o}},
   {107,112,{o,hi,hi,skin,skin,skin,shadow,shadow,o}},
   {108,112,{o,hi,skin,skin,skin,skin,skin,shadow,o}},
   {109,113,{hi,hi,skin,skin,skin,shadow,shadow}},
   {110,113,{hi,skin,skin,skin,skin,shadow,shadow}},
   {111,114,{skin,skin,skin,skin,shadow,shadow}},
   {114,116,{skin,skin,shadow,shadow}},
   {115,116,{shadow,shadow,shadow,shadow}},
   {116,117,{'b66d48',shadow,shadow}}
  })
  patch('Developed shirt light and folds',{
   {97,115,{light,light,tee}},
   {98,114,{light,light,light,tee,tee,tee}},
   {99,114,{tee,light,tee,tee,tee}},
   {101,113,{dark,tee,tee,dark,dark}},
   {102,114,{tee,tee,dark,dark,dark}},
   {103,115,{tee,dark,dark,dark}},
   {104,120,{dark,tee,tee}},
   {105,123,{dark,tee,tee}}
  })
 end
 local l=sprite:newLayer();l.name='Preview / Intact source-matched floor head neck shoulder';sprite:newCel(l,1,junction,Point(0,0))
 sprite:saveAs(out..(stage==1 and 'form-heel-slide' or 'developed-heel-slide')..'.aseprite');sprite:close()
end
src:close();print('Prepared two isolated heel-slide studies, preserving source pose and entire floor junction.')
