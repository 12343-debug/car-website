/**
 * NOCTIS — Configuration & Parameters
 * All scrollytelling thresholds, frame counts, asset paths and callout coordinates.
 */
const CONFIG = {
  hero: {
    height: '600vh',
    frameCount: 590,
    desktopPattern: 'assets/frames/hero/frame_%04d.webp',
    mobilePattern: 'assets/frames/hero-mobile/frame_%04d.webp',
    initialPreloadCount: 40,
    chapters: [
      {
        id: 'chapter-1',
        range: [0.00, 0.14],
        hudChapter: '01/04'
      },
      {
        id: 'chapter-2',
        range: [0.22, 0.42],
        hudChapter: '02/04'
      },
      {
        id: 'chapter-3',
        range: [0.50, 0.70],
        hudChapter: '03/04'
      },
      {
        id: 'chapter-4',
        range: [0.80, 1.00],
        hudChapter: '04/04'
      }
    ],
    hud: {
      maxSpeed: 118,    // km/h
      maxDistance: 4.2  // km
    },
    blackoutThreshold: 0.95 // Last 5% fades to solid black
  },

  statement: {
    text: "Every part was designed to disappear into one line of light."
  },

  dismantle: {
    height: '350vh',
    frameCount: 200,
    desktopPattern: 'assets/frames/dismantle/frame_%04d.webp',
    mobilePattern: 'assets/frames/dismantle-mobile/frame_%04d.webp',
    calloutThreshold: 0.70,
    callouts: [
      {
        id: 'body',
        name: 'BODY',
        desc: 'Carbon composite monocoque',
        // Dot percentage coordinates relative to the canvas display area
        dotX: 42,
        dotY: 36,
        labelX: 22,
        labelY: 30,
        revealProgress: 0.72
      },
      {
        id: 'battery',
        name: 'BATTERY',
        desc: '110 kWh structural pack',
        dotX: 38,
        dotY: 70,
        labelX: 18,
        labelY: 78,
        revealProgress: 0.79
      },
      {
        id: 'drive',
        name: 'DRIVE',
        desc: 'Dual axial-flux motors, 680 kW',
        dotX: 63,
        dotY: 53,
        labelX: 75,
        labelY: 45,
        revealProgress: 0.86
      },
      {
        id: 'light',
        name: 'LIGHT',
        desc: 'Single-line LED signature',
        dotX: 78,
        dotY: 74,
        labelX: 80,
        labelY: 84,
        revealProgress: 0.93
      }
    ]
  },

  lineup: {
    models: [
      {
        id: 'gt-e',
        num: '01',
        name: 'GT-E',
        tagline: 'The grand tourer.',
        range: '640 KM',
        accel: '3.1 S',
        power: '680 KW',
        image: 'assets/cars/gt-e.webp',
        alt: 'NOCTIS GT-E matte graphite grand tourer coupe in side profile',
        swatches: ['#1A1C20', '#EDEAE4', '#0E1626', '#E1251B'],
        activeSwatch: 0
      },
      {
        id: 's',
        num: '02',
        name: 'S',
        tagline: 'Four doors, no compromise.',
        range: '600 KM',
        accel: '3.6 S',
        power: '520 KW',
        image: 'assets/cars/s.webp',
        alt: 'NOCTIS S satin bone white four-door sport sedan in side profile',
        swatches: ['#EDEAE4', '#1A1C20', '#1F2937', '#374151'],
        activeSwatch: 0
      },
      {
        id: 'x',
        num: '03',
        name: 'X',
        tagline: 'Higher, never heavier.',
        range: '560 KM',
        accel: '4.2 S',
        power: '480 KW',
        image: 'assets/cars/x.webp',
        alt: 'NOCTIS X midnight blue SUV coupe in side profile',
        swatches: ['#0E1626', '#1A1C20', '#EDEAE4', '#2C3539'],
        activeSwatch: 0
      },
      {
        id: 'r',
        num: '04',
        name: 'R',
        tagline: 'Built for the track.',
        range: '420 KM',
        accel: '2.4 S',
        power: '900 KW',
        image: 'assets/cars/r.webp',
        alt: 'NOCTIS R satin black two-seat track coupe with red accents in side profile',
        swatches: ['#0F1012', '#E1251B', '#EDEAE4', '#2A2C30'],
        activeSwatch: 0
      },
      {
        id: 'one',
        num: '05',
        name: 'ONE',
        tagline: 'The future, early.',
        range: 'CONCEPT',
        accel: 'SUB-2.0 S',
        power: '1000+ KW',
        image: 'assets/cars/one.webp',
        alt: 'NOCTIS ONE liquid silver concept hypercar in side profile',
        swatches: ['#A0A8B0', '#0F1012', '#CFE3FF', '#EDEAE4'],
        activeSwatch: 0
      }
    ]
  }
};

