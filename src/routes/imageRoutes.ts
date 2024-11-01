import express from 'express';
import {uploadMiddleware, uploadImage, resizeImage, cropImage, downloadImage, filterImage, waterMarkImage} from '../controllers/imageController';

const router = express.Router();

// Route to handle image upload
router.post('/uploadImage', uploadMiddleware ,uploadImage);
router.post('/resizeImage', uploadMiddleware, resizeImage);
router.post('/cropImage', uploadMiddleware, cropImage);
router.post('/filterImage', uploadMiddleware ,filterImage);
router.post('/waterMarkImage', uploadMiddleware, waterMarkImage);
router.get('/downloadImage/:name', downloadImage);

export default router;

