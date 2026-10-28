local s=app.open("art/source/app-icon.aseprite")
assert(s.width==64 and s.height==64,"Launcher master must remain 64x64 logical pixels")
local pc=app.pixelColor
local maxDistance=0
for _,layer in ipairs(s.layers) do if layer.name=="Stride - front boot" or layer.name=="Stride - rear boot" then
 local cel=layer:cel(1);assert(cel,"Missing central stride artwork")
 for p in cel.image:pixels() do if pc.rgbaA(p())>0 then local x,y=p.x+cel.position.x+.5-32,p.y+cel.position.y+.5-32;maxDistance=math.max(maxDistance,math.sqrt(x*x+y*y)) end end
end end
assert(maxDistance<=64*.4,"Keep both boots inside the Android maskable safe circle (radius 25.6px)")
local function png(size,path)
 local source=Image(s);local output=Image(size,size,ColorMode.RGB)
 for p in output:pixels() do p(source:getPixel(math.floor(p.x*64/size),math.floor(p.y*64/size))) end
 output:saveAs(path)
end
png(192,"public/icons/strides-192.png");png(512,"public/icons/strides-512.png");png(180,"public/icons/strides-apple-touch.png");png(32,"public/icons/strides-favicon-32.png")
png(192,"public/icons/icon-192.png");png(512,"public/icons/icon-512.png");png(180,"public/icons/apple-touch-icon.png")
for _,layer in ipairs(s.layers) do if layer.name=="Brass frame" then layer.isVisible=false end end
png(512,"public/icons/strides-maskable-512.png");png(512,"public/icons/maskable-512.png")
s:close()
local f=assert(io.open("art/review/interface-audit.json","w"));f:write('{"logicalSize":64,"criticalRadius":'..maxDistance..',"safeRadius":25.6,"uiFrame":24,"uiCount":8,"interpolation":"nearest-neighbour","review":"Aseprite-native pixel drawing; solid background; no pre-rounded alpha corners"}');f:close()
print("Exported launcher, maskable, Apple touch and favicon assets from Aseprite.")
