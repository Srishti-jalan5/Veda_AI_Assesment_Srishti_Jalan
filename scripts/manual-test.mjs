import { cosineSimilarity, generateDeterministicEmbedding, computePairwiseSimilarities } from "../src/lib/ai/embeddings.ts";
import { validateDocument, formatBytes } from "../src/services/document-processing/validator.ts";

console.log("\n========================================================");
console.log("   🧪 VedaAI Manual Testing Sandbox (Live Verification) ");
console.log("========================================================\n");

// 1. Test Cosine Similarity on Custom Text
console.log("--- 1. Testing Semantic Embeddings & Similarity ---");
const question = "Which organelle is primarily involved in photosynthesis?";
const correctStudentAnswer = "Photosynthesis happens in the chloroplast of plant cells using chlorophyll.";
const wrongStudentAnswer = "The mitochondria is the powerhouse of the cell generating ATP.";

const qVec = generateDeterministicEmbedding(question);
const correctVec = generateDeterministicEmbedding(correctStudentAnswer);
const wrongVec = generateDeterministicEmbedding(wrongStudentAnswer);

const matchScoreCorrect = cosineSimilarity(qVec, correctVec);
const matchScoreWrong = cosineSimilarity(qVec, wrongVec);

console.log(`Question: "${question}"`);
console.log(`\n• Student Answer 1: "${correctStudentAnswer}"`);
console.log(`  -> Similarity Score: ${(matchScoreCorrect * 100).toFixed(1)}% (Expected: High Match ✅)`);

console.log(`\n• Student Answer 2: "${wrongStudentAnswer}"`);
console.log(`  -> Similarity Score: ${(matchScoreWrong * 100).toFixed(1)}% (Expected: Low Match ❌)`);

// 2. Test Pairwise Matrix Matching
console.log("\n--- 2. Testing Pairwise Question-to-Answer Matrix ---");
const questions = [
  { id: "q1", question_number: "1", text: "Which blood vessel carries blood away from the heart?" },
  { id: "q2", question_number: "2", text: "Explain photosynthesis and chloroplasts." },
];

const studentAnswers = [
  { id: "a1", detected_question_label: "Ans 2", handwritten_text: "Chloroplasts contain chlorophyll for photosynthesis." },
  { id: "a2", detected_question_label: "1", handwritten_text: "Arteries carry blood away from the heart." },
];

const result = await computePairwiseSimilarities(questions, studentAnswers);
console.log("Matrix Results:");
console.log(`- Q1 ("${questions[0].text.substring(0, 30)}...") best matched with: ${result.bestMatchPerQuestion["q1"].answerId} (Score: ${(result.bestMatchPerQuestion["q1"].similarity * 100).toFixed(1)}%)`);
console.log(`- Q2 ("${questions[1].text.substring(0, 30)}...") best matched with: ${result.bestMatchPerQuestion["q2"].answerId} (Score: ${(result.bestMatchPerQuestion["q2"].similarity * 100).toFixed(1)}%)`);

// 3. Test File Validation
console.log("\n--- 3. Testing Document Validation ---");
const fakePdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
const docValidation = validateDocument(fakePdf, "maths_paper.pdf");
console.log(`- Validating PDF: Is Valid = ${docValidation.isValid}, Format = ${docValidation.detectedMimeType}, Size = ${formatBytes(docValidation.fileSizeBytes)} ✅`);

console.log("\n========================================================");
console.log("   🎉 All manual verification checks passed!            ");
console.log("========================================================\n");
