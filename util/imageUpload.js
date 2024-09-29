import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { StatusCodes } from 'http-status-codes';
import { fileURLToPath } from 'url';

// Define __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const uploadImage = async ({
  req,
  res,
  Model,
  modelName,
  imageField,
  docId
}) => {
  try {
    console.log('... uploading image ...');
    
    const FILE_TYPE_MAP = {
      'image/png': 'png',
      'image/jpg': 'jpg',
      'image/jpeg': 'jpeg',
      'image/webp': 'webp',
    };

    const file = req.body.image;

    // Check if file exists
    if (!file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'No file uploaded.',
      });
    }
    console.log(file.mimetype)
    // Validate file type
    const isValid = FILE_TYPE_MAP[file.mimetype];
    if (!isValid) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Unsupported file format.',
      });
    }

    const fileName = file.originalname.replace(/ /g, '-');
    const newName =
      'img' + '-' + Date.now() + '-' + fileName.split('.')[0] + '.webp';

    // Process and convert the image
    const processedImg = await sharp(file.buffer)
      .toFormat('webp', { quality: 80 })
      .toBuffer();

    // Save the processed image to the upload directory
    const filePath = path.join(uploadDir, newName);
    fs.writeFileSync(filePath, processedImg);

    // Find the document by ID
    const document = await Model.findById(docId);
    if (!document) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: `${modelName} not found.`,
      });
    }

    // Update the document with the image path
    if (!Array.isArray(document[imageField])) {
      document[imageField] = [];
    }

    document[imageField].push(newName);
    await document.save();

    // Send success response
    return res.status(StatusCodes.CREATED).json({
      status: 'Created',
      message: `${modelName} image has been uploaded successfully!`,
      data: document,
    });
  } catch (error) {
    console.error('Error uploading the image:', error);
    // Ensure that we only send the error response once
    if (!res.headersSent) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Error uploading the image.',
      });
    }
  }
};

