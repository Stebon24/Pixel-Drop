class Brush {
	constructor(size) {
		this.size = 1;
		this.xPosition = 0;
		this.yPosition = 0;
		this.isDrawing = false;
	}
	get offset() {
		return Math.floor(stage.pixelSize / 2);
	}
	get ctx() {
		return stage.activeLayer.ctx;
	}
	updatePosition(evt) {
		let canvas = stage.brushOverlay;
		//find brushPosition
		this.xPosition = Math.floor(evt.pageX - stage.leftOrigin);
		this.yPosition = Math.floor(evt.pageY - stage.topOrigin);
		// console.log(this.xPosition);
		this.xPixelPosition = Math.floor(this.xPosition / stage.pixelSize);
		this.yPixelPosition = Math.floor(this.yPosition / stage.pixelSize);
		//draw brushPosition
		canvas.ctx.clearRect(0, 0, stage.width, stage.height);
		canvas.ctx.strokeStyle = 'green';
		canvas.ctx.strokeRect(
			this.xPosition - this.offset,
			this.yPosition - this.offset,
			this.size * stage.pixelSize,
			this.size * stage.pixelSize
		);
	}
	drawPixel(x = brush.xPixelPosition, y = brush.yPixelPosition) {
		let xOrigin = x * stage.pixelSize;
		let yOrigin = y * stage.pixelSize;

		this.ctx.fillStyle = pallet.currentColor;
		this.ctx.fillRect(
			xOrigin,
			yOrigin,
			stage.pixelSize * brush.size,
			stage.pixelSize * brush.size
		);
	}
	drawCheckerGrid() {
		const lightGray = '#d7d7d7';
		const darkGray = '#fafafa';
		const rows = stage.rows;
		const cols = stage.cols;
		let colorOffset = 0;

		for (let x = 0; x < cols; x++) {
			colorOffset % 2 === 0
				? (pallet.currentColor = darkGray)
				: (pallet.currentColor = lightGray);
			colorOffset++;
			for (let y = 0; y < rows; y++) {
				pallet.currentColor === lightGray
					? (pallet.currentColor = darkGray)
					: (pallet.currentColor = lightGray);
				brush.drawPixel(x, y);
			}
		}
	}
}
