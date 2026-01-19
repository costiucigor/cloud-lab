/**
 * Cloud Technologies - Main Server
 * Serves the website and provides API endpoints for all modules
 */

const express = require('express');
const path = require('path');
const multer = require('multer');
const vision = require('@google-cloud/vision');
const translate = require('@google-cloud/translate').v2;
const textToSpeech = require('@google-cloud/text-to-speech');
const language = require('@google-cloud/language');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// File upload config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ============================================
// GCP Client Initialization
// ============================================
// Set GOOGLE_APPLICATION_CREDENTIALS env var to your key.json path
// Or place key.json in this directory and uncomment:
// process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, 'key.json');

let visionClient, translateClient, ttsClient, languageClient;

try {
  visionClient = new vision.ImageAnnotatorClient();
  translateClient = new translate.Translate();
  ttsClient = new textToSpeech.TextToSpeechClient();
  languageClient = new language.LanguageServiceClient();
  console.log('✅ GCP clients initialized');
} catch (error) {
  console.warn('⚠️ GCP clients not initialized. Set GOOGLE_APPLICATION_CREDENTIALS');
  console.warn('   Demo mode: APIs will return simulated data');
}

// ============================================
// API Routes
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    gcpConfigured: !!visionClient,
    timestamp: new Date().toISOString()
  });
});

// Vision API - Label Detection
app.post('/api/vision/labels', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    if (!visionClient) {
      // Demo mode - return simulated data
      return res.json({
        labels: [
          { description: 'Computer', score: 0.95 },
          { description: 'Technology', score: 0.89 },
          { description: 'Electronics', score: 0.85 },
          { description: 'Screen', score: 0.82 }
        ],
        demo: true
      });
    }

    const [result] = await visionClient.labelDetection({
      image: { content: req.file.buffer.toString('base64') }
    });

    const labels = result.labelAnnotations.map(label => ({
      description: label.description,
      score: label.score
    }));

    res.json({ labels });
  } catch (error) {
    console.error('Vision API error:', error);
    res.status(500).json({ error: 'Vision API error', message: error.message });
  }
});

// Vision API - Object Detection
app.post('/api/vision/objects', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    if (!visionClient) {
      return res.json({
        objects: [
          { name: 'Laptop', score: 0.92 },
          { name: 'Person', score: 0.88 }
        ],
        demo: true
      });
    }

    const [result] = await visionClient.objectLocalization({
      image: { content: req.file.buffer.toString('base64') }
    });

    const objects = result.localizedObjectAnnotations.map(obj => ({
      name: obj.name,
      score: obj.score,
      boundingPoly: obj.boundingPoly
    }));

    res.json({ objects });
  } catch (error) {
    console.error('Vision API error:', error);
    res.status(500).json({ error: 'Vision API error', message: error.message });
  }
});

// Translation API
app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLanguage = 'ro' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    if (!translateClient) {
      // Demo translations
      const demoTranslations = {
        'Computer': 'Calculator',
        'Technology': 'Tehnologie',
        'Electronics': 'Electronică',
        'Screen': 'Ecran',
        'Person': 'Persoană',
        'Laptop': 'Laptop'
      };
      
      const translations = Array.isArray(text) 
        ? text.map(t => demoTranslations[t] || t)
        : demoTranslations[text] || text;
      
      return res.json({ translations, demo: true });
    }

    const [translations] = await translateClient.translate(text, targetLanguage);

    res.json({ translations: Array.isArray(translations) ? translations : [translations] });
  } catch (error) {
    console.error('Translation API error:', error);
    res.status(500).json({ error: 'Translation API error', message: error.message });
  }
});

// Text-to-Speech API
app.post('/api/tts', async (req, res) => {
  try {
    const { text, languageCode = 'ro-RO' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    if (!ttsClient) {
      return res.status(503).json({ 
        error: 'TTS not configured',
        message: 'Set GOOGLE_APPLICATION_CREDENTIALS to enable TTS',
        demo: true
      });
    }

    const [response] = await ttsClient.synthesizeSpeech({
      input: { text },
      voice: { languageCode, ssmlGender: 'FEMALE' },
      audioConfig: { audioEncoding: 'MP3' }
    });

    res.set('Content-Type', 'audio/mpeg');
    res.send(response.audioContent);
  } catch (error) {
    console.error('TTS API error:', error);
    res.status(500).json({ error: 'TTS API error', message: error.message });
  }
});

// Natural Language API - Sentiment Analysis
app.post('/api/sentiment', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    if (!languageClient) {
      // Simple sentiment simulation
      const positiveWords = ['amazing', 'love', 'excellent', 'great', 'wonderful', 'fantastic', 'best', 'happy', 'good'];
      const negativeWords = ['terrible', 'awful', 'hate', 'worst', 'bad', 'horrible', 'disappointing', 'waste'];
      
      const words = text.toLowerCase().split(/\s+/);
      let score = 0;
      words.forEach(word => {
        if (positiveWords.some(pw => word.includes(pw))) score += 0.3;
        if (negativeWords.some(nw => word.includes(nw))) score -= 0.3;
      });
      score = Math.max(-1, Math.min(1, score));
      
      return res.json({
        sentiment: {
          score,
          magnitude: Math.abs(score) * 2
        },
        demo: true
      });
    }

    const document = {
      content: text,
      type: 'PLAIN_TEXT'
    };

    const [result] = await languageClient.analyzeSentiment({ document });

    res.json({
      sentiment: {
        score: result.documentSentiment.score,
        magnitude: result.documentSentiment.magnitude
      }
    });
  } catch (error) {
    console.error('Language API error:', error);
    res.status(500).json({ error: 'Language API error', message: error.message });
  }
});

// Full Vision Pipeline (Module 7)
app.post('/api/vision-pipeline', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const results = {
      labels: [],
      translations: [],
      audioUrl: null,
      demo: !visionClient
    };

    // Step 1: Label Detection
    if (visionClient) {
      const [visionResult] = await visionClient.labelDetection({
        image: { content: req.file.buffer.toString('base64') }
      });
      results.labels = visionResult.labelAnnotations.slice(0, 5).map(l => ({
        description: l.description,
        score: l.score
      }));
    } else {
      results.labels = [
        { description: 'Computer', score: 0.95 },
        { description: 'Technology', score: 0.89 },
        { description: 'Electronics', score: 0.85 }
      ];
    }

    // Step 2: Translation to Romanian
    const englishLabels = results.labels.map(l => l.description);
    if (translateClient) {
      const [translations] = await translateClient.translate(englishLabels, 'ro');
      results.translations = englishLabels.map((en, i) => ({
        english: en,
        romanian: translations[i]
      }));
    } else {
      const demoTrans = { 'Computer': 'Calculator', 'Technology': 'Tehnologie', 'Electronics': 'Electronică' };
      results.translations = englishLabels.map(en => ({
        english: en,
        romanian: demoTrans[en] || en
      }));
    }

    // Step 3: Text-to-Speech (generate audio URL)
    if (ttsClient) {
      const textForSpeech = results.translations.map(t => t.romanian).join(', ');
      const [ttsResponse] = await ttsClient.synthesizeSpeech({
        input: { text: `Am detectat: ${textForSpeech}` },
        voice: { languageCode: 'ro-RO', ssmlGender: 'FEMALE' },
        audioConfig: { audioEncoding: 'MP3' }
      });
      // Return audio as base64
      results.audioBase64 = ttsResponse.audioContent.toString('base64');
    }

    res.json(results);
  } catch (error) {
    console.error('Vision Pipeline error:', error);
    res.status(500).json({ error: 'Vision Pipeline error', message: error.message });
  }
});

// ============================================
// Static Routes
// ============================================

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle module pages
app.get('/modules/:module', (req, res) => {
  res.sendFile(path.join(__dirname, 'modules', `${req.params.module}.html`));
});

// Handle demo pages
app.get('/demos/:demo', (req, res) => {
  res.sendFile(path.join(__dirname, 'demos', `${req.params.demo}.html`));
});

// ============================================
// Start Server
// ============================================
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   ☁️  Cloud Technologies Server                            ║
║                                                            ║
║   Running at: http://localhost:${PORT}                       ║
║                                                            ║
║   GCP APIs: ${visionClient ? '✅ Configured' : '⚠️  Demo Mode (set GOOGLE_APPLICATION_CREDENTIALS)'}
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
