# Face Detection Camera App

A React + TypeScript application that uses face-api.js for real-time face detection and blink verification before capturing photos.

## Features

- Real-time face detection using face-api.js
- Blink detection for photo verification
- Webcam integration with react-webcam
- Modern UI with responsive design
- TypeScript for type safety

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A webcam

### Installation

1. Navigate to the project directory:
```bash
cd face-detection-app
```

2. Install dependencies:
```bash
npm install
```

3. The face-api.js models are already downloaded in `public/models/`. If you need to re-download them, run:
```bash
cd public/models
./download-models.sh
```

### Running the App

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## How It Works

1. Click "Open Camera" to start the webcam
2. Position your face in the center of the camera
3. Once your face is detected, you'll be prompted to blink
4. After blinking, the photo is automatically captured
5. The captured photo is displayed below the button

## Technologies Used

- **React**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **face-api.js**: Face detection and facial landmark detection
- **react-webcam**: Webcam integration

## Project Structure

```
face-detection-app/
├── public/
│   └── models/          # face-api.js model files
├── src/
│   ├── components/
│   │   └── WebcamModal.tsx  # Main webcam component with face detection
│   ├── App.tsx          # Main application component
│   ├── App.css          # Styles
│   └── main.tsx         # Entry point
└── package.json
```

## License

MIT
