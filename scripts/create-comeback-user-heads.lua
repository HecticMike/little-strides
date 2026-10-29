-- Establish one authoritative head source per pose; stage heads are derived at export.
local root='art/prototypes/comeback/user-art/'
if app.fs.isFile(root..'heads.aseprite') then error('Canonical head master exists; edit it directly.') end
local source=app.open(root..'character.aseprite');local s=Sprite(96,128,ColorMode.RGB);s:deleteLayer(s.layers[1])
for _,pose in ipairs({'Standing','Heel slide'}) do
 local wanted=pose..' / Starting / Shared head';local image=Image(96,128,ColorMode.RGB)
 for _,l in ipairs(source.layers) do if l.name==wanted then image:drawImage(l:cel(1).image,Point(0,0)) end end
 local l=s:newLayer();l.name=pose=='Standing' and 'Canonical standing head' or 'Canonical floor head';s:newCel(l,1,image,Point(0,0))
end
s:setPalette(source.palettes[1]);s:saveAs(root..'heads.aseprite');s:close();source:close()
print('Created the shared authoritative head master for both physique stages.')