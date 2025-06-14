# Bulk Upload Feature Documentation

## Overview

The bulk upload feature allows administrators to automatically extract and upload course data from PDF files using OpenAI's Responses API. This feature significantly reduces manual data entry time and ensures consistency in course data.

## Components

### 1. CSV Parser (`csvParser.js`)
Handles the parsing and validation of CSV data extracted from PDFs.

**Functions:**
- `parseCsvToMaterii(csvData, facultate, specializare)` - Parses CSV data into materii objects
- `bulkUploadMaterii(materiiList, onProgress)` - Bulk uploads materii to Firebase
- `validateCsvData(csvData)` - Validates CSV structure before processing

### 2. Bulk Upload Tab (`BulkUploadTab.js`)
The main interface for the bulk upload functionality.

**Features:**
- Faculty and specialization selection
- PDF file upload with validation
- Processing overlay with animated spinner
- Funny Romanian loading messages

### 3. Bulk Upload Preview (`BulkUploadPreview.js`)
Shows a preview of extracted courses before uploading to Firebase.

**Features:**
- Preview of all extracted courses
- Course details display (name, type, year, semester, credits)
- Confirmation/cancellation options
- Upload results display

## Data Flow

1. **File Upload**: User selects faculty, specialization, and uploads PDF
2. **OpenAI Processing**: PDF is sent to OpenAI Responses API for extraction
3. **CSV Parsing**: Returned CSV data is parsed and validated
4. **Preview**: User reviews extracted courses before upload
5. **Bulk Upload**: Confirmed courses are uploaded to Firebase
6. **Results**: Success/error results are displayed

## CSV Format

The expected CSV format from OpenAI:
```
Course name, Status (Mandatory or Optional), Semester, Year, Credits
```

### Status Mapping
- `Mandatory` → `obligatorie: true`
- `Optional` → `obligatorie: false`
- `Facultative` → `obligatorie: false`

### Year Mapping
- `1` or `I` → `I`
- `2` or `II` → `II`
- `3` or `III` → `III`

## Firebase Document Structure

Each materie document contains:
```javascript
{
  nume: string,           // Course name
  facultate: string,      // Faculty
  specializare: string,   // Specialization
  an: string,            // Year (I, II, III)
  semestru: string,      // Semester (1, 2)
  credite: string,       // Credits (as string)
  obligatorie: boolean,  // Mandatory/Optional
  locuriDisponibile: number | null, // Available spots (null for mandatory)
  descriere: string,     // Description (empty for bulk uploads)
  profesori: [],         // Professors array (empty initially)
  studentiInscrisi: []   // Enrolled students (empty initially)
}
```

## Error Handling

### Validation Errors
- Empty CSV data
- Invalid course data (missing fields, invalid years/semesters)
- File type validation (PDF only, max 10MB)

### Upload Errors
- Firebase connection issues
- Individual course upload failures
- Partial upload scenarios

### User Feedback
- Real-time progress updates during upload
- Detailed error reporting
- Success/failure statistics

## Usage Instructions

1. Navigate to Admin → Materii → Import în Masă
2. Select the faculty and specialization
3. Upload a PDF file containing course curriculum
4. Wait for OpenAI processing (with funny loading messages)
5. Review the extracted courses in the preview
6. Confirm to upload or cancel to retry
7. View upload results and any errors

## Technical Notes

### OpenAI Integration
- Uses Responses API with specific instructions for PDF extraction
- Handles file upload to OpenAI servers
- Implements comprehensive response debugging

### Performance Considerations
- Progress tracking for large uploads
- Individual error handling to prevent total failure
- Efficient CSV parsing with validation

### Security
- File type and size validation
- Input sanitization
- Error message sanitization

## Maintenance

### Adding New Faculties/Specializations
Update the constants in `constants.js`:
```javascript
export const facultati = [
  // Add new faculty here
];

export const specializari = {
  "New Faculty": ["Spec1", "Spec2"]
};
```

### Modifying CSV Format
Update the parsing logic in `csvParser.js` if the OpenAI prompt or expected format changes.

### Error Handling Updates
Modify error messages and handling in both `csvParser.js` and the main upload function.

## Future Enhancements

1. **Duplicate Detection**: Check for existing courses before upload
2. **Batch Processing**: Handle multiple PDF files at once
3. **Template Validation**: Ensure PDF follows expected curriculum format
4. **Professor Assignment**: Automatically assign professors based on course names
5. **Rollback Functionality**: Ability to undo bulk uploads

## Troubleshooting

### Common Issues

1. **OpenAI API Errors**
   - Check API key configuration
   - Verify rate limits
   - Check file size and format

2. **CSV Parsing Errors**
   - Review OpenAI prompt instructions
   - Check for malformed CSV data
   - Validate course data format

3. **Firebase Upload Errors**
   - Check Firebase permissions
   - Verify document structure
   - Monitor Firestore quotas

### Debug Information

All operations are logged to the console with detailed information:
- CSV parsing steps
- Individual course validation
- Upload progress and results
- Error details and stack traces 