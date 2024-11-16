const express = require("express");
const bodyParser = require("body-parser");
// const mysql = require("mysql");
const cors = require("cors");
// const he = require('he')
const publicationController = require('./controllers/publicationController');
const articleController = require('./controllers/articleController');
const additionalKeywordsController = require('./controllers/additionalKeywordsController');


// Initialize Express app
const app = express();

// Middleware
app.use(bodyParser.json());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }))
app.use(cors());

// Routes
app.get('/getPublications', publicationController.getPublications);
app.post('/getArticles', articleController.getArticles);
app.post('/getArticlesByPageNo', articleController.getArticlesByPageNo);
app.post('/getFullTextById', articleController.getFullTextById);
app.post('/getFilterString', articleController.getFilterString);
app.put('/editArticle', articleController.editArticle);
app.put('/editPage', articleController.editPage);
app.put('/editJour', articleController.editJour);
app.post('/additionalKeywords', additionalKeywordsController.addKeywords);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
