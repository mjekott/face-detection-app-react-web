import { useState } from 'react'
import './App.css'
import WebcamModal from './components/WebcamModal'

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  const handleClose = () => {
    setIsModalOpen(false)
  }

  const openModal = () => {
    setIsModalOpen(true)
    setCapturedImage(null)
  }

  const handleCapture = (imageDataUrl: string) => {
    setCapturedImage(imageDataUrl)
  }

  return (
    <div className="app">
      <h1>Face Detection Camera</h1>
      <p>Click the button below to start face detection with liveness verification</p>

      <button className="open-camera-button" onClick={openModal}>
        Open Camera
      </button>

      {capturedImage && (
        <div className="captured-image-container">
          <h2>Verification Complete!</h2>
          <img src={capturedImage} alt="Captured" className="captured-image" />
        </div>
      )}

      <WebcamModal isOpen={isModalOpen} onClose={handleClose} onCapture={handleCapture} />
    </div>
  )
}

export default App
