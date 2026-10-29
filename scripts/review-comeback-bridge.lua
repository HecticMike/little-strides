-- Inspect alpha/glow and the complete source pose without altering approved masters.
local root='art/prototypes/comeback/user-art/'
local prefix=app.params['prefix'] or 'bridge'
local pc=app.pixelColor
local s=app.open(app.params['source'] or 'art/direction/comeback-user/starting-bridge.png');local source=Image(s);s:close()
local counts={clear=0,partial=0,solid=0};local bounds={}
for _,a in ipairs({128,240,250,254,255}) do bounds[tostring(a)]={x=source.width,y=source.height,x1=-1,y1=-1} end
for p in source:pixels() do local a=pc.rgbaA(p());if a==0 then counts.clear=counts.clear+1 elseif a==255 then counts.solid=counts.solid+1 else counts.partial=counts.partial+1 end;for level,b in pairs(bounds) do if a>=tonumber(level) then b.x=math.min(b.x,p.x);b.y=math.min(b.y,p.y);b.x1=math.max(b.x1,p.x);b.y1=math.max(b.y1,p.y) end end end
local palette={};for line in io.lines(root..'palette.gpl') do local r,g,b=line:match('^(%d+)%s+(%d+)%s+(%d+)');if r then palette[#palette+1]={tonumber(r),tonumber(g),tonumber(b)} end end
local memo={};local function quant(v,threshold)if pc.rgbaA(v)<threshold then return 0 end;local key=v & 0xffffff;if memo[key] then return memo[key] end;local r,g,b=pc.rgbaR(v),pc.rgbaG(v),pc.rgbaB(v);local best,dist=1,1e30;for i,c in ipairs(palette) do local d=2*(r-c[1])^2+3*(g-c[2])^2+2*(b-c[3])^2;if d<dist then best,dist=i,d end end;local c=palette[best];memo[key]=pc.rgba(c[1],c[2],c[3],255);return memo[key] end
local levels={128,240,250};local strip=Image(768,512,ColorMode.RGB);strip:clear(pc.rgba(245,237,221,255))
for i,threshold in ipairs(levels) do local b=bounds[tostring(threshold)];local scale=172/(b.x1-b.x+1);local image=Image(192,128,ColorMode.RGB)
 for y=0,127 do for x=0,191 do local sx=math.floor((x+.5-96)/scale+(b.x+b.x1+1)/2);local sy=math.floor((y+.5-122)/scale+b.y1+1);if sx>=0 and sx<source.width and sy>=0 and sy<source.height then image:drawPixel(x,y,quant(source:getPixel(sx,sy),threshold)) end end end
 image:saveAs(root..prefix..'-fit-'..threshold..'.png')
 for y=0,127 do for x=0,191 do local v=image:getPixel(x,y);if pc.rgbaA(v)>0 then for yy=0,1 do for xx=0,1 do strip:drawPixel(x*2+xx,(i-1)*160+y*2+yy-90,v) end end end end end
end
strip:saveAs(root..prefix..'-fit-review.png');local info={width=source.width,height=source.height,alpha=counts,bounds=bounds};local f=io.open(root..prefix..'-fit.json','w');f:write(json.encode(info));f:close();print(json.encode(info))
