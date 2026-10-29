-- One-time preparation of the supplied complete pose. No detached/rotated head.
local root='art/prototypes/comeback/user-art/'
local developed=app.params['appearance']=='developed'
local stem=developed and 'supine-developed' or 'supine-start'
local prefix=developed and 'supine-developed' or 'supine'
if app.fs.isFile(root..stem..'.aseprite') then error('Supine master exists. Edit it directly; do not reimport.') end
local pc=app.pixelColor
local source=app.open(root..prefix..'-fit-240.png');local image=Image(source);source:close()
local sprite=Sprite(192,128,ColorMode.RGB);sprite:deleteLayer(sprite.layers[1]);sprite.gridBounds=Rectangle(0,0,1,1)
local palette=Palette(28);palette:setColor(0,Color{r=0,g=0,b=0,a=0});local roles,index={},1
for line in io.lines(root..'palette.gpl') do local r,g,b,role=line:match('^(%d+)%s+(%d+)%s+(%d+)%s+(.*)');if r then local v=pc.rgba(tonumber(r),tonumber(g),tonumber(b),255);roles[v]=role;palette:setColor(index,Color{r=tonumber(r),g=tonumber(g),b=tonumber(b),a=255});index=index+1 end end
local names={'Far bent leg and trainer','Near bent leg and trainer','Pelvis and shorts','Teal torso shading','Visible forearm and hand','Torso support and contours','Intact head neck and upper-back junction'}
local parts={};for _,name in ipairs(names) do parts[name]=Image(192,128,ColorMode.RGB) end
for y=0,127 do for x=0,191 do local v=image:getPixel(x,y);if pc.rgbaA(v)>0 then local role=roles[v];local name='Torso support and contours'
 if x>=128 then name='Intact head neck and upper-back junction'
 elseif x<76 and (y<108 or x<62) then name=(y<106 and x<44 or y>=106 and x<30) and 'Far bent leg and trainer' or 'Near bent leg and trainer'
 elseif role=='Skin' and y>=108 then name='Visible forearm and hand'
 elseif role=='Shirt' then name='Teal torso shading'
 elseif role=='Shorts' or x<96 then name='Pelvis and shorts' end
 parts[name]:drawPixel(x,y,v)
 end end end
for _,name in ipairs(names) do local layer=sprite:newLayer();layer.name='Pose / '..name;sprite:newCel(layer,1,parts[name],Point(0,0)) end
local reference=sprite:newLayer();reference.name='Reference / complete registered source (not exported)';sprite:newCel(reference,1,image,Point(0,0));reference.isVisible=false
sprite:setPalette(palette);sprite:saveAs(root..stem..'.aseprite');sprite:close();image:saveAs(root..prefix..'-registered-source.png')
print('Prepared editable supine starting pose; source head/neck intact, far arm not reconstructed.')
