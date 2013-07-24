// setup the global bbm object so we can call bbm.<function> from where-ever in the app
var bbm = {
	registered: false,

	// registers this application with the blackberry.bbm.platform APIs.
	register: function() {
		blackberry.event.addEventListener('onaccesschanged', function(accessible, status) {

			if (status === 'unregistered') {
				blackberry.bbm.platform.register({
					uuid: '435f132f-95b3-4101-84de-cd4f3af52958'
				});

			} else if (status === 'allowed') {
				bbm.registered = accessible;
			}

		}, false);
	},

	// update the users personal message in bbm
	updateMessage: function() {

		// dialog callback
		function dialogCallBack(selection) {
			var txt = selection.promptText;
			blackberry.bbm.platform.self.setPersonalMessage(
				txt,

				function(accepted) {
				});
		}

		// standard async dialog to get new 'personal message' for bbm
		blackberry.ui.dialog.standardAskAsync("Enter your new status", blackberry.ui.dialog.D_PROMPT, dialogCallBack, {
			title: "I am a dialog"
		});
	},

	// invite a contact to download your app via bbm
	inviteToDownload: function() {
		blackberry.bbm.platform.users.inviteToDownload();
	}
};

function start() {
	blackberry.ui.cover.setContent(blackberry.ui.cover.TYPE_IMAGE, {
		path: 'local:///JSCover.png'
	});
	
	blackberry.ui.cover.updateCover();
	// register with bbm
	bbm.register();
}

function toast(msg) {
    blackberry.ui.toast.show(msg);
}

function eval2(code){
    try {
        sandbox = $('<iframe width="0" height="0"/>').css({display: 'none'}).appendTo('body')[0].contentWindow;
        return sandbox.eval ? sandbox.eval(code) : eval(code);
    } catch(e){
        test = '<div style="color: red;">' + e + '</div>';
    }
}

//invoke the filePicker Card
function invokeFilePicker(details) {
        blackberry.invoke.card.invokeFilePicker(details, function (path) {  readFile(path); window.path = path; },  null,
        function (error) {
            if (error) {
                alert("invoke error "+ error);
            } else {
                console.log("invoke success " );
            }});
}

//pick a file using a filter, of only js
function selectJS() {
        var details = {
            mode: blackberry.invoke.card.FILEPICKER_MODE_PICKER,
            filter: ["*.js", "*.JS"]
        };
    invokeFilePicker(details);
}

function writeBlobToPath(blob, code, size, path, callback) {
    var errorHandler = function (e) {
        alert(e);
    }
    blackberry.io.sandbox = false;
    window.webkitRequestFileSystem(window.PERSISTENT, size, function (fs) {
        fs.root.getFile(path, {create: true}, function (file) {
            file.createWriter(function (writer) {
                writer.onwriteend = function (e) {
                   callback(path);
                };
                writer.write(blob);
            }, errorHandler);
        }, errorHandler);
    }, errorHandler);
}

function overwrite(blob, code, size, path, callback) {
    var errorHandler = function (e) {
        alert(e);
    }
    blackberry.io.sandbox = false;
    window.webkitRequestFileSystem(window.PERSISTENT, size, function (fs) {
        fs.root.getFile(path, {create: false}, function (file) {
            file.createWriter(function (writer) {
                writer.onwriteend = function (e) {
                   callback(path);
                   writer.truncate(code.length);
                };
                writer.write(blob);
            }, errorHandler);
        }, errorHandler);
    }, errorHandler);
}

function save(overwrite, code){
if (overwrite) {
    blob = new window.Blob([code], {type:  'text/js'});
    if (window.path == "") {
        //blackberry.ui.toast.show("This is a new file, please save it first a file.");
        save(false, code);
        return
    }
    if (path.slice(-3) != ".js") {path.concat(".js")};
    writeBlobToPath(blob, code, 5.0 * 1024 * 1024, window.path, function(path){
        blackberry.ui.toast.show('Successsful saved at: ' + path);
    });
}
else 
blackberry.invoke.card.invokeFilePicker({
        mode: blackberry.invoke.card.FILEPICKER_MODE_SAVER,
        directory: [blackberry.io.sharedFolder]
    },
function (path) {
    blob = new window.Blob([code], {type:  'text/js'});
    if (path.slice(-3) != ".js") {path.concat(".js")};
    window.path = path;
    writeBlobToPath(blob, code, 5.0 * 1024 * 1024, path, function(path){
        blackberry.ui.toast.show('Successsful saved at: ' + path);
    });
},null,
function (error) {
    if (error) {
        blackberry.ui.toast.show('Error during saving: ' + error);
        console.log('Invoke Error: ' + error);
    }});
}

function readFile(file_path) {
    console.log(file_path);
    // un-sandbox file system to access shared folder
    blackberry.io.sandbox = false;

    window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

    window.requestFileSystem(window.TEMPORARY, 1024 * 1024,
        function (fs) {
            // in order to access the shared folder,
            // config.xml must declare the "access_shared" permission
            // reference file by absolute path since file system is un-sandboxed
            fs.root.getFile(file_path, {create: true},
                function (fileEntry) {
                    fileEntry.file(function (file) {
                        var reader = new FileReader();
                        
                        reader.onloadend = function (e) {
                            window.path = file_path;
                            window.code = this.result;
                            bb.pushScreen('new.html', 'edit', {source: this.result});
                        };
                        
                        reader.readAsText(file);
                    
                    }, errorHandler);
                }, errorHandler);
        });
}

function errorHandler(e) {
    var msg = '';

    switch (e.code) {
        case FileError.QUOTA_EXCEEDED_ERR:
            msg = 'QUOTA_EXCEEDED_ERR';
            break;
        case FileError.NOT_FOUND_ERR:
            msg = 'NOT_FOUND_ERR';
            break;
        case FileError.SECURITY_ERR:
            msg = 'SECURITY_ERR';
            break;
        case FileError.INVALID_MODIFICATION_ERR:
            msg = 'INVALID_MODIFICATION_ERR';
            break;
        case FileError.INVALID_STATE_ERR:
            msg = 'INVALID_STATE_ERR';
            break;
        default:
            msg = 'Unknown Error';
            break;
    };

    blackberry.ui.toast.show('Error: ' + msg);
}

window.seen = false;

function onInvoked(info) {
    if(info.data) {
        alert("Data: " + info.data);
        //the data comes in as a base64 string you can convert it using atob(...)
        //note that atob will fail if you are being passed unicode strings
        alert("Data: " + atob(info.data));
    }
    alert(JSON.stringify(info));
    var path = [];
    var cut = info.uri.substr(7);
    var file_path = decodeURI(cut);
    path.push(file_path)
    readFile(path);
    window.path = path;
}