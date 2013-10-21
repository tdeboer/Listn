requirejs.config({
    paths: {
        jqueryui: '//ajax.googleapis.com/ajax/libs/jqueryui/1.8.23/jquery-ui.min',
        scrollbar: 'jquery.tinyscrollbar1-81.min',
        timeago: 'timeago',
        youtube: '//s.ytimg.com/yts/jsbin/www-widgetapi-vflr_hAhz',
        socket: '../../socket.io/socket.io'
    },
    shim: {
        'timeago': {
            deps: ['jquery']
        },
        'scrollbar': {
            deps: ['jquery']
        },
        'jqueryui': {
            deps: ['jquery']
        },
        'youtube': {
        	exports: 'YT'
        },
        'socket': {
        	exports: 'io'
        }
    }
});


require(["playYT"], function(listn_app) {

    //console.log(listn_app);
    //listn_app.initPlaylist();
	    
});