-- One-time extraction of an independently editable side-view mat for the proof.
local root='art/prototypes/comeback/'
local s=app.open(root..'studio.aseprite')
for _,l in ipairs(s.layers) do if l.name=='Workout / Side-view mat' then error('Side-view mat already authored; edit it directly.') end end
local l=s:newLayer();l.name='Workout / Side-view mat';l.isVisible=false
local im=Image(160,96,ColorMode.RGB)
local function c(h)return app.pixelColor.rgba(tonumber(h:sub(1,2),16),tonumber(h:sub(3,4),16),tonumber(h:sub(5,6),16),255)end
local function r(x,y,w,h,colour)for yy=y,y+h-1 do for xx=x,x+w-1 do im:drawPixel(xx,yy,c(colour))end end end
r(8,83,145,1,'7ca890');r(6,84,149,2,'56877b');r(5,86,151,2,'386965');r(7,86,147,1,'56877b');r(16,85,76,1,'386965');r(119,85,9,1,'386965');r(142,86,8,1,'386965')
s:newCel(l,1,im,Point(0,0));s:saveAs(root..'studio.aseprite');s:close()
print('Authored one separate workout mat; the room mat stays independent.')