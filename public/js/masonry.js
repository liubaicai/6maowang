(function () {
	function nextTick(fn) { setTimeout(fn, 0); }

	function onImagesReady(container, callback) {
		const imgs = Array.from(container.querySelectorAll('img'));
		if (imgs.length === 0) return callback();
		let pending = imgs.length;
		const done = () => { if (--pending === 0) callback(); };
		imgs.forEach(img => {
			if (img.complete) return done();
			img.addEventListener('load', done, { once: true });
			img.addEventListener('error', done, { once: true });
		});
	}

	function computeColumnCount(containerWidth, minColWidth, gap, maxCols) {
		const count = Math.max(1, Math.floor((containerWidth + gap) / (minColWidth + gap)));
		return Math.min(maxCols || Infinity, count);
	}

	function layout(container, itemSelector, options) {
		const gap = options.gap ?? 16;
		const minColWidth = options.minColWidth ?? 260;
		const maxCols = options.maxCols ?? 4;
		const containerWidth = Math.floor(container.clientWidth);
		const cols = computeColumnCount(containerWidth, minColWidth, gap, maxCols);
		const colWidth = Math.floor((containerWidth - gap * (cols - 1)) / cols);
		container.style.setProperty('--masonry-col-width', colWidth + 'px');
		container.style.setProperty('--masonry-gap', gap + 'px');

		const items = Array.from(container.querySelectorAll(itemSelector));
		// First row: left-to-right
		const colHeights = new Array(cols).fill(0);
		const positions = [];
		for (let i = 0; i < items.length; i++) {
			const el = items[i];
			el.style.width = colWidth + 'px';
			const rect = el.getBoundingClientRect();
			const height = Math.ceil(el.offsetHeight);
			let colIndex;
			if (i < cols) {
				colIndex = i; // first row
			} else {
				// pick the shortest column
				colIndex = 0;
				let minH = colHeights[0];
				for (let c = 1; c < cols; c++) {
					if (colHeights[c] < minH) { minH = colHeights[c]; colIndex = c; }
				}
			}
			const top = colHeights[colIndex];
			const left = colIndex * (colWidth + gap);
			positions.push({ el, top, left, height });
			colHeights[colIndex] = top + height + gap;
		}
		// apply positions
		positions.forEach(p => {
			p.el.style.transform = `translate(${p.left}px, ${p.top}px)`;
		});
		const totalHeight = Math.max(0, ...colHeights) - gap; // remove last gap
		container.style.height = Math.max(0, totalHeight) + 'px';
		if (options && typeof options.onLayout === 'function') {
			try { options.onLayout(); } catch {}
		}
	}

	function initMasonry(container, itemSelector, options = {}) {
		const state = { container, itemSelector, options };
		const relayout = () => layout(container, itemSelector, options);
		const schedule = () => nextTick(() => onImagesReady(container, relayout));
		schedule();
		window.addEventListener('resize', schedule);
		return {
			layout: schedule,
			destroy() { window.removeEventListener('resize', schedule); }
		};
	}

	// expose global
	window.Masonry = { init: initMasonry };
})();


