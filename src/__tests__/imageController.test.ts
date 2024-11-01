import request from 'supertest';
import express from 'express';
import router from '../routes/imageRoutes'; // Adjust the path based on your directory structure
import path from 'path';
import fs from 'fs';

const app = express();
app.use(express.json());
app.use('/', router); // Adjust the base route as necessary


describe('Image Controller', () => {
    // Test for image upload
    it('should upload an image', async () => {
        const response = await request(app)
            .post('/uploadImage')
            .attach('image', path.join(__dirname, 'example.jpg')); // Ensure correct path
    
        expect(response.status).toBe(200);
        //delete image
        fs.unlinkSync(response.body.path);
    });

    // Test for image resize
    it('should resize an image', async () => {
        const response = await request(app)
            .post('/resizeImage?width=100&height=100')
            .attach('image', path.join(__dirname, 'example.jpg')); // Ensure correct path
    
        expect(response.status).toBe(200);
        //delete image
        fs.unlinkSync(response.body.path);
    });

    // Test for image crop
    it('should crop an image', async () => {
        const response = await request(app)
            .post('/cropImage?cropX=10&cropY=10&cropWidth=100&cropHeight=100')
            .attach('image', path.join(__dirname, 'example.jpg')); // Ensure correct path
    
        expect(response.status).toBe(200);
        //delete image
        fs.unlinkSync(response.body.path);
    });

    // Test for image download
    it('should download an image', async () => {
        const response = await request(app)
            .get('/downloadImage/example.jpg')
    
        expect(response.status).toBe(200);
    });

    // Test for image filtering
    it('should filter an image', async () => {
        const response = await request(app)
            .post('/filterImage?filter=grayscale')
            .attach('image', path.join(__dirname, 'example.jpg')); // Ensure correct path
    
        expect(response.status).toBe(200);
        //delete image
        fs.unlinkSync(response.body.path);
    });

    // Test for image watermarking
    it('should watermark an image', async () => {
        const response = await request(app)
            .post('/watermarkImage?watermark=Watermark')
            .attach('image', path.join(__dirname, 'example.jpg')); // Ensure correct path
    
        expect(response.status).toBe(200);
        //delete image
        fs.unlinkSync(response.body.path);
    });
});

describe('Image Controller - Error Handling', () => {
    
    //Test for missing image in upload
    it('should return 400 if no image is uploaded', async () => {
        const response = await request(app)
            .post('/uploadImage');
    
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Please upload an image');
    });

    //Test for invalid resize dimensions
    it('should return 400 for invalid resize dimensions', async () => {
        const response = await request(app)
            .post('/resizeImage?width=0&height=0')
            .attach('image', path.join(__dirname, 'example.jpg'));
    
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Please specify valid positive values for width and height.');
    });

    //Test for invalid crop parameters
    it('should return 400 for invalid crop parameters', async () => {
        const response = await request(app)
            .post('/cropImage?cropX=-10&cropY=-10&cropWidth=0&cropHeight=0')
            .attach('image', path.join(__dirname, 'example.jpg'));
    
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Please specify valid positive values for cropWidth and cropHeight.');
    });

    //Test for missing image file in download
    it('should return 404 if image file does not exist', async () => {
        const response = await request(app)
            .get('/downloadImage/nonexistent.jpg');
    
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Image not found');
    });

    // Test for invalid filter type
    it('should return 400 for invalid filter type', async () => {
        const response = await request(app)
            .post('/filterImage?filter=unknownFilter')
            .attach('image', path.join(__dirname, 'example.jpg'));
    
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid filter. Supported filters are grayscale and blur.');
    });

    // Test for missing watermark text
    it('should return 400 if no watermark text is provided', async () => {
        const response = await request(app)
            .post('/watermarkImage')
            .attach('image', path.join(__dirname, 'example.jpg'));
    
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Watermark text is required');
    });
});
