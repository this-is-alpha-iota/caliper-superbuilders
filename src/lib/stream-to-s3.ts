import type { KinesisStreamEvent, KinesisStreamRecord } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Buffer } from 'buffer';

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.BUCKET_NAME!;

interface CaliperEventRecord {
  envelope: any;
  processedAt: string;
  sensorId: string;
  eventCount: number;
}

export async function handler(event: KinesisStreamEvent): Promise<void> {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hour = String(now.getUTCHours()).padStart(2, '0');
  const minute = String(now.getUTCMinutes()).padStart(2, '0');
  
  // Group records by sensor for better partitioning
  const recordsBySensor = new Map<string, CaliperEventRecord[]>();
  
  for (const record of event.Records) {
    try {
      const payload = JSON.parse(
        Buffer.from(record.kinesis.data, 'base64').toString('utf-8')
      );
      
      const sensorId = payload.envelope.sensor;
      if (!recordsBySensor.has(sensorId)) {
        recordsBySensor.set(sensorId, []);
      }
      
      recordsBySensor.get(sensorId)!.push({
        envelope: payload.envelope,
        processedAt: new Date().toISOString(),
        sensorId,
        eventCount: payload.envelope.data?.length || 0,
      });
    } catch (error) {
      console.error('Failed to process record:', error, record);
      // In production, we would send this to a DLQ
    }
  }
  
  // Write each sensor's events to S3
  const promises: Promise<any>[] = [];
  
  for (const [sensorId, records] of recordsBySensor) {
    const key = `events/year=${year}/month=${month}/day=${day}/hour=${hour}/sensor=${sensorId}/${Date.now()}-${minute}.json`;
    
    const content = records
      .map(record => JSON.stringify(record))
      .join('\n');
    
    promises.push(
      s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: content,
        ContentType: 'application/x-ndjson',
        Metadata: {
          recordCount: String(records.length),
          processedAt: now.toISOString(),
        },
      }))
    );
  }
  
  await Promise.all(promises);
  
  console.log(`Processed ${event.Records.length} Kinesis records, wrote ${recordsBySensor.size} S3 objects`);
} 