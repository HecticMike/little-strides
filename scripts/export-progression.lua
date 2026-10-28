local s=app.open('art/prototypes/progression/hero-progression.aseprite')
for _,mode in ipairs({'body','adventure','workout','control'}) do
 for _,l in ipairs(s.layers) do
  l.isVisible=l.name:find('^Body')~=nil or (mode=='adventure' and l.name:find('^Adventure')~=nil) or (mode=='workout' and l.name:find('^Workout')~=nil) or (mode=='control' and l.name:find('^Control')~=nil)
 end
 Image(s):saveAs('art/prototypes/progression/'..mode..'.png')
end
s:close()
print('Progression proof exported from shared body and independent outfit layers; no live export changed.')