import multer from 'multer';
import path from 'path';
import sharp from 'sharp';
import fs from 'fs';
import { Request, Response, NextFunction, Express } from 'express';

// Ensure images directory exists
const ensureImagesDirectory = () => {
    const imagesDir = path.resolve('./images');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
    }
};

// Disk storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        ensureImagesDirectory();
        cb(null, path.resolve('./src/images'));
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// File filter to allow only images
const fileFilter = (req: Request, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void): void => {
    const fileTypes = /jpeg|jpg|png|gif/i;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        return cb(new Error('Only images are allowed!'), false);
    }
};

// Initialize upload to accept a single image
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB file size limit
    }
}).single('image');

// Middleware to handle multer upload errors
const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
            // Multer-specific errors
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ 
                    error: 'File too large', 
                    message: 'File size should not exceed 5MB' 
                });
            }
            return res.status(400).json({ 
                error: 'File upload error', 
                message: err.message 
            });
        } else if (err) {
            // Other errors (like file type errors)
            return res.status(400).json({ 
                error: 'Upload error', 
                message: err.message || 'Error uploading file' 
            });
        }

        // If no file was uploaded
        if (!req.file) {
            return res.status(400).json({ 
                error: 'No file', 
                message: 'Please upload an image' 
            });
        }

        // Continue to the next middleware/route handler
        next();
    });
};

// Image upload handler
const uploadImage = async (req: Request, res: Response) => {
    try {
        // Ensure a file exists (from middleware)
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        res.status(200).json({ 
            message: 'Image uploaded successfully',
            originalFilename: req.file.originalname,
            filename: req.file.filename,
            size: req.file.size,
            path: req.file.path,
        });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ 
            error: 'Image upload failed', 
            message: 'Could not process the uploaded image' 
        });
    }
};

const resizeImage = async (req: Request, res: Response): Promise<Response> => {
    const width: number | undefined = parseInt(req.query.width as string, 10);
    const height: number | undefined = parseInt(req.query.height as string, 10);

    // Check if a file is uploaded
    if (!req.file) {
        console.log('No file uploaded');
        return res.status(400).send('No file uploaded');
    }


    // Check if dimensions are valid
    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        // delete the uploaded file
        await deleteFileFromServer(req.file.path);
        return res.status(400).json({ message: 'Please specify valid positive values for width and height.' });
    }


    // Check if at least one dimension is specified
    if (!width && !height) {
        // delete the uploaded file
        await deleteFileFromServer(req.file.path);
        return res.status(400).json({ message: 'The width and height parameters are required' });
    }

    try {
        // Generate the new file path
        const newFilePath: string = path.resolve(`./src/images/resized-${req.file.filename}`);

        // Resize the image using sharp
        const image = sharp(req.file.path); // Use req.file.path for the actual image path

        await image
            .resize(width, height)
            .toFormat('jpeg')
            .jpeg({ quality: 80 })
            .toFile(newFilePath);

        console.log('Image resized successfully to:', newFilePath);
        await deleteFileFromServer(req.file.path);
        return res.status(200).json({ message: 'Image resized successfully!', path: newFilePath });
    } catch (error) {
        console.error('Error resizing image:', error);
        return res.status(500).send('Error processing image.');
    }
};


/**
 * Image cropping controller
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<import('express').Response>} - Promise that resolves to an Express response object
 * @description This controller crops an uploaded image to the specified width and height
 *              using the sharp library. It accepts the crop parameters as query parameters
 *              or body parameters. If no file is uploaded, it returns a 400 error.
 *              If no crop parameters are specified, it returns a 400 error.
 *              If the cropping fails, it returns a 500 error.
 */


// Image cropping controller
const cropImage = async (req: Request, res: Response): Promise<Response> => {
    // Get crop parameters from query or request body
    const cropX: number = parseInt(req.query.cropX || req.body.cropX, 10);
    const cropY: number = parseInt(req.query.cropY || req.body.cropY, 10);
    const cropWidth: number = parseInt(req.query.cropWidth || req.body.cropWidth, 10);
    const cropHeight: number = parseInt(req.query.cropHeight || req.body.cropHeight, 10);

    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    if (isNaN(cropWidth) || isNaN(cropHeight) || cropWidth <= 0 || cropHeight <= 0) {
        // delete the uploaded file
        await deleteFileFromServer(req.file.path);
        return res.status(400).json({ message: 'Please specify valid positive values for cropWidth and cropHeight.' });
    }

    try {
        // Generate the new file path
        const newFilePath: string = path.resolve(`./src/images/cropped-${req.file.filename}`);

        // Crop the image using sharp
        await sharp(req.file.path)
            .extract({ width: cropWidth, height: cropHeight, left: cropX, top: cropY })
            .toFormat('jpeg')
            .jpeg({ quality: 80 })
            .toFile(newFilePath);

        console.log('Image cropped successfully to:', newFilePath);
        await deleteFileFromServer(req.file.path);
        res.send({ message: 'Image cropped successfully!', path: newFilePath });
    } catch (error) {
        if (error.message.includes('extract_area: bad extract area')) {
            console.error('Error cropping image:', error);
            deleteFileFromServer(req.file.path);
            res.status(400).send('Invalid crop parameters. Please check the coordinates and dimensions.');
        } else {
            console.error('Error cropping image:', error);
            deleteFileFromServer(req.file.path);
            res.status(500).send('Error processing image.');
        }
    }
};

/**
 * Image Download Controller by name
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @description This controller downloads an image from the server by its name.
 *              It accepts the image name as a route parameter.
 *              If the image is not found, it returns a 404 error.
 *              If there is an error downloading the image, it returns a 500 error.
 * @returns {void} - Does not return any value
 */
const downloadImage = (req: Request, res: Response): void => {
    const imageName: string = req.params.name;
    const imagePath: string = path.resolve(`./src/images/${imageName}`);
    res.download(imagePath, imageName, (err) => {
        if (err) {
            if (err.code === 'ENOENT') {
                console.log('Image not found:', err);
                return res.status(404).json({ message: 'Image not found' });
            }
            console.error('Error downloading image:', err);
            res.status(500).send('Error downloading image.');
        }
    });
};

/**
 * Image Filtering Controller
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<import('express').Response>} - Promise that resolves to an Express response object
 * @description This controller applies various image filters such as grayscale and blur to an image.
 *              It accepts a single image file and filter type as query parameters or body parameters.
 *              If no file is uploaded, it returns a 400 error.
 *              If no filter type is specified, it returns a 400 error.
 *              If the filtering fails, it returns a 500 error.
 */
const filterImage = async (req: Request, res: Response): Promise<Response> => {
    // Check if a file is uploaded
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    // Get filter type from query or request body
    const filter: string = req.query.filter || req.body.filter;

    // Check if a filter type is specified
    if (!filter) {
        await deleteFileFromServer(req.file.path);
        return res.status(400).send('Please specify a filter (grayscale or blur)');
    }

    try {
        // Get input image metadata
        const metadata: any = await sharp(req.file.path).metadata();

        // Create output file path
        const outputPath: string = path.resolve(`./src/images/filtered-${req.file.originalname}`);

        // Apply filter based on query parameter
        let processedImage: any;
        switch (filter.toLowerCase()) {
            case 'grayscale':
                processedImage = sharp(req.file.path)
                    .toFormat('jpeg')
                    .jpeg({ quality: 80 })
                    .grayscale();
                break;
            case 'blur':
                processedImage = sharp(req.file.path)
                    .toFormat('jpeg')
                    .jpeg({ quality: 80 })
                    .blur(20);
                break;
            default:
                await deleteFileFromServer(req.file.path);
                return res.status(400).json({ message: 'Invalid filter. Supported filters are grayscale and blur.'});
        }

        // Save the processed image
        await processedImage.toFile(outputPath);

        // Delete the original image
        await deleteFileFromServer(req.file.path);

        console.log('Image filtered successfully:', outputPath);
        res.json({
            message: 'Image filtered successfully!',
            path: outputPath,
            filter: filter
        });
    } catch (error) {
        console.error('Error filtering image:', error);
        await deleteFileFromServer(req.file.path);
        res.status(500).send('Error processing image.');
    }
};

/**
 * Applies a watermark to the uploaded image
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<import('express').Response>} - Promise that resolves to an Express response object
 * @description This controller takes an uploaded image and overlays a
 *              watermark SVG on top of it. The watermark SVG is generated
 *              based on the style parameter, which can be 'diagonal', 'grid', or 'scattered'.
 *              The watermark text is taken from the query parameter or body parameter 'watermark'.
 *              If the watermark text is not provided, it defaults to 'Watermark'.
 *              The output image is saved to a file with a unique filename, and
 *              the response is a JSON object with the filename, file path, and
 *              the style of the watermark.
 */
const waterMarkImage = async (req: Request, res: Response) => {
    // Check if file is uploaded
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!req.query.watermark && !req.body.watermark) {
        await deleteFileFromServer(req.file.path);
        return res.status(400).json({ message: 'Watermark text is required' });
    }

    // Get watermark text and options
    const rawWatermarkText: string = req.query.watermark || req.body.watermark || 'Watermark';
    const watermarkStyle: string = req.query.style || 'diagonal'; // Options: diagonal, grid, scattered

    try {
        // Get input image metadata
        const metadata: any = await sharp(req.file.path).metadata();

        // Create watermark SVG based on style
        const createWatermarkSVG = (width: number, height: number, style: string): Buffer => {
            /**
             * Creates a Watermark SVG based on the style parameter.
             * @param {number} width - Width of the image.
             * @param {number} height - Height of the image.
             * @param {string} style - Style of the watermark, can be 'diagonal', 'grid', or 'scattered'.
             * @returns {Buffer} - A Buffer containing the watermark SVG.
             */
            const fontSize: number = Math.max(width / 20, 24);
            let svgContent: string = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

            switch (style) {
                case 'diagonal':
                    // Diagonal line of watermarks
                    const diagonalSpacing: number = fontSize * 3;
                    for (let y = -height; y < height * 2; y += diagonalSpacing) {
                        for (let x = -width; x < width * 2; x += diagonalSpacing) {
                            svgContent += `
                                <text 
                                    x="${x}" 
                                    y="${y}" 
                                    font-size="${fontSize}" 
                                    font-family="Arial" 
                                    fill="rgba(255, 255, 255, 0.3)"
                                    transform="rotate(-30)"
                                >
                                    ${rawWatermarkText}
                                </text>
                            `;
                        }
                    }
                    break;

                case 'grid':
                    // Grid pattern of watermarks
                    const gridSpacingX: number = width / 5;
                    const gridSpacingY: number = height / 5;
                    for (let y = 0; y < height; y += gridSpacingY) {
                        for (let x = 0; x < width; x += gridSpacingX) {
                            svgContent += `
                                <text 
                                    x="${x}" 
                                    y="${y}" 
                                    font-size="${fontSize}" 
                                    font-family="Arial" 
                                    fill="rgba(255, 255, 255, 0.3)"
                                >
                                    ${rawWatermarkText}
                                </text>
                            `;
                        }
                    }
                    break;

                case 'scattered':
                    // Randomly scattered watermarks
                    const numWatermarks: number = 50;
                    for (let i = 0; i < numWatermarks; i++) {
                        const x: number = Math.random() * width;
                        const y: number = Math.random() * height;
                        const rotation: number = Math.random() * 360;
                        svgContent += `
                            <text 
                                x="${x}" 
                                y="${y}" 
                                font-size="${fontSize}" 
                                font-family="Arial" 
                                fill="rgba(255, 255, 255, 0.3)"
                                transform="rotate(${rotation} ${x} ${y})"
                            >
                                ${rawWatermarkText}
                            </text>
                        `;
                    }
                    break;

                default:
                    throw new Error('Invalid watermark style');
            }

            svgContent += `</svg>`;
            return Buffer.from(svgContent);
        };

        // Generate unique filename
        const outputFilename: string = `watermarked-${Date.now()}-${req.file.originalname}`;
        const outputPath: string = path.resolve(`./src/images/${outputFilename}`);

        // Apply watermark
        await sharp(req.file.path)
            .composite([{ 
                input: createWatermarkSVG(metadata.width, metadata.height, watermarkStyle), 
                top: 0,
                left: 0,
                blend: 'over'
            }])
            .toFile(outputPath);

        console.log('Image watermarked successfully to:', outputPath);
        await deleteFileFromServer(req.file.path);
        res.json({ 
            message: 'Image watermarked successfully!', 
            path: outputPath,
            filename: outputFilename,
            style: watermarkStyle
        });
    } catch (error) {
        console.error('Error applying text watermark:', error);
        await deleteFileFromServer(req.file.path);
        res.status(500).json({ 
            error: 'Error processing image', 
            details: error.message 
        });
    }
};

// Delete a file from the server
const deleteFileFromServer = async (filePath: string): Promise<void> => {
    try {
        await fs.promises.unlink(filePath);
    } catch (error) {
        console.error(`Error deleting file: ${error.message}`);
    }
};

export { uploadImage, resizeImage, uploadMiddleware, cropImage, downloadImage, filterImage, waterMarkImage, deleteFileFromServer };
