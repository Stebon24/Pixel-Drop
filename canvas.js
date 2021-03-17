const Pixel = class {
	constructor(color, x, y, size) {
		this.color = color;
		this.size = size;
		this.xOrigin = x;
		this.yOrigin = y;
		this.xEnd = this.xOrigin + this.size;
		this.yEnd = this.yOrigin + this.size;
		this.xCenter = x + size / 2;
		this.yCenter = y + size / 2;
	}
};

class Canvas {
	constructor(rows, cols) {
		this.rows = rows;
		this.cols = cols;
		this.scale = window.devicePixelRatio;
		this.stage = document.querySelector('#stage');
		this.canvasContainer = document.querySelector('#canvasContainer');
		this.element = null;
		this.ctx = null;
		this.currentIndex = 0;
		this.pixelSize = null;
		this.width = null;
		this.height = null;
		this.topOrigin = null;
		this.leftOrigin = null;

		this.pixelsLastIndex = () => this.pixels.length - 1;

		this.saveState = function () {
			//delete redos
			if (this.currentIndex !== this.pixelsLastIndex()) {
				this.pixels.splice(this.currentIndex + 1);
			}
			let copyState = _.cloneDeep(_.last(this.pixels));
			this.pixels.push(copyState);
			this.currentIndex = this.pixelsLastIndex();
		};

		this.undo = function () {
			if (this.currentIndex > 0) {
				this.currentIndex--;
				this.drawAllPixels();
			}
		};

		this.redo = function () {
			if (this.currentIndex < this.pixelsLastIndex()) {
				this.currentIndex++;
				this.drawAllPixels();
			}
		};

		this.createCanvasElement = function (id) {
			this.element = document.createElement('canvas');
			this.ctx = this.element.getContext('2d');
			this.findPixelSize();
			// this.updateBrushSize();
			this.width = this.cols * this.pixelSize;
			this.height = this.rows * this.pixelSize;
			this.element.id = id;
			this.element.style.width = `${this.width}px`;
			this.element.style.height = `${this.height}px`;
			this.element.width = Math.floor(this.cols * this.pixelSize * this.scale);
			this.element.height = Math.floor(this.rows * this.pixelSize * this.scale);
			this.element.classList.add('canvas', id);
			this.ctx.scale(this.scale, this.scale);
		};
		this.appendCanvasElement = function () {
			this.stage.appendChild(this.element);
			let box = this.element.getBoundingClientRect();
			this.leftOrigin = box.left;
			this.topOrigin = box.top;
		};

		this.findPixelSize = function () {
			const containerWidth = this.canvasContainer.scrollWidth;
			const containerHeight = this.canvasContainer.scrollHeight;
			const colSize = Math.floor(containerWidth / this.cols);
			const rowSize = Math.floor(containerHeight / this.rows);
			const pixelSize =
				colSize > rowSize || colSize === rowSize ? rowSize : colSize;
			this.pixelSize = pixelSize;
		};

		this.drawGrid = function () {
			const lightGray = '#d7d7d7';
			const darkGray = '#fafafa';
			const rows = this.rows;
			const cols = this.cols;
			const pixelSize = this.pixelSize;
			let offset = 0;

			for (let x = 0; x < rows; x++) {
				offset % 2 === 0
					? (pallet.currentColor = darkGray)
					: (pallet.currentColor = lightGray);
				offset++;
				for (let y = 0; y < cols; y++) {
					pallet.currentColor === lightGray
						? (pallet.currentColor = darkGray)
						: (pallet.currentColor = lightGray);
					this.drawPixel(x, y);
				}
			}
		};

		this.drawBrushPosition = function () {
			// console.log(brush.xPosition, brush.yPosition);
			this.ctx.clearRect(0, 0, this.width, this.height);
			this.ctx.strokeStyle = 'green';
			this.ctx.strokeRect(
				brush.xPosition - brush.offset,
				brush.yPosition - brush.offset,
				brush.size * this.pixelSize,
				brush.size * this.pixelSize
			);
		};

		this.drawPixel = function (
			x = brush.xPixelPosition,
			y = brush.yPixelPosition
		) {
			let xOrigin = x * this.pixelSize;
			let yOrigin = y * this.pixelSize;
			this.ctx.fillStyle = pallet.currentColor;
			this.ctx.fillRect(
				xOrigin,
				yOrigin,
				this.pixelSize * brush.size,
				this.pixelSize * brush.size
			);
		};
	}
}
