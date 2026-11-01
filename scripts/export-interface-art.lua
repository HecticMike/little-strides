-- Read-only export of the editable branding masters. Never redraws source pixels.
local pc=app.pixelColor
local records={}
local function q(s) return '"'..s:gsub('\\','\\\\'):gsub('"','\\"')..'"' end
local function inventory(s,id)
 local names,counts={},{}
 for _,l in ipairs(s.layers) do names[#names+1]=q(l.name);local count=0;local cel=l:cel(1);assert(cel,"Every branding layer needs editable pixels");for p in cel.image:pixels() do if pc.rgbaA(p())>0 then count=count+1 end end;assert(count>0,"Empty branding layer");counts[#counts+1]=count end
 records[#records+1]='{"asset":'..q(id)..',"width":'..s.width..',"height":'..s.height..',"mode":"RGBA","layers":['..table.concat(names,",")..'],"visiblePixels":['..table.concat(counts,",")..']}'
end
local s=app.open("art/source/app-icon.aseprite")
assert(s.width==64 and s.height==64,"Launcher master must remain 64x64 logical pixels")
local maxDistance=0
for _,l in ipairs(s.layers) do if l.name=="Window frame - oak" or l.name=="Glass - warm daylight" or l.name=="Light - frame highlights" then local cel=l:cel(1);for p in cel.image:pixels() do if pc.rgbaA(p())>0 then local x,y=p.x+cel.position.x+.5-32,p.y+cel.position.y+.5-32;maxDistance=math.max(maxDistance,math.sqrt(x*x+y*y)) end end end end
assert(maxDistance>0 and maxDistance<=25.6,"Essential window must fit Android maskable safe circle")
local function png(sprite,size,path)
 local source=Image(sprite);local output=Image(size,size,ColorMode.RGB)
 for p in output:pixels() do local value=source:getPixel(math.floor(p.x*sprite.width/size),math.floor(p.y*sprite.height/size));assert(pc.rgbaA(value)==255,"Launcher background must be completely opaque");p(value) end
 output:saveAs(path)
end
png(s,192,"public/icons/strides-192.png");png(s,512,"public/icons/strides-512.png");png(s,180,"public/icons/strides-apple-touch.png")
png(s,192,"public/icons/icon-192.png");png(s,512,"public/icons/icon-512.png");png(s,180,"public/icons/apple-touch-icon.png")
png(s,512,"public/icons/strides-maskable-512.png");png(s,512,"public/icons/maskable-512.png");png(s,64,"art/review/window-icon-native.png")
inventory(s,"app-icon");s:close()
local f=app.open("art/source/app-favicon.aseprite");assert(f.width==32 and f.height==32,"Favicon must be separately editable at32px");png(f,32,"public/icons/strides-favicon-32.png");inventory(f,"app-favicon");f:close()
local file=assert(io.open("art/review/interface-audit.json","w"));file:write('{"logicalSize":64,"faviconLogicalSize":32,"criticalRadius":'..maxDistance..',"safeRadius":25.6,"uiFrame":24,"uiCount":8,"opaque":true,"interpolation":"nearest-neighbour","review":"Native layered sunlit window; independent simplified favicon; square opaque background with no pre-rounded corners","sources":['..table.concat(records,",")..']}\n');file:close()
print("Exported native window icons, maskable and Apple touch sizes; independent32px favicon.")
