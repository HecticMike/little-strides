local s=app.open("art/source/icons.aseprite");assert(s.width==168,"Garden frame already appended or unexpected UI atlas")
local out=Sprite(192,24,ColorMode.RGB);local initial=out.layers[1]
for _,layer in ipairs(s.layers) do local n=out:newLayer();n.name=layer.name;local cel=layer:cel(1);if cel then out:newCel(n,1,Image(cel.image),cel.position) end end
local pc=app.pixelColor
local colors={leaf={68,115,83},fern={112,144,91},gold={237,189,102},paper={255,240,194},brass={182,129,66},tan={225,173,105}}
local image=Image(192,24,ColorMode.RGB)
local function px(x,y,name) local c=colors[name];image:drawPixel(168+x,y,pc.rgba(c[1],c[2],c[3],255)) end
local function rect(x,y,w,h,c) for yy=y,y+h-1 do for xx=x,x+w-1 do px(xx,yy,c) end end end
local function line(x,y,x1,y1,c,w) local n=math.max(math.abs(x1-x),math.abs(y1-y),1);for i=0,n do rect(math.floor(x+(x1-x)*i/n+.5),math.floor(y+(y1-y)*i/n+.5),w or 1,w or 1,c) end end
local function ellipse(x,y,rx,ry,c) for yy=-ry,ry do for xx=-rx,rx do if xx*xx/(rx*rx)+yy*yy/(ry*ry)<=1 then px(x+xx,y+yy,c) end end end end
rect(11,10,2,12,"leaf");line(11,13,7,16,"fern",2);line(12,18,18,15,"fern",2);line(12,13,12,21,"fern")
for _,p in ipairs({{12,3},{18,7},{16,13},{7,13},{6,6}}) do ellipse(p[1],p[2],3,3,"gold");px(p[1]-1,p[2]-1,"paper") end
ellipse(12,9,4,4,"brass");ellipse(12,9,2,2,"paper");px(13,10,"tan")
local l=out:newLayer();l.name="Garden - golden wildflower";out:newCel(l,1,image,Point(0,0));out:deleteLayer(initial);out:saveAs("art/source/icons.aseprite");out:close();s:close()
