local root='art/prototypes/comeback/user-art/'
local inventory={}
local hs=app.open(root..'heads.aseprite');local heads=Image(hs);hs:close();heads:saveAs(root..'heads.png');heads:saveAs(root..'heads-canonical.png')
for _,name in ipairs({'character','studio','heads'}) do
 local s=app.open(root..name..'.aseprite')
 local entry={name=name,width=s.width,height=s.height,layers={},structure=name=='studio' and 'full-detail-flattened-user-background' or (name=='heads' and 'source-matched-pose-junctions-with-shared-standing-head' or 'material-and-region-pose-layers')}
 for _,l in ipairs(s.layers) do local n=0;for _,cel in ipairs(l.cels) do for p in cel.image:pixels() do if app.pixelColor.rgbaA(p())>0 then n=n+1 end end end;entry.layers[#entry.layers+1]={name=l.name,visible=l.isVisible,pixels=n} end
 if name=='character' then local body=Image(s);body:saveAs(root..'body.png');body:drawImage(heads,Point(0,0));body:saveAs(root..'character.png')
 elseif name=='studio' then Image(s):saveAs(root..'studio.png') end
 inventory[#inventory+1]=entry;s:close()
end
local f=io.open(root..'inventory.json','w');f:write(json.encode(inventory));f:close()
print('Exported intact source-matched head/neck poses and full-detail Sunlit source; masters unchanged.')