import { MuseumConfig, PictureFrameItem } from '../types/museum';

export const INITIAL_MUSEUM_CONFIG: MuseumConfig = {
  coupleNames: 'James & Emily',
  partner1: 'James',
  partner2: 'Emily',
  playerName: 'James',
  partnerName: 'Emily',
  selectedAvatar: 'kai',
  anniversaryDate: 'October 14, 2021',
  title: 'Our Museum',
  subtitle: 'A Permanent Collection for Emily',
  userRole: 'admin',
  selectedSongId: 'clair-de-lune',
  cinemaVideoUrl: '',
  dedicationLetter: `A private 3D sanctuary created for our timeless love story.

This museum is built to hold the moments that words alone cannot capture. From the quiet morning coffees to the nights we stayed up tracing constellations, every second with you has shaped my universe.

Love, James`,
};

// Curated 3D museum frames positioned flush against the perimeter gallery walls
export const INITIAL_FRAMES: PictureFrameItem[] = [
  // --- West Gallery Wall (x = -7.34, facing towards center) ---
  {
    id: 'frame-entrance-1',
    roomId: 'entrance',
    position: [-7.34, 2.4, 1.0],
    rotation: [0, Math.PI / 2, 0],
    width: 2.4,
    height: 1.7,
    title: 'The First Spark',
    date: 'Autumn 2021',
    story: 'The day we first met under the golden maples. We talked for four hours without noticing the sun setting.',
    imageUrl: '/src/assets/images/art_autumn_walk_1792907504106.jpg',
  },
  {
    id: 'frame-memories-1',
    roomId: 'memories',
    position: [-7.34, 2.4, -9.0],
    rotation: [0, Math.PI / 2, 0],
    width: 2.4,
    height: 1.7,
    title: 'Golden Sunset by the Sea',
    date: 'Summer 2023',
    story: 'Walking barefoot along the pacific shoreline as the sun melted into warm peach and gold. You whispered a promise I will keep forever.',
    imageUrl: '/src/assets/images/art_sunset_lovers_1792907502463.jpg',
  },
  {
    id: 'frame-memories-2',
    roomId: 'memories',
    position: [-7.34, 2.4, -19.0],
    rotation: [0, Math.PI / 2, 0],
    width: 2.4,
    height: 1.7,
    title: 'Beneath the Starlight',
    date: 'Winter 2023',
    story: 'Wrapped in our favorite wool blanket under a sea of stars. We saw three shooting stars and made the exact same wish.',
    imageUrl: '/src/assets/images/art_stargazing_1792907504033.jpg',
  },
  {
    id: 'frame-memories-3',
    roomId: 'memories',
    position: [-7.34, 2.4, -27.0],
    rotation: [0, Math.PI / 2, 0],
    width: 2.4,
    height: 1.7,
    title: 'A New Milestone (Ready for Your Photo)',
    date: 'Add Date',
    story: 'Mount your favorite memory, trip, engagement photo, or private moment here.',
    imageUrl: '', // Empty frame ready for upload!
  },

  // --- East Gallery Wall (x = 7.34, facing towards center) ---
  {
    id: 'frame-entrance-2',
    roomId: 'entrance',
    position: [7.34, 2.4, 1.0],
    rotation: [0, -Math.PI / 2, 0],
    width: 2.4,
    height: 1.7,
    title: 'Rainy Cafe in Paris',
    date: 'Spring 2022',
    story: 'Caught in sudden rain in Montmartre. We shared a single warm croissant, laughed until our sides hurt, and decided rainy days were our favorite.',
    imageUrl: '/src/assets/images/art_paris_cafe_1792907503921.jpg',
  },
  {
    id: 'frame-whispers-1',
    roomId: 'whispers',
    position: [7.34, 2.4, -9.0],
    rotation: [0, -Math.PI / 2, 0],
    width: 2.4,
    height: 1.7,
    title: 'Our Next Adventure',
    date: 'Add Date',
    story: 'An empty canvas waiting for our upcoming voyage across the world. Where shall we travel next?',
    imageUrl: '', // Empty frame
  },
  {
    id: 'frame-whispers-2',
    roomId: 'whispers',
    position: [7.34, 2.4, -19.0],
    rotation: [0, -Math.PI / 2, 0],
    width: 2.4,
    height: 1.7,
    title: 'Little Everyday Wonders',
    date: 'Add Date',
    story: 'For the candid laughs, Sunday morning pancakes, and quiet lazy afternoons that mean the world.',
    imageUrl: '', // Empty frame
  },
  {
    id: 'frame-whispers-3',
    roomId: 'whispers',
    position: [7.34, 2.4, -27.0],
    rotation: [0, -Math.PI / 2, 0],
    width: 2.4,
    height: 1.7,
    title: 'Our Unwritten Future',
    date: 'Always',
    story: 'A frame preserved for all the dreams, houses, sunsets, and anniversaries still waiting to unfold.',
    imageUrl: '', // Empty frame
  },
];
