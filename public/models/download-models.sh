#!/bin/bash
# Download face-api.js models
# Run this script from the public/models directory

echo "Downloading face-api.js models..."

# Download tiny_face_detector models
curl -L https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json -o tiny_face_detector_model-weights_manifest.json
curl -L https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1 -o tiny_face_detector_model-shard1

# Download face_landmark_68 models
curl -L https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json -o face_landmark_68_model-weights_manifest.json
curl -L https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1 -o face_landmark_68_model-shard1

# Download face_recognition models
curl -L https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json -o face_recognition_model-weights_manifest.json
curl -L https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1 -o face_recognition_model-shard1
curl -L https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2 -o face_recognition_model-shard2

echo "Models downloaded successfully!"
