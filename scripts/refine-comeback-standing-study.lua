-- One-time focused revision of the isolated study, plus one intermediate standing proof.
-- Never reads or writes live progression or runtime artwork.
local root='art/prototypes/comeback/user-art/'
local out='art/prototypes/comeback/stage-study/'
local pc=app.pixelColor
local function colour(h)return pc.rgba(tonumber(h:sub(1,2),16),tonumber(h:sub(3,4),16),tonumber(h:sub(5,6),16),255)end
local function patch(sprite,name,points)
 local im=Image(96,128,ColorMode.RGB)
 for _,p in ipairs(points) do for yy=0,1 do for xx=0,1 do im:drawPixel(p[1]*2+xx,p[2]*2+yy,colour(p[3])) end end end
 local l=sprite:newLayer();l.name=name;sprite:newCel(l,1,im,Point(0,0))
end
assert(not app.fs.isFile(out..'form-standing.aseprite'),'Intermediate study exists; edit its layers instead of rerunning preparation.')
local final=app.open(out..'developed-silhouette.aseprite')
for _,l in ipairs(final.layers) do assert(l.name~='Refinement / Sleeve edges, elbow and waist','Refinement already applied.') end
-- Open a narrow arm/waist gap without moving elbow, wrist or pelvis anchors.
for _,l in ipairs(final.layers) do if not l.name:find('^Preview /') then local c=l:cel(1)
 if c then for y=33,35 do for yy=0,1 do for xx=0,1 do local px,py=36+xx-c.position.x,y*2+yy-c.position.y
 if px>=0 and py>=0 and px<c.image.width and py<c.image.height then c.image:drawPixel(px,py,0) end end end end end
end end
patch(final,'Refinement / Sleeve edges, elbow and waist',{
 {15,22,'307a7e'},{16,23,'48979a'},{15,25,'215861'},
 {31,23,'48979a'},{32,24,'307a7e'},{31,25,'48979a'},
 {15,27,'ffc481'},{16,28,'efa96c'},{16,29,'d88e59'},
 {16,30,'b66d48'},{16,31,'d88e59'},{15,32,'efa96c'},
 {29,28,'ffc481'},{30,28,'efa96c'},{31,28,'d88e59'},
 {29,29,'efa96c'},{30,29,'ffc481'},{31,29,'d88e59'},
 {30,30,'efa96c'},{31,30,'ffdda5'},{31,31,'ffc481'},
 {19,33,'10232c'},{20,33,'48979a'},
 {19,34,'10232c'},{20,34,'48979a'},{21,34,'307a7e'},
 {19,35,'10232c'},{20,35,'215861'}
})
final:saveAs(out..'developed-silhouette.aseprite');final:close()
-- Same starting body, head, outfit, height and anchors; independently editable clusters.
local source=app.open(root..'character.aseprite')
local mid=Sprite(96,128,ColorMode.RGB);mid:deleteLayer(mid.layers[1]);mid:setPalette(source.palettes[1]);mid.gridBounds=Rectangle(0,0,2,2)
for _,l in ipairs(source.layers) do if l.name:find('^Standing / Starting / ') then
 local c=l:cel(1);local im=Image(96,128,ColorMode.RGB);if c then im:drawImage(c.image,c.position) end
 local target=mid:newLayer();target.name=l.name:gsub('Standing / Starting','Base / Starting');mid:newCel(target,1,im,Point(0,0))
end end;source:close()
patch(mid,'Study / Intermediate shoulder and sleeve silhouette',{
 {15,22,'10232c'},{16,22,'307a7e'},
 {14,23,'10232c'},{15,23,'215861'},{16,23,'307a7e'},
 {14,24,'10232c'},{15,24,'307a7e'},{16,24,'48979a'},
 {30,22,'48979a'},{31,22,'10232c'},
 {30,23,'48979a'},{31,23,'307a7e'},{32,23,'10232c'},
 {30,24,'48979a'},{31,24,'307a7e'},{32,24,'10232c'},
 {31,25,'307a7e'},{32,25,'10232c'}
})
patch(mid,'Study / Intermediate arm form',{
 {15,28,'ffc481'},{16,28,'efa96c'},{17,28,'d88e59'},
 {15,29,'ffc481'},{16,29,'efa96c'},{17,29,'d88e59'},
 {15,30,'efa96c'},{16,30,'efa96c'},{17,30,'d88e59'},
 {15,31,'ffc481'},{16,31,'efa96c'},
 {29,28,'10232c'},{30,28,'efa96c'},{31,28,'d88e59'},
 {29,29,'efa96c'},{30,29,'ffc481'},{31,29,'d88e59'},
 {30,30,'efa96c'},{31,30,'ffdda5'},
 {30,31,'efa96c'},{31,31,'ffc481'}
})
patch(mid,'Study / Intermediate shirt planes',{
 {20,26,'215861'},{21,26,'307a7e'},
 {21,27,'215861'},{22,27,'307a7e'},
 {26,31,'215861'},{27,31,'215861'},
 {26,32,'215861'},{27,33,'215861'},
 {20,34,'48979a'},{21,34,'307a7e'}
})
local hs=app.open(root..'heads.aseprite');local h=Image(hs);hs:close();local im=Image(96,128,ColorMode.RGB)
for y=0,41 do for x=0,95 do im:drawPixel(x,y,h:getPixel(x,y)) end end
local preview=mid:newLayer();preview.name='Preview / Shared canonical head - authoritative source heads.aseprite';mid:newCel(preview,1,im,Point(0,0))
mid:saveAs(out..'form-standing.aseprite');mid:close()
print('Refined isolated final study and prepared one 24-unit standing proof; live art unchanged.')
