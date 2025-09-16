import express from 'express';
import bcrypt from 'bcrypt';
import { db } from '../sqlite.js';

export const authRouter = express.Router();

function requireAuth(req, res, next) {
	if (!req.session.userId) {
		return res.redirect('/login');
	}
	next();
}

authRouter.get('/login', (req, res) => {
	if (req.session.userId) return res.redirect('/');
	res.render('auth/login', { title: '登录' });
});

authRouter.post('/login', (req, res) => {
	const { username, password } = req.body;
	const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
	if (!user) return res.render('auth/login', { title: '登录', error: '用户名或密码错误' });
	const ok = bcrypt.compareSync(password, user.password_hash);
	if (!ok) return res.render('auth/login', { title: '登录', error: '用户名或密码错误' });
	req.session.userId = user.id;
	req.session.username = user.username;
	res.redirect('/albums/manage');
});

authRouter.post('/logout', (req, res) => {
	req.session.destroy(() => {
		res.redirect('/');
	});
});

authRouter.get('/account', requireAuth, (req, res) => {
	res.render('auth/account', { title: '账户设置' });
});

authRouter.post('/account/password', requireAuth, (req, res) => {
	const { currentPassword, newPassword } = req.body;
	const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
	if (!user) return res.redirect('/login');
	const ok = bcrypt.compareSync(currentPassword, user.password_hash);
	if (!ok) return res.render('auth/account', { title: '账户设置', error: '当前密码错误' });
	const newHash = bcrypt.hashSync(newPassword, 10);
	db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);
	res.render('auth/account', { title: '账户设置', success: '密码已更新' });
});

export function requireAuthMiddleware(req, res, next) {
	return requireAuth(req, res, next);
}


