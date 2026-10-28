-- Targeted edits of the canonical keys; no new identity, pose catalogue or physique.
local pc=app.pixelColor;local W,H=96,128
local function inside(x,y,p)local hit=false;for i=1,#p do local a,b=p[i],p[i%#p+1];if(a[2]>y)~=(b[2]>y)and x<(b[1]-a[1])*(y-a[2])/(b[2]-a[2])+a[1]then hit=not hit end end;return hit end
local left={{22,49},{38,49},{39,62},{37,84},{22,85}};local right={{64,49},{75,48},{86,84},{68,84},{63,62}}
local function arm(x,y)return inside(x,y,left)and 1 or inside(x,y,right)and 2 or 0 end
local body=app.open('art/source/hero-body.aseprite')
for _,l in ipairs(body.layers)do local cel=l:cel(1);local source=Image(body.width,H,ColorMode.RGB);source:drawImage(cel.image,cel.position);local out=Image(source)
 for _,col in ipairs({7,8})do
  for y=0,H-1 do for x=0,W-1 do out:drawPixel(col*W+x,y,0)end end
  -- Registered torso, head, hair and pelvis remain untouched.
  for y=0,H-1 do for x=0,W-1 do local c=source:getPixel(x,y);if y<84 and arm(x,y)==0 then out:drawPixel(col*W+x,y,c)end end end
  for y=84,H-1 do for x=0,W-1 do local c=source:getPixel(x,y);if pc.rgbaA(c)>0 then
   local leg=x<51 and 1 or 2;local swinging=(col==7 and leg==2)or(col==8 and leg==1);local t=math.min(1,(y-84)/23);local dx=math.floor((swinging and 6 or -5)*t+.5);local dy=swinging and -math.floor(math.min(1,(y-84)/25)*4+.5)or 0
   if x+dx>=0 and x+dx<W and y+dy<H then out:drawPixel(col*W+x+dx,y+dy,c)end
  end end end
  for which=1,2 do local angle=math.rad(((col==7 and which==1)or(col==8 and which==2))and 16 or -16);local px,py=which==1 and 33 or 69,51;local co,si=math.cos(angle),math.sin(angle)
   for y=43,88 do for x=12,91 do local dx,dy=x-px,y-py;local sx,sy=math.floor(co*dx+si*dy+px+.5),math.floor(-si*dx+co*dy+py+.5)
    if sx>=0 and sx<W and sy>=0 and sy<H and arm(sx,sy)==which then local c=source:getPixel(sx,sy);if pc.rgbaA(c)>0 then out:drawPixel(col*W+x,y,c)end end
   end end
  end
  -- The far counter-swing passes behind the registered central shirt.
  for y=42,73 do for x=43,62 do out:drawPixel(col*W+x,y,source:getPixel(x,y))end end
 end;cel.image=out;cel.position=Point(0,0)
end
body:saveAs(body.filename);local posed=Image(body);body:close()
local gear=app.open('art/source/hero-equipment.aseprite')
for _,l in ipairs(gear.layers)do if l.name:find('cloak')then local cel=l:cel(1);local source=Image(gear.width,gear.height,ColorMode.RGB);source:drawImage(cel.image,cel.position);local out=Image(source)
 for row=0,1 do for _,col in ipairs({7,8})do for y=43,H-1 do for x=0,W-1 do if pc.rgbaA(posed:getPixel(col*W+x,y))>0 then out:drawPixel(col*W+x,row*H+y,0)end end end end end
 cel.image=out;cel.position=Point(0,0)
end end;gear:saveAs(gear.filename);gear:close()
for _,id in ipairs({'abdominal-bracing','pelvic-tilt','heel-slide','glute-bridge'})do
 local s=app.open('art/source/hero-core-'..id..'.aseprite');local exists=false;for _,l in ipairs(s.layers)do if l.name=='Shared mat and contact shadow'then exists=true end end
 if not exists then local image=Image(s);local bottom=0;for p in image:pixels()do if pc.rgbaA(p())>230 then bottom=math.max(bottom,p.y)end end
  local mat=Image(s.width,s.height,ColorMode.RGB);local width=id=='heel-slide'and 184 or 158;local y=math.min(122,bottom+1)
  for yy=y,math.min(127,y+4)do for x=8,width-4 do local c=yy==y and pc.rgba(52,84,84,255)or pc.rgba(37,64,65,255);mat:drawPixel(x,yy,c)end end
  for x=10,width-6 do mat:drawPixel(x,math.min(127,y+4),pc.rgba(72,105,102,255))end
  local base=s.layers[1];local l=s:newLayer();l.name='Shared mat and contact shadow';l.stackIndex=1;s:newCel(l,1,mat);s:saveAs(s.filename)
 end;s:close()
end
print('Enhanced registered stride/counter-swing and shared floor contact; exercise anatomy unchanged.')
