-- One-time preparation of the uploaded still, not a locomotion animation or rig.
local root='art/prototypes/comeback/user-art/'
local stage=app.params['appearance']=='developed' and 1 or 0
local stem=stage==1 and 'march-developed' or 'march'
if app.fs.isFile(root..stem..'.aseprite') then error('March master exists. Edit it in Aseprite; do not reimport.') end
local pc=app.pixelColor
local function read(path)local s=app.open(path);local im=Image(s);s:close();return im end
local src,heads=read(root..stem..'-native-fit.png'),read(root..'heads.png')
local s=Sprite(96,128,ColorMode.RGB);s:deleteLayer(s.layers[1]);s.gridBounds=Rectangle(0,0,2,2)
local roles={};local palette=Palette(28);palette:setColor(0,Color{r=0,g=0,b=0,a=0});local index=1
for line in io.lines(root..'palette.gpl') do local r,g,b,role=line:match('^(%d+)%s+(%d+)%s+(%d+)%s+(.*)');if r then local colour=pc.rgba(tonumber(r),tonumber(g),tonumber(b),255);roles[colour]=role;palette:setColor(index,Color{r=tonumber(r),g=tonumber(g),b=tonumber(b),a=255});index=index+1 end end
local names={'Neck and collar','Teal shirt and sleeve shading','Near arm and hand','Far arm and hand','Pelvis and shorts','Planted leg and trainer','Lifted leg and trainer','Remaining contours'}
local parts={};for _,name in ipairs(names) do parts[name]=Image(96,128,ColorMode.RGB) end
for y=42,127 do for x=0,95 do local v=src:getPixel(x,y);if pc.rgbaA(v)>0 then
 local role=roles[v];local name='Remaining contours'
 if role=='Shirt' then name='Teal shirt and sleeve shading'
 elseif y<52 then name='Neck and collar'
 elseif y>=96 then name=x<52 and 'Planted leg and trainer' or 'Lifted leg and trainer'
 elseif y>=82 and x>=52 and role=='Skin' then name='Lifted leg and trainer'
 elseif x<40 and y<90 then name='Near arm and hand'
 elseif x>=62 and y<90 then name='Far arm and hand'
 elseif y>=78 then name='Pelvis and shorts' end
 parts[name]:drawPixel(x,y,v)
 end end end
for _,name in ipairs(names) do local layer=s:newLayer();layer.name='Body / '..name;s:newCel(layer,1,parts[name],Point(0,0)) end
local preview=Image(96,128,ColorMode.RGB);for y=0,41 do for x=0,95 do preview:drawPixel(x,y,heads:getPixel(stage*96+x,y)) end end
local layer=s:newLayer();layer.name='Preview / shared canonical upright head';s:newCel(layer,1,preview,Point(0,0))
s:setPalette(palette);s:saveAs(root..stem..'.aseprite');s:close()
print('Prepared matching-stage march with editable visible body regions and shared canonical upright head. No hidden anatomy reconstructed.')
