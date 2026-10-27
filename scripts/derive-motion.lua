-- Derive just two walk keys and one blink from the canonical Aseprite sheets.
-- This is repeatable: the seven existing exercise/study columns are untouched.
local function expand(file, equipment)
  local old = app.open(file)
  local original = old.cels[1].image
  local output = Image(480, original.height, ColorMode.RGB)
  for y=0,original.height-1 do for x=0,335 do output:drawPixel(x,y,original:getPixel(x,y)) end end
  for row=0,(equipment and 1 or 0) do
    for frame=0,2 do
      for y=0,63 do for x=0,47 do
        local sourceX=x
        local column=(frame<2 and not equipment) and 1 or 0
        if frame==1 and not equipment and y>=39 then sourceX=47-x end
        output:drawPixel((7+frame)*48+x,row*64+y,original:getPixel(column*48+sourceX,row*64+y))
      end end
      if frame==2 and not equipment then
        for y=14,16 do for x=22,23 do output:drawPixel(9*48+x,y,app.pixelColor.rgba(229,175,131,255)) end end
        for y=14,15 do output:drawPixel(9*48+28,y,app.pixelColor.rgba(229,175,131,255)) end
        for x=22,23 do output:drawPixel(9*48+x,16,app.pixelColor.rgba(32,44,55,255)) end
        output:drawPixel(9*48+28,16,app.pixelColor.rgba(32,44,55,255))
      end
    end
  end
  old:close()
  local sprite=Sprite(480,output.height,ColorMode.RGB)
  sprite.cels[1].image=output
  sprite:saveAs(file)
  sprite:close()
end
expand('art/source/hero-body.aseprite',false)
expand('art/source/hero-equipment.aseprite',true)