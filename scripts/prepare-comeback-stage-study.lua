-- One-time, isolated standing study. Never edit approved endpoint masters.
local root='art/prototypes/comeback/user-art/'
local out='art/prototypes/comeback/stage-study/'
assert(not app.fs.isFile(out..'developed-silhouette.aseprite'),'Study exists. Edit its layers, do not reprepare.')
local pc=app.pixelColor
local src=app.open(root..'character.aseprite')
local dest=Sprite(96,128,ColorMode.RGB);dest:deleteLayer(dest.layers[1]);dest.gridBounds=Rectangle(0,0,2,2);dest:setPalette(src.palettes[1])
for _,layer in ipairs(src.layers) do if layer.name:find('^Standing / Starting / ') then
 local im=Image(96,128,ColorMode.RGB);local cel=layer:cel(1)
 if cel then im:drawImage(cel.image,cel.position) end
 local l=dest:newLayer();l.name=layer.name:gsub('Standing / Starting','Base / Starting');dest:newCel(l,1,im,Point(0,0))
end end
src:close()
local function colour(h)return pc.rgba(tonumber(h:sub(1,2),16),tonumber(h:sub(3,4),16),tonumber(h:sub(5,6),16),255)end
local function patch(name,points)
 local im=Image(96,128,ColorMode.RGB)
 for _,p in ipairs(points) do local v=colour(p[3]);for yy=0,1 do for xx=0,1 do im:drawPixel(p[1]*2+xx,p[2]*2+yy,v) end end end
 local l=dest:newLayer();l.name='Study / '..name;dest:newCel(l,1,im,Point(0,0))
end
-- Hand-selected silhouette proposal; no interpolation or anatomy scaling.
local points={}
local function run(y,x,hexes)for i,h in ipairs(hexes) do points[#points+1]={x+i-1,y,h} end end
local o='10232c';local dark='215861';local teal='307a7e';local light='48979a'
run(21,15,{o,teal,teal});run(21,30,{light,o})
run(22,14,{o,dark,teal});run(22,30,{light,teal,o})
for y=23,24 do run(y,13,{o,dark,teal,teal});run(y,30,{light,teal,dark,o}) end
run(25,13,{o,dark,teal,dark,o});run(25,30,{teal,teal,dark,o})
run(26,14,{o,teal,dark,o});run(26,30,{teal,teal,o})
patch('Broader shoulder silhouette and sleeve caps',points)
points={};local skin='efa96c';local hi='ffc481';local shade='d88e59'
run(27,14,{o,hi,skin,shade,o});run(27,29,{hi,skin,shade,o})
run(28,13,{o,hi,skin,skin,shade,o});run(28,28,{o,hi,skin,shade,o})
run(29,13,{o,hi,skin,shade,shade,o});run(29,28,{o,hi,skin,shade,o})
run(30,14,{hi,skin,shade,shade,o});run(30,29,{skin,hi,shade,o})
run(31,14,{hi,skin,shade,shade});run(31,30,{skin,hi,skin,o})
run(32,14,{hi,skin,skin});run(32,30,{skin,hi,skin,o})
patch('Upper arms - connected deltoid and biceps clusters',points)
points={}
run(25,19,{teal,teal,teal});run(26,19,{dark,dark,teal});run(27,20,{dark,dark,teal,teal})
run(27,25,{teal,dark,dark});run(28,21,{teal,teal,teal});run(29,23,{teal,teal,dark})
run(31,25,{dark,dark});run(32,25,{dark,dark});run(33,26,{dark,dark});run(34,19,{light,teal,teal})
patch('Shirt - chest plane and restrained folds',points)

-- Existing soles, leg silhouettes, hands and all head pixels are retained.
local hs=app.open(root..'heads.aseprite');local hi=Image(hs);hs:close();local preview=Image(96,128,ColorMode.RGB)
for y=0,41 do for x=0,95 do preview:drawPixel(x,y,hi:getPixel(x,y)) end end
local l=dest:newLayer();l.name='Preview / Shared canonical head - authoritative source heads.aseprite';dest:newCel(l,1,preview,Point(0,0))
dest:saveAs(out..'developed-silhouette.aseprite');dest:close()
print('Prepared one editable standing silhouette study; no approved or runtime artwork changed.')
