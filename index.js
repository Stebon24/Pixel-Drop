const express = require('express');
const app = express();
const path = require('path');
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.listen(port, () => {
	console.log(`Pixel-Drop listening on port ${port}`);
});

app.get('/', (req, res) => {
	res.render('index');
});
