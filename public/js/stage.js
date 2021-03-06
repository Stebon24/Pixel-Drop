const stage = {
	mainDiv: document.querySelector('#stage'),
	layersDiv: document.querySelector('#stageLayers'),
	stageDiv: document.querySelector('#stage'),
	stagePanel: document.querySelector('#stagePanel'),
	controls: document.querySelector('#controls'),
	layerPviewContainer: document.querySelector('#layerPviewContainer'),
	background: {},
	mergedView: {},
	brushOverlay: {},
	layers: [],
	activeLayer: {},
	height: 0,
	width: 0,
	maxZIndex: 12,
	lastLayerNum: 0,
	appIsInit: false,
	sessionStorage: false,

	get pixelSize() {
		return parseInt(this.stageDiv.style.height) / this.height;
	},

	get leftOrigin() {
		return this.stageDiv.getBoundingClientRect().left;
	},

	get topOrigin() {
		return this.stageDiv.getBoundingClientRect().top;
	},

	get nextLayerZindex() {
		return this.layers.length + 1;
	},

	get nextlayerName() {
		return `Layer-${++this.lastLayerNum}`;
	},

	attachStageListeners() {
		this.mainDiv.addEventListener('mousedown', (e) => {
			if (toolsPanel.activeTool.undoAble) {
				statePanel.saveState('toolAction', this.activeLayer.state);
			}
			statePanel.clearRedos();
			toolsPanel.activeTool.isDrawing = true;
			toolsPanel.activeTool.startAction();
			toolsPanel.activeTool.action();
		});

		this.mainDiv.addEventListener('mousemove', (e) => {
			toolsPanel.activeTool.updatePosition(e);
			if (toolsPanel.activeTool.isDrawing) toolsPanel.activeTool.action();
		});

		this.mainDiv.addEventListener('mouseleave', () => {
			toolsPanel.activeTool.isDrawing = false;
		});

		this.mainDiv.addEventListener('mouseup', (e) => {
			toolsPanel.activeTool.releaseAction();
			toolsPanel.activeTool.isDrawing = false;
			layerPanel.updateLayerPview();
			autoSave();
		});

		window.addEventListener('resize', () => {
			this.resizeStage();
		});
	},

	init(height, width, lastLayerNum, prevLayers, prevActiveLayer) {
		this.height = height;
		this.width = width;
		this.resizeStage();
		hotkeys.setScope('stage');

		this.mergedView = this.makeCanvas('mergedView', 0);
		this.appendToStageDiv(this.mergedView);

		this.background = this.makeCanvas('background', 0);
		this.appendToStageDiv(this.background);

		toolsPanel.brush.drawCheckerGrid(this.background);

		this.brushOverlay = this.makeCanvas('brushOverlay', this.maxZIndex);
		this.appendToStageDiv(this.brushOverlay);

		layerPanel.setLayerPviewDim();

		if (!this.appIsInit) {
			this.attachStageListeners();
		}

		if (lastLayerNum && prevLayers) {
			this.sessionStorage = true;
			this.lastLayerNum = lastLayerNum;
			this.restorePrevSession(prevLayers).then(() => {
				let activeLayer = _.find(stage.layers, (layer) => {
					return layer.uuid === prevActiveLayer;
				});
				this.updateMergedView();
				this.setActiveLayer(activeLayer);
			});
		}
		if (!stage.sessionStorage) {
			this.newLayer().then((layer) => {
				this.setActiveLayer(layer);
			});
		}
		this.appIsInit = true;
	},

	reset() {
		if (this.background.element) this.background.element.remove();
		if (this.brushOverlay.element) this.brushOverlay.element.remove();
		if (this.mergedView.element) this.mergedView.element.remove();
		this.clearLayers();
		_.remove(statePanel.undoStates);
		this.lastLayerNum = 0;
	},

	clearLayers() {
		_.each(this.layers, (layer) => {
			layer.element.remove();
			layer.layerTile.remove();
		});
		_.remove(stage.layers);
	},

	findLayer(searchTerm, property, callback) {
		let foundLayer = _.find(stage.layers, (l) => {
			if (typeof searchTerm === 'string') {
				return l[property] === searchTerm;
			}
			if (typeof searchTerm === 'object') {
				return l[property] === searchTerm[property];
			}
		});
		if (callback) callback(foundLayer);
		else return foundLayer;
	},

	resizeStage() {
		this.checkWindowSize();
		const maxW = this.stagePanel.clientWidth;
		const maxH = this.stagePanel.clientHeight;
		const wr = maxW / this.width;
		const hr = maxH / this.height;

		if (wr > hr) {
			this.stageDiv.style.height = `${Math.floor(this.height * hr)}px`;
			this.stageDiv.style.width = `${Math.floor(this.width * hr)}px`;
		}
		if (hr > wr) {
			this.stageDiv.style.height = `${Math.floor(this.height * wr)}px`;
			this.stageDiv.style.width = `${Math.floor(this.width * wr)}px`;
		}
	},

	checkWindowSize() {
		const windowWidth = window.innerWidth;
		const bsLrgGridmin = 992; //bootstrap large grid, minimum pixel size
		const setVertical = () => {
			layerPanel.layerPanel.classList.replace('dropend', 'dropup');
			if (this.stagePanel.classList.contains('stagePanel-vert')) return;
			this.stagePanel.classList.replace('stagePanel-wide', 'stagePanel-vert');
		};
		const setWide = () => {
			layerPanel.layerPanel.classList.replace('dropup', 'dropend');
			if (this.stagePanel.classList.contains('stagePanel-wide')) return;
			this.stagePanel.classList.replace('stagePanel-vert', 'stagePanel-wide');
		};

		if (windowWidth >= bsLrgGridmin) {
			setWide();
		} else setVertical();
	},

	async restorePrevSession(prevLayers) {
		const newLayers = [];
		_.eachRight(prevLayers, (layer) => {
			const { uuid, zIndex, name, imgDataUri } = layer;
			newLayers.push(stage.newLayer(uuid, zIndex, name, imgDataUri));
		});
		await Promise.all(newLayers);
	},

	makeCanvas(uuid = uuidv4(), zIndex) {
		return new Canvas(uuid, zIndex);
	},

	makeLayer(uuid, zIndex, name) {
		return new Promise((res, rej) => {
			const layer = new Layer(uuid, zIndex, name);
			res(layer);
		});
	},

	async newLayer(
		uuid = uuidv4(),
		zIndex = this.nextLayerZindex,
		name = this.nextlayerName,
		imgDataUri
	) {
		let layer = await this.makeLayer(uuid, zIndex, name);
		this.appendToLayerDiv(layer);
		this.appendToTileContainer(layer.layerTile, 0);
		this.layers.unshift(layer);
		if (imgDataUri) await layer.renderCanvas(imgDataUri);
		this.updateZIndexes();
		return layer;
	},

	setActiveLayer(activeLayer = this.activeLayer) {
		this.activeLayer = activeLayer;
		layerPanel.updateLayerPview();
		activeLayer.layerTile.scrollIntoView();
		this.toggleActive();
	},

	toggleActive() {
		_.each(stage.layers, (layer) => {
			if (
				layer != this.activeLayer &&
				layer.layerTile.classList.contains('active')
			) {
				layer.layerTile.classList.toggle('active');
			} else if (
				layer === this.activeLayer &&
				!layer.layerTile.classList.contains('active')
			) {
				layer.layerTile.classList.toggle('active');
			}
		});
	},

	appendToStageDiv(canvas) {
		//stage canvases... bg, overlay, merged
		this.mainDiv.appendChild(canvas.element);
	},

	appendToLayerDiv(canvas) {
		//painting canvases
		this.layersDiv.appendChild(canvas.element);
	},

	appendToTileContainer(tile, index) {
		let container = layerPanel.tileContainer;

		if (index == undefined) container.append(tile);
		else {
			let children = container.children;
			container.insertBefore(tile, children[index]);
		}
	},

	updateZIndexes() {
		const layerCount = this.layers.length;
		let z = 1; //z index starts at one to stay above bg canvas
		for (let i = layerCount - 1; i >= 0; i--) {
			z++;
			let canvas = this.layers[i];
			canvas.element.style.zIndex = z;
			canvas.zIndex = z;
		}
	},

	findArrayIndex(arr, element) {
		const index = _.findIndex(arr, element);
		return index;
	},

	updateMergedView() {
		this.mergedView.clearCanvas();
		_.eachRight(this.layers, (layer) => {
			this.mergedView.ctx.drawImage(
				layer.element,
				0,
				0,
				this.width,
				this.height
			);
		});
	},

	deleteLayer(layer) {
		let deletedLayer = _.find(stage.layers, (l) => l.uuid === layer.uuid);
		_.remove(this.layers, deletedLayer);
		deletedLayer.element.remove();
		deletedLayer.layerTile.remove();
		if (deletedLayer === this.activeLayer) {
			this.setActiveLayer(_.head(this.layers));
		}
		autoSave();
	},

	moveIndex(oldIndex, newIndex) {
		layer = this.layers[oldIndex];
		this.layers.splice(oldIndex, 1);
		this.layers.splice(newIndex, 0, layer);
		stage.updateZIndexes();
	},

	moveLayer(oldIndex, newIndex) {
		let layer = this.layers[oldIndex];
		statePanel.saveState('arrangeLayer', layer.state);
		this.moveIndex(oldIndex, newIndex);
		autoSave();
	},

	restoreLayer(layerData) {
		const { uuid, zIndex, name, imgDataUri, layerIndex, tileIndex } = layerData;
		let layer = new Layer(uuid, zIndex, name);
		this.layers.splice(layerIndex, 0, layer);
		this.appendToLayerDiv(layer);
		this.appendToTileContainer(layer.layerTile, tileIndex);
		if (imgDataUri) layer.renderCanvas(imgDataUri);
		this.setActiveLayer(layer);

		return layer;
	},
};
