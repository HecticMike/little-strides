-- One-time native drawing recipe. Exports never execute this file.
-- The original boot master is retained in art/archive and in Git history.
local existing=io.open("art/source/app-favicon.aseprite","rb");if existing then existing:close();error("Window masters already exist. Edit their layers and run art:export -- --branding.") end
local pc=app.pixelColor
local P={deep="#203b40",shade="#192f35",teal="#294b4d",edge="#142c31",wood="#936748",brown="#b38153",amber="#e5b365",gold="#f4ca7f",cream="#fff0c6",glass="#c9d6bc",warm="#eed8a3",ochre="#c99554"}
local function color(hex) return pc.rgba(tonumber(hex:sub(2,3),16),tonumber(hex:sub(4,5),16),tonumber(hex:sub(6,7),16),255) end
local function rect(im,x,y,w,h,key) for yy=y,y+h-1 do for xx=x,x+w-1 do if xx>=0 and yy>=0 and xx<im.width and yy<im.height then im:drawPixel(xx,yy,color(P[key])) end end end end
local function polygon(im,pts,key)
 for y=0,im.height-1 do local xs={};for i,a in ipairs(pts) do local b=pts[i%#pts+1];if (a[2]>y)~=(b[2]>y) then xs[#xs+1]=a[1]+(y-a[2])*(b[1]-a[1])/(b[2]-a[2]) end end;table.sort(xs);for i=1,#xs-1,2 do rect(im,math.ceil(xs[i]),y,math.floor(xs[i+1])-math.ceil(xs[i])+1,1,key) end end
end
local function layer(s,name,draw) local im=Image(s.width,s.height,ColorMode.RGB);draw(im);local l=s:newLayer();l.name=name;s:newCel(l,1,im,Point(0,0)) end
local function make(size) local s=Sprite(size,size,ColorMode.RGB);local first=s.layers[1];return s,first end
local s,first=make(64)
layer(s,"Background - deep teal",function(im) rect(im,0,0,64,64,"deep");rect(im,0,0,64,9,"teal");polygon(im,{{0,9},{64,9},{64,32},{0,53}},"teal") end)
layer(s,"Shadow - window and floor",function(im) polygon(im,{{19,16},{48,16},{53,48},{25,48}},"shade");polygon(im,{{0,55},{25,47},{59,57},{64,64},{0,64}},"shade") end)
layer(s,"Light - sunlit floor",function(im) polygon(im,{{20,39},{44,39},{55,53},{28,53}},"ochre");polygon(im,{{21,40},{43,40},{52,51},{28,51}},"amber");polygon(im,{{23,41},{29,41},{35,51},{29,51}},"gold");polygon(im,{{31,41},{34,41},{42,51},{39,51}},"wood");polygon(im,{{25,44},{47,44},{49,47},{27,47}},"brown") end)
layer(s,"Glass - warm daylight",function(im) rect(im,19,14,26,26,"warm");rect(im,20,15,23,10,"cream");rect(im,20,28,23,10,"gold");polygon(im,{{35,15},{43,15},{43,25},{27,25}},"warm");polygon(im,{{36,28},{43,28},{43,38},{25,38}},"amber");rect(im,20,35,6,3,"warm") end)
layer(s,"Window frame - oak",function(im) rect(im,17,12,30,2,"wood");rect(im,17,14,2,27,"wood");rect(im,45,14,2,27,"wood");rect(im,17,40,30,3,"wood");rect(im,19,14,1,26,"brown");rect(im,44,14,1,26,"brown");rect(im,30,14,3,26,"wood");rect(im,19,26,26,3,"wood");rect(im,14,42,36,3,"wood");rect(im,16,45,32,1,"edge") end)
layer(s,"Light - frame highlights",function(im) rect(im,17,12,29,1,"gold");rect(im,17,13,1,28,"amber");rect(im,30,14,1,26,"amber");rect(im,19,26,26,1,"amber");rect(im,14,42,36,1,"gold");rect(im,14,43,2,1,"amber");rect(im,19,39,26,1,"brown") end)
s:deleteLayer(first);s:saveAs("art/source/app-icon.aseprite");s:close()
-- Deliberately simpler 32px drawing, not a resampled export of the master.
local f,initial=make(32)
layer(f,"Background - deep teal",function(im) rect(im,0,0,32,32,"deep");polygon(im,{{0,0},{32,0},{32,15},{0,26}},"teal") end)
layer(f,"Shadow - window",function(im) rect(im,10,7,15,16,"shade") end)
layer(f,"Light - sunlit floor",function(im) polygon(im,{{10,20},{21,20},{27,26},{14,26}},"amber");polygon(im,{{15,20},{17,20},{21,26},{19,26}},"wood") end)
layer(f,"Glass - warm daylight",function(im) rect(im,10,7,12,12,"cream");rect(im,10,13,12,6,"gold");rect(im,19,14,3,5,"amber") end)
layer(f,"Window frame - oak",function(im) rect(im,8,6,16,1,"amber");rect(im,8,7,2,13,"wood");rect(im,22,7,2,13,"wood");rect(im,15,7,2,13,"wood");rect(im,10,12,12,2,"wood");rect(im,8,19,16,2,"wood");rect(im,7,21,18,1,"gold");rect(im,8,22,16,1,"wood") end)
layer(f,"Light - frame highlights",function(im) rect(im,8,7,1,12,"amber");rect(im,15,7,1,12,"amber");rect(im,10,12,12,1,"amber") end)
f:deleteLayer(initial);f:saveAs("art/source/app-favicon.aseprite");f:close()
print("Created layered native 64px window and independently drawn 32px favicon masters.")
