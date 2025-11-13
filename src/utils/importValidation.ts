/**
 * Import Validation Utilities for Voter Database
 * Validates and transforms imported voter data from Excel files
 */

export interface ImportVoterRow {
  'Voter ID': string;
  'First Name': string;
  'Last Name'?: string;
  'Middle Name'?: string;
  'Age': number;
  'Gender': string;
  'Date of Birth'?: string;
  'Phone': string;
  'Alternate Phone'?: string;
  'Email'?: string;
  'Caste'?: string;
  'Religion'?: string;
  'Education'?: string;
  'Occupation'?: string;
  'Booth'?: string | number;
  'Ward'?: string;
  'Pincode'?: string;
  'Address Line 1'?: string;
  'Address Line 2'?: string;
  'Party Affiliation'?: string;
  'Sentiment'?: string;
  'Influence Level'?: string;
  'Tags'?: string;
  'Is Opinion Leader'?: string | boolean;
  'Is Active'?: string | boolean;
  'Notes'?: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface TransformedVoter {
  voter_id: string;
  first_name: string;
  last_name?: string;
  middle_name?: string;
  age: number;
  gender: string;
  date_of_birth?: string;
  phone: string;
  alternate_phone?: string;
  email?: string;
  caste?: string;
  religion?: string;
  education?: string;
  occupation?: string;
  booth_number?: number;
  ward?: string;
  pincode?: string;
  address_line1?: string;
  address_line2?: string;
  party_affiliation?: string;
  sentiment?: string;
  influence_level?: string;
  tags?: string[];
  is_opinion_leader?: boolean;
  is_active?: boolean;
  notes?: string;
}

/**
 * Validates a single voter row from imported data
 */
export function validateVoterRow(row: any, rowNumber: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required field validation
  if (!row['Voter ID'] || String(row['Voter ID']).trim() === '') {
    errors.push({
      row: rowNumber,
      field: 'Voter ID',
      message: 'Voter ID is required'
    });
  }

  if (!row['First Name'] || String(row['First Name']).trim() === '') {
    errors.push({
      row: rowNumber,
      field: 'First Name',
      message: 'First Name is required'
    });
  }

  if (!row['Age']) {
    errors.push({
      row: rowNumber,
      field: 'Age',
      message: 'Age is required'
    });
  } else {
    const age = Number(row['Age']);
    if (isNaN(age)) {
      errors.push({
        row: rowNumber,
        field: 'Age',
        message: 'Age must be a number'
      });
    } else if (age < 18 || age > 120) {
      errors.push({
        row: rowNumber,
        field: 'Age',
        message: 'Age must be between 18 and 120'
      });
    }
  }

  if (!row['Gender'] || String(row['Gender']).trim() === '') {
    errors.push({
      row: rowNumber,
      field: 'Gender',
      message: 'Gender is required'
    });
  } else {
    const gender = String(row['Gender']).toLowerCase();
    if (!['male', 'female', 'other'].includes(gender)) {
      errors.push({
        row: rowNumber,
        field: 'Gender',
        message: 'Gender must be Male, Female, or Other'
      });
    }
  }

  if (!row['Phone'] || String(row['Phone']).trim() === '') {
    errors.push({
      row: rowNumber,
      field: 'Phone',
      message: 'Phone is required'
    });
  } else {
    const phone = String(row['Phone']).replace(/\D/g, '');
    if (phone.length !== 10) {
      errors.push({
        row: rowNumber,
        field: 'Phone',
        message: 'Phone must be 10 digits'
      });
    }
  }

  if (!row['Booth']) {
    errors.push({
      row: rowNumber,
      field: 'Booth',
      message: 'Booth is required'
    });
  }

  // Optional field validation
  if (row['Email'] && row['Email'].trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(row['Email']))) {
      errors.push({
        row: rowNumber,
        field: 'Email',
        message: 'Invalid email format'
      });
    }
  }

  if (row['Sentiment'] && row['Sentiment'].trim() !== '') {
    const sentiment = String(row['Sentiment']).toLowerCase();
    if (!['positive', 'negative', 'neutral'].includes(sentiment)) {
      errors.push({
        row: rowNumber,
        field: 'Sentiment',
        message: 'Sentiment must be Positive, Negative, or Neutral'
      });
    }
  }

  if (row['Influence Level'] && row['Influence Level'].trim() !== '') {
    const influenceLevel = String(row['Influence Level']).toLowerCase();
    if (!['high', 'medium', 'low'].includes(influenceLevel)) {
      errors.push({
        row: rowNumber,
        field: 'Influence Level',
        message: 'Influence Level must be High, Medium, or Low'
      });
    }
  }

  return errors;
}

/**
 * Transforms imported row data to database format
 */
export function transformImportRow(row: ImportVoterRow): TransformedVoter {
  const voter: TransformedVoter = {
    voter_id: String(row['Voter ID']).trim(),
    first_name: String(row['First Name']).trim(),
    age: Number(row['Age']),
    gender: String(row['Gender']).toLowerCase(),
    phone: String(row['Phone']).replace(/\D/g, ''),
  };

  // Optional fields
  if (row['Last Name']) {
    voter.last_name = String(row['Last Name']).trim();
  }

  if (row['Middle Name']) {
    voter.middle_name = String(row['Middle Name']).trim();
  }

  if (row['Date of Birth']) {
    voter.date_of_birth = String(row['Date of Birth']).trim();
  }

  if (row['Alternate Phone']) {
    voter.alternate_phone = String(row['Alternate Phone']).replace(/\D/g, '');
  }

  if (row['Email'] && String(row['Email']).trim()) {
    voter.email = String(row['Email']).trim().toLowerCase();
  }

  if (row['Caste']) {
    voter.caste = String(row['Caste']).trim();
  }

  if (row['Religion']) {
    voter.religion = String(row['Religion']).trim();
  }

  if (row['Education']) {
    voter.education = String(row['Education']).trim();
  }

  if (row['Occupation']) {
    voter.occupation = String(row['Occupation']).trim();
  }

  if (row['Booth']) {
    voter.booth_number = Number(row['Booth']);
  }

  if (row['Ward']) {
    voter.ward = String(row['Ward']).trim();
  }

  if (row['Pincode']) {
    voter.pincode = String(row['Pincode']).trim();
  }

  if (row['Address Line 1']) {
    voter.address_line1 = String(row['Address Line 1']).trim();
  }

  if (row['Address Line 2']) {
    voter.address_line2 = String(row['Address Line 2']).trim();
  }

  if (row['Party Affiliation']) {
    voter.party_affiliation = String(row['Party Affiliation']).trim();
  }

  if (row['Sentiment']) {
    voter.sentiment = String(row['Sentiment']).toLowerCase();
  }

  if (row['Influence Level']) {
    voter.influence_level = String(row['Influence Level']).toLowerCase();
  }

  if (row['Tags'] && String(row['Tags']).trim()) {
    // Split comma-separated tags
    voter.tags = String(row['Tags'])
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');
  }

  if (row['Is Opinion Leader'] !== undefined && row['Is Opinion Leader'] !== '') {
    const value = String(row['Is Opinion Leader']).toLowerCase();
    voter.is_opinion_leader = value === 'true' || value === 'yes' || value === '1';
  }

  if (row['Is Active'] !== undefined && row['Is Active'] !== '') {
    const value = String(row['Is Active']).toLowerCase();
    voter.is_active = value === 'true' || value === 'yes' || value === '1';
  } else {
    voter.is_active = true; // Default to active
  }

  if (row['Notes']) {
    voter.notes = String(row['Notes']).trim();
  }

  return voter;
}

/**
 * Validates an entire batch of imported rows
 */
export function validateImportBatch(
  rows: any[]
): { valid: TransformedVoter[]; errors: ValidationError[] } {
  const valid: TransformedVoter[] = [];
  const errors: ValidationError[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because index is 0-based and Excel starts at row 2 (after header)
    const rowErrors = validateVoterRow(row, rowNumber);

    if (rowErrors.length === 0) {
      valid.push(transformImportRow(row));
    } else {
      errors.push(...rowErrors);
    }
  });

  return { valid, errors };
}

/**
 * Generates a summary message for import results
 */
export function generateImportSummary(
  totalRows: number,
  successCount: number,
  duplicateCount: number,
  errorCount: number
): string {
  const messages = [];

  if (successCount > 0) {
    messages.push(`${successCount} voter${successCount !== 1 ? 's' : ''} imported successfully`);
  }

  if (duplicateCount > 0) {
    messages.push(`${duplicateCount} duplicate${duplicateCount !== 1 ? 's' : ''} skipped`);
  }

  if (errorCount > 0) {
    messages.push(`${errorCount} error${errorCount !== 1 ? 's' : ''} encountered`);
  }

  return messages.join(', ');
}
