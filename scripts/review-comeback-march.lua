-- Diagnostic fit only; the upload and existing masters remain unchanged.
local root='art/prototypes/comeback/user-art/'
local prefix=app.params['prefix'] or 'march'
local stage=tonumber(app.params['stage']) or 0
local pc=app.pixelColor
local function read(path)local s=app.open(path);local im=Image(s);s:close();return im end
local source=read(app.params['source'] or 'art/direction/comeback-user/starting-march.png')
local canonical=Image(96,128,ColorMode.RGB);canonical:drawImage(read(root..'character.png'),Point(-stage*96,0))
local colours={};for line in io.lines(root..'palette.gpl') do local r,g,b=line:match('^(%d+)%s+(%d+)%s+(%d+)');if r then colours[#colours+1]={tonumber(r),tonumber(g),tonumber(b)} end end
local memo={};local function quant(v)
 if pc.rgbaA(v)<240 then return 0 end
 local key=v & 0xffffff;if memo[key] then return memo[key] end
 local r,g,b=pc.rgbaR(v),pc.rgbaG(v),pc.rgbaB(v);local best,dist=1,1e30
 for i,p in ipairs(colours) do local d=2*(r-p[1])^2+3*(g-p[2])^2+2*(b-p[3])^2;if d<dist then best,dist=i,d end end
 local p=colours[best];memo[key]=pc.rgba(p[1],p[2],p[3],255);return memo[key]
end
local x0,y0,x1,y1=source.width,source.height,-1,-1;local alpha={clear=0,solid=0,partial=0}
for p in source:pixels() do local a=pc.rgbaA(p());if a==0 then alpha.clear=alpha.clear+1 elseif a==255 then alpha.solid=alpha.solid+1 else alpha.partial=alpha.partial+1 end;if a>=240 then x0=math.min(x0,p.x);y0=math.min(y0,p.y);x1=math.max(x1,p.x);y1=math.max(y1,p.y) end end
local scale=120/(y1-y0+1);local fit=Image(96,128,ColorMode.RGB)
for y=0,127 do for x=0,95 do local sx=math.floor((x+.5-48)/scale+(x0+x1+1)/2);local sy=math.floor((y+.5-124)/scale+y1+1);if sx>=0 and sx<source.width and sy>=0 and sy<source.height then fit:drawPixel(x,y,quant(source:getPixel(sx,sy))) end end end
fit:saveAs(root..prefix..'-source-fit.png')
local review=Image(768,512,ColorMode.RGB);review:clear(pc.rgba(245,237,221,255))
for y=0,127 do for x=0,95 do for stage=0,1 do local v=stage==0 and canonical:getPixel(x,y) or fit:getPixel(x,y);if pc.rgbaA(v)>0 then for dy=0,3 do for dx=0,3 do review:drawPixel(stage*384+x*4+dx,y*4+dy,v) end end end end end end
review:saveAs(root..prefix..'-fit-review.png')
local info={source={width=source.width,height=source.height,bounds={x=x0,y=y0,w=x1-x0+1,h=y1-y0+1},alpha=alpha},scale=scale,workingFrame={width=96,height=128,feetY=124},status='diagnostic-only'}
local f=io.open(root..prefix..'-fit.json','w');f:write(json.encode(info));f:close();print(json.encode(info))

-- Match the existing 48x64 logical art grid at exact 2x working resolution.
local small=Image(48,64,ColorMode.RGB);local lowScale=60/(y1-y0+1)
for y=0,63 do for x=0,47 do local sx=math.floor((x+.5-24)/lowScale+(x0+x1+1)/2);local sy=math.floor((y+.5-62)/lowScale+y1+1);if sx>=0 and sx<source.width and sy>=0 and sy<source.height then small:drawPixel(x,y,quant(source:getPixel(sx,sy))) end end end
local logical=Image(96,128,ColorMode.RGB)
for y=0,63 do for x=0,47 do local v=small:getPixel(x,y);for yy=0,1 do for xx=0,1 do logical:drawPixel(x*2+xx,y*2+yy,v) end end end end
logical:saveAs(root..prefix..'-native-fit.png')
local shared=Image(logical);local heads=read(root..'heads.png')
for y=0,41 do for x=0,95 do shared:drawPixel(x,y,heads:getPixel(stage*96+x,y)) end end
shared:saveAs(root..prefix..'-canonical-fit.png')
local variants={canonical,logical,shared};local strip=Image(864,384,ColorMode.RGB);strip:clear(pc.rgba(245,237,221,255))
for i,im in ipairs(variants) do for y=0,127 do for x=0,95 do local v=im:getPixel(x,y);if pc.rgbaA(v)>0 then for yy=0,2 do for xx=0,2 do strip:drawPixel((i-1)*288+x*3+xx,y*3+yy,v) end end end end end end
strip:saveAs(root..prefix..'-canonical-review.png')
