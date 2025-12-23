// @ts-nocheck
import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import session from 'express-session';
import SQLiteStoreFactory from 'connect-sqlite3';
import csrf from 'csurf';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import expressLayouts from 'express-ejs-layouts';
import favicon from 'serve-favicon';

import { db, initDatabase } from './sqlite.js';
import { authRouter } from './routes/auth.js';
import { albumsRouter } from './routes/albums.js';
import { photosRouter } from './routes/photos.js';
import { ensureUploadsDirs } from './utils/paths.js';

const app = express();

// Ensure runtime directories
ensureUploadsDirs();
initDatabase();

const __dirname = path.resolve();
const publicDir = path.join(__dirname, 'public');
const uploadsDir = path.join(publicDir, 'uploads');

// Views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan('dev'));
// 确保使用 UTF-8 编码处理请求
app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));
app.use(express.json({ charset: 'utf-8' }));

// Sessions
const SQLiteStore = SQLiteStoreFactory(session);

// 确保生产环境配置了 SESSION_SECRET
if (process.env.NODE_ENV === 'production' && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'change_this_session_secret')) {
	console.error('错误: 生产环境必须设置 SESSION_SECRET 环境变量');
	process.exit(1);
}

app.use(
	session({
		store: new SQLiteStore({ db: 'sessions.sqlite', dir: path.join(__dirname, 'data') }),
		secret: process.env.SESSION_SECRET || 'change_this_session_secret',
		resave: false,
		saveUninitialized: false,
		cookie: { 
			maxAge: 1000 * 60 * 60 * 24 * 7,
			secure: process.env.NODE_ENV === 'production', // HTTPS only in production
			httpOnly: true,
			sameSite: 'strict'
		},
	})
);

// CSRF Protection
const csrfProtection = csrf({ 
	cookie: false, // 使用 session 存储 CSRF token
	value: (req) => {
		// 支持从请求头或请求体中读取 CSRF token
		return req.headers['x-csrf-token'] || req.body._csrf || req.query._csrf;
	}
});
app.use(csrfProtection);

// Expose auth to views
app.use((req, res, next) => {
	res.locals.isAuthenticated = Boolean(req.session.userId);
	res.locals.username = req.session.username || null;
	res.locals.csrfToken = req.csrfToken(); // 提供 CSRF token 给所有视图
	next();
});

// Static
app.use(express.static(publicDir));
if (fs.existsSync(path.join(publicDir, 'favicon.ico'))) {
	app.use(favicon(path.join(publicDir, 'favicon.ico')));
}

// Routers
app.use('/', authRouter);
app.use('/albums', albumsRouter);
app.use('/photos', photosRouter);

// Home -> albums list
app.get('/', (req, res) => {
	// Render album list page; Vue 前端会拉取 /albums/api 列表
	res.render('albums/index', { title: '遛猫网', page: 'albums' });
});

// 404
app.use((req, res) => {
	res.status(404).render('errors/404', { title: '未找到' });
});

// Error handler
app.use((err, req, res, next) => {
	console.error(err);
	
	// CSRF token 错误
	if (err.code === 'EBADCSRFTOKEN') {
		if (req.headers['content-type']?.includes('application/json') || req.path.startsWith('/albums/api') || req.path.startsWith('/photos/api')) {
			return res.status(403).json({ error: 'CSRF 验证失败' });
		}
		return res.status(403).render('errors/403', { title: '禁止访问', error: 'CSRF 验证失败' });
	}
	
	if (req.headers['content-type']?.includes('application/json') || req.path.startsWith('/albums/api') || req.path.startsWith('/photos/api')) {
		res.status(500).json({ error: '服务器错误' });
		return;
	}
	res.status(500).render('errors/500', { title: '服务器错误', error: process.env.NODE_ENV === 'development' ? err : null });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});

