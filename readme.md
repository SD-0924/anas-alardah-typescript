# Image Processing API using TypeScript

A robust REST API for image processing built with TypeScript, Express, and Sharp. This API provides various image manipulation functionalities including resizing, cropping, filtering, and watermarking.

## Features

- 📤 Image upload with validation
- 🖼️ Image resizing with custom dimensions
- ✂️ Image cropping with specified coordinates
- 🎨 Image filtering (grayscale and blur)
- 💧 Watermarking with customizable text and styles
- ⬇️ Image download functionality
- 🔒 File type validation
- 💾 Automatic file cleanup

## Technical Details

### Dependencies

- `express` - Web framework
- `multer` - File upload handling
- `sharp` - Image processing
- `typescript` - Type safety and modern JavaScript features

### File Upload Specifications

- Supported formats: JPEG, JPG, PNG, GIF
- Maximum file size: 5MB
- Files are stored in the `./src/images` directory

## API Endpoints

### Upload Image
```http
POST /upload
```
Uploads a single image file with validation.

### Resize Image
```http
POST /resize?width=<width>&height=<height>
```
Resizes an uploaded image to specified dimensions.

Parameters:
- `width` (required) - Target width in pixels
- `height` (required) - Target height in pixels

### Crop Image
```http
POST /crop
```
Crops an image to specified dimensions from given coordinates.

Parameters:
- `cropX` - Starting X coordinate
- `cropY` - Starting Y coordinate
- `cropWidth` - Width of crop area
- `cropHeight` - Height of crop area

### Filter Image
```http
POST /filter?filter=<filterType>
```
Applies filters to the uploaded image.

Available filters:
- `grayscale`
- `blur`

### Watermark Image
```http
POST /watermark
```
Applies a watermark to the uploaded image.

Parameters:
- `watermark` (required) - Text to use as watermark
- `style` (optional) - Watermark style (`diagonal`, `grid`, or `scattered`, default: `diagonal`)

### Download Image
```http
GET /download/:name
```
Downloads a processed image by filename.

## Error Handling

The API includes comprehensive error handling for:
- File size limits
- Invalid file types
- Missing files
- Invalid parameters
- Processing errors
- File system errors

## Security Features

- File type validation using both extension and mimetype
- Automatic cleanup of temporary files
- Secure file naming with unique identifiers
- Size limitations on uploads

## Example Usage

### Resize an Image
```javascript
const formData = new FormData();
formData.append('image', imageFile);

fetch('/resizeImage?width=800&height=600', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

### Apply a Watermark
```javascript
const formData = new FormData();
formData.append('image', imageFile);

fetch('/watermark?watermark=Copyright%202024', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Create an images directory:
```bash
mkdir -p src/images
```
4. Start the server:
```bash
npm start
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
