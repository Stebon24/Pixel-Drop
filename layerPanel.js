const layerPanel = {
	newLayerBtn: document.querySelector('#newLayerBtn'),
	tileContainer: document.querySelector('#tileContainer'),
	tileTemplate: document.querySelector('#tileTemplate'),
	activeTile: undefined,
	init() {
		this.updateTiles();
		this.addLayerPanelListeners();
		this.toggleActive();
		$('#tileContainer').sortable({
			stop: (event, ui) => this.moveLayer(ui.item[0]),
		});
	},

	moveLayer(movedLayerTile) {
		let tiles = [...this.tileContainer.children];
		_.reverse(tiles);
		const currentTileIndex = this.findArrayIndex(tiles, movedLayerTile);
		const prevTileIndex = this.findArrayIndex(stage.layers, (layer) => {
			return layer.tile == movedLayerTile;
		});
		stage.moveIndex(currentTileIndex, prevTileIndex);
		this.updateTiles();
		stage.updateZIndexes();
	},
	deleteLayer(deletedLayer) {
		statePanel.saveState('delete', deletedLayer);
		_.find(stage.layers, (layer) => {
			if (layer && layer.element === deletedLayer.element)
				_.remove(stage.layers, layer);
		});
		deletedLayer.element.remove();
		deletedLayer.tile.remove();

		if (deletedLayer.tile === layerPanel.activeTile) {
			stage.setActiveLayer(_.last(stage.layers));
		}
	},
	findArrayIndex(arr, element) {
		const index = _.findIndex(arr, element);
		return index;
	},
	updateTiles() {
		_.each(this.tileContainer.children, (child) => {
			if (child && child.id != this.tileTemplate.id) child.remove();
		});

		_.eachRight(stage.layers, (layer) => {
			this.tileContainer.appendChild(layer.tile);
		});
		this.toggleActive();
	},
	toggleActive() {
		const currentlyActive = document.querySelector('#tileContainer .active');
		if (currentlyActive) currentlyActive.classList.toggle('active');
		this.activeTile.classList.toggle('active');
	},
	addLayerPanelListeners() {
		this.newLayerBtn.addEventListener('click', () => stage.newLayer());
	},
};
