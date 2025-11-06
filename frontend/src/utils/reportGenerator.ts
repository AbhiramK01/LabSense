/**
 * Student Report Generator
 * Creates downloadable reports for student exam results
 */

import { getMySubmissions } from '../api';

interface StudentResult {
  exam_id: string;
  subject_name: string;
  language: string;
  duration_minutes: number;
  department_name?: string;
  section_name?: string;
  year?: number;
  score?: number;
  submitted_at?: string;
  exam_version?: number;
  original_subject_name?: string;
  best_score?: number;
  final_score?: number;
  submission_count?: number;
}

interface Submission {
  question_id: string;
  code: string;
  score: number;
  passed: boolean;
  public_case_results: boolean[];
  detailed_results?: any[];
  submitted_at: string;
  effort_score?: number;
  logic_similarity?: number;
  correctness?: number;
  llm_feedback?: {
    feedback?: string;
    strengths?: string;
    improvements?: string;
    scope_for_improvement?: string | any;
  };
}

interface StudentInfo {
  rollNumber?: string;
  departmentName?: string;
  year?: number;
  sectionName?: string;
  name?: string;
}

/**
 * Generate a report for a single exam
 */
export async function generateSingleExamReport(
  result: StudentResult,
  studentInfo: StudentInfo,
  getSubmissionsForExam: (examId: string, version?: number) => Promise<Submission[]>
): Promise<string> {
  return generateStudentReport([result], studentInfo, getSubmissionsForExam);
}

export async function generateStudentReport(
  results: StudentResult[],
  studentInfo: StudentInfo,
  getSubmissionsForExam: (examId: string, version?: number) => Promise<Submission[]>
): Promise<string> {
  const now = new Date();
  const reportDate = now.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Student Exam Report - ${studentInfo.rollNumber || 'Student'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: #ffffff;
      padding: 40px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 3px solid #9333EA;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #9333EA;
      font-size: 28px;
      margin-bottom: 15px;
    }
    .student-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }
    .info-item {
      padding: 10px;
      background: #f8f9fa;
      border-left: 4px solid #9333EA;
      border-radius: 4px;
    }
    .info-label {
      font-size: 12px;
      color: #64748B;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 16px;
      color: #1a1a1a;
      font-weight: 500;
    }
    .summary {
      background: linear-gradient(135deg, #9333EA 0%, #A855F7 100%);
      color: white;
      padding: 25px;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    .summary h2 {
      font-size: 20px;
      margin-bottom: 15px;
    }
    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
    }
    .stat-item {
      text-align: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    .stat-label {
      font-size: 14px;
      opacity: 0.9;
    }
    .exam-section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    .exam-header {
      background: #1a1a1a;
      color: white;
      padding: 20px;
      border-radius: 8px 8px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;
    }
    .exam-title {
      font-size: 22px;
      font-weight: 600;
    }
    .exam-meta {
      display: flex;
      gap: 20px;
      font-size: 14px;
      opacity: 0.9;
    }
    .exam-score {
      font-size: 24px;
      font-weight: 700;
      color: #10B981;
    }
    .question-card {
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      margin-top: 20px;
      overflow: hidden;
      background: white;
    }
    .question-header {
      background: #f8f9fa;
      padding: 15px 20px;
      border-bottom: 2px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .question-title {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
    }
    .question-scores {
      display: flex;
      gap: 20px;
      font-size: 14px;
    }
    .score-badge {
      padding: 6px 12px;
      border-radius: 6px;
      font-weight: 600;
    }
    .score-best {
      background: #D1FAE5;
      color: #047857;
    }
    .score-final {
      background: #DBEAFE;
      color: #1E40AF;
    }
    .submission-item {
      border-bottom: 1px solid #e5e7eb;
      padding: 20px;
    }
    .submission-item:last-child {
      border-bottom: none;
    }
    .submission-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .submission-time {
      font-size: 14px;
      color: #64748B;
    }
    .submission-score {
      font-size: 20px;
      font-weight: 700;
    }
    .code-block {
      background: #1a1a1a;
      color: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      overflow-x: auto;
      margin: 15px 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .test-results {
      margin-top: 15px;
    }
    .test-case {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 10px;
      background: #f8f9fa;
    }
    .test-case.passed {
      border-left: 4px solid #10B981;
      background: #F0FDF4;
    }
    .test-case.failed {
      border-left: 4px solid #DC2626;
      background: #FEF2F2;
    }
    .test-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    .test-status {
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    .test-status.passed {
      background: #D1FAE5;
      color: #047857;
    }
    .test-status.failed {
      background: #FECACA;
      color: #DC2626;
    }
    .test-detail {
      font-size: 13px;
      margin: 5px 0;
      padding: 8px;
      background: white;
      border-radius: 4px;
    }
    .test-label {
      font-weight: 600;
      color: #475569;
      margin-bottom: 4px;
      display: block;
    }
    .feedback-section {
      margin-top: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 6px;
    }
    .feedback-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 10px;
      color: #9333EA;
    }
    .feedback-item {
      margin-bottom: 15px;
    }
    .feedback-label {
      font-size: 13px;
      font-weight: 600;
      color: #64748B;
      margin-bottom: 5px;
      text-transform: uppercase;
    }
    .feedback-content {
      font-size: 14px;
      line-height: 1.8;
      color: #1a1a1a;
      white-space: pre-wrap;
    }
    .evaluation-breakdown {
      display: flex;
      gap: 10px;
      margin-top: 10px;
      flex-wrap: wrap;
    }
    .breakdown-chip {
      padding: 6px 12px;
      background: #e5e7eb;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #64748B;
      font-size: 12px;
    }
    @media print {
      body {
        padding: 20px;
      }
      .exam-section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Student Exam Performance Report</h1>
    <div style="color: #64748B; font-size: 14px;">Generated on ${reportDate}</div>
  </div>

  <div class="student-info">
    ${studentInfo.rollNumber ? `
    <div class="info-item">
      <div class="info-label">Roll Number</div>
      <div class="info-value">${studentInfo.rollNumber}</div>
    </div>
    ` : ''}
    ${studentInfo.name ? `
    <div class="info-item">
      <div class="info-label">Name</div>
      <div class="info-value">${studentInfo.name}</div>
    </div>
    ` : ''}
    ${studentInfo.departmentName ? `
    <div class="info-item">
      <div class="info-label">Department</div>
      <div class="info-value">${studentInfo.departmentName}</div>
    </div>
    ` : ''}
    ${studentInfo.year ? `
    <div class="info-item">
      <div class="info-label">Year</div>
      <div class="info-value">Year ${studentInfo.year}</div>
    </div>
    ` : ''}
    ${studentInfo.sectionName ? `
    <div class="info-item">
      <div class="info-label">Section</div>
      <div class="info-value">${studentInfo.sectionName}</div>
    </div>
    ` : ''}
  </div>

  <div class="summary">
    <h2>Performance Summary</h2>
    <div class="summary-stats">
      <div class="stat-item">
        <div class="stat-value">${results.length}</div>
        <div class="stat-label">Total Exams</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${results.length > 0 ? (results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length).toFixed(1) : '0'}%</div>
        <div class="stat-label">Average Score</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${results.filter(r => (r.score || 0) >= 70).length}</div>
        <div class="stat-label">Exams Passed (≥70%)</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${results.reduce((sum, r) => sum + (r.submission_count || 0), 0)}</div>
        <div class="stat-label">Total Submissions</div>
      </div>
    </div>
  </div>
`;

  // Generate detailed exam sections
  for (const result of results) {
    try {
      const submissions = await getSubmissionsForExam(result.exam_id, result.exam_version);
      
      // Group submissions by question
      const byQuestion: Record<string, Submission[]> = {};
      for (const sub of submissions) {
        const qid = sub.question_id || 'unknown';
        if (!byQuestion[qid]) byQuestion[qid] = [];
        byQuestion[qid].push(sub);
      }

      html += `
  <div class="exam-section">
    <div class="exam-header">
      <div>
        <div class="exam-title">${result.original_subject_name || result.subject_name}</div>
        <div class="exam-meta" style="margin-top: 8px;">
          <span>Language: ${result.language.toUpperCase()}</span>
          <span>Duration: ${result.duration_minutes} min</span>
          ${result.submitted_at ? `<span>Submitted: ${new Date(result.submitted_at).toLocaleString()}</span>` : ''}
        </div>
      </div>
      <div class="exam-score">${(result.score || 0).toFixed(1)}%</div>
    </div>
`;

      // Add question details
      for (const [qid, subs] of Object.entries(byQuestion)) {
        const sorted = subs.slice().sort((a, b) => 
          new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
        );
        const bestSub = sorted.reduce((best, cur) => 
          (cur.score || 0) > (best.score || 0) ? cur : best, sorted[0]
        );
        const finalSub = sorted[sorted.length - 1];

        html += `
    <div class="question-card">
      <div class="question-header">
        <div class="question-title">Question: ${qid}</div>
        <div class="question-scores">
          <span class="score-badge score-best">Best: ${(bestSub.score || 0).toFixed(1)}%</span>
          <span class="score-badge score-final">Final: ${(finalSub.score || 0).toFixed(1)}%</span>
          <span style="color: #64748B;">${subs.length} attempt${subs.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
`;

        // Add each submission
        for (const sub of sorted) {
          html += `
      <div class="submission-item">
        <div class="submission-header">
          <div class="submission-time">${new Date(sub.submitted_at).toLocaleString()}</div>
          <div class="submission-score" style="color: ${(sub.score || 0) >= 70 ? '#047857' : (sub.score || 0) >= 50 ? '#92400E' : '#DC2626'};">
            Score: ${(sub.score || 0).toFixed(1)}%
          </div>
        </div>

        ${sub.public_case_results ? `
        <div style="margin-bottom: 15px; font-size: 14px; color: #64748B;">
          Test Cases: ${sub.public_case_results.filter(Boolean).length}/${sub.public_case_results.length} passed
        </div>
        ` : ''}

        ${sub.detailed_results && sub.detailed_results.length > 0 ? `
        <div class="test-results">
          <div style="font-weight: 600; margin-bottom: 10px; color: #1a1a1a;">Test Case Results:</div>
          ${sub.detailed_results.map((tc: any, idx: number) => {
            const passed = tc?.passed === true;
            return `
            <div class="test-case ${passed ? 'passed' : 'failed'}">
              <div class="test-header">
                <span class="test-status ${passed ? 'passed' : 'failed'}">Test ${idx + 1}: ${passed ? 'PASSED' : 'FAILED'}</span>
                ${tc.execution_time ? `<span style="color: #64748B; font-size: 12px;">${(tc.execution_time * 1000).toFixed(2)}ms</span>` : ''}
              </div>
              ${tc.input !== undefined ? `
              <div class="test-detail">
                <span class="test-label">Input:</span>
                <div style="font-family: monospace; font-size: 12px; margin-top: 4px; padding: 8px; background: white; border-radius: 4px;">
                  ${tc.input || '(empty)'}
                </div>
              </div>
              ` : ''}
              ${tc.expected_output !== undefined ? `
              <div class="test-detail">
                <span class="test-label">Expected Output:</span>
                <div style="font-family: monospace; font-size: 12px; margin-top: 4px; padding: 8px; background: white; border-radius: 4px;">
                  ${tc.expected_output || '(empty)'}
                </div>
              </div>
              ` : ''}
              ${tc.actual_output !== undefined ? `
              <div class="test-detail">
                <span class="test-label">Your Output:</span>
                <div style="font-family: monospace; font-size: 12px; margin-top: 4px; padding: 8px; background: ${passed ? '#F0FDF4' : '#FEF2F2'}; border-radius: 4px; color: ${passed ? '#047857' : '#DC2626'};">
                  ${tc.actual_output || '(empty)'}
                </div>
              </div>
              ` : ''}
              ${tc.error ? `
              <div class="test-detail">
                <span class="test-label" style="color: #DC2626;">Error:</span>
                <div style="font-family: monospace; font-size: 12px; margin-top: 4px; padding: 8px; background: #FEF2F2; border-radius: 4px; color: #DC2626;">
                  ${tc.error}
                </div>
              </div>
              ` : ''}
            </div>
            `;
          }).join('')}
        </div>
        ` : ''}

        <div style="margin-top: 15px;">
          <div style="font-weight: 600; margin-bottom: 8px; color: #1a1a1a;">Submitted Code:</div>
          <div class="code-block">${escapeHtml(sub.code || 'No code available')}</div>
        </div>

        ${sub.llm_feedback && Object.keys(sub.llm_feedback).length > 0 ? `
        <div class="feedback-section">
          <div class="feedback-title">AI Feedback & Insights</div>
          
          ${sub.llm_feedback.feedback ? `
          <div class="feedback-item">
            <div class="feedback-label">Overall Feedback</div>
            <div class="feedback-content">${escapeHtml(sub.llm_feedback.feedback)}</div>
          </div>
          ` : ''}
          
          ${sub.llm_feedback.strengths ? `
          <div class="feedback-item">
            <div class="feedback-label" style="color: #047857;">Strengths</div>
            <div class="feedback-content">${escapeHtml(sub.llm_feedback.strengths)}</div>
          </div>
          ` : ''}
          
          ${sub.llm_feedback.improvements ? `
          <div class="feedback-item">
            <div class="feedback-label" style="color: #92400E;">Areas for Improvement</div>
            <div class="feedback-content">${escapeHtml(sub.llm_feedback.improvements)}</div>
          </div>
          ` : ''}
          
          ${sub.llm_feedback.scope_for_improvement ? `
          <div class="feedback-item">
            <div class="feedback-label" style="color: #1E40AF;">Scope for Improvement</div>
            <div class="feedback-content">${escapeHtml(
              typeof sub.llm_feedback.scope_for_improvement === 'string' 
                ? sub.llm_feedback.scope_for_improvement 
                : JSON.stringify(sub.llm_feedback.scope_for_improvement, null, 2)
            )}</div>
          </div>
          ` : ''}
          
          ${(typeof sub.effort_score === 'number' || typeof sub.logic_similarity === 'number' || typeof sub.correctness === 'number') ? `
          <div class="evaluation-breakdown">
            ${sub.effort_score !== undefined ? `<span class="breakdown-chip">Effort: ${(sub.effort_score * 100).toFixed(1)}%</span>` : ''}
            ${sub.logic_similarity !== undefined ? `<span class="breakdown-chip">Logic Similarity: ${(sub.logic_similarity * 100).toFixed(1)}%</span>` : ''}
            ${sub.correctness !== undefined ? `<span class="breakdown-chip">Test Cases: ${(sub.correctness * 100).toFixed(1)}%</span>` : ''}
          </div>
          ` : ''}
        </div>
        ` : ''}
      </div>
`;
        }

        html += `
    </div>
`;
      }

      html += `
  </div>
`;
    } catch (err) {
      console.error(`Failed to load submissions for exam ${result.exam_id}:`, err);
      // Continue with other exams
    }
  }

  html += `
  <div class="footer">
    <p>This report was generated automatically by LabSense Evaluation System</p>
    <p>Report includes all completed exams with detailed submissions, test case results, and AI-generated feedback</p>
  </div>
</body>
</html>
`;

  return html;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function downloadReport(htmlContent: string, filename: string = 'student-report') {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printReport(htmlContent: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to print the report');
    return;
  }
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

