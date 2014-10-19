var express = require('express');
var data = require('./data/systemData.json');
var Converter = require("csvtojson").core.Converter;
var fs = require('fs');
var connect = require('connect');

var path = require('path');
var app = express();

app.use(express.static(__dirname + '/public'));

app.use(connect.bodyParser());

var port = process.env.PORT || 3000;
var router = express.Router();

router.get('/getData', function (req, res, next) {
    console.log("router.get('/getData', function (req, res, next) {");
    res.json(data);
});

router.post('/getData', function (req, res, next) {
    console.log("router.post('/getData', function (req, res, next) {");

    var fileStream = fs.createReadStream(req.files['csv'].path);
    var csvConverter = new Converter({
        constructResult: true
    });
    csvConverter.on("end_parsed", function (jsonObj) {
        res.end(JSON.stringify(jsonObj));
    });

    fileStream.pipe(csvConverter);
});

router.post('/uploadFiltered', function (req, res, next) {
    console.log("router.post('/uploadFiltered', function (req, res, next) {");
    console.log(req.body);

    var fn = req.header("fileName");
    console.log(fn);

    var outputFilename = __dirname + '/Mashups/' + fn + '.json';

    fs.writeFile(outputFilename, JSON.stringify(req.body, null, 4), function (err) {
        if(err) {
            console.log(err);
        } else {
            res.send(200);
        }
    });

});

app.use('/', router);

app.listen(port);
console.log('Server Listening on Port :: ' + port);
