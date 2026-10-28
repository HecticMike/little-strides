-- One-time Aseprite-native pixel drawing. Normal art:export preserves later edits.
local check=io.open("art/source/app-icon.aseprite","rb");if check then check:close();error("Interface masters exist. Edit them and use art:export.") end
local pc=app.pixelColor
local P={ink="#102629",deep="#112d26",pine="#183e34",teal="#255344",leaf="#447353",fern="#70905b",cream="#fff0c2",gold="#edbd66",light="#ffda88",brass="#b68142",bronze="#765135",wood="#805535",brown="#a46d40",leather="#c28c50",tan="#e1ad69",sole="#263b39",roof="#ac5740",rooflight="#e58752",paper="#eed8a3",paperlight="#fff0c2",blue="#77a59a"}
local function color(c) if c=="transparent" then return 0 end;return pc.rgba(tonumber(c:sub(2,3),16),tonumber(c:sub(4,5),16),tonumber(c:sub(6,7),16),255) end
local function pixel(im,x,y,c) if x>=0 and y>=0 and x<im.width and y<im.height then im:drawPixel(x,y,color(c)) end end
local function rect(im,x,y,w,h,c) for yy=y,y+h-1 do for xx=x,x+w-1 do pixel(im,xx,yy,c) end end end
local function line(im,x,y,x1,y1,c,w) local n=math.max(math.abs(x1-x),math.abs(y1-y),1);for i=0,n do local xx=math.floor(x+(x1-x)*i/n+.5);local yy=math.floor(y+(y1-y)*i/n+.5);rect(im,xx,yy,w or 1,w or 1,c) end end
local function poly(im,points,c)
 local lo,hi=10000,-10000;for _,p in ipairs(points) do lo=math.min(lo,p[2]);hi=math.max(hi,p[2]) end
 for y=lo,hi do local xs={};for i,a in ipairs(points) do local b=points[i%#points+1];if (a[2]>y)~=(b[2]>y) then xs[#xs+1]=a[1]+(y-a[2])*(b[1]-a[1])/(b[2]-a[2]) end end;table.sort(xs);for i=1,#xs-1,2 do for x=math.ceil(xs[i]),math.floor(xs[i+1]) do pixel(im,x,y,c) end end end
end
local function ellipse(im,x,y,rx,ry,c) for yy=-ry,ry do for xx=-rx,rx do if xx*xx/(rx*rx)+yy*yy/(ry*ry)<=1 then pixel(im,x+xx,y+yy,c) end end end end
local function make(w,h) local s=Sprite(w,h,ColorMode.RGB);return s,s.layers[1] end
local function layer(s,name,im) local l=s:newLayer();l.name=name;s:newCel(l,1,im,Point(0,0));return l end
local function img(w,h) return Image(w,h,ColorMode.RGB) end
local function star(im,x,y,c) line(im,x-2,y,x+2,y,c);line(im,x,y-2,x,y+2,c);pixel(im,x,y,P.cream) end
local s,initial=make(64,64)
local bg=img(64,64)
for y=0,63 do for x=0,63 do
 local step=math.min(6,math.floor(math.sqrt((x-22)^2+(y-16)^2)/9));local r,g,b=24-step,57-step*3,47-step*2
 bg:drawPixel(x,y,pc.rgba(r,g,b,255));if (x*11+y*7)%67==0 then bg:drawPixel(x,y,pc.rgba(r+3,g+5,b+3,255)) end
end end
layer(s,"Forest enamel",bg)
local rim=img(64,64)
poly(rim,{{12,3},{51,3},{60,12},{60,51},{51,60},{12,60},{3,51},{3,12}},P.ink)
poly(rim,{{13,5},{50,5},{58,13},{58,50},{50,58},{13,58},{5,50},{5,13}},P.bronze)
poly(rim,{{14,6},{49,6},{57,14},{57,49},{49,57},{14,57},{6,49},{6,14}},P.gold)
poly(rim,{{15,8},{48,8},{55,15},{55,48},{48,55},{15,55},{8,48},{8,15}},P.teal)
poly(rim,{{16,9},{47,9},{54,16},{54,47},{47,54},{16,54},{9,47},{9,16}},"transparent")
line(rim,14,6,47,6,P.cream);line(rim,6,15,6,45,P.light);line(rim,16,57,48,57,P.brass);line(rim,57,17,57,48,P.brass)
for _,p in ipairs({{11,11},{52,11},{11,52},{52,52}}) do rect(rim,p[1]-1,p[2]-1,3,3,P.bronze);pixel(rim,p[1],p[2],P.cream) end
layer(s,"Brass frame",rim)
local path=img(64,64)
poly(path,{{29,53},{24,51},{30,44},{35,38},{28,30},{25,23},{30,17},{33,11},{37,11},{34,20},{32,25},{38,33},{42,39},{36,47}},P.bronze)
poly(path,{{29,51},{27,50},{34,42},{37,38},{30,29},{28,23},{33,17},{34,12},{36,12},{32,23},{36,30},{40,38},{35,46}},P.gold)
for _,p in ipairs({{30,47},{35,42},{35,34},{31,25},{33,19}}) do rect(path,p[1],p[2],2,1,P.cream) end
layer(s,"Golden trail",path)
local leaves=img(64,64)
for _,p in ipairs({{13,30},{50,43}}) do local x,y=p[1],p[2];line(leaves,x,y-7,x,y+7,P.fern);poly(leaves,{{x,y-2},{x-4,y-6},{x-4,y-2},{x,y+1}},P.leaf);poly(leaves,{{x,y+2},{x+4,y-2},{x+4,y+2},{x,y+5}},P.leaf);pixel(leaves,x-3,y-3,P.fern);pixel(leaves,x+3,y+1,P.fern) end
layer(s,"Fern details",leaves)
local rear=img(64,64)
poly(rear,{{37,17},{45,17},{46,24},{48,27},{51,29},{52,33},{50,36},{37,36},{35,34},{35,29}},P.ink)
poly(rear,{{38,19},{44,19},{44,26},{48,29},{50,30},{50,33},{48,34},{38,34},{37,32},{37,28}},P.wood)
poly(rear,{{39,20},{43,20},{43,26},{46,29},{49,30},{49,32},{39,32},{38,30}},P.brown)
rect(rear,38,18,7,3,P.sole);rect(rear,39,19,5,1,P.blue);line(rear,39,22,39,27,P.tan);line(rear,39,28,47,31,P.leather)
line(rear,38,34,49,34,P.brass);line(rear,38,35,49,35,P.sole);rect(rear,42,23,3,2,P.gold);pixel(rear,43,23,P.cream);pixel(rear,43,24,P.wood)
for y=26,30,2 do line(rear,40,y,43,y+1,P.tan) end
layer(s,"Stride - rear boot",rear)
local front=img(64,64)
poly(front,{{20,27},{29,27},{30,33},{33,37},{37,39},{39,43},{38,47},{34,50},{20,50},{16,47},{16,42},{18,36}},P.ink)
poly(front,{{21,29},{28,29},{28,34},{31,38},{36,40},{37,43},{36,46},{33,48},{21,48},{18,46},{18,42},{20,36}},P.wood)
poly(front,{{22,31},{27,31},{27,35},{29,38},{34,40},{35,43},{33,45},{22,45},{20,43},{21,37}},P.brown)
poly(front,{{22,36},{24,35},{25,39},{31,41},{33,43},{23,43},{21,42}},P.leather)
rect(front,20,28,9,3,P.sole);rect(front,21,29,6,1,P.blue);line(front,21,33,20,39,P.tan)
line(front,20,47,33,47,P.brass);line(front,20,49,33,49,P.sole);line(front,34,46,37,44,P.leather)
for y=33,39,2 do line(front,24,y,28,y+1,P.tan);pixel(front,25,y,P.paperlight) end
rect(front,28,32,3,3,P.gold);pixel(front,29,33,P.wood);pixel(front,28,32,P.cream)
layer(s,"Stride - front boot",front)
local glints=img(64,64);star(glints,21,17,P.gold);pixel(glints,47,44,P.light);pixel(glints,17,22,P.fern);layer(s,"Glints",glints)
s:deleteLayer(initial);s:saveAs("art/source/app-icon.aseprite");s:close()
-- Native-size 24px UI glyphs. Each object stays independently editable.
local ui,old=make(192,24)
local function glyph(index,name,draw) local t=img(24,24);draw(t);local full=img(192,24);full:drawImage(t,Point(index*24,0));layer(ui,name,full) end
glyph(0,"Today - walking boots",function(t)
 ellipse(t,12,21,9,1,P.ink)
 poly(t,{{5,9},{10,9},{10,13},{13,16},{13,19},{5,19},{3,17},{4,13}},P.ink);rect(t,5,10,4,6,P.wood);poly(t,{{5,14},{9,14},{12,16},{11,18},{5,18}},P.brown);line(t,5,18,11,18,P.gold);rect(t,6,10,2,1,P.blue);line(t,6,12,8,13,P.tan)
 poly(t,{{14,3},{19,3},{19,8},{22,11},{22,14},{14,14},{12,12},{13,8}},P.ink);rect(t,14,4,4,6,P.wood);poly(t,{{14,8},{18,8},{21,11},{20,13},{14,13}},P.leather);line(t,14,13,20,13,P.gold);rect(t,15,4,2,1,P.blue);line(t,15,6,17,7,P.tan);star(t,6,4,P.gold)
end)
glyph(1,"Village - hearth cottage",function(t)
 ellipse(t,12,21,11,1,P.ink);rect(t,4,10,16,11,P.ink);rect(t,5,11,14,9,P.paper);rect(t,5,18,14,2,P.brass);rect(t,16,2,3,6,P.wood)
 poly(t,{{1,10},{11,2},{13,2},{23,10},{21,12},{3,12}},P.ink);poly(t,{{3,10},{12,3},{21,10}},P.roof);line(t,7,7,17,7,P.rooflight);line(t,5,9,19,9,P.brass);pixel(t,12,4,P.paper)
 rect(t,10,13,5,7,P.wood);rect(t,11,14,3,6,P.brown);pixel(t,13,17,P.gold);rect(t,6,13,3,4,P.ink);rect(t,7,14,1,2,P.light);rect(t,16,13,3,4,P.ink);rect(t,17,14,1,2,P.light);line(t,5,11,5,19,P.wood);line(t,19,11,19,19,P.wood);rect(t,8,20,9,1,P.fern);pixel(t,3,20,P.leaf);pixel(t,20,19,P.fern)
end)
glyph(2,"Journal - leather field book",function(t)
 poly(t,{{4,3},{18,2},{21,4},{21,20},{6,22},{3,20},{3,5}},P.ink);poly(t,{{5,4},{18,3},{20,5},{20,19},{6,21},{4,19},{4,6}},P.wood);rect(t,7,5,11,14,P.paper);line(t,8,5,17,5,P.paperlight);rect(t,5,5,2,14,P.brass);line(t,8,18,17,18,P.tan);rect(t,16,4,2,7,P.teal);pixel(t,16,11,P.blue)
 for y=8,15,3 do line(t,9,y,14,y,P.brass) end;rect(t,18,12,2,3,P.bronze);pixel(t,18,13,P.gold);line(t,5,20,18,20,P.brass)
end)
glyph(3,"Settings - brass mechanism",function(t)
 poly(t,{{8,2},{15,2},{16,5},{19,5},{20,8},{23,9},{23,15},{20,16},{19,19},{16,19},{15,22},{8,22},{7,19},{4,19},{3,16},{0,15},{0,9},{3,8},{4,5},{7,5}},P.ink)
 for _,r in ipairs({{9,3,5,4},{9,17,5,4},{1,10,5,4},{18,10,4,4},{4,5,4,4},{16,5,4,4},{4,16,4,4},{16,16,4,4}}) do rect(t,r[1],r[2],r[3],r[4],P.brass) end
 ellipse(t,11,12,8,8,P.gold);ellipse(t,11,12,6,6,P.brass);ellipse(t,11,12,4,4,P.ink);ellipse(t,11,12,2,2,P.teal);line(t,7,6,13,5,P.paperlight);pixel(t,6,7,P.paperlight);pixel(t,17,15,P.bronze);pixel(t,9,3,P.light)
end)
glyph(4,"Progress - stride medal",function(t)
 poly(t,{{5,2},{10,2},{13,15},{8,21},{6,15}},P.ink);poly(t,{{13,2},{18,2},{16,15},{12,21},{10,14}},P.ink);rect(t,7,3,3,10,P.teal);rect(t,14,3,3,10,P.roof);ellipse(t,12,14,8,8,P.ink);ellipse(t,12,13,7,7,P.brass);ellipse(t,12,13,5,5,P.gold);ellipse(t,12,13,3,3,P.wood);line(t,11,10,10,14,P.paperlight);line(t,13,12,12,16,P.paper);pixel(t,9,8,P.paperlight);line(t,9,19,15,18,P.bronze)
end)
glyph(5,"Stage - guild shield",function(t)
 poly(t,{{3,2},{20,2},{21,12},{18,18},{12,23},{5,18},{2,12}},P.ink);poly(t,{{4,3},{19,3},{19,12},{16,17},{12,20},{7,17},{4,12}},P.brass);poly(t,{{6,5},{17,5},{17,11},{15,15},{12,17},{8,15},{6,11}},P.teal);line(t,5,4,18,4,P.paperlight);line(t,5,5,5,11,P.gold);star(t,12,10,P.gold);pixel(t,12,15,P.paperlight);pixel(t,6,15,P.gold);pixel(t,17,15,P.bronze)
end)
glyph(6,"Timber - bound oak logs",function(t)
 poly(t,{{2,10},{7,6},{16,6},{22,11},{22,18},{17,22},{7,22},{1,17}},P.ink);poly(t,{{4,10},{8,7},{16,7},{21,11},{17,15},{7,15}},P.brown);poly(t,{{3,12},{8,16},{17,16},{21,13},{21,18},{17,21},{7,21},{2,17}},P.wood)
 for _,p in ipairs({{6,12},{12,9},{17,15}}) do ellipse(t,p[1],p[2],4,4,P.ink);ellipse(t,p[1],p[2],3,3,P.tan);ellipse(t,p[1],p[2],1,2,P.brown);pixel(t,p[1]-1,p[2]-1,P.paper) end
 line(t,9,15,13,20,P.cream,2);line(t,13,6,17,11,P.cream,2);line(t,10,15,14,20,P.brass);pixel(t,5,20,P.brown)
end)
glyph(7,"Garden - golden wildflower",function(t)
 rect(t,11,10,2,12,P.leaf);line(t,11,13,7,16,P.fern,2);line(t,12,18,18,15,P.fern,2);line(t,12,13,12,21,P.fern)
 for _,p in ipairs({{12,3},{18,7},{16,13},{7,13},{6,6}}) do ellipse(t,p[1],p[2],3,3,P.gold);pixel(t,p[1]-1,p[2]-1,P.paperlight) end
 ellipse(t,12,9,4,4,P.brass);ellipse(t,12,9,2,2,P.cream);pixel(t,13,10,P.tan)
end)
ui:deleteLayer(old);ui:saveAs("art/source/icons.aseprite");ui:close()
print("Created layered launcher emblem and eight native-size UI glyphs.")
