/**
 * Interface for a single row in the feedback table
 */
export interface FeedbackRow {
  urduPhrase: string;
  userTranslation: string;
  suggestedTranslation: string;
  explanation: string;
}

/**
 * Parsed feedback response
 */
export interface ParsedFeedback {
  feedbackRows: FeedbackRow[];
  naturalVersion: string;
  score: number;
  rawResponse: string;
}

/**
 * Parse the Gemini feedback response
 * Extracts the table data, natural version, and score
 */
export function parseFeedbackResponse(response: string): ParsedFeedback {
  const feedbackRows: FeedbackRow[] = [];
  let naturalVersion = '';
  let score = 0;

  try {
    console.log('=== Parsing Gemini Feedback Response ===');
    console.log('Response length:', response.length);
    console.log('First 500 chars:', response.substring(0, 500));

    // Extract table rows
    const tableMatch = response.match(/\|.*\|[\s\S]*?\n\n/);
    if (tableMatch) {
      console.log('✓ Found table match');
      const tableText = tableMatch[0];
      const lines = tableText.split('\n').filter(line => line.trim());
      console.log(`Found ${lines.length} lines in table`);

      // Skip header and separator rows
      for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || !line.startsWith('|')) continue;

        // Parse table row: | col1 | col2 | col3 | col4 |
        const columns = line
          .split('|')
          .map(col => col.trim())
          .filter(col => col);

        if (columns.length >= 4) {
          feedbackRows.push({
            urduPhrase: columns[0],
            userTranslation: columns[1],
            suggestedTranslation: columns[2],
            explanation: columns[3],
          });
        }
      }
      console.log(`✓ Parsed ${feedbackRows.length} feedback rows`);
    } else {
      console.warn('✗ No table match found in response');
    }

    // Extract natural version
    const naturalMatch = response.match(/##\s*Natural Version\s*\n+([\s\S]*?)(?=\n##|$)/i);
    if (naturalMatch) {
      naturalVersion = naturalMatch[1].trim();
      console.log('✓ Found natural version:', naturalVersion.substring(0, 100));
    } else {
      console.warn('✗ No natural version found');
    }

    // Extract score
    const scoreMatch = response.match(/##\s*Overall Score\s*\n+([\d.]+)/i);
    if (scoreMatch) {
      score = parseFloat(scoreMatch[1]);
      // Ensure score is between 0 and 10
      score = Math.max(0, Math.min(10, score));
      console.log('✓ Found score:', score);
    } else {
      console.warn('✗ No score match found');
    }

    // Fallback: if no structured data found, try to extract score from anywhere in response
    if (score === 0) {
      const anyScoreMatch = response.match(/(\d+(?:\.\d+)?)\s*(?:\/\s*10|out of 10)/i);
      if (anyScoreMatch) {
        score = parseFloat(anyScoreMatch[1]);
        score = Math.max(0, Math.min(10, score));
        console.log('✓ Found score via fallback:', score);
      }
    }

    // If still no score, default to 5 and log warning
    if (score === 0) {
      console.warn('⚠ No score found, defaulting to 5. This may indicate the model did not follow the prompt format.');
      console.log('Full response for debugging:', response);
      score = 5;
    }

    const result = {
      feedbackRows,
      naturalVersion: naturalVersion || 'Natural version not available.',
      score,
      rawResponse: response,
    };

    console.log('=== Parsing Complete ===');
    console.log('Summary:', {
      feedbackRowsCount: feedbackRows.length,
      hasNaturalVersion: !!naturalVersion,
      score,
    });

    return result;
  } catch (error) {
    console.error('=== Error Parsing Feedback ===');
    console.error('Error:', error);
    console.error('Response:', response);

    // If parsing fails, return basic structure with raw response
    return {
      feedbackRows: [],
      naturalVersion: 'Unable to parse feedback. Please see raw response.',
      score: 5,
      rawResponse: response,
    };
  }
}
