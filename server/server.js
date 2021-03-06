var loopback = require('loopback'),
    boot = require('loopback-boot'),
    exphbs = require('express-handlebars'),
    express = require('express'),
    path = require('path'),
    fs = require('fs'),
    app = module.exports = loopback(),
    // routers
    aboutRouter = require('./routes/about'),
    contactRouter = require('./routes/contact'),
    categoriesRouter = require('./routes/categories'),
    wisdomizersRouter = require('./routes/wisdomizers'),
    wisdombabiesRouter = require('./routes/wisdombabies'),
    booksRouter = require('./routes/books'),
    adminRouter = require('./routes/admin'),
    // loading partials preps
    partialsDir = process.cwd() + '/client/views/partials',
    filenames = fs.readdirSync(partialsDir);

// require modules
app.handlebars = require('handlebars');

// load partials
filenames.forEach(function(filename){
  var matches = /^([^.]+).hbs$/.exec(filename);
  if (!matches) {
    return;
  }
  var name = matches[1];
  var template = fs.readFileSync(partialsDir + '/' + filename, 'utf8');
  app.handlebars.registerPartial(name, template);
})

// routing - root level
app.get('/', function(req, res){
    return app.models.Recommendation.getCurrentMonthRecommendations()
    .then(function(pageContent){
        if(pageContent.count === 0){
            return res.redirect('/wisdomizers');
        }
        return app.models.Wisdomizer.getWisdomizerCount()
        .then(function(wisdomizerCount){
            pageContent.wisdomizerCount = wisdomizerCount;
            res.render('pages/home', {pageContent});
        })
    });
})
// routing - one level deeper
app.use('/about', aboutRouter);
app.use('/contact', contactRouter);
app.use('/categories', categoriesRouter);
app.use('/wisdomizers', wisdomizersRouter);
app.use('/wisdombabies', wisdombabiesRouter);
app.use('/books', booksRouter);
app.use('/admin', adminRouter);

app.engine('hbs', exphbs({extname:'hbs',
                          defaultLayout:'main',
                          layoutsDir: process.cwd() + '/client/views/layouts',
                          partialsDir: process.cwd() + '/client/views/partials'}));

app.set('view engine', 'hbs');
app.set('views', process.cwd() + '/client/views');
app.use('/images', express.static(process.cwd() + '/client/assets/images'));
app.use('/css', express.static(process.cwd() + '/client/assets/css'));
app.use('/js', express.static(process.cwd() + '/client/assets/js'));
app.use('/bower', express.static(process.cwd() + '/bower_components'));

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});