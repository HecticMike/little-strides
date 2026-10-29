-- Guarded, pose-specific native studies. No live/source asset writes or walking frames.
local root='art/prototypes/comeback/user-art/'
local out='art/prototypes/comeback/stage-study/'
for _,name in ipairs({'form-march','developed-march'}) do assert(not app.fs.isFile(out..name..'.aseprite'),'Study exists; edit its layers rather than rerunning preparation.') end
local source=app.open(root..'march.aseprite');local pc=app.pixelColor
local hs=app.open(root..'heads.aseprite');local heads=Image(hs);hs:close()
local function colour(h)return pc.rgba(tonumber(h:sub(1,2),16),tonumber(h:sub(3,4),16),tonumber(h:sub(5,6),16),255)end
for stage=1,2 do
 local s=Sprite(96,128,ColorMode.RGB);s:deleteLayer(s.layers[1]);s:setPalette(source.palettes[1]);s.gridBounds=Rectangle(0,0,2,2)
 for _,l in ipairs(source.layers) do if not l.name:find('^Preview /') then local c=l:cel(1);local im=Image(96,128,ColorMode.RGB);if c then im:drawImage(c.image,c.position) end
 local target=s:newLayer();target.name=l.name:gsub('^Body /','Base / Starting march /');s:newCel(target,1,im,Point(0,0)) end end
 local function patch(name,runs)
 local im=Image(96,128,ColorMode.RGB)
 for _,r in ipairs(runs) do local y,x,hexes=r[1],r[2],r[3];assert(y>=21 and y<34,'Edit outside upper-body review region.')
 for i,h in ipairs(hexes) do for yy=0,1 do for xx=0,1 do im:drawPixel((x+i-1)*2+xx,y*2+yy,colour(h)) end end end end
 local l=s:newLayer();l.name='Study / '..name;s:newCel(l,1,im,Point(0,0)) end
 local o='10232c';local dark='215861';local teal='307a7e';local light='48979a';local skin='efa96c';local hi='ffc481';local shadow='d88e59'
 if stage==1 then
 patch('Intermediate marching shoulder and sleeve shape',{
 {22,14,{o,dark,teal}}, {23,13,{o,dark,teal,teal}},
 {24,12,{o,dark,teal,teal,dark}}, {25,13,{o,teal,teal,dark}},
 {23,30,{teal,teal,o}}, {24,30,{teal,light,teal,o}},
 {25,31,{light,teal,o}}
 })
 patch('Intermediate marching arm form',{
 {27,15,{hi,skin,shadow}}, {28,15,{hi,skin,shadow}},
 {29,14,{hi,skin,skin,shadow}}, {30,14,{skin,skin,shadow}},
 {27,29,{skin,hi,o}}, {28,29,{hi,skin,o}},
 {29,29,{skin,hi,skin}}, {30,30,{skin,hi}}
 })
 patch('Intermediate shirt planes',{
 {25,21,{dark,teal}}, {26,22,{dark,teal}},
 {27,23,{dark,teal}}, {30,24,{dark,dark}}, {31,25,{dark}}
 })
 else
 patch('Developed marching shoulder and sleeve shape',{
 {21,14,{o,teal,teal}}, {22,13,{o,dark,teal,teal}},
 {23,12,{o,dark,teal,light,teal}},
 {24,11,{o,dark,teal,teal,light,teal}},
 {25,12,{o,dark,teal,teal,dark,dark,o}},
 {26,13,{o,teal,dark,dark,o}},
 {22,30,{light,teal,o}}, {23,30,{light,teal,teal,o}},
 {24,30,{light,teal,teal,dark,o}},
 {25,31,{light,teal,dark,o}}, {26,31,{teal,dark,o}}
 })
 patch('Developed marching arm form',{
 {27,13,{o,hi,skin,skin,shadow,o}},
 {28,13,{o,hi,skin,skin,shadow,o}},
 {29,13,{o,hi,skin,skin,shadow}},
 {30,14,{hi,skin,shadow}}, {31,14,{skin,skin,shadow}},
 {27,28,{o,skin,hi,o}}, {28,28,{o,hi,skin,shadow,o}},
 {29,28,{shadow,skin,hi,skin,o}},
 {30,30,{skin,hi,skin}}
 })
 patch('Developed shirt planes',{
 {24,21,{teal,teal,teal}}, {25,20,{dark,dark,teal}},
 {26,21,{dark,dark,teal}}, {27,22,{dark,teal,teal}},
 {29,23,{teal,dark}}, {30,24,{dark,dark}},
 {31,24,{dark,dark}}, {32,25,{dark,dark}}
 })
 end
 local preview=Image(96,128,ColorMode.RGB);for y=0,41 do for x=0,95 do preview:drawPixel(x,y,heads:getPixel(x,y)) end end
 local l=s:newLayer();l.name='Preview / Authoritative shared canonical upright head';s:newCel(l,1,preview,Point(0,0))
 s:saveAs(out..(stage==1 and 'form-march' or 'developed-march')..'.aseprite');s:close()
end
source:close();print('Prepared two marching physique studies; head, legs and foot anchors retained.')
