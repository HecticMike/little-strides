-- One-time original prop/interface authoring. Normal export never regenerates masters.
for _,name in ipairs({'chapter-props','ui-enamel','ui-paper','discovery-pond','discovery-watchtower'}) do
 local check=io.open('art/source/'..name..'.aseprite','rb');if check then check:close();error('Chapter masters already exist. Edit them and use art:export; bootstrap will not overwrite them.') end
end
local pc=app.pixelColor
local P={ink="#18342e",shadow="#294234",wood="#795038",bark="#573a2d",tan="#ba8650",light="#e0b66e",gold="#e5ad50",cream="#fff0c2",leaf="#54764b",fern="#88a263",teal="#36776c",blue="#65978a",skin="#dca77a",skinlight="#f2c397",hair="#704631",rust="#b26948",dark="#283a3b",stone="#9e9b77",pink="#cf957d"}
local function color(v) local c=P[v] or v;return pc.rgba(tonumber(c:sub(2,3),16),tonumber(c:sub(4,5),16),tonumber(c:sub(6,7),16),255) end
local function im() return Image(48,48,ColorMode.RGB) end
local function r(a,x,y,w,h,c) for yy=y,y+h-1 do for xx=x,x+w-1 do if xx>=0 and xx<48 and yy>=0 and yy<48 then a:drawPixel(xx,yy,color(c)) end end end end
local function dot(a,x,y,c) r(a,x,y,1,1,c) end
local function line(a,x,y,x2,y2,c) local n=math.max(math.abs(x2-x),math.abs(y2-y));for i=0,n do dot(a,math.floor(x+(x2-x)*i/math.max(1,n)+.5),math.floor(y+(y2-y)*i/math.max(1,n)+.5),c) end end
local function make(w,h) local s=Sprite(w,h,ColorMode.RGB);return s,s.layers[1] end
local function layer(s,name,a,frame) local image=Image(s.width,s.height,ColorMode.RGB);local x=(frame%4)*96;local y=math.floor(frame/4)*96;for p in a:pixels() do if pc.rgbaA(p())>0 then for dy=0,1 do for dx=0,1 do image:drawPixel(x+p.x*2+dx,y+p.y*2+dy,p()) end end end end;local l=s:newLayer();l.name=name;s:newCel(l,1,image) end
local s,initial=make(384,288)
for frame=0,1 do
 local a=im();r(a,12,8,2,34,'bark');r(a,12,8,1,34,'tan');r(a,11,6,4,3,'gold');r(a,14,10,22,23,'ink');r(a,15,11,20,20,'teal');r(a,16,12,18,2,'blue');r(a,16,29,18,1,'gold');for i=0,4 do r(a,15+i,31+i,20-2*i,1,'teal') end;layer(s,'Banner cloth and pole '..frame,a,frame)
 local b=im();if frame==0 then line(b,25,16,25,27,'light');for y=17,24,3 do line(b,25,y,20,y-2,'cream');line(b,25,y+1,29,y-1,'light') end else for d=-4,4 do r(b,25-math.floor((4-math.abs(d))/2),21+d,math.floor((4-math.abs(d))/2)*2+1,1,'light') end;dot(b,25,21,'cream') end;layer(s,'Crest '..frame,b,frame)
end
for frame=2,3 do
 local a=im();for y=25,29 do r(a,7,y,34,1,y%2==0 and 'wood' or 'tan') end;r(a,7,16,34,3,'bark');r(a,8,16,32,1,'light');r(a,8,20,32,3,'wood');r(a,9,20,30,1,'tan');for _,x in ipairs({10,36}) do r(a,x,18,3,20,'bark');r(a,x,18,1,19,'tan');r(a,x-1,36,6,2,'ink') end;line(a,8,29,39,29,'light');for _,x in ipairs({9,37}) do dot(a,x,17,'stone');dot(a,x,21,'stone') end;layer(s,'Garden carved timber '..frame,a,frame)
 local b=im();for _,x in ipairs({3,5,41,44}) do line(b,x,36,x,25,'leaf');for y=27,33,3 do line(b,x,y,x-2,y-2,'fern');line(b,x,y,x+2,y-1,'leaf') end;if frame==2 then r(b,x-1,23,3,3,'cream');dot(b,x,24,'gold') end end;layer(s,'Planting '..frame,b,frame)
end
local a=im();r(a,22,12,3,30,'bark');r(a,22,12,1,29,'tan');r(a,21,40,6,2,'stone');r(a,16,10,13,2,'wood');r(a,17,8,11,2,'dark');r(a,18,12,9,12,'ink');r(a,19,13,7,9,'gold');r(a,20,14,4,7,'light');r(a,21,15,2,5,'cream');r(a,17,23,11,3,'bark');r(a,18,23,9,1,'tan');r(a,22,12,1,11,'bark');layer(s,'Lantern metal glass and timber',a,4)
local a=im();for _,x in ipairs({8,36}) do r(a,x,12,3,31,'bark');r(a,x,13,1,29,'tan') end;r(a,5,10,37,23,'ink');r(a,6,11,35,21,'wood');r(a,8,13,31,16,'cream');r(a,9,14,29,14,'light');line(a,11,25,17,18,'teal');line(a,17,18,22,23,'teal');line(a,22,23,29,17,'teal');line(a,29,17,34,21,'teal');for _,x in ipairs({11,24,35}) do r(a,x,16,3,3,'rust') end;r(a,5,9,37,2,'tan');layer(s,'Noticeboard timber and illustrated map',a,5)
for frame=6,7 do
 local a=im();r(a,18,21,12,11,frame==6 and 'rust' or 'teal');r(a,19,22,9,2,frame==6 and 'tan' or 'blue');r(a,16,23,3,9,'skin');r(a,29,23,3,9,'skin');r(a,19,32,4,9,'dark');r(a,25,32,4,9,'dark');r(a,18,40,6,3,'bark');r(a,25,40,6,3,'bark');r(a,18,40,5,1,'tan');r(a,25,40,5,1,'tan');r(a,18,12,12,10,'skin');r(a,19,13,9,5,'skinlight');r(a,18,10,12,4,'hair');r(a,17,13,3,5,'hair');r(a,29,13,2,5,'hair');dot(a,22,17,'ink');dot(a,27,17,'ink');line(a,23,20,26,20,'rust');if frame==6 then r(a,17,10,15,2,'stone');r(a,19,7,10,3,'stone');r(a,21,26,7,9,'wood');line(a,24,24,24,32,'tan') else r(a,28,17,3,8,'hair');r(a,17,22,14,2,'gold');r(a,28,26,5,8,'bark') end;layer(s,frame==6 and 'Rowan - carpenter' or 'Mira - traveller',a,frame)
end
local a=im();r(a,5,27,37,4,'bark');r(a,6,26,35,2,'tan');r(a,9,31,3,11,'wood');r(a,35,31,3,11,'wood');r(a,13,20,8,6,'rust');r(a,14,19,6,2,'light');r(a,25,22,5,4,'cream');r(a,32,21,5,5,'cream');r(a,33,20,3,1,'gold');layer(s,'Gathering table bread and cups',a,8)
for frame=9,10 do local a=im();for i=0,6 do local x=8+i*4;local y=32-(i%3)*3;line(a,x,39,x+(frame-9),y,'leaf');for j=0,2 do line(a,x,y+j*2,x-3,y+j*2-2,'fern');line(a,x,y+j*2,x+3,y+j*2-1,'leaf') end end;layer(s,'Foliage key '..frame,a,frame) end
local a=im();for i=0,3 do r(a,20+i%2*2,26-i*5,4+i,2,'stone') end;layer(s,'Chimney wisp',a,11)
s:deleteLayer(initial);s:saveAs('art/source/chapter-props.aseprite');s:close()
for _,name in ipairs({'enamel','paper'}) do
 local s,initial=make(32,32);local base=Image(32,32,ColorMode.RGB);local edge=Image(32,32,ColorMode.RGB);local corners=Image(32,32,ColorMode.RGB)
 local bg=name=='paper' and '#f1dfb2' or '#193d33';local border=name=='paper' and '#a88850' or '#53725e'
 for y=0,31 do for x=0,31 do base:drawPixel(x,y,color(bg));if x==1 or y==1 or x==30 or y==30 then edge:drawPixel(x,y,color(border)) end;if (x==3 or x==28) and y>=3 and y<=28 or (y==3 or y==28) and x>=3 and x<=28 then edge:drawPixel(x,y,color(name=='paper' and '#d4bb83' or '#254d3d')) end end end
 for _,x in ipairs({2,26}) do for _,y in ipairs({2,26}) do for i=0,3 do corners:drawPixel(x+i,y,color('#d1a45b'));corners:drawPixel(x,y+i,color('#d1a45b')) end end end
 for _,v in ipairs({{'Surface',base},{'Inlaid border',edge},{'Brass corners',corners}}) do local l=s:newLayer();l.name=v[1];s:newCel(l,1,v[2]) end
 s:deleteLayer(initial);s:saveAs('art/source/ui-'..name..'.aseprite');s:close()
end
for _,name in ipairs({'pond','watchtower'}) do
 local src=Image{fromFile='art/direction/chapter-one/'..name..'.png'};local s,initial=make(320,200);local image=Image(320,200,ColorMode.RGB)
 for p in image:pixels() do p(src:getPixel(math.min(src.width-1,math.floor((p.x+.5)*src.width/320)),math.min(src.height-1,math.floor((p.y+.5)*src.height/200)))) end
 local l=s:newLayer();l.name='Generated landscape - flattened';s:newCel(l,1,image);s:deleteLayer(initial);s:saveAs('art/source/discovery-'..name..'.aseprite');s:close()
end
print('Created original layered props and nine-slice frames; landscapes are honestly flattened.')
