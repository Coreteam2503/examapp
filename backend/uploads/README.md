# Uploads Directory

This directory contains uploaded files from users. Files are automatically organized and stored securely.

## Security Notes
- File types are validated on upload
- File size is limited to 10MB
- Files are stored with unique names to prevent conflicts
- Only authenticated users can upload files
- Users can only access their own uploaded files

## File Structure
- Files are stored with format: `originalname-timestamp-random.ext`
- Original content is also stored in the database for processing
