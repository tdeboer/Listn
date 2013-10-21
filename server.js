var express = require('express'),
	cons = require('consolidate'),
	app = express(),
	server = require('http').createServer(app),
	passport = require('passport'),
	FacebookStrategy = require('passport-facebook').Strategy,
	secret = require('./resources/secret'),
	BSON = require('mongodb').BSONPure;


io = require('socket.io').listen(server);
var playlists = require('./routes/playlists'),
	graph = require('./routes/graph');;

// config
app.engine('html', cons.mustache);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({ secret: secret.session }));  // 'keyboard cat'
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.favicon(__dirname + '/favicon.ico'));
io.set('log level', 1);

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
		console.log(profile);
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




io.sockets.on('connection', function (socket) {
	
	socket.on('room', function(room) {
        socket.join(room);
    });
    
    socket.on('disconnect', function (event) {
		console.log('Disconnect socket');
		
		if (socket.queue) {
			db.collection('files', function(err, collection) {
	        	collection.find({'_id': { $in: socket.queue } }).toArray(function(err, files) {
	        		if (err) throw err;
	        		var result = {},
	        			trunc,
	        			length = files.length;
	        		
	        		files.reverse();
	        		
	            	if (length >= 3) {
	            		files[0].comma = ", ";
	            		files[1].comma = " and ";
	            		files[2].comma = " ";
	            	} else if (length == 2) {
		            	files[0].comma = " and ";
	            		files[1].comma = " ";
	            	} else {
		            	files[0].comma = " ";
	            	}
	            	
	            	if (length > 3) {
	            		trunc = files.slice(0,3);
	            		result.amount = length - 3;
	            		result.more = true;
	            		result.items = trunc;
            		} else {
	            		result.items = files;
            		}
	        		
	        		cons.mustache('views/fbpost.html', result, function(err, html){
						if (err) throw err;
						graph.postToEvent(socket.queueUser, socket.queuePlaylist, html, files[length-1]._id);
					});
	        	});
		    });
	    }

	});
    
});







// routes
app.get('/', playlists.findAll);
app.get('/playlist/:id', playlists.findById);
app.post('/playlist', playlists.addPlaylist);
app.put('/playlist/:id', playlists.updatePlaylist);
app.delete('/playlist/:id', playlists.deletePlaylist);

app.get('/playlist/:id/item/:item', playlists.findById);
app.post('/playlist/:id/item', playlists.addItem);
app.delete('/playlist/:id/item/:item', playlists.deleteItem);

app.get('/playlist/:id/events', playlists.findUserEvents);
app.delete('/playlist/:id/event', playlists.disconnectEvent);

app.post('/user/:id', graph.addUser);
app.get('/channel', graph.fbchannel);

// authentication
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_events', 'friends_events', 'publish_stream'] }));

/*
app.get('/auth/facebook', function(req, res, next) {
	passport.authenticate('facebook', function(err, user, info) {
		if (err) { return next(err); }
	    if (!user) { return res.redirect('/login'); }
	    console.log('FLUPSHFHFH');
	})(req, res , next);
});
*/

app.get('/auth/facebook/callback',
	passport.authenticate('facebook', { failureRedirect: '/login' }),
	function(req, res) {
		res.redirect('/'); // todo: remember where user came from and redirect there
	}
);

ensureAuthenticated = function(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        console.log('MALCOLM IN THE MIDDLE');
        req.session.redirectUrl = req.url;
    }
}

passport.serializeUser(function(user, done) {
	done(null, user._id); // todo: add access token for easy access in graph methods
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

/* forever start -l /var/www/projects/listn.nl/log/forever.log -o /var/www/projects/listn.nl/log/out.log -e /var/www/projects/listn.nl/log/err.log --append -w -d server.js */
/* forever stopall */