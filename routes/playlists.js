var mongo = require('mongodb'),
	secret = require('../resources/secret'),
	FB = require('fb');

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
    var id = req.params.id,
    	item = req.params.item;
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
		           	
		           	playlist.id = id;
		           	
		           	db.collection('users', function(err, collection) {
		           		collection.find().toArray(function(err, users) {
				        	
				        	for (var i=0,len=files.length; i<len; i++) {
								for (var j=0,lenUsers=users.length; j<lenUsers; j++) {
									if (files[i].user_id == users[j]._id) {
										files[i].contributor = users[j].username;
									}
								}
								
								// option to remove item when the logged in user is the admin or the item is added by the logged in user
								if (playlist.admin_id === req.session.passport.user) {
									files[i].removable = true;
								} else if (typeof req.session.passport.user !== 'undefined' && files[i].user_id == req.session.passport.user) {
									files[i].removable = true;
								}
								
								if (typeof item !== 'undefined' && item == files[i]._id) {
									files[i].current = true;
								}
							}
							playlist.items = files;
							
							if (typeof req.session.passport.user !== 'undefined') {
								playlist.admin = (playlist.admin_id === req.session.passport.user);
							
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
        	var data = {};
        	data.all_playlists = items;
        	
        	db.collection('files', function(err, collection) {
            	collection.find({}, {"sort": [["date", "desc"]], "limit": 5}).toArray(function(err, files) {
            		
            		data.last_added = files;
            		
            		if (typeof req.session.passport.user !== 'undefined' ) {
		           		db.collection('users', function(err, collection) {
							var user_id = new BSON.ObjectID(req.session.passport.user);
					   		collection.findOne({_id: user_id}, function(err, user) {
					        	data.auth = user;
					        	data.fb_app_id = secret.facebook.clientID;
				           		console.log(data.auth);
					        	res.render('home', data);
					        });
					   	});
		           	} else {
		           		data.fb_app_id = secret.facebook.clientID;
			        	res.render('home', data);
		           	}
            		
            	});
            });
        	
        });
    });
};


exports.addPlaylist = function(req, res) {
	
	if (typeof req.session.passport.user !== 'undefined' ) {
	    var playlist = req.body;
	    playlist.admin_id = req.session.passport.user;
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

	if (typeof req.session.passport.user !== 'undefined' ) {
		var playlist_id = req.params.id,
			fb_event_id = req.body.fb_event,
			playlist_res;

		db.collection('playlists', function(err, collection) {
			collection.findAndModify({'_id':new BSON.ObjectID(playlist_id)}, [['_id','asc']], {$set: {event_id: fb_event_id}}, {}, function(err, playlist) {
				if (err) {
					res.send({'error':'An error has occurred - ' + err});
				} else {
					playlist_res = playlist;

					db.collection('users', function(err, collection) {
						var user_id = new BSON.ObjectID(req.session.passport.user);
						collection.findOne({_id: user_id}, function(err, user) {
							fbConnectEvent(user.user_token, playlist_res, req.body.fb_event, function(err, fbres) {
								if (err) {
									res.send({'error':'An error has occurred - ' + err});
								} else {
									FB.setAccessToken(user.user_token);
									FB.api("/" + fb_event_id, function (fbresEvent) {
										if(!fbresEvent || fbresEvent.error) {
											console.log(!fbresEvent ? 'error occurred' : fbresEvent.error);
											return;
										}
										
										res.render('eventconnect', fbresEvent);
									});
									
								}
							});
						});
					});

				}
			});
		});

	} else {
	
		res.send(401, 'Unauthorized!');
		
	}
	
};


exports.disconnectEvent = function(req, res) {
	
	if (typeof req.session.passport.user !== 'undefined' ) {
		
		var playlist_id = req.params.id;
	
		db.collection('playlists', function(err, collection) {
			collection.findAndModify({'_id':new BSON.ObjectID(playlist_id)}, [['_id','asc']], {$unset: {event_id: ""}}, {}, function(err, playlist) {
				if (err) {
					res.send({'error':'An error has occurred - ' + err});
				} else {
				
					db.collection('users', function(err, collection) {
						var user_id = new BSON.ObjectID(req.session.passport.user);
				   		collection.findOne({_id: user_id}, function(err, user) {				
				
							FB.setAccessToken(user.user_token);
		
							FB.api("/me/events/", function (fbres) {
								if(!fbres || fbres.error) {
									console.log(!fbres ? 'error occurred' : fbres.error);
									return;
								}
								
								var result = { events: fbres.data, hasEvents: fbres.data.length > 0 };
								res.render('eventlist', result);
							});
						});
					});
					
				}
			});
		});
		
	}  else {
	
		res.send(401, 'Unauthorized!');
		
	}
	
};


exports.deletePlaylist = function(req, res) {
	
	if (typeof req.session.passport.user !== 'undefined' ) { // todo: check if admin
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


exports.addItem = function(req, res) { // todo: prevent non-invites to the fb event to add items

	if (typeof req.session.passport.user !== 'undefined' ) {

	    var item = req.body,
			id = req.params.id,
			now = new Date(),
			socketId = req.body.socket;
			
		item.pl_id = id;
		item.user_id = req.session.passport.user;
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
							
							
							db.collection('playlists', function(err, collection) {
								collection.findOne({'_id':new BSON.ObjectID(item.pl_id)}, function(err, playlist) {
									if (err) {
										console.log('An error has occurred - ' + err);
									} else {
										if (typeof playlist.event_id !== 'undefined') {
											// build a queue for publishing updates on facebook
											io.sockets.sockets[socketId].queue = io.sockets.sockets[socketId].queue || [];
											io.sockets.sockets[socketId].queue.push(result.items[0]._id);
											io.sockets.sockets[socketId].queueUser = item.user_id;
											io.sockets.sockets[socketId].queuePlaylist = item.pl_id;
										}
									}
								});
							});

							// update other listeners of this playlist
							io.sockets.in(item.pl_id).emit('newItem', html); // bug: username is not properly shown on other clients in the room
						}
					});
	            }
	        });
	    });

	} else {
		
		res.send(401, 'Unauthorized!');
		
	}
	
};


exports.deleteItem = function(req, res) {
	
	if (typeof req.session.passport.user !== 'undefined' ) {
		
		var id = req.params.id,
			item = req.params.item;
	    console.log('Deleting item: ' + item + ' from ' + id);

	    db.collection('files', function(err, collection) {
	        collection.remove({'_id':new BSON.ObjectID(item)}, {safe:true}, function(err, result) {
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


exports.findUserEvents = function(req, res) {
	
	if (typeof req.session.passport.user !== 'undefined' ) {
	
		var pl_id = req.params.id;
	
		db.collection('users', function(err, collection) {
			var user_id = new BSON.ObjectID(req.session.passport.user);
	   		collection.findOne({_id: user_id}, function(err, user) {
					
				db.collection('playlists', function(err, collection) {
				    collection.findOne({'_id':new BSON.ObjectID(pl_id)}, function(err, playlist) {
					    if (err) console.log('An error has occurred - ' + err);
						
						FB.setAccessToken(user.user_token);
						
						if (typeof playlist.event_id !== "undefined" && playlist.event_id !== null) {
						
							FB.api("/" + playlist.event_id, function (fbresEvent) {
								if(!fbresEvent || fbresEvent.error) {
									console.log(!fbresEvent ? 'error occurred' : fbresEvent.error);
									return;
								}
								
								res.render('eventconnect', fbresEvent);
							});
							
						} else {
							
							FB.api("/me/events/", function (fbres) {
								if(!fbres || fbres.error) {
									console.log(!fbres ? 'error occurred' : fbres.error);
									return;
								}
								
								var result = { events: fbres.data, hasEvents: fbres.data.length > 0 };
								res.render('eventlist', result);
							});
							
						}
			        	
					});
				});

	        });
	   	});
	
	} else {
	
		res.send(401, 'Unauthorized!');
			
	}
	
};


var fbConnectEvent = function(access_token, playlist, fb_event, callback) {
	FB.setAccessToken(access_token);
    
    FB.api(fb_event + '/feed', 'post',
    {
 		message: "connected playlist '" + playlist.title + "' to this event.",
 		link: "http://listn.nl/playlist/" + playlist._id,
 		name: playlist.title + " on Listn.",
 		caption: "What would you like to add?",
 		description: "www.listn.nl",
 		picture: "http://listn.nl/web/gfx/logo128.png"
    },
    function (res) {
    	var error;
		if(!res || res.error) {
			error = !res ? 'error occurred' : res.error;
		}
		callback(error, res);

	});

};


var isAdmin = function(userId, playlistId) {
	db.collection('playlists', function(err, collection) {
        collection.findOne({'_id':new BSON.ObjectID(playlistId)}, function(err, playlist) {
        	console.log(userId);
			console.log(playlist.admin_id);
			console.log(playlist.admin_id === userId);
        	if (playlist.admin_id === userId) return true;
        });
    });
}


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
 * FB api: https://github.com/Thuzi/facebook-node-sdk
 *
 *
 * Todos:
 * 		PubSub with socket.io
 */