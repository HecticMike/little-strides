-- One-time native-pixel derivation; normal exports never regenerate edited layers.
local root='art/prototypes/comeback/user-art/'
if app.fs.isFile(root..'calf.aseprite') then error('Calf master exists. Edit its layers in Aseprite instead of reimporting.') end
local pc=app.pixelColor
local source=app.open(root..'character.aseprite');local heads=app.open(root..'heads.aseprite');local head=Image(heads);heads:close()
local result=Sprite(192,132,ColorMode.RGB);result:deleteLayer(result.layers[1]);result.gridBounds=Rectangle(0,0,2,2);result:setPalette(source.palettes[1])
local function round(n)return math.floor(n+.5)end
local function enlarge(im)local out=Image(96,132,ColorMode.RGB);for y=0,65 do for x=0,47 do local v=im:getPixel(x,y);for yy=0,1 do for xx=0,1 do out:drawPixel(x*2+xx,y*2+yy,v) end end end end;return out end
for stage=0,1 do local name=stage==0 and 'Starting' or 'Developed'
 for _,layer in ipairs(source.layers) do if layer.name:find('^Standing / '..name..' / ') then
  local cel=layer:cel(1);local im=Image(48,66,ColorMode.RGB);local b={x=48,y=66,x1=-1,y1=-1}
  if cel then for y=0,63 do for x=0,47 do local sx=x*2+stage*96-cel.position.x;local sy=y*2-cel.position.y;if sx>=0 and sx<cel.image.width and sy>=0 and sy<cel.image.height then local v=cel.image:getPixel(sx,sy);im:drawPixel(x,y,v);if pc.rgbaA(v)>0 then b.x=math.min(b.x,x);b.x1=math.max(b.x1,x);b.y=math.min(b.y,y);b.y1=math.max(b.y1,y) end end end end end
  if layer.name:find('trainer') then
   local near=layer.name:find('Near')~=nil;local px=near and b.x or b.x1;local py=b.y1;local angle=math.rad(near and -15 or 15);local co,si=math.cos(angle),math.sin(angle);local out=Image(48,66,ColorMode.RGB)
   for y=0,65 do for x=0,47 do local dx,dy=x-px,y-(py+2);local sx=round(co*dx+si*dy+px);local sy=round(-si*dx+co*dy+py);if sx>=0 and sx<48 and sy>=0 and sy<66 and y<=py+2 then out:drawPixel(x,y,im:getPixel(sx,sy)) end end end;im=out
  end
  local target=result:newLayer();target.name=layer.name:gsub('^Standing','Raised heels');result:newCel(target,1,enlarge(im),Point(stage*96,0))
 end end
 local preview=Image(96,132,ColorMode.RGB);for y=0,41 do for x=0,95 do preview:drawPixel(x,y,head:getPixel(stage*96+x,y)) end end
 local layer=result:newLayer();layer.name='Preview / '..name..' shared canonical head';result:newCel(layer,1,preview,Point(stage*96,0))
end
source:close();result:saveAs(root..'calf.aseprite');result:close()
print('Prepared two endpoint calf stills with unchanged body parts and separately editable trainers. No animation or clinical clearance.')
