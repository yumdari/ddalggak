// 업로드할 수 있는 PDF의 최대 크기.
// Vercel은 요청 본문을 4.5MB까지만 받는다. 퀴즈·개념·카드·튜터는 PDF를 base64(약 1.33배)로 보내므로
// 3MB 파일 → 약 4.0MB 요청이 되어 한도 안에 들어온다.
export const MAX_PDF_MB = 3;
export const MAX_PDF_BYTES = MAX_PDF_MB * 1024 * 1024;
