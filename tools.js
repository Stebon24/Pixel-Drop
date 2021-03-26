class Tool {
	constructor(buttonElement) {
		this.size = 1;
		this.xPosition = 0;
		this.yPosition = 0;
		this.isDrawing = false;
		this.buttonElement = buttonElement;
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
}

class Brush extends Tool {
	action() {
		this.drawPixel();
	}
	releaseAction() {}
	drawPixel(x = this.xPixelPosition, y = this.yPixelPosition) {
		let xOrigin = x * stage.pixelSize;
		let yOrigin = y * stage.pixelSize;

		this.ctx.fillStyle = colorPanel.currentColor;
		this.ctx.fillRect(
			xOrigin,
			yOrigin,
			stage.pixelSize * this.size,
			stage.pixelSize * this.size
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
				? (colorPanel.currentColor = darkGray)
				: (colorPanel.currentColor = lightGray);
			colorOffset++;
			for (let y = 0; y < rows; y++) {
				colorPanel.currentColor === lightGray
					? (colorPanel.currentColor = darkGray)
					: (colorPanel.currentColor = lightGray);
				this.drawPixel(x, y);
			}
		}
	}
}
class Eraser extends Tool {
	action() {
		this.erasePixel();
	}
	releaseAction() {}
	erasePixel(x = this.xPixelPosition, y = this.yPixelPosition) {
		let xOrigin = x * stage.pixelSize;
		let yOrigin = y * stage.pixelSize;

		// this.ctx.fillStyle = colorPanel.currentColor;
		this.ctx.clearRect(
			xOrigin,
			yOrigin,
			stage.pixelSize * this.size,
			stage.pixelSize * this.size
		);
	}
}
class EyeDrop extends Tool {
	constructor(buttonElement) {
		super(buttonElement);
		this.color = undefined;
	}
	action() {
		this.color = this.selectColor();
		console.log(this.color);
	}
	releaseAction() {
		//do nothing if pixel was transparent
		if (this.color) return colorPanel.updateColorHistory(this.color);
	}
	selectColor(x = this.xPosition, y = this.yPosition) {
		//multiply x/y to account for context scale
		let colorSample = this.ctx.getImageData(
			x * stage.scale,
			y * stage.scale,
			1,
			1
		).data;

		//if colorSample has full transparency do nothing
		if (colorSample[3] != 0) {
			let hex = colorPanel.rgbToHex(...colorSample);
			colorPanel.setCurrentColor(hex);
			return hex;
		}
	}
}
class FillTool extends Tool {
	action() {}
	releaseAction() {
		this.fill();
		console.log('fill');
	}
	fill(x = this.xPosition, y = this.yPosition) {
		const sample = this.ctx.getImageData(x * stage.scale, y * stage.scale, 1, 1)
			.data;
		for (let i = 0; i < stage.rows; i++) {
			for (let j = 0; j < stage.cols; j++) {
				let checkPixel = this.ctx.getImageData(
					i * stage.pixelSize * stage.scale, // +1 for rounding error??
					j * stage.pixelSize * stage.scale,
					1,
					1
				).data;
				if (sample.join() == checkPixel.join()) {
					this.ctx.fillStyle = colorPanel.currentColor;
					this.ctx.fillRect(
						i * stage.pixelSize,
						j * stage.pixelSize,
						stage.pixelSize,
						stage.pixelSize
					);
				}
			}
		}
	}
}
class MoveTool extends Tool {}