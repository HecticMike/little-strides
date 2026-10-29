-- Two contact keys from the approved standing bodies. Head/torso stay registered.
local root='art/prototypes/comeback/user-art/'
if app.fs.isFile(root..'motion.aseprite') then error('Motion master exists; edit it directly.') end
local src=app.open(root..'character.aseprite');local body=Image(src);local palette=src.palettes[1]
local s=Sprite(288,256,ColorMode.RGB);s:deleteLayer(s.layers[1]);local pc=app.pixelColor
local function put(image,x,y,value)if x>=0 and x<image.width and y>=0 and y<image.height then image:drawPixel(x,y,value) end end
local function round(n)return math.floor(n/2+.5)*2 end
for stage=0,1 do
 local layers={};for _,name in ipairs({'Registered torso and pelvis','Near arm','Far arm','Near leg and trainer','Far leg and trainer'}) do local l=s:newLayer();l.name=(stage==0 and 'Starting' or 'Developed')..' / '..name;layers[name]={layer=l,image=Image(288,256,ColorMode.RGB)} end
 for frame=0,2 do
  for y=0,127 do for x=0,95 do
   local v=body:getPixel(stage*96+x,y);if pc.rgbaA(v)>0 then
    local part='Registered torso and pelvis';local dx,dy=0,0
    if y>=88 then
     local near=x<50;part=near and 'Near leg and trainer' or 'Far leg and trainer'
     if frame>0 then
      local nearSwing=frame==2;local swing=near==nearSwing;local shift=(frame==1 and -6 or 6)*(near and 1 or -1)
      local t=math.min(1,math.max(0,(y-88)/28));dx=round(shift*t);dy=swing and -round(6*t) or 0
     end
    elseif y>=56 and y<87 and (x<38 or x>=60) then
     local near=x<38;part=near and 'Near arm' or 'Far arm'
     if frame>0 then local t=math.min(1,(y-56)/24);dx=round((frame==1 and 4 or -4)*(near and 1 or -1)*t) end
    end
    put(layers[part].image,frame*96+x+dx,stage*128+y+dy,v)
   end
  end end
 end
 for _,name in ipairs({'Registered torso and pelvis','Near arm','Far arm','Near leg and trainer','Far leg and trainer'}) do local p=layers[name];s:newCel(p.layer,1,p.image,Point(0,0)) end
end
s:setPalette(palette);s.gridBounds=Rectangle(0,0,96,128);s:saveAs(root..'motion.aseprite');s:close();src:close()
print('Created registered stand/left-contact/right-contact body keys. No exercise demonstration derived from walking.')