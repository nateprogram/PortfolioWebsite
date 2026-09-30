// The plain text of Nate's resume, used by the ATS keyword tool to flag
// which JD keywords are NOT already present in the resume.
//
// Derived from the structured resume in resume.ts (the same data that
// renders /resume and /resume.pdf), so the "missing from your resume"
// flags can't drift from what a recruiter actually downloads.

import { resumeToPlainText } from "./resume";

export const RESUME_TEXT = resumeToPlainText();
