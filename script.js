document.addEventListener('DOMContentLoaded', async () => {
  const video = document.getElementById('video');
  const storeEmotionButton = document.getElementById('storeEmotion');
  const emotionDisplay = document.getElementById('emotionDisplay');
  const canvas = document.getElementById('overlayCanvas');
  const displaySize = { width: video.width, height: video.height };

  // Load FaceAPI models
  await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
  await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
  await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
  await faceapi.nets.faceExpressionNet.loadFromUri('/models');

  // Get user media for video
  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((err) => {
      console.error('Error accessing the camera:', err);
    });

  video.addEventListener('play', () => {
    const displaySize = { width: video.width, height: video.height };
    canvas.width = video.width;
    canvas.height = video.height;

    const context = canvas.getContext('2d');
    let detectedEmotion = '';

    storeEmotionButton.addEventListener('click', async () => {
      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      context.clearRect(0, 0, canvas.width, canvas.height);
      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      if (resizedDetections.length > 0) {
        const emotions = resizedDetections[0].expressions;
        detectedEmotion = getDominantEmotion(emotions);
        emotionDisplay.textContent = `You seem to be ${detectedEmotion} today.`;
      } else {
        emotionDisplay.textContent = 'No face detected.';
      }

      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
    });

    setInterval(async () => {
      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      context.clearRect(0, 0, canvas.width, canvas.height);
      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      faceapi.draw.drawDetections(canvas, resizedDetections);

      if (resizedDetections.length > 0) {
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      }

    }, 100);
  });

  function getDominantEmotion(emotions) {
    let emotionLabel = '';
    let maxConfidence = -Infinity;

    for (const [emotion, confidence] of Object.entries(emotions)) {
      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        emotionLabel = emotion;
      }
    }

    return emotionLabel;
  }
});
