var mongo = require('mongodb'),
	secret = require('../resources/secret');

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var server = new Server(secret.mongodb.address, secret.mongodb.port, {auto_reconnect: true});
db = new Db(secret.mongodb.db, server);

db.open(function(err, db) {
    if(!err) {
        console.log("Connected to 'listn' database");
        db.collection('files', {strict:true}, function(err, collection) {
            if (err) {
                console.log("The collection doesn't exist.");
            }
        });
    }
});


exports.findById = function(req, res) {
    var id = req.params.id;
    console.log('Retrieving playlist: ' + id);
    
    db.collection('playlists', function(err, collection) {
        collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, playlist) {
            
            db.collection('files', function(err, collection) {
            	collection.find({pl_id: id}, {"sort": [["date", "desc"]]}).toArray(function(err, files) {
		           	
		           	playlist.calcDuration = function() {
		           		var itemMinutes = Math.floor( this.duration/60 );
						var itemSeconds = Math.ceil( this.duration%60 ) <  10 ? "0" + Math.ceil( this.duration%60 ) : Math.ceil( this.duration%60 );
						return itemMinutes + ':' + itemSeconds;
		           	};
		           	
		           	db.collection('users', function(err, collection) {
		           		collection.find().toArray(function(err, users) {
				        	
				        	for (var i=0,len=files.length; i<len; i++) {
								for (var j=0,lenUsers=users.length; j<lenUsers; j++) {
									if (files[i].user_id == users[j]._id) {
										files[i].contributor = users[j].username;
									}
								}
							}
							playlist.items = files;
							
							if (typeof req.session.passport.user !== 'undefined' ) {
								var user_id = new BSON.ObjectID(req.session.passport.user);
						   		collection.findOne({_id: user_id}, function(err, user) {
						        	playlist.auth = user;
						        	res.render('playlist', playlist);
						        });
				           	} else {
					        	res.render('playlist', playlist);
				           	}
							
				        });
		           	});
		           	
				});
			});

        });
    });
};


exports.findAll = function(req, res) {
    db.collection('playlists', function(err, collection) {
        collection.find().toArray(function(err, items) {
        	var data ={};
        	data.all_playlists = items;
        	
        	if (typeof req.session.passport.user !== 'undefined' ) {
           		db.collection('users', function(err, collection) {
					var user_id = new BSON.ObjectID(req.session.passport.user);
			   		collection.findOne({_id: user_id}, function(err, user) {
			        	data.auth = user;
		           		console.log(data.auth);
			        	res.render('home', data);
			        });
			   	});
           	} else {
	        	res.render('home', data);  	
           	}
        });
    });
};


exports.addPlaylist = function(req, res) {
	
	if (typeof req.session.passport.user !== 'undefined' ) {
	
	    var playlist = req.body;
	    console.log('Adding playlist: ' + JSON.stringify(playlist));
	
	    db.collection('playlists', function(err, collection) {
	        collection.insert(playlist, {safe:true}, function(err, result) {
	            if (err) {
	                res.send({'error':'An error has occurred'});
	            } else {
	            	res.send({'id': result[0]._id});
	            }
	        });
	    });
	    
	} else {
		res.send(401, 'Unauthorized!');		
	}
};


exports.updatePlaylist = function(req, res) {
	
};


exports.deletePlaylist = function(req, res) {
	
	if (typeof req.session.passport.user !== 'undefined' ) { // check if admin
		
		var id = req.params.id;
	    console.log('Deleting playlist: ' + id);
	    
	    db.collection('playlists', function(err, collection) {
	        collection.remove({'_id':new BSON.ObjectID(id)}, {safe:true}, function(err, result) {
	            if (err) {
	                res.send({'error':'An error has occurred - ' + err});
	            } else {
	                console.log('' + result + ' document(s) deleted');
	            }
	        });
	    });
	    
	    db.collection('files', function(err, collection) {
	        collection.remove({'pl_id': id}, {safe:true}, function(err, result) {
	            if (err) {
	                res.send({'error':'An error has occurred - ' + err});
	            } else {
	                console.log('' + result + ' document(s) deleted');
	                res.send(req.body);
	            }
	        });
	    });
		
	} else {
	
		res.send(401, 'Unauthorized!');
			
	}

};


exports.addItem = function(req, res) {

	if (typeof req.session.passport.user !== 'undefined' ) {

	    var item = req.body,
			id = req.params.id;
			
		item.pl_id = id;
		item.user_id = req.session.passport.user;
		var now = new Date();
		item.date = now.toISOString();
	    console.log('Adding item: ' + JSON.stringify(item));
	
	    db.collection('files', function(err, collection) {
	        collection.insert(item, {safe:true}, function(err, files) {
	            if (err) {
	                res.send({'error':'An error has occurred'});
	            } else {
	            	var result = {};
	            	result.items = files;
					result.calcDuration = function() {
		           		var itemMinutes = Math.floor( this.duration/60 );
						var itemSeconds = Math.ceil( this.duration%60 ) <  10 ? "0" + Math.ceil( this.duration%60 ) : Math.ceil( this.duration%60 );
						return itemMinutes + ':' + itemSeconds;
		           	};
		           		           	
		           	res.render('item', result, function(err, html) {
		           		if (err) {
			                res.send({'error':'An error has occurred'});
			                console.log(err);
			            } else {
							res.send(html);
						}
					});
	            }
	        });
	    });

	} else {
		
		res.send(401, 'Unauthorized!');
		
	}
	
};



/*
var updateDB = function () {
    console.log('Updating wine: ');
    var smerig = { "uid" : 19, "title" : "Smerige ghetto hits", "admin_id" : "516d0f77d89a2c1263000001", "last_user_id" : "516d0f77d89a2c1263000001", "date" : "2012-10-31 11:29:27", "public" : 1, "location_id" : 0, "place_id" : 0, "event_id" : null };
    
    db.collection('playlists', function(err, collection) {
        collection.update({'_id':new BSON.ObjectID("516d10e0dd17bb3263000003")}, smerig, {safe:true}, function(err, result) {
            if (err) {
                console.log('Error updating wine: ' + err);
                res.send({'error':'An error has occurred'});
            } else {
                console.log(' document(s) updated');
            }
        });
    });
}
*/

/*
 * example used: http://coenraets.org/blog/2012/10/creating-a-rest-api-using-node-js-express-and-mongodb/
 *
 *
 * Todos:
 * 		PubSub with socket.io
 */