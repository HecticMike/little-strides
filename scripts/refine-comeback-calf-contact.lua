-- One-time native trainer cleanup after nearest-neighbour rotation; no body edits.
local root='art/prototypes/comeback/user-art/'
if app.fs.isFile(root..'calf-contact-refinement.json') then error('Contact cleanup already applied. Edit the calf master directly.') end
local s=app.open(root..'calf.aseprite');local edits={}
for stage=0,1 do local name='Raised heels / '..(stage==0 and 'Starting' or 'Developed')..' / Far trainer'
 for _,layer in ipairs(s.layers) do if layer.name==name then local cel=layer:cel(1);local im=cel.image:clone()
  local function tile(x,y,sx,sy)local v=sx and im:getPixel(sx-cel.position.x,sy-cel.position.y) or 0;for yy=0,1 do for xx=0,1 do im:drawPixel(x+xx-cel.position.x,y+yy-cel.position.y,v) end end;edits[#edits+1]={stage=stage,x=x-stage*96,y=y,sourceX=sx and sx-stage*96,sourceY=sy,clear=not sx} end
  if stage==0 then tile(66,118);tile(58,120,60,120);tile(64,122,64,124) else tile(160,122,160,120);tile(162,124,160,124) end
  cel.image=im
 end end
end
s:saveAs(root..'calf.aseprite');s:close();local f=io.open(root..'calf-contact-refinement.json','w');f:write(json.encode({status='provisional-native-pixel-cleanup',edits=edits,bodyChanged=false,headChanged=false}));f:close()
