-- One-time exercise-only key-pose refinement; no standing/walking identity redraw.
local body=app.open('art/source/hero-body.aseprite')
local original=body.cels[1].image
local pc=app.pixelColor
local ink=pc.rgba(32,44,55,255)
local skin=pc.rgba(229,175,131,255)
local skinLight=pc.rgba(244,203,160,255)
local wood=pc.rgba(106,76,61,255)
local woodLight=pc.rgba(156,117,80,255)
local cream=pc.rgba(240,212,160,255)
if original:getPixel(3*48+47,12)~=cream then
  local output=Image(original)
  -- Slight whole-trunk inclination toward the contact wall, anchored at the feet.
  for y=0,42 do
    for x=0,45 do output:drawPixel(3*48+x,y,0) end
    local shift=y<24 and 3 or y<36 and 2 or 1
    for x=0,45-shift do output:drawPixel(3*48+x+shift,y,original:getPixel(3*48+x,y)) end
  end
  local function rect(x,y,w,h,color)for yy=y,y+h-1 do for xx=x,x+w-1 do output:drawPixel(3*48+xx,yy,color)end end end
  -- Visible bent elbow and flat hand contact; remain provisional pending review.
  rect(35,23,10,16,0)
  rect(34,28,6,6,ink);rect(35,29,4,4,skin);rect(35,29,2,1,skinLight)
  rect(38,26,7,6,ink);rect(39,27,5,4,skin);rect(39,27,4,1,skinLight)
  rect(43,21,3,10,ink);rect(44,22,2,8,skinLight)
  output:drawPixel(3*48+47,12,cream)
  -- Knees and boots follow the same stance instead of the original splayed legs.
  for y=50,63 do for x=0,47 do output:drawPixel(2*48+x,y,0)end end
  local function sq(x,y,w,h,color)for yy=y,y+h-1 do for xx=x,x+w-1 do output:drawPixel(2*48+xx,yy,color)end end end
  sq(13,50,8,5,ink);sq(14,50,6,4,wood);sq(13,53,6,7,ink);sq(14,54,4,5,woodLight)
  sq(26,50,8,5,ink);sq(28,53,6,7,ink);sq(27,50,6,4,wood);sq(29,54,4,5,woodLight)
  sq(11,59,11,4,ink);sq(27,59,11,4,ink);sq(12,59,7,1,woodLight);sq(28,59,7,1,woodLight);sq(11,62,11,1,cream);sq(27,62,11,1,cream)
  body.cels[1].image=output;body:saveAs('art/source/hero-body.aseprite')
  local equipment=app.open('art/source/hero-equipment.aseprite')
  local old=equipment.cels[1].image;local image=Image(old)
  for row=0,1 do for y=0,42 do
    for x=0,47 do image:drawPixel(3*48+x,row*64+y,0)end
    local shift=y<24 and 3 or y<36 and 2 or 1
    for x=0,47-shift do image:drawPixel(3*48+x+shift,row*64+y,old:getPixel(3*48+x,row*64+y))end
  end end
  equipment.cels[1].image=image;equipment:saveAs('art/source/hero-equipment.aseprite');equipment:close()
end
body:close()