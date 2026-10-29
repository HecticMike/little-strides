-- One-time, native-pixel authoring. Never imports/resamples the generated concept.
local root='art/prototypes/comeback/'
if app.fs.isFile(root..'character.aseprite') or app.fs.isFile(root..'studio.aseprite') then error('Proof masters already exist. Edit them in Aseprite; authoring never overwrites them.') end
local C={ink='243c42',dark='344d51',hairDark='4b332c',hair='77503a',hairLight='aa7045',skinDark='b77353',skin='dc9b6c',skinLight='f4c48b',skinBright='ffe0ab',shirtDark='255559',shirt='397a76',shirtLight='65a394',shirtBright='91ba9f',shortDark='303943',short='48545a',shortLight='657078',shoeDark='527078',shoe='d5d7bf',shoeLight='fff0cc',matDark='386965',mat='56877b',matLight='7ca890',wall='ead9b9',wallLight='f7eacb',wallShadow='c9bda2',woodDark='8b6954',wood='b58a65',woodLight='d6aa79',leafDark='345850',leaf='54765b',leafLight='83a76a',sky='9fbeb1',glass='c3d6bd'}
local function col(k) local h=C[k];return app.pixelColor.rgba(tonumber(h:sub(1,2),16),tonumber(h:sub(3,4),16),tonumber(h:sub(5,6),16),255) end
local sprite,layer,img,ox,oy
local function start(s,name,x,y) sprite=s;layer=s:newLayer();layer.name=name;img=Image(s.width,s.height,ColorMode.RGB);ox=x or 0;oy=y or 0 end
local function px(x,y,k) if x+ox>=0 and x+ox<img.width and y+oy>=0 and y+oy<img.height then img:drawPixel(x+ox,y+oy,col(k)) end end
local function rect(x,y,w,h,k) for j=y,y+h-1 do for i=x,x+w-1 do px(i,j,k) end end end
local function poly(p,k)
 local lo,hi=10000,-10000;for _,v in ipairs(p) do lo=math.min(lo,v[2]);hi=math.max(hi,v[2]) end
 for y=lo,hi do local hits={};for i=1,#p do local a,b=p[i],p[i%#p+1];if (a[2]<=y and b[2]>y) or (b[2]<=y and a[2]>y) then hits[#hits+1]=a[1]+(y-a[2])*(b[1]-a[1])/(b[2]-a[2]) end end;table.sort(hits);for i=1,#hits-1,2 do for x=math.ceil(hits[i]),math.floor(hits[i+1]) do px(x,y,k) end end end
end
local function finish() sprite:newCel(layer,1,img,Point(0,0)) end
local function upright(x,y,athletic)
 local broad=athletic and 2 or 0
 start(sprite,'Standing / '..(athletic and 'Developed' or 'Starting')..' / Far arm',x,y)
 poly({{29+broad,20},{33+broad,21},{35+broad,30},{35+broad,37},{33+broad,39},{31+broad,37},{31+broad,29}},'ink')
 poly({{30+broad,22},{33+broad,23},{34+broad,30},{34+broad,36},{32+broad,37},{32+broad,29}},'skinDark');rect(32+broad,25,2,8,'skin');finish()
 start(sprite,'Standing / '..(athletic and 'Developed' or 'Starting')..' / Legs',x,y)
 poly({{18,43},{25,43},{24,52},{23,59},{17,59},{17,53}},'ink');poly({{25,43},{31,43},{31,52},{33,59},{27,60},{25,53}},'ink')
 poly({{19,44},{24,44},{23,52},{22,59},{18,59},{19,52}},'skin');rect(19,47,2,7,'skinLight');rect(21,55,2,4,'skinDark')
 poly({{26,44},{30,44},{30,52},{32,59},{28,59},{27,52}},'skinDark');rect(27,46,2,8,'skin');px(28,49,'skinLight');finish()
 start(sprite,'Standing / '..(athletic and 'Developed' or 'Starting')..' / Trainers',x,y)
 poly({{17,57},{23,57},{23,61},{24,62},{14,62},{14,60}},'ink');poly({{27,57},{32,57},{33,60},{36,61},{36,62},{26,62}},'ink')
 rect(17,58,5,2,'shoe');rect(15,60,8,2,'shoe');rect(27,58,5,2,'shoe');rect(27,60,8,2,'shoeDark');rect(28,59,4,2,'shoe')
 rect(14,61,9,1,'shoeLight');rect(27,61,8,1,'shoe');rect(18,58,3,1,'shoeLight');px(20,59,'shoeDark');px(30,59,'shoeDark');finish()
 start(sprite,'Standing / '..(athletic and 'Developed' or 'Starting')..' / Shorts',x,y)
 poly({{18,36},{30,36},{32,45},{31,47},{25,47},{24,43},{23,47},{16,47},{16,44}},'ink');poly({{18,37},{29,37},{30,45},{26,46},{24,41},{22,46},{17,46}},'short')
 rect(18,39,3,5,'shortLight');rect(25,39,4,2,'shortDark');rect(18,36,11,2,'shortDark');rect(18,45,4,1,'shortLight');finish()
 start(sprite,'Standing / '..(athletic and 'Developed' or 'Starting')..' / Shirt',x,y)
 poly({{20,16},{27,16},{31+broad,18},{34+broad,24},{30+broad,26},{29,31},{30,37},{18,38},{16,34},{17,26},{13-broad,25},{15-broad,19}},'ink')
 poly({{20,17},{27,17},{31+broad,19},{33+broad,23},{29+broad,24},{28,30},{29,36},{19,37},{17,33},{18,24},{14-broad,24},{16-broad,20}},'shirt')
 poly({{20,18},{18,22},{18,28},{20,33},{20,36},{18,35},{17,32},{18,23},{15-broad,23},{17-broad,20}},'shirtLight')
 poly({{28+broad,22},{30+broad,24},{28,29},{29,35},{26,36},{26,31}},'shirtDark');rect(21,35,5,1,'shirtDark');rect(17-broad,20,3,1,'shirtBright')
 if athletic then rect(21,27,5,1,'shirtLight');rect(21,31,4,1,'shirtDark');rect(24,23,5,1,'shirtDark') else rect(20,32,5,1,'shirtLight') end
 finish()
 start(sprite,'Standing / '..(athletic and 'Developed' or 'Starting')..' / Near arm',x,y)
 poly({{14-broad,25},{18,26},{17,32},{17,37},{16,40},{13-broad,39},{12-broad,36},{12-broad,30}},'ink')
 poly({{14-broad,26},{17,27},{16,32},{16,37},{15,39},{13-broad,37},{13-broad,31}},'skin')
 rect(14-broad,27,2,6,'skinLight');rect(13-broad,34,2,3,'skinLight');rect(15,35,1,3,'skinDark');px(15,38,'skinDark')
 if athletic then rect(13,29,2,2,'skinBright') end;finish()
 start(sprite,'Standing / Shared canonical head and neck / '..(athletic and 'Developed' or 'Starting'),x,y)
 rect(21,14,6,4,'skinDark');rect(21,15,4,2,'skin');rect(21,17,5,1,'skinLight')
 poly({{19,6},{27,5},{30,8},{30,14},{28,17},{23,17},{19,14},{18,10}},'ink');rect(20,8,8,6,'skin');rect(21,13,6,3,'skin')
 rect(20,9,2,4,'skinLight');rect(23,8,4,2,'skinLight');rect(28,10,2,4,'skinDark');px(24,14,'skinDark');rect(24,15,3,1,'skinDark');px(25,12,'skinBright');px(26,12,'skin')
 rect(22,10,2,1,'hairDark');rect(26,10,2,1,'hairDark');px(23,11,'ink');px(27,11,'ink');px(22,11,'shoeLight');px(26,11,'shoeLight');px(28,13,'skin')
 poly({{18,5},{20,5},{20,3},{24,3},{24,2},{27,3},{29,3},{30,6},{29,9},{26,8},{24,7},{22,9},{20,9},{20,12},{18,11}},'hairDark')
 poly({{19,5},{22,4},{25,4},{25,3},{28,4},{29,6},{26,6},{24,5},{21,8},{19,8}},'hair');rect(21,4,3,1,'hairLight');px(20,6,'hairLight');rect(25,5,2,1,'hairLight');finish()
end
local function floorpose(x,y,athletic)
 local tag=athletic and 'Developed' or 'Starting'
 start(sprite,'Heel slide / '..tag..' / Far bent leg',x,y)
 poly({{44,52},{51,49},{60,36},{64,36},{72,54},{76,56},{75,59},{68,59},{64,49},{61,44},{55,57},{49,58}},'ink')
 poly({{48,52},{52,50},{61,38},{63,38},{69,53},{68,55},{64,47},{61,42},{54,56},{49,56}},'skinDark');poly({{52,50},{61,38},{63,39},{60,43},{54,52}},'skin');rect(60,38,3,2,'skinLight')
 poly({{69,54},{72,54},{73,56},{76,57},{75,58},{68,58}},'shoeDark');rect(70,55,3,2,'shoe');rect(68,58,8,1,'shoeLight');finish()
 start(sprite,'Heel slide / '..tag..' / Near sliding leg',x,y)
 poly({{47,51},{55,51},{64,53},{73,54},{86,55},{88,58},{85,60},{75,59},{63,58},{51,58}},'ink')
 poly({{49,52},{55,52},{64,54},{73,55},{85,56},{86,58},{77,58},{64,57},{51,57}},'skin');rect(57,53,6,1,'skinLight');rect(65,55,12,1,'skinLight');rect(65,57,13,1,'skinDark')
 if athletic then rect(53,53,6,1,'skinLight');rect(58,56,5,1,'skinDark') end;finish()
 start(sprite,'Heel slide / '..tag..' / Extended trainer',x,y)
 poly({{85,54},{88,52},{90,52},{91,55},{94,56},{94,59},{87,60},{85,58}},'ink');poly({{86,55},{88,53},{89,53},{90,56},{93,57},{93,58},{87,59}},'shoe');rect(88,54,1,2,'shoeLight');rect(87,58,6,1,'shoeLight');px(90,56,'shoeDark');finish()
 start(sprite,'Heel slide / '..tag..' / Shorts and pelvis',x,y)
 poly({{41,49},{49,49},{55,51},{55,58},{45,59},{40,57}},'ink');rect(42,50,7,7,'short');rect(49,51,5,6,'shortDark');rect(42,50,2,6,'shortLight');rect(45,57,8,1,'shortDark');finish()
 start(sprite,'Heel slide / '..tag..' / Shirt',x,y)
 poly({{19,51},{23,48-(athletic and 2 or 0)},{30,47-(athletic and 1 or 0)},{40,49},{44,49},{44,57},{40,59},{24,59},{20,57}},'ink')
 poly({{21,52},{24,49-(athletic and 2 or 0)},{30,48-(athletic and 1 or 0)},{40,50},{43,50},{43,56},{39,58},{24,58},{21,56}},'shirt')
 poly({{23,51},{26,49-(athletic and 2 or 0)},{31,49},{37,50},{36,51},{28,50},{24,53}},'shirtLight');rect(30,56,10,2,'shirtDark');rect(39,51,3,1,'shirtDark');finish()
 start(sprite,'Heel slide / '..tag..' / Near arm and hand',x,y)
 poly({{23,52},{27,52},{31,55},{40,55},{44,56},{45,58},{29,58},{25,57}},'ink')
 poly({{24,53},{27,53},{30,56},{41,56},{43,57},{29,57},{26,56}},'skin');rect(30,56,10,1,'skinLight');if athletic then rect(25,53,3,2,'skinLight') end;finish()
 start(sprite,'Heel slide / Shared canonical profile head / '..tag,x,y)
 poly({{9,48},{12,46},{15,46},{16,44},{18,46},{18,49},{21,51},{22,54},{21,57},{17,58},{10,58},{7,55},{7,51}},'ink')
 poly({{11,48},{14,47},{16,46},{17,47},{17,50},{20,52},{20,55},{18,57},{12,57},{9,54},{9,51}},'skin');rect(12,48,3,2,'skinLight');rect(16,51,2,2,'skinLight');px(16,48,'ink');px(18,51,'skinDark');rect(17,55,3,1,'skinDark')
 poly({{8,49},{11,48},{12,51},{11,55},{14,57},{11,58},{8,57},{6,54},{6,51}},'hairDark');rect(7,51,3,4,'hair');px(8,50,'hairLight');px(8,53,'hairLight');finish()
end
sprite=Sprite(192,128,ColorMode.RGB)
upright(0,0,false);upright(48,0,true);floorpose(0,64,false);floorpose(96,64,true)
sprite:saveAs(root..'character.aseprite');Image(sprite):saveAs(root..'character.png');sprite:close()
sprite=Sprite(160,96,ColorMode.RGB)
start(sprite,'Architecture / Wall and skirting');rect(0,0,160,96,'wall');rect(0,0,160,2,'wallLight');rect(0,63,160,4,'woodDark');rect(0,63,160,1,'woodLight');rect(0,61,160,2,'wallShadow');finish()
start(sprite,'Architecture / Floorboards');rect(0,67,160,29,'wood');for yy=68,95,7 do rect(0,yy,160,1,'woodDark');rect(0,yy+1,160,1,'woodLight');for xx=(yy%3)*13,159,36 do rect(xx,yy+2,1,5,'woodDark');rect(xx+3,yy+4,9,1,'woodLight') end end;finish()
start(sprite,'Window / Neighbourhood');rect(91,9,54,45,'woodDark');rect(93,11,50,41,'sky');rect(94,12,48,15,'glass');poly({{94,33},{104,23},{116,33}},'wallLight');rect(96,33,19,16,'wallLight');rect(101,37,4,7,'wood');rect(109,35,4,7,'wood');poly({{116,32},{127,19},{140,32}},'woodDark');rect(120,32,19,18,'woodLight');rect(124,36,4,7,'sky');rect(133,37,4,6,'sky');for xx=94,141,9 do rect(xx,47,9,4,'leaf');rect(xx+2,44,5,5,'leafLight') end;rect(117,10,3,43,'woodDark');rect(93,29,50,3,'woodDark');rect(92,52,54,3,'wood');rect(91,52,56,1,'woodLight');finish()
start(sprite,'Light / Authored sunlight planes');poly({{91,55},{116,55},{153,62},{160,62},{160,66},{110,66}},'wallLight');poly({{110,68},{150,68},{160,78},{160,86},{137,86}},'woodLight');finish()
start(sprite,'Details / Shelf and folded towels');rect(12,25,45,3,'woodDark');rect(13,24,44,2,'woodLight');rect(19,28,2,6,'wood');rect(50,28,2,6,'wood');rect(17,18,15,6,'shirt');rect(18,18,14,1,'shirtLight');rect(18,21,13,1,'shirtDark');rect(36,19,12,5,'shoe');rect(37,19,10,1,'shoeLight');rect(39,21,8,1,'wallShadow');finish()
start(sprite,'Details / Wall clock');rect(67,12,12,12,'woodDark');rect(65,14,16,8,'woodDark');rect(67,13,12,10,'wallLight');rect(66,15,14,6,'wallLight');rect(72,14,1,5,'ink');rect(72,18,5,1,'ink');px(73,21,'wood');finish()
start(sprite,'Plant / Pot and foliage');rect(137,65,14,12,'woodDark');rect(138,66,12,9,'wood');rect(136,64,16,3,'woodLight');rect(141,41,2,23,'leafDark');for _,v in ipairs({{131,43},{143,36},{133,52},{146,46},{144,56}}) do poly({{v[1],v[2]},{v[1]+5,v[2]-3},{v[1]+8,v[2]-1},{v[1]+6,v[2]+4},{v[1]+2,v[2]+3}},'leafDark');rect(v[1]+2,v[2]-1,4,3,'leaf');rect(v[1]+3,v[2]-1,2,1,'leafLight') end;finish()
start(sprite,'Training / Mat and contact shadow');poly({{15,79},{96,79},{113,91},{28,91}},'matDark');poly({{16,78},{96,78},{111,89},{28,89}},'mat');rect(28,88,81,1,'matLight');poly({{18,78},{95,78},{97,80},{21,80}},'matLight');finish()
sprite:saveAs(root..'studio.aseprite');Image(sprite):saveAs(root..'studio.png');sprite:close()
print('Created separate native-grid layered proof masters. No live artwork changed.')
