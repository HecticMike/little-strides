-- Structural redraw of the review-only character and room, never live assets.
local root='art/prototypes/comeback/'
if app.fs.isFile(root..'refinement.json') then error('Structural refinement already applied. Edit the Aseprite masters, do not rerun authoring.') end
if not app.fs.isFile(root..'v1-character.aseprite') or not app.fs.isFile(root..'v1-studio.aseprite') then error('Preserve the v1 masters before refinement.') end
local C={ink='243c42',hairDark='4b332c',hair='77503a',hairLight='aa7045',skinDark='b77353',skin='dc9b6c',skinLight='f4c48b',skinBright='ffe0ab',shirtDark='255559',shirt='397a76',shirtLight='65a394',shirtBright='91ba9f',shortDark='303943',short='48545a',shortLight='657078',shoeDark='527078',shoe='d5d7bf',shoeLight='fff0cc',matDark='386965',mat='56877b',matLight='7ca890',wall='ead9b9',wallLight='f7eacb',wallShadow='c9bda2',woodDark='8b6954',wood='b58a65',woodLight='d6aa79',woodSun='e5bd89',woodShade='a98060',leafDark='345850',leaf='54765b',leafLight='83a76a',sky='9fbeb1',glass='c3d6bd'}
local function colour(k) local h=C[k];return app.pixelColor.rgba(tonumber(h:sub(1,2),16),tonumber(h:sub(3,4),16),tonumber(h:sub(5,6),16),255) end
local sprite,layer,img,ox,oy
local function begin(name,x,y)
 layer=nil;for _,l in ipairs(sprite.layers) do if l.name==name then layer=l;break end end
 if not layer then layer=sprite:newLayer();layer.name=name end
 img=Image(sprite.width,sprite.height,ColorMode.RGB);ox=x or 0;oy=y or 0
end
local function px(x,y,k) if x+ox>=0 and x+ox<img.width and y+oy>=0 and y+oy<img.height then img:drawPixel(x+ox,y+oy,colour(k)) end end
local function rect(x,y,w,h,k) for yy=y,y+h-1 do for xx=x,x+w-1 do px(xx,yy,k) end end end
local function poly(p,k)
 local low,high=10000,-10000;for _,v in ipairs(p) do low=math.min(low,v[2]);high=math.max(high,v[2]) end
 for yy=low,high do local hit={};for i=1,#p do local a,b=p[i],p[i%#p+1];if (a[2]<=yy and b[2]>yy) or (b[2]<=yy and a[2]>yy) then hit[#hit+1]=a[1]+(yy-a[2])*(b[1]-a[1])/(b[2]-a[2]) end end;table.sort(hit);for i=1,#hit-1,2 do for xx=math.ceil(hit[i]),math.floor(hit[i+1]) do px(xx,yy,k) end end end
end
local function finish() local cel=layer:cel(1);if cel then cel.image=img;cel.position=Point(0,0) else sprite:newCel(layer,1,img,Point(0,0)) end end
local function stand(x,athletic)
 local tag=athletic and 'Developed' or 'Starting';local b=athletic and 2 or 0
 begin('Standing / '..tag..' / Far arm',x,0)
 poly({{30+b,22},{33+b,23},{34+b,27},{34,31},{33,35},{33,39},{31,41},{30,39},{31,34},{31,28}},'ink')
 poly({{31+b,23},{33+b,24},{33+b,28},{32,34},{32,39},{31,40},{31,37},{32,30}},'skin');rect(32+b,25,1,4,'skinLight');rect(32,34,1,4,'skinLight');px(31,39,'skinDark');finish()
 begin('Standing / '..tag..' / Legs',x,0)
 poly({{17,41},{24,41},{24,47},{23,51},{23,56},{22,59},{18,59},{17,56},{17,51},{16,47}},'ink')
 poly({{18,42},{23,42},{23,47},{22,51},{22,57},{19,58},{18,55},{18,50},{17,47}},'skin');rect(21,44,2,5,'skinLight');rect(19,51,2,4,'skinLight');rect(18,48,2,2,'skinDark');rect(18,56,1,2,'skinDark')
 poly({{26,41},{32,41},{33,47},{32,51},{32,57},{31,59},{27,59},{26,55},{27,50},{26,47}},'ink')
 poly({{27,42},{31,42},{32,47},{31,51},{31,58},{28,58},{27,55},{28,50},{27,47}},'skin');rect(30,43,2,5,'skinLight');rect(30,52,1,5,'skinLight');rect(27,49,2,2,'skinDark')
 if athletic then rect(17,44,1,4,'skin');rect(31,52,1,3,'skin') end;finish()
 begin('Standing / '..tag..' / Trainers',x,0)
 rect(18,56,5,3,'shoe');rect(28,56,4,3,'shoe');rect(18,56,4,1,'shoeLight');rect(28,56,3,1,'shoeLight')
 poly({{18,58},{23,58},{23,61},{15,61},{15,60}},'ink');poly({{28,58},{32,58},{34,60},{34,62},{26,62},{26,60}},'ink')
 rect(18,59,4,1,'shoe');rect(16,60,7,1,'shoe');rect(16,61,7,1,'shoeLight');rect(28,59,4,1,'shoe');rect(27,60,6,1,'shoeDark');rect(27,61,7,1,'shoeLight');px(20,59,'shoeDark');px(30,59,'shoeDark');finish()
 begin('Standing / '..tag..' / Shorts',x,0)
 poly({{18,34},{30,34},{32,38},{32,44},{26,45},{24,41},{23,45},{16,45},{16,40}},'ink')
 poly({{18,35},{29,35},{31,38},{31,43},{26,44},{24,39},{22,44},{17,44},{17,40}},'short');rect(18,35,12,2,'shortDark');rect(18,38,1,5,'shortLight');rect(18,43,4,1,'shortLight');rect(27,43,4,1,'shortLight');px(24,37,'shortLight');rect(28,38,2,4,'shortDark');finish()
 begin('Standing / '..tag..' / Shirt',x,0)
 poly({{21,16},{27,16},{31+b,18},{33+b,22},{31+b,25},{29,26},{29,30},{30,35},{18,36},{17,32},{17,26},{14-b,24},{15-b,19}},'ink')
 poly({{21,17},{27,17},{31+b,19},{32+b,22},{30+b,24},{28,25},{28,30},{29,34},{19,35},{18,31},{18,25},{15-b,23},{16-b,20}},'shirt')
 poly({{26,18},{30+b,19},{31+b,21},{28+b,23},{25,23},{26,21}},'shirtLight');rect(28+b,19,3,1,'shirtBright')
 poly({{17-b,21},{18,24},{19,26},{19,31},{21,34},{19,34},{18,30},{18,25},{15-b,23}},'shirtDark')
 rect(21,34,6,1,'shirtDark');px(27,31,'shirtLight');rect(20,18,2,1,'shirtLight')
 if athletic then rect(23,25,4,1,'shirtDark');rect(27,26,1,3,'shirtLight') else rect(23,31,4,1,'shirtLight') end;finish()
 begin('Standing / '..tag..' / Near arm',x,0)
 poly({{14-b,24},{18,25},{18,28},{17,31},{17,35},{18,38},{17,41},{14,41},{13,38},{13,33},{12-b,29},{12-b,26}},'ink')
 poly({{14-b,25},{17,26},{17,29},{16,31},{16,36},{17,38},{16,40},{14,39},{14,35},{14,32},{13-b,29},{13-b,27}},'skin')
 rect(15,26,2,3,'skinLight');rect(15,32,1,5,'skinLight');rect(14,37,1,2,'skinDark');px(16,39,'skinDark')
 if athletic then rect(13,27,2,3,'skin');px(14,30,'skinDark') end;finish()
 begin('Standing / Shared canonical head and neck / '..tag,x,0)
 rect(23,12,4,5,'skinDark');rect(24,13,3,4,'skin');px(26,15,'skinLight')
 poly({{21,5},{27,5},{29,8},{28,12},{26,15},{23,15},{20,12},{20,8}},'ink')
 poly({{22,6},{27,6},{28,8},{27,12},{25,14},{23,13},{21,11},{21,8}},'skin');rect(26,8,2,3,'skinLight');px(25,7,'skinLight');rect(22,11,1,2,'skinDark');rect(24,13,2,1,'skinDark');px(27,10,'skinBright')
 rect(22,8,2,1,'hairDark');rect(25,8,2,1,'hairDark');px(23,9,'ink');px(26,9,'ink');px(26,11,'skinDark');rect(24,12,2,1,'skinDark')
 poly({{20,5},{21,3},{24,3},{24,2},{27,3},{29,4},{29,7},{27,8},{25,6},{23,7},{22,9},{20,10},{19,7}},'hairDark')
 poly({{21,5},{22,4},{25,4},{25,3},{28,4},{28,6},{26,6},{24,5},{22,7},{20,7}},'hair');rect(25,4,2,1,'hairLight');px(27,5,'hairLight');px(22,5,'hairLight');finish()
end
local function floorpose(x,athletic)
 local tag=athletic and 'Developed' or 'Starting'
 begin('Heel slide / '..tag..' / Far bent leg',x,64)
 poly({{45,51},{51,49},{56,41},{60,36},{64,36},{67,41},{70,50},{72,55},{78,56},{80,58},{79,60},{69,60},{67,55},{64,47},{62,43},{58,49},{55,55},{49,58}},'ink')
 poly({{48,52},{52,50},{58,41},{61,38},{63,38},{65,42},{68,51},{70,56},{69,58},{67,53},{63,44},{62,41},{58,47},{54,54},{50,56}},'skin');poly({{52,51},{58,42},{60,40},{59,44},{55,52},{51,55}},'skinDark');rect(61,38,2,2,'skinLight');rect(65,44,1,3,'skinLight')
 poly({{69,55},{72,55},{73,57},{78,57},{79,58},{78,59},{69,59},{68,58}},'shoeDark');rect(70,56,3,2,'shoe');rect(70,58,9,1,'shoeLight');finish()
 begin('Heel slide / '..tag..' / Near sliding leg',x,64)
 poly({{47,51},{55,49},{62,46},{67,46},{72,49},{77,52},{85,55},{88,57},{87,60},{82,60},{74,57},{67,53},{63,53},{56,57},{49,58}},'ink')
 poly({{49,52},{56,50},{62,48},{66,48},{71,51},{76,54},{85,56},{86,58},{83,59},{75,56},{67,51},{63,51},{56,55},{50,57}},'skin');poly({{51,53},{57,51},{62,49},{66,49},{64,50},{57,54},{52,56}},'skinDark');rect(64,48,3,1,'skinLight');rect(77,55,5,1,'skinLight')
 if athletic then rect(57,50,4,1,'skinLight');rect(58,53,2,1,'skinDark') end;finish()
 begin('Heel slide / '..tag..' / Extended trainer',x,64)
 poly({{84,55},{86,53},{89,52},{90,53},{90,56},{94,57},{94,60},{86,61},{84,59}},'ink')
 poly({{85,56},{87,54},{89,54},{89,57},{93,58},{93,59},{87,60},{85,59}},'shoe');rect(87,55,2,1,'shoeLight');rect(86,59,7,1,'shoeLight');px(89,57,'shoeDark');finish()
 begin('Heel slide / '..tag..' / Shorts and pelvis',x,64)
 poly({{41,49},{48,49},{54,50},{56,53},{55,57},{50,59},{44,59},{40,57}},'ink');rect(42,50,7,7,'short');poly({{48,50},{53,51},{55,53},{54,56},{50,58},{48,57}},'shortDark');rect(43,51,1,5,'shortLight');rect(51,56,3,1,'shortLight');finish()
 begin('Heel slide / '..tag..' / Shirt',x,64)
 poly({{20,53},{23,49-(athletic and 1 or 0)},{27,47-(athletic and 1 or 0)},{32,47},{38,49},{43,49},{44,52},{43,57},{39,59},{24,59},{21,57}},'ink')
 poly({{22,53},{25,49-(athletic and 1 or 0)},{28,48-(athletic and 1 or 0)},{32,48},{38,50},{42,50},{43,52},{42,56},{39,58},{25,58},{22,56}},'shirt')
 poly({{28,49},{31,49},{37,51},{41,51},{41,52},{36,52},{31,50}},'shirtLight');rect(31,56,10,2,'shirtDark');rect(40,50,2,1,'shirtBright');rect(23,53,2,3,'shirtDark');finish()
 begin('Heel slide / '..tag..' / Near arm and hand',x,64)
 poly({{24,52},{28,52},{31,55},{36,56},{45,56},{49,57},{51,58},{50,60},{44,60},{35,59},{29,58},{26,57}},'ink')
 poly({{25,53},{28,53},{30,56},{36,57},{45,57},{49,58},{50,59},{44,59},{35,58},{29,57},{27,56}},'skin');rect(36,57,9,1,'skinLight');rect(46,58,3,1,'skinLight');px(48,59,'skinDark');if athletic then rect(26,53,2,2,'skinLight') end;finish()
 begin('Heel slide / Shared canonical profile head / '..tag,x,64)
 poly({{9,48},{12,46},{15,46},{17,45},{18,46},{17,49},{19,50},{19,52},{18,53},{20,55},{23,55},{24,58},{19,59},{12,59},{8,57},{6,54},{6,51}},'ink')
 poly({{11,48},{14,47},{16,47},{16,49},{18,51},{17,53},{19,56},{23,56},{23,57},{19,58},{13,58},{10,56},{8,53},{8,51}},'skin');rect(13,48,2,2,'skinLight');px(16,50,'skinLight');px(16,48,'hairDark');px(16,49,'ink');px(18,52,'skinDark');rect(19,56,3,1,'skinDark')
 poly({{8,49},{11,48},{12,50},{11,53},{13,56},{15,58},{11,58},{8,56},{6,53},{7,50}},'hairDark');rect(8,51,2,3,'hair');px(9,50,'hairLight');px(10,54,'hair');finish()
end
sprite=app.open(root..'character.aseprite')
stand(0,false);stand(48,true);floorpose(0,false);floorpose(96,true)
sprite:saveAs(root..'character.aseprite');sprite:close()
sprite=app.open(root..'studio.aseprite')
begin('Architecture / Floorboards')
rect(0,67,160,29,'wood')
local rows={{67,72,23},{72,79,3},{79,87,30},{87,96,11}}
for index,r in ipairs(rows) do
 local y0,y1,offset=r[1],r[2],r[3];rect(0,y0,160,1,'woodDark');rect(0,y0+1,160,1,'woodLight')
 for x0=offset,159,46 do for yy=y0+1,y1-1 do local xx=math.floor(80+(x0-80)*(yy-28)/(y0-28)+0.5);px(xx,yy,'woodDark') end end
 for x0=offset+7,150,46 do rect(x0,y0+3,14+(index%2)*5,1,'woodLight');if y1-y0>6 then rect(x0+5,y1-2,9,1,'woodShade') end end
end
finish()
begin('Window / Neighbourhood')
rect(91,9,54,45,'woodDark');rect(92,10,52,43,'wood');rect(94,12,48,39,'sky');rect(94,12,48,15,'glass')
poly({{94,34},{104,24},{115,34}},'woodDark');rect(96,34,18,16,'wallLight');rect(97,35,16,1,'wallShadow');rect(100,38,4,7,'wood');rect(108,37,4,6,'wood');rect(101,39,2,4,'sky');rect(109,38,2,3,'sky')
poly({{116,32},{127,20},{140,32}},'woodDark');poly({{119,30},{127,22},{136,30}},'wood');rect(120,32,19,18,'woodLight');rect(124,36,4,7,'shoeDark');rect(133,37,4,6,'shoeDark');rect(125,37,2,4,'sky');rect(134,38,2,3,'sky')
poly({{94,48},{98,44},{103,45},{106,43},{112,47},{119,45},{126,46},{131,44},{137,47},{142,46},{142,51},{94,51}},'leaf');rect(98,45,4,1,'leafLight');rect(107,44,3,1,'leafLight');rect(130,45,4,1,'leafLight');rect(116,49,5,1,'leafDark')
rect(117,11,3,41,'woodDark');rect(119,12,1,39,'woodLight');rect(93,29,50,3,'woodDark');rect(94,29,48,1,'woodLight');rect(92,52,54,3,'wood');rect(91,52,56,1,'woodLight');rect(93,55,51,1,'wallShadow');finish()
-- Preserve grain/seams inside the light plane, never place a wedge on the wall.
begin('Light / Authored sunlight planes')
local floorImage;for _,l in ipairs(sprite.layers) do if l.name=='Architecture / Floorboards' then floorImage=l:cel(1).image end end
for yy=68,86 do
 local t=(yy-68)/18;local left=math.floor(106-28*t);local right=math.floor(140-28*t)
 for xx=left,right do
  local v=floorImage:getPixel(xx,yy);local k='woodLight'
  if v==colour('woodDark') then k='wood' elseif v==colour('woodLight') then k='woodSun' elseif v==colour('woodShade') then k='wood' end
  local mullion=math.floor(122-28*t)
  if xx<mullion or xx>mullion+1 then px(xx,yy,k) end
 end
end
finish()
begin('Details / Shelf and folded towels')
rect(11,28,44,2,'wallShadow');rect(13,28,3,5,'woodDark');rect(49,28,3,5,'woodDark');rect(13,29,2,3,'wood');rect(49,29,2,3,'wood');rect(12,24,45,4,'woodDark');rect(12,24,45,1,'woodLight');rect(13,25,43,2,'wood')
rect(17,18,15,6,'shirtDark');rect(18,18,14,2,'shirt');rect(18,18,13,1,'shirtLight');rect(18,21,13,2,'shirt');rect(18,21,12,1,'shirtLight');rect(36,19,12,5,'wallShadow');rect(37,19,11,2,'shoe');rect(37,19,10,1,'shoeLight');rect(37,22,10,1,'shoe');finish()
begin('Details / Wall clock')
rect(67,12,12,12,'woodDark');rect(65,14,16,8,'woodDark');rect(67,13,12,10,'wallLight');rect(66,15,14,6,'wallLight');rect(67,14,1,7,'wallShadow');rect(72,14,1,5,'ink');rect(72,18,5,1,'ink');px(73,21,'wood');finish()
begin('Plant / Pot and foliage')
poly({{137,66},{151,66},{149,77},{139,77}},'woodDark');poly({{139,67},{150,67},{148,75},{140,75}},'wood');rect(146,68,2,6,'woodLight');rect(136,64,16,3,'woodDark');rect(137,64,14,1,'woodLight');rect(138,65,12,1,'wood')
poly({{141,64},{141,44},{144,36},{145,37},{143,45},{143,64}},'leafDark')
for _,p in ipairs({{{142,43},{138,38},{132,37},{131,40},{136,43}},{{143,40},{146,34},{151,33},{152,36},{148,40}},{{141,51},{135,46},{130,46},{131,50},{136,52}},{{143,50},{148,44},{153,44},{154,47},{149,51}},{{142,59},{136,55},{131,56},{133,60},{139,61}},{{143,58},{149,53},{153,54},{152,58},{148,60}}}) do poly(p,'leafDark');local cx,cy=0,0;for _,v in ipairs(p) do cx=cx+v[1];cy=cy+v[2] end;cx=math.floor(cx/#p);cy=math.floor(cy/#p);rect(cx,cy-1,3,2,'leaf');px(cx+2,cy-1,'leafLight') end;finish()
sprite:saveAs(root..'studio.aseprite');sprite:close()
local f=io.open(root..'refinement.json','w');f:write(json.encode({revision=2,kind='structural-native-pixel-refinement',lighting='window-upper-right',provisional=true,liveIntegrated=false}));f:close()
print('Refined the two proof masters structurally; live assets are untouched.')