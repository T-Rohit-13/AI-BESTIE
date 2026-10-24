import fs from 'fs';
import path from 'path';
import { chatService } from './modules/chat/chat.service';

async function runTraining() {
  console.log('\n======================================================');
  console.log('       INARO COMPANION MODEL TRAINING PIPELINE        ');
  console.log('======================================================\n');

  const defaultDatasetPath = path.resolve(__dirname, '../../data/tone_training_dataset.json');

  if (!fs.existsSync(defaultDatasetPath)) {
    console.error(`Dataset file not found at: ${defaultDatasetPath}`);
    process.exit(1);
  }

  try {
    const rawData = fs.readFileSync(defaultDatasetPath, 'utf-8');
    const dataset = JSON.parse(rawData);

    console.log(`[DataLoader] Loaded ${dataset.length} training samples from ${path.basename(defaultDatasetPath)}`);
    console.log('[Trainer] Ingesting conversational samples and tuning friend response style...');

    const result = chatService.trainDataset(dataset);

    console.log(`[Success] ${result.message}`);
    console.log('[Checkpoint] Tone classifier and companion response embeddings synchronized!\n');
  } catch (err: any) {
    console.error('[Error] Training failed:', err?.message);
    process.exit(1);
  }
}

runTraining();
