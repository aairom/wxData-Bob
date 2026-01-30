/**
 * Upload Routes
 * 
 * Handles file uploads to MinIO/S3
 */

const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const config = require('../config/watsonx.config');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept json, csv, parquet, avro, orc files
    const allowedTypes = [
      'application/json',
      'text/csv',
      'application/octet-stream', // For parquet, avro, orc
      'text/plain',
    ];
    
    const allowedExtensions = ['.json', '.csv', '.parquet', '.avro', '.orc'];
    const fileExt = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (allowedExtensions.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`));
    }
  },
});

// Configure S3 client for MinIO
const getS3Client = () => {
  return new S3Client({
    endpoint: process.env.MINIO_ENDPOINT || 'https://localhost:9000',
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY || 'admin',
      secretAccessKey: process.env.MINIO_SECRET_KEY || 'password',
    },
    forcePathStyle: true,
    tls: true,
    rejectUnauthorized: false,
  });
};

/**
 * POST /api/upload
 * Upload a file to MinIO/S3
 */
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    const { bucket, path } = req.body;
    
    if (!bucket) {
      return res.status(400).json({
        success: false,
        error: 'Bucket name is required',
      });
    }

    // Construct the S3 key (path in bucket)
    const fileName = req.file.originalname;
    const s3Key = path ? `${path}/${fileName}` : fileName;

    logger.info(`Uploading file: ${fileName} to bucket: ${bucket}, key: ${s3Key}`);

    // Upload to S3/MinIO
    const s3Client = getS3Client();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      Metadata: {
        originalName: fileName,
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    logger.info(`File uploaded successfully: ${s3Key}`);

    res.json({
      success: true,
      data: {
        fileName: fileName,
        bucket: bucket,
        key: s3Key,
        size: req.file.size,
        contentType: req.file.mimetype,
        s3Path: `s3://${bucket}/${s3Key}`,
      },
    });
  } catch (error) {
    logger.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload file',
    });
  }
});

/**
 * POST /api/upload/multiple
 * Upload multiple files to MinIO/S3
 */
router.post('/multiple', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided',
      });
    }

    const { bucket, path } = req.body;
    
    if (!bucket) {
      return res.status(400).json({
        success: false,
        error: 'Bucket name is required',
      });
    }

    const s3Client = getS3Client();
    const uploadResults = [];
    const errors = [];

    // Upload each file
    for (const file of req.files) {
      try {
        const fileName = file.originalname;
        const s3Key = path ? `${path}/${fileName}` : fileName;

        const command = new PutObjectCommand({
          Bucket: bucket,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype,
          Metadata: {
            originalName: fileName,
            uploadedAt: new Date().toISOString(),
          },
        });

        await s3Client.send(command);

        uploadResults.push({
          fileName: fileName,
          bucket: bucket,
          key: s3Key,
          size: file.size,
          s3Path: `s3://${bucket}/${s3Key}`,
          success: true,
        });

        logger.info(`File uploaded successfully: ${s3Key}`);
      } catch (error) {
        logger.error(`Failed to upload file ${file.originalname}:`, error);
        errors.push({
          fileName: file.originalname,
          error: error.message,
        });
      }
    }

    res.json({
      success: errors.length === 0,
      data: {
        uploaded: uploadResults,
        failed: errors,
        total: req.files.length,
        successful: uploadResults.length,
        failed: errors.length,
      },
    });
  } catch (error) {
    logger.error('Multiple file upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload files',
    });
  }
});

module.exports = router;

// Made with Bob
