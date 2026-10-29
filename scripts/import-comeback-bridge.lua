-- One-time native preparation of the supplied bridge still; no pose/head transforms.
local root='art/prototypes/comeback/user-art/'
local stem=app.params['appearance']=='developed' and 'bridge-developed' or 'bridge'
if app.fs.isFile(root..stem..'.aseprite') then error('Bridge master exists; edit directly rather than reimport.') end
local pc=app.pixelColor
local src=app.open(root..stem..'-fit-240.png');local image=Image(src);src:close()
local s=Sprite(192,128,ColorMode.RGB);s:deleteLayer(s.layers[1]);s.gridBounds=Rectangle(0,0,1,1)
local palette=Palette(28);palette:setColor(0,Color{r=0,g=0,b=0,a=0});local roles,index={},1
for line in io.lines(root..'palette.gpl') do local r,g,b,role=line:match('^(%d+)%s+(%d+)%s+(%d+)%s+(.*)');if r then local value=pc.rgba(tonumber(r),tonumber(g),tonumber(b),255);roles[value]=role;palette:setColor(index,Color{r=tonumber(r),g=tonumber(g),b=tonumber(b),a=255});index=index+1 end end
local names={'Far bent leg and trainer','Near bent leg and trainer','Raised pelvis and shorts','Teal torso shading','Far visible forearm and hand','Near visible forearm and hand','Torso support and contours','Intact head neck and shoulder junction'}
local parts={};for _,name in ipairs(names) do parts[name]=Image(192,128,ColorMode.RGB) end
for y=0,127 do for x=0,191 do local v=image:getPixel(x,y);if pc.rgbaA(v)>0 then local role=roles[v];local name='Torso support and contours'
 if x>=128 then name='Intact head neck and shoulder junction'
 elseif x<66 then name=(y<107 and x<38 or y>=107 and x<28) and 'Far bent leg and trainer' or 'Near bent leg and trainer'
 elseif role=='Skin' and y>=107 then name=y<115 and 'Far visible forearm and hand' or 'Near visible forearm and hand'
 elseif role=='Shirt' then name='Teal torso shading'
 elseif role=='Shorts' or x<97 then name='Raised pelvis and shorts' end
 parts[name]:drawPixel(x,y,v)
 end end end
for _,name in ipairs(names) do local layer=s:newLayer();layer.name='Pose / '..name;s:newCel(layer,1,parts[name],Point(0,0)) end
local ref=s:newLayer();ref.name='Reference / complete registered source (not exported)';s:newCel(ref,1,image,Point(0,0));ref.isVisible=false
s:setPalette(palette);s:saveAs(root..stem..'.aseprite');s:close();image:saveAs(root..stem..'-registered-source.png')
print('Prepared bridge master with editable visible regions and complete source head/neck/shoulder.')
