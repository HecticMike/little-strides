local names={"hero-body","hero-equipment","hero-training-outfit","hero-core-study","hero-core-abdominal-bracing","hero-core-pelvic-tilt","hero-core-heel-slide","hero-core-glute-bridge","village-ground","workshop-context","buildings","village-foreground","vista","training","tiles","icons","app-icon","chapter-props","chapter-banner","ui-enamel","ui-paper","discovery-pond","discovery-watchtower"}
local out={}
local function q(s) return '"'..s:gsub('\\','\\\\'):gsub('"','\\"')..'"' end
for _,name in ipairs(names) do
 local s=app.open("art/source/"..name..".aseprite")
 local layers,counts,alphaByIndex={},{},{}
 if s.colorMode==ColorMode.INDEXED then for i=0,#s.palettes[1]-1 do alphaByIndex[i]=s.palettes[1]:getColor(i).alpha end end
 for _,l in ipairs(s.layers) do
  layers[#layers+1]=q(l.name)
  local count=0;local cel=l:cel(1)
  if cel then for p in cel.image:pixels() do
   local alpha=s.colorMode==ColorMode.INDEXED and alphaByIndex[p()] or app.pixelColor.rgbaA(p())
   if alpha>0 then count=count+1 end
  end end
  counts[#counts+1]=tostring(count)
 end
 out[#out+1]='  {'..'"asset":'..q(name)..',"width":'..s.width..',"height":'..s.height..',"mode":'..q(s.colorMode==ColorMode.INDEXED and "indexed" or "RGBA")..',"layers":['..table.concat(layers,",")..'],"visiblePixels":['..table.concat(counts,",")..']}'
 s:close()
end
local f=assert(io.open("art/source-inventory.json","w"));f:write("[\n"..table.concat(out,",\n").."\n]\n");f:close()
print("Aseprite source inventory refreshed.")
