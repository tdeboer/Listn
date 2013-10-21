var secret = require('../resources/secret'),
	FB = require('fb'),
	BSON = require('mongodb').BSONPure;


exports.postToEvent = function(user_id, pl_id, message, item_id) {
	
	db.collection('users', function(err, collection) {
   		collection.findOne({'_id':new BSON.ObjectID(user_id)}, function(err, user) {
        	if (err) {
				console.log('An error has occurred - ' + err);
			} else {

			    db.collection('playlists', function(err, collection) {
				    collection.findOne({'_id':new BSON.ObjectID(pl_id)}, function(err, playlist) {
					    if (err) {
							console.log('An error has occurred - ' + err);
						} else if (typeof playlist.event_id !== 'undefined') {
							console.log('Posting on FB: ' + message);
							FB.setAccessToken(user.user_token);

						    FB.api(playlist.event_id + '/feed', 'post',
						    {
						 		message: message,
						 		link: "http://listn.nl/playlist/" + playlist._id + "/item/" + item_id,
						 		name: playlist.title + " on Listn.",
						 		caption: "What would you like to add?",
						 		description: "www.listn.nl"
						    },
						    function (res) {
								if(!res || res.error) {
									console.log(!res ? 'error occurred' : res.error);
									return;
								}
								return;
							});

						}
					});
				});
				
			}
        });
   	});
	
};


exports.addUser = function(req, res) {
	var fb_id = req.params.id,
		access_token = req.body.token;
	
	FB.setAccessToken(access_token);

    FB.api("/" + fb_id, function (profile) {
		if(!profile || profile.error) {
			console.log(!profile ? 'error occurred' : profile.error);
			return;
		}
		
		console.log(profile);
		
		var now = new Date(),
			fbUser = {
				user_token: access_token,
				username: profile.name,
				email: profile.email,
				fbid: profile.id,
				log: now.toISOString()
			};
	    
	    db.collection('users', function(err, collection) {
	    
	    	collection.findAndModify({fbid: profile.id}, [], {$set: fbUser}, {upsert:true, new:true},
	            function(err, object) {
			        if (err) {
				     	console.warn(err.message);
				     	//return done(err); // todo: handle auth error
			        }
			        else {
			        	console.dir(object);
			        	//done(null, object); // todo: use session
			        }
			    }
			);
	    });
	});
	
};


exports.fbchannel = function(req, res) {
	res.render('channel');
};