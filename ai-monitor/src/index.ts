import express from 'express';
import poseDetector from './detectors/poseDetector';
import attentionAnalyzer from './analyzers/attentionAnalyzer';

const app = express();
const PORT = process.env.AI_MONITOR_PORT || 5001;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize detectors
async function initializeDetectors() {
  try {
    console.log('Initializing AI monitors...');
    await poseDetector.initialize();
    console.log('✅ AI monitors initialized');
  } catch (error) {
    console.error('Failed to initialize detectors:', error);
    process.exit(1);
  }
}

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Analyze frame
app.post('/analyze', async (req, res) => {
  try {
    const { frameData } = req.body;

    if (!frameData) {
      return res.status(400).json({
        error: true,
        message: 'Frame data required',
      });
    }

    // Convert base64 to tensor
    const imageBuffer = Buffer.from(frameData, 'base64');

    // Detect pose
    const poses = await poseDetector.detectPose(imageBuffer);

    if (!poses || poses.length === 0) {
      return res.status(200).json({
        poseDetected: false,
        analysis: null,
      });
    }

    // Analyze attention
    const poseAnalysis = await poseDetector.analyzePose(poses);
    const attentionAnalysis = await attentionAnalyzer.analyzeAttention(poseAnalysis);

    res.status(200).json({
      poseDetected: true,
      analysis: attentionAnalysis,
      pose: poseAnalysis,
    });
  } catch (error: any) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: true,
      message: error.message,
    });
  }
});

// Start server
async function startServer() {
  await initializeDetectors();

  app.listen(PORT, () => {
    console.log(`✅ AI Monitor running on http://localhost:${PORT}`);
  });
}

startServer();

export { app };
