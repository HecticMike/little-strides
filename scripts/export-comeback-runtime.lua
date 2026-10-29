-- Reuse the canonical imported masters; normal exports never recreate motion.
dofile('scripts/export-comeback-user-art.lua')
local root='art/prototypes/comeback/user-art/'
local heads=app.open(root..'heads.aseprite');local hi=Image(heads);heads:close()
local motion=app.open(root..'motion.aseprite');local atlas=Image(motion)
for stage=0,1 do local h=Image(96,128,ColorMode.RGB);h:drawImage(hi,Point(-stage*96,0));for frame=0,2 do atlas:drawImage(h,Point(frame*96,stage*128)) end end
atlas:saveAs('public/art/comeback-walk.png');atlas:saveAs(root..'walk.png');motion:close()
for _,entry in ipairs({{'character','comeback-character'},{'studio','comeback-room'}}) do local image=Image{fromFile=root..entry[1]..'.png'};image:saveAs('public/art/'..entry[2]..'.png') end
print('Exported approved comeback character, Sunlit room and registered walking atlas for runtime caching.')-- Derived review loop; edit motion.aseprite, not this GIF.
local review=Sprite(288,144,ColorMode.RGB);review.layers[1].name='Derived motion review'
for i,col in ipairs({1,0,2,0}) do
 if i>1 then review:newEmptyFrame() end;review.frames[i].duration=.16
 local im=Image(288,144,ColorMode.RGB);im:clear(app.pixelColor.rgba(245,237,221,255))
 for x=0,287 do im:drawPixel(x,132,app.pixelColor.rgba(185,199,185,255)) end
 for stage=0,1 do
  local pose=Image(96,128,ColorMode.RGB);pose:drawImage(atlas,Point(-col*96,-stage*128));im:drawImage(pose,Point(stage*144+48,8))
  for y=0,63 do for x=0,47 do local v=pose:getPixel(x*2+1,y*2+1);if app.pixelColor.rgbaA(v)>0 then im:drawPixel(stage*144+4+x,70+y,v) end end end
 end
 local cel=review.layers[1]:cel(i);if cel then cel.image=im else review:newCel(review.layers[1],i,im,Point(0,0)) end
end
review:saveAs(root..'walk-review.gif');review:close()

if app.fs.isFile(root..'march.aseprite') then dofile('scripts/export-comeback-march.lua') end

if app.fs.isFile(root..'supine-start.aseprite') then dofile('scripts/export-comeback-supine.lua') end

if app.fs.isFile(root..'bridge.aseprite') then dofile('scripts/export-comeback-bridge.lua') end

if app.fs.isFile(root..'calf.aseprite') then dofile('scripts/export-comeback-calf.lua') end
