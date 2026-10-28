-- One-time registered correction of existing floor art. No new exercise/identity.
local pc=app.pixelColor;local W,H=192,128
local function inside(x,y,poly)
 local hit=false;for i=1,#poly do local a,b=poly[i],poly[i%#poly+1];if(a[2]>y)~=(b[2]>y)and x<(b[1]-a[1])*(y-a[2])/(b[2]-a[2])+a[1]then hit=not hit end end;return hit
end
local headPoly={{0,56},{45,56},{45,93},{43,98},{38,101},{35,109},{0,109}}
local armPoly={{48,96},{60,98},{73,102},{96,103},{102,106},{102,109},{88,110},{63,109},{49,105}}
local skinShades={};local colors={{155,91,64},{183,115,79},{213,143,97},{233,170,120},{247,193,140},{255,218,168}}
for i,c in ipairs(colors)do local dark=colors[math.max(1,i-1)];skinShades[pc.rgba(c[1],c[2],c[3],255)]=pc.rgba(dark[1],dark[2],dark[3],255)end
for _,id in ipairs({'abdominal-bracing','pelvic-tilt','heel-slide','glute-bridge'})do
 local s=app.open('art/source/hero-core-'..id..'.aseprite')
 for _,l in ipairs(s.layers)do assert(l.name~='Supine head - face and neck','Preserve the refined master; do not repeat this one-time edit.')end
 local original=Image(s);local saved={};for _,l in ipairs(s.layers)do local cel=l:cel(1);local image=Image(W,H,ColorMode.RGB);image:drawImage(cel.image,cel.position);saved[l.name]=image end
 local matTop=128;for p in saved['Shared mat and contact shadow']:pixels()do if pc.rgbaA(p())>0 then matTop=math.min(matTop,p.y)end end
 local floor=matTop-1;local headMask=function(x,y)return inside(x,y,headPoly)end
 local angle=math.rad(-15);local co,si=math.cos(angle),math.sin(angle);local clipped=0
 local face,contour=Image(W,H,ColorMode.RGB),Image(W,H,ColorMode.RGB)
 for _,l in ipairs(s.layers)do
  if l.name~='Shared mat and contact shadow'and l.name~='Adventurer cuffs'and l.name~='Veteran cuffs'then
   local source=saved[l.name];local remaining=Image(source);local moved=Image(W,H,ColorMode.RGB)
   for y=56,109 do for x=0,45 do if headMask(x,y)then remaining:drawPixel(x,y,0)end end end
   for y=56,119 do for x=0,55 do
    local dx,dy=x-43,y-98;local sx,sy=math.floor(co*dx+si*dy+43+.5),math.floor(-si*dx+co*dy+98+.5)
    if sx>=0 and sx<W and sy>=0 and sy<H and headMask(sx,sy)then
     local color=source:getPixel(sx,sy)
     if pc.rgbaA(color)>0 then if y<=floor then moved:drawPixel(x,y,color)else clipped=clipped+1 end end
    end
   end end
   if l.name=='Chestnut hair'then remaining:drawImage(moved)
   elseif l.name=='Skin and face'then face:drawImage(moved)
   else contour:drawImage(moved)end
   local cel=l:cel(1);cel.image=remaining;cel.position=Point(0,0)
  end
 end
 -- Separate the existing near arm as a complete part, not isolated extra fingers.
 local armMask={};local flesh=saved['Skin and face']
 for y=96,109 do for x=48,102 do if inside(x,y,armPoly)and pc.rgbaA(original:getPixel(x,y))>0 then
  for dy=-1,1 do for dx=-1,1 do if pc.rgbaA(flesh:getPixel(x+dx,y+dy))>0 then armMask[y*W+x]=true end end end
 end end end
 for _,layer in ipairs(s.layers)do if saved[layer.name]and layer.name~='Shared mat and contact shadow'and layer.name~='Adventurer cuffs'and layer.name~='Veteran cuffs'then
  local cel=layer:cel(1);local image=Image(W,H,ColorMode.RGB);image:drawImage(cel.image,cel.position)
  for key in pairs(armMask)do image:drawPixel(key%W,math.floor(key/W),0)end
  cel.image=image;cel.position=Point(0,0)
 end end
 local far,near=Image(W,H,ColorMode.RGB),Image(W,H,ColorMode.RGB)
 for key in pairs(armMask)do local x,y=key%W,math.floor(key/W);local color=original:getPixel(x,y);far:drawPixel(x,y-2,skinShades[color]or color)end
 local a=math.rad(8);local ac,as=math.cos(a),math.sin(a)
 for y=94,119 do for x=46,106 do
  local dx,dy=x-53,y-100;local sx,sy=math.floor(ac*dx+as*dy+53+.5),math.floor(-as*dx+ac*dy+100+.5)
  if sx>=0 and sx<W and sy>=0 and sy<H and armMask[sy*W+sx]then near:drawPixel(x,y,original:getPixel(sx,sy))end
 end end
 -- A shallow cloth plane makes the two resting-arm depths readable.
 local mat=Image(W,H,ColorMode.RGB);local width=id=='heel-slide'and 184 or 158
 for y=105,118 do local inset=y<108 and 6-(y-105)or 3
  for x=inset,width-inset do
   local color=pc.rgba(37,64,65,255)
   if (x+y*2)%17==0 then color=pc.rgba(52,84,84,255)end
   if y==105 or x==inset or x==width-inset then color=pc.rgba(52,84,84,255)end
   if y==118 then color=pc.rgba(16,38,41,255)end
   mat:drawPixel(x,y,color)
  end
 end
 for x=9,width-9,5 do mat:drawPixel(x,116,pc.rgba(72,105,102,255));mat:drawPixel(x+1,116,pc.rgba(72,105,102,255))end
 local matCel=s.layers[1]:cel(1);matCel.image=mat;matCel.position=Point(0,0)
 local support=Image(W,H,ColorMode.RGB);local shirt=saved['Teal training shirt']
 for x=40,54 do local bottom
  for y=109,96,-1 do if pc.rgbaA(shirt:getPixel(x,y))>0 and not headMask(x,y)then bottom=y;break end end
  if bottom and bottom>=103 then for y=bottom+1,floor do support:drawPixel(x,y,y==floor and pc.rgba(25,51,54,255)or shirt:getPixel(x,bottom))end end
 end
 local contact=Image(W,H,ColorMode.RGB)
 local function shadow(image,x0,x1,minY,maxY)
  for x=x0,x1 do local bottom
   for y=maxY,minY,-1 do if pc.rgbaA(image:getPixel(x,y))>0 then bottom=y;break end end
   if bottom and bottom+1>=105 and bottom+1<118 and pc.rgbaA(mat:getPixel(x,bottom+1))>0 then contact:drawPixel(x,bottom+1,pc.rgba(16,38,41,255))end
  end
 end
 shadow(near,57,106,104,116);shadow(far,57,106,104,109);shadow(saved['Trousers and footwear'],110,width-2,106,109)
 local scalp=Image(W,H,ColorMode.RGB);for _,l in ipairs(s.layers)do if l.name=='Chestnut hair'then scalp:drawImage(l:cel(1).image,l:cel(1).position)end end
 shadow(scalp,3,38,109,109);shadow(support,40,54,109,109)
 local function add(name,image,index)local layer=s:newLayer();layer.name=name;if index then layer.stackIndex=index end;s:newCel(layer,1,image,Point(0,0));return layer end
 add('Support contact shadows',contact,2);add('Far forearm - shaded depth',far,3);add('Upper-back support - shirt underside',support,4)
 add('Near forearm - separated',near);add('Supine head - face and neck',face);add('Supine head - collar and contour',contour)
 s:saveAs(s.filename);s:close();print(id..': registered head contact y='..floor..'; '..clipped..' support-line silhouette pixels trimmed.')
end
