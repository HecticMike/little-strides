import React from 'react';
// Eight native-size Aseprite glyphs: Today, Village, Journal, Settings, progress, stage, timber, garden flower.
export function Icon({index,className=''}){
 return <span aria-hidden="true" className={'pixel-icon '+className} style={{'--icon':index}}/>;
}
