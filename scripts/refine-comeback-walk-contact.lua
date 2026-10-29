-- Register the near planted sole with the fixed ground row; no head/torso change.
local root='art/prototypes/comeback/user-art/'
if app.fs.isFile(root..'motion-contact.json') then error('Contact correction already applied; edit the master.') end
local s=app.open(root..'motion.aseprite')
for _,l in ipairs(s.layers) do if l.name:find('/ Near leg and trainer') then
 local cel=l:cel(1);local source=Image(cel.image);local out=Image(source);local base=l.name:find('^Developed') and 128 or 0
 for y=88,127 do for x=96,191 do out:drawPixel(x,base+y,0) end end
 for y=88,127 do local t=math.min(1,math.max(0,(y-88)/28));local dy=math.floor(t+.5)*2;local sy=y-dy;for x=96,191 do out:drawPixel(x,base+y,source:getPixel(x,base+sy)) end end
 cel.image=out
end end
s:saveAs(root..'motion.aseprite');s:close()
local f=io.open(root..'motion-contact.json','w');f:write(json.encode({supportRow=123,headShift=0,torsoShift=0,correction='near planted sole +2 source pixels, inverse sampled to keep calf connected'}));f:close()
print('Registered both supporting soles to row 123; head and torso unchanged.')