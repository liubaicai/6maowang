import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.resolve();
export const publicDir = path.join(__dirname, 'public');
export const uploadsDir = path.join(publicDir, 'uploads');
export const originalsDir = path.join(uploadsDir, 'originals');
export const thumbsDir = path.join(uploadsDir, 'thumbs');

export function ensureUploadsDirs() {
	[publicDir, uploadsDir, originalsDir, thumbsDir].forEach((dir) => {
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
	});
}


