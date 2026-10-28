-- One-time, review-only body study. Never modifies a live master.
local target='art/prototypes/progression/hero-progression.aseprite'
if app.fs.isFile(target) then error('Prototype exists. Edit its layers; normal export preserves it.') end
local pc=app.pixelColor
local function full(layer,w,h)
 local out=Image(w,h,ColorMode.RGB);local c=layer:cel(1)
 if c then out:drawImage(c.image,c.position) end;return out
end
local body=app.open('art/source/hero-body.aseprite')
local palette=Palette(#body.palettes[1]);for i=0,#palette-1 do palette:setColor(i,body.palettes[1]:getColor(i)) end
local originals={};for _,l in ipairs(body.layers) do originals[l.name]=full(l,960,128) end
body:close()
local function strength(y)
 if y<38 or y>=84 then return 0 end
 if y<44 then return (y-38)/6 end
 if y<=55 then return 1 end
 if y<70 then return (70-y)/15 end
 return 0
end
-- Monotone row mapping preserves height, all joint heights and original texture/light.
-- Hands retain their source width; opening the shoulders translates them gently.
local function sourceX(x,y,pose)
 if y<38 or y>=84 then return x end
 local d=x-52;local a=math.abs(d);local sign=d<0 and -1 or 1
 local expansion=.22*strength(y)
 local shift=0
 if a>17 and y>=60 then shift=1.5*math.min(1,(y-60)/10) end
 if pose==1 and x<42 and y>=53 and y<=67 then
  -- Keep the raised fist/fingers at their approved size rather than inflating them.
  return x+3
 end
 return 52+sign*math.max(0,(a-shift)/(1+expansion))
end
local function reshape(src,pose)
 local out=Image(96,128,ColorMode.RGB)
 for y=0,127 do for x=0,95 do
  local sx=math.floor(sourceX(x,y,pose)+.5)
  if sx>=0 and sx<96 then out:drawPixel(x,y,src:getPixel(sx,y)) end
 end end;return out
end
local function sheet(src,kind,rowSource)
 local out=Image(192,256,ColorMode.RGB)
 for row=0,1 do for pose=0,1 do
  local r=kind=='body' and 0 or (kind=='adventure' and 1 or (kind=='control' and 0 or (row==0 and 0 or 2)))
  local frame=Image(src,Rectangle(pose*96,r*128,96,128))
  if row==1 then frame=reshape(frame,pose) end
  if kind~='adventure' or row==1 then out:drawImage(frame,Point(pose*96,row*128)) end
 end end;return out
end
local function rgb(r,g,b)return pc.rgba(r,g,b,255) end
local lights={ [rgb(36,80,78)]=rgb(50,101,95),[rgb(50,101,95)]=rgb(67,121,112),[rgb(52,84,84)]=rgb(72,105,102) }
local shadows={ [rgb(50,101,95)]=rgb(36,80,78),[rgb(67,121,112)]=rgb(50,101,95) }
local outfit=sheet(originals['Outfit and boots'],'body')
-- Small cloth clusters suggest an opened chest; no painted six-pack or bare-skin torso.
for pose=0,1 do for y=44,64 do for x=38,66 do
 local c=outfit:getPixel(pose*96+x,128+y)
 local chest=((x-46)/10)^2+((y-48)/4)^2<1
 local flank=y>=58 and ((x>=39 and x<=42) or (x>=62 and x<=64))
 if chest and lights[c] then outfit:drawPixel(pose*96+x,128+y,lights[c])
 elseif flank and shadows[c] then outfit:drawPixel(pose*96+x,128+y,shadows[c]) end
end end end
local gear=app.open('art/source/hero-equipment.aseprite')
local cloak=sheet(full(gear.layers[1],960,256),'adventure')
local pack=sheet(full(gear.layers[2],960,256),'adventure')
local scarf=sheet(full(gear.layers[3],960,256),'adventure');gear:close()
local training=app.open('art/source/hero-training-outfit.aseprite')
local cuffs=sheet(full(training.layers[1],960,384),'training')
local accents=sheet(full(training.layers[2],960,384),'training')
local control=Image(192,256,ColorMode.RGB)
for _,l in ipairs(training.layers) do control:drawImage(sheet(full(l,960,384),'control'),Point(0,0)) end
training:close()
local s=Sprite(192,256,ColorMode.RGB);s:setPalette(palette)
local entries={
 {'Adventure - cloak behind body',cloak,true},
 {'Body - outfit and boots',outfit,true},
 {'Body - skin and face',sheet(originals['Skin and face'],'body'),true},
 {'Body - canonical chestnut hair',sheet(originals['Chestnut hair'],'body'),true},
 {'Adventure - pack and straps',pack,true},{'Adventure - scarf',scarf,true},
 {'Workout - soft cuffs',cuffs,false},{'Workout - stage seams',accents,false},
 {'Control - identical Beginner workout trim',control,false}
}
for i,e in ipairs(entries) do
 local l;if i==1 then l=s.layers[1];s.cels[1].image=e[2] else l=s:newLayer();s:newCel(l,1,e[2],Point(0,0)) end
 l.name=e[1];l.isVisible=e[3]
end
s:saveAs(target);s:close()
print('Separate two-pose progression master created; live masters untouched.')