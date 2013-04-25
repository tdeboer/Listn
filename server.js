var express = require('express'),
	cons = require('consolidate'),
	playlists = require('./routes/playlists'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	passport = require('passport'),
	FacebookStrategy = require('passport-facebook').Strategy,
	secret = require('./resources/secret'),
	BSON = require('mongodb').BSONPure;

// config
app.engine('html', cons.mustache);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({ secret: 'keyboard cat' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);

passport.use(new FacebookStrategy({
		clientID: secret.facebook.clientID,
		clientSecret: secret.facebook.clientSecret,
		callbackURL: "http://www.listn.nl/auth/facebook/callback"
	},
	function(accessToken, refreshToken, profile, done) {
	
		var now = new Date();
		var fbUser = {};
		fbUser.user_token = accessToken;
		fbUser.username = profile.displayName;
		fbUser.email = profile.emails[0].value;
		fbUser.fbid = profile.id;
		fbUser.log = now.toISOString();
	    
	    db.collection('users', function(err, collection) {
	    
	    	collection.findAndModify({fbid: profile.id}, [], {$set: fbUser}, {upsert:true, new:true},
	            function(err, object) {
			        if (err) {
				     	console.warn(err.message);
				     	return done(err);
			        }
			        else {
			        	console.dir(object);
			        	done(null, object);
			        }
			    }
			);
	    });
	    
	}
));


/*
io.sockets.on('connection', function (socket) {
	socket.emit('news', { hello: 'world' });
	socket.on('my other event', function (data) {
		console.log(data);
	});
});
*/

// routes
app.get('/', playlists.findAll);
app.get('/playlist/:id', playlists.findById);
app.post('/playlist', playlists.addPlaylist);
app.put('/playlist/:id', playlists.updatePlaylist);
app.delete('/playlist/:id', playlists.deletePlaylist);

app.get('/playlist/:id/item/:item', playlists.findById);
app.post('/playlist/:id/item', playlists.addItem);
app.delete('/playlist/:id/item/:item', playlists.deleteItem);


// authentication
app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback',
	passport.authenticate('facebook', { failureRedirect: '/login' }),
	function(req, res) {
		res.redirect('/'); // remember where user came from and redirect there
	}
);


passport.serializeUser(function(user, done) {
	done(null, user._id);
});


passport.deserializeUser(function(id, done) {
	db.collection('users', function(err1, collection) {
		if (err1) {
            console.log('An error has occurred - ' + err1);
        } else {
			var o_id = new BSON.ObjectID(id);
			collection.findOne({_id:o_id}, function (err, user) {
				done(err, user);
			});
		}
	});
});


app.get('/login', function(req, res) {
    res.render('home');
});



server.listen(3000);
console.log('Listening on port 3000');