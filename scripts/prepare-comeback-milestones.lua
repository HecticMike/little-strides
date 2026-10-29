-- One-time native pixel authoring of the two remaining milestone builds.
-- Explicit clusters, not interpolation or image morphing. Original masters never saved.
local out='art/prototypes/comeback/stage-study/'
local pc=app.pixelColor
for _,stage in ipairs({'rhythm','confident'}) do for _,pose in ipairs({'standing','march','heel-slide','supine','bridge','calf'}) do assert(not app.fs.isFile(out..stage..'-'..pose..'.aseprite'),'Milestone master exists: edit its layers.') end end
local function colour(h)return pc.rgba(tonumber(h:sub(1,2),16),tonumber(h:sub(3,4),16),tonumber(h:sub(5,6),16),255)end
local function patch(s,name,runs,scale)
 local im=Image(s.width,s.height,ColorMode.RGB)
 for _,r in ipairs(runs) do for i,h in ipairs(r[3]) do for yy=0,scale-1 do for xx=0,scale-1 do im:drawPixel((r[2]+i-1)*scale+xx,r[1]*scale+yy,colour(h)) end end end end
 local l=s:newLayer();l.name=name;s:newCel(l,1,im,Point(0,0))
end
local o='10232c';local dark='215861';local tee='307a7e';local light='48979a';local skin='efa96c';local hi='ffc481';local shadow='d88e59'
for _,stage in ipairs({'rhythm','confident'}) do for _,pose in ipairs({'standing','march','heel-slide','supine','bridge'}) do
 local s=app.open(out..'form-'..pose..'.aseprite')
 if stage=='rhythm' then local remove={};for _,l in ipairs(s.layers) do if l.name:find('^Study /') then remove[#remove+1]=l end end;for _,l in ipairs(remove) do s:deleteLayer(l) end end
 local runs,scale={},(pose=='standing' or pose=='march') and 2 or 1
 if pose=='standing' then scale=2
  runs=stage=='rhythm' and {
   {22,15,{o,tee}},{23,14,{o,tee}},{24,15,{light}},
   {28,15,{hi,skin,shadow}},{29,15,{hi,skin,shadow}},
   {30,30,{skin,hi}},{26,21,{dark}},{31,26,{dark}}
  } or {
   {22,31,{light,o}},{23,31,{tee,dark,o}},{24,31,{tee,dark,o}},
   {25,31,{tee,dark,o}},{27,30,{hi,skin,o}},{28,30,{hi,skin,o}},
   {29,30,{hi,skin,o}},{30,30,{skin,hi}},{32,25,{dark,dark}},{33,26,{dark}}
  }
 elseif pose=='march' then scale=2
  runs=stage=='rhythm' and {
   {23,13,{o,tee}},{24,13,{o,tee,tee}},{25,14,{tee,light}},
   {27,15,{hi,skin,shadow}},{28,15,{hi,skin,shadow}},
   {29,30,{hi,skin}},{26,22,{dark}}
  } or {
   {23,31,{tee,dark,o}},{24,31,{light,tee,dark,o}},
   {25,32,{tee,dark,o}},{27,29,{skin,hi,o}},
   {28,29,{hi,skin,shadow,o}},{29,29,{skin,hi,skin,o}},
   {26,21,{dark,dark,tee}},{30,24,{dark,dark}},{31,24,{dark}}
  }
 else
  scale=1;local top=pose=='supine' and 108 or 109
  runs=stage=='rhythm' and {
   {top-1,115,{hi}},{top,115,{hi,skin,shadow}},
   {114,116,{skin,shadow}},
   {pose=='bridge' and 93 or 99,115,{light,tee}}
  } or {
   {top-3,116,{o}}, {top-2,115,{hi,skin,shadow}},
   {top-1,114,{hi,skin,skin,shadow}},
   {114,116,{skin,shadow,shadow}}, {115,117,{shadow}},
   {pose=='bridge' and 93 or 99,114,{light,tee,tee}}
  }
 end
 patch(s,'Milestone / '..stage..' pose-specific physique',runs,scale)
 s:saveAs(out..stage..'-'..pose..'.aseprite');s:close()
end end
for _,stage in ipairs({'rhythm','confident'}) do
 local s=app.open(out..'form-calf.aseprite');local remove={};for _,l in ipairs(s.layers) do if l.name:find('^Preview /') then remove[#remove+1]=l end end;for _,l in ipairs(remove) do s:deleteLayer(l) end
 local stand=app.open(out..stage..'-standing.aseprite');local body=Image(stand);stand:close();local im=Image(96,132,ColorMode.RGB)
 for y=0,73 do for x=0,95 do im:drawPixel(x,y,body:getPixel(x,y)) end end
 local l=s:newLayer();l.name='Preview / Shared '..stage..' standing upper body';s:newCel(l,1,im,Point(0,0));s:saveAs(out..stage..'-calf.aseprite');s:close()
end
print('Authored rhythm/confident native milestone clusters for all six poses; original masters unchanged.')
