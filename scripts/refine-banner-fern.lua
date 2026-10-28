-- One-time additive fern variant: visibly upgrades the original blue-green cloth.
local s=app.open('art/source/chapter-banner.aseprite')
for _,l in ipairs(s.layers)do if l.name=='Fern enamel and stitchwork' then s:close();error('Fern variant already refined. Edit master directly.')end end
local source=Image(s);local image=Image(s.width,s.height,ColorMode.RGB);local pc=app.pixelColor
for y=9,51 do for x=14,39 do local c=source:getPixel(x,y);local r,g,b=pc.rgbaR(c),pc.rgbaG(c),pc.rgbaB(c)
 if pc.rgbaA(c)>240 and r<g and g>=b and g>45 then image:drawPixel(x,y,pc.rgba(math.floor(r*.9),math.min(255,math.floor(g*1.12)),math.floor(b*.70),255))end
end end
for _,p in ipairs({{17,17},{34,17},{19,40},{32,40}})do image:drawPixel(p[1],p[2],pc.rgba(255,218,136,255));image:drawPixel(p[1]+1,p[2],pc.rgba(209,159,72,255))end
local l=s:newLayer();l.name='Fern enamel and stitchwork';s:newCel(l,1,image);s:saveAs('art/source/chapter-banner.aseprite');s:close()
