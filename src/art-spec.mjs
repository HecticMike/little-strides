export const CHARACTER = {
  id: 'hearthwood-wayfarer', frameWidth: 96, frameHeight: 128,
  body: './art/hero-body.png', equipment: './art/hero-equipment.png',
  poses: ['stand', 'march', 'squat', 'push', 'calf', 'reach', 'lying', 'walk-a', 'walk-b', 'idle-blink'],
  stages: [
    { id: 'beginner', name: 'Beginner', equipmentRow: null },
    { id: 'adventurer', name: 'Adventurer', equipmentRow: 0 },
    { id: 'veteran', name: 'Veteran', equipmentRow: 1 },
  ],
  exercisePoses: { march: 'march', squat: 'squat', push: 'push', calf: 'calf', reach: 'reach' },
};
export const WORLD = { width: 320, height: 288, tileSize: 16, textureScale: 2, buildingFrameWidth: 280, buildingFrameHeight: 300, workshopX: 180, workshopY: 12, workshopUnlock: 1 };
export const PALETTE = { ink:'#202c37', deep:'#293b40', pine:'#344e48', leaf:'#4d6a48', grass:'#718252', light:'#98a16a', moss:'#b6b879', sand:'#d3b879', cream:'#f0d4a0', gold:'#e4ad55', amber:'#bd7c40', brick:'#a05b44', roof:'#754951', roofLight:'#a46759', wood:'#6a4c3d', woodLight:'#9c7550', skin:'#e5af83', skinLight:'#f4cba0', skinShadow:'#b9765e', hair:'#563c35', hairLight:'#986244', teal:'#3f7270', tealLight:'#75a49a', blue:'#50788a', blueLight:'#86a6b1', lilac:'#9b879a', white:'#fff0c2' };