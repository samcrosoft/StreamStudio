var mediaServer;
playFromUpnp = false;

function browseUpnpDir(serverId, indexId, parentId) {
    console.log('loading file for server index ' + serverId + " at index " + indexId)

    mediaServer = new Plug.UPnP_ContentDirectory(cli._servers[serverId], {
        debug: false
    });
    mediaServer.index = serverId;

    mediaServer.browse(indexId, null, null, 0, 1000, null).then(function(response) {
        if (response && response.data) {
            try {
                var xml = encodeXML(response.data.Result);
                var channels = [];
                parseString(xml, function(err, result) {
                    var dirs = undefined;
                    try {
                        dirs = result['DIDL-Lite']['container'];
                    } catch (err) {}
                    var items = undefined;
                    try {
                        items = result['DIDL-Lite']['item'];
                    } catch (err) {}
                    $('#items_container').empty().show();
                    if (items) {
                        $.each(items, function(index, dir) {
                            var channel = {};
                            channel.parentId = parentId;
                            channel.serverId = serverId;
                            if (dir['upnp:class'][0].indexOf('object.container') !== -1) {
                                var channel = {};
                                channel.data = dir.$;
                                channel.title = XMLEscape.xmlEscape(dir['dc:title'][0])
                                channel.type = 'folder';
                                channels.push(channel);
                            } else if (dir['upnp:class'][0].indexOf('object.item') !== -1) {
                                channel.data = dir["res"][0]['$'];
                                channel.link = dir["res"][0]["_"] + '&upnp';
                                channel.class= dir['upnp:class'][0];
                                channel.type = 'file';
                                channel.title = XMLEscape.xmlEscape(dir['dc:title'][0])
                                channels.push(channel);
                            }
                            if (index + 1 === items.length) {
                                if (dirs) {
                                    $.each(dirs, function(index, dir) {
                                        var channel = {};
                                        channel.parentId = parentId;
                                        channel.serverId = serverId;
                                        if (dir['upnp:class'][0].indexOf('object.container') !== -1) {
                                            channel.data = dir.$;
                                            channel.title = XMLEscape.xmlEscape(dir['dc:title'][0])
                                            channel.type = 'folder'
                                            channels.push(channel);
                                        } else if (dir['upnp:class'][0].indexOf('object.item') !== -1) {
                                            channel.data = dir["res"][0]['$'];
                                            channel.link = dir["res"][0]["_"] + '&upnp';
                                            channel.class= dir['upnp:class'][0];
                                            channel.type = 'file';
                                            channel.title = XMLEscape.xmlEscape(dir['dc:title'][0])
                                            channels.push(channel);
                                        }
                                        if (index + 1 === dirs.length) {
                                            var sorted = ___.sortBy(channels, 'title');
                                            loadUpnpItems(sorted);
                                        }
                                    });
                                } else {
                                    var sorted = ___.sortBy(channels, 'title');
                                    loadUpnpItems(sorted);
                                }
                            }
                        });
                    } else {
                        if (dirs) {
                            $.each(dirs, function(index, dir) {
                                var channel = {};
                                channel.parentId = parentId;
                                channel.serverId = serverId;
                                if (dir['upnp:class'][0].indexOf('object.container') !== -1) {
                                    channel.data = dir.$;
                                    channel.title = XMLEscape.xmlEscape(dir['dc:title'][0])
                                    channel.type = 'folder'
                                    channels.push(channel);
                                } else if (dir['upnp:class'][0].indexOf('object.item') !== -1) {
                                    channel.data = dir["res"][0]['$'];
                                    channel.link = dir["res"][0]["_"] + '&upnp';
                                    channel.class= dir['upnp:class'][0];
                                    channel.type = 'file';
                                    channel.title = XMLEscape.xmlEscape(dir['dc:title'][0]);
                                    channels.push(channel);
                                }
                                if (index + 1 === dirs.length) {
                                    var sorted = ___.sortBy(channels, 'title');
                                    loadUpnpItems(sorted);
                                }
                            });
                        }
                    }
                });
            } catch (err) {
                console.log("ERRORRRRRR " + err)
            }
        } else {
            console.log("no response")
        }
        $(".mejs-overlay").hide();
        $(".mejs-layer").hide();
        $(".mejs-overlay-loading").hide();

    }).then(null, function(error) { // Handle any errors
        console.log("An error occurred: " + error.description);
        $(".mejs-overlay").hide();
        $(".mejs-layer").hide();
        $(".mejs-overlay-loading").hide();
    });
}

function loadUpnpItems(items) {
    $.each(items, function(index, file) {
        if (file.type === "folder") {
            var id = Math.floor(Math.random() * 1000000);
            var obj = {
                "attr": {
                    id: '' + id + '_upnpSubNode'
                },
                "data": {
                        "title": XMLEscape.xmlUnescape(file.title),
                        "attr": {
                            "id": '' + id + '_upnpSubNode',
                            "serverId" : file.serverId,
                            "parent": file.parentId,
                            "index": file.data.id
                        }
                },
                "children": []
            }
            $("#UpnpContainer").jstree("create", $("#"+file.parentId), "inside", obj, function() {}, true);
        } else {
			try {
				var ext = file.title.split('.').pop().toLowerCase();
				if(['pdf','txt','html','rar','zip','iso','.torrent','nfo'].indexOf(ext) !== -1) {
					return true;
				}
			} catch(err) {}
			
			if(ext)
            var id = Math.floor(Math.random() * 1000000);
                var obj = {
                    "attr": {
                        "id": id
                    },
                    "icon": "js/jstree/themes/default/movie_file.png",
                    "data": {
                        "title": XMLEscape.xmlUnescape(file.title),
                        "attr": {
                            "id": id,
                            "parent": file.parentId,
                            "data": JSON.stringify(file.data),
                            "link": file.link,
                            "type" : file.class,
                            "class": "upnpMedia",
                            "title": file.title
                        }
                    }
                }
            $("#fileBrowserContent").jstree("create", $("#"+file.parentId), "inside", obj, function() {}, true);
        }
    });
}


function updateUpnpList() {
    var list = cli._servers;
    $('#upnp_upnpRootNode ul').remove()
    if ($('#UpnpContainer li').length === 0) {
        $(function() {
            $("#UpnpContainer").jstree({
                "plugins": ["themes", "json_data", "ui", "types", "crrm"],
                "json_data": {
                    "data": {
                        "attr": {
                            id: '' + _("upnp") + '_upnpRootNode'
                        },
                        "data": _("Upnp"),
                        "children": []
                    }
                },
                "themes": {
                    "theme": "default"
                },
            }).bind("select_node.jstree", function(e, data) {
                onSelectedItem(data);
            }).bind('before.jstree', function(event, data) {
                if (data.plugin == 'contextmenu') {
                    var settings = data.inst._get_settings();
                    if ((data.inst._get_parent(data.args[0]) == -1) || (data.args[0].id === '')) {
                        settings.contextmenu.items.remove._disabled = true;
                        settings.contextmenu.items.rename._disabled = true;
                        settings.contextmenu.items.create._disabled = false;
                    } else {
                        settings.contextmenu.items.remove._disabled = false;
                        settings.contextmenu.items.rename._disabled = false;
                        settings.contextmenu.items.create._disabled = true;
                    }
                }
            }).bind("loaded.jstree", function(event, data) {
                console.log('upnp tree loaded...')
            });
        });
    }
    $.each(list, function(index, server) {
		// load upnpFolder if not already loaded
        if ($('#' + server._index + '_upnpRootNode').length === 0) {
            var obj = {
                "attr": {
                    id: '' + server._index + '_upnpRootNode'
                },
                "data": XMLEscape.xmlUnescape(server.friendlyName),
                "class": "upnpSubfolder",
                "children": []
            }
            $("#UpnpContainer").jstree("create", $("#" + _("upnp") + "_upnpRootNode"), "inside", obj, function() {}, true);
        }
    })
    if(cli._avTransports.length > 0) {
		$('#upnpRenderersContainer').show();
        $('#upnpBubble').show();
	} else {
        $('#upnpRenderersContainer').hide();
        $('#upnpBubble').hide();
    }
}

function loadUpnpRenderers() {
	var list = cli._avTransports;
	upnpDevices = [];
	$('#upnpPopup').empty();
	$.each(list,function(index,item) {
		var name = item.friendlyName;
		if (upnpDevices.length === 0) {
			$('#upnpPopup').append('<span style="position:relative;top:-3px;">'+name + ' :</span> <input class="upnp" type="radio" data-type="upnp" name="'+name+'" checked="true" value="'+name+'"> <br />');
		} else {
			$('#upnpPopup').append('<span style="position:relative;top:-3px;">'+name + ' :</span> <input class="upnp" type="radio" data-type="upnp" name="'+name+'" value="'+name+'"> <br />');
		}
		upnpDevices.push(name);
		if(index+1 === list.length) {
			return loadUpnpQtip();
		}
	});

    $.each(chromecastDevices,function(index,item) {
        var name = item.name;
        var id = item.id;
        if (upnpDevices.length === 0) {
            $('#upnpPopup').append('<span style="position:relative;top:-3px;">'+name + ' :</span> <input class="upnp" type="radio" data-type="chromecast" name="'+name+'" checked="true" value="'+id+'"> <br />');
        } else {
            $('#upnpPopup').append('<span style="position:relative;top:-3px;">'+name + ' :</span> <input class="upnp" type="radio" data-type="chromecast" name="'+name+'" value="'+id+'"> <br />');
        }
        upnpDevices.push(name);
        if(index+1 === chromecastDevices.length) {
            return loadUpnpQtip();
        }
    });
}


function loadUpnpQtip() {
  var type = 'upnp';
  if (upnpDevice !== null) {
      $("#upnpPopup input").each(function(){
          var name = $(this).prop('name');
          type = $(this).attr('data-type');
          if (name !== upnpDevice) {
              $(this).prop('checked','');
          }
      });
      if(type == 'upnp') {
        $("#upnpPopup input[name='"+cli._avTransports[upnpDevice]['friendlyName']+"']").prop('checked','checked');
        mediaRenderer = new Plug.UPnP_AVTransport( cli._avTransports[upnpDevice], { debug: false } );
      } else {
        mediaRenderer = __.some(chromecastDevices, function( el ) {
            return el.name === 'foo';
        });
      }
  } else {
	  if (upnpDevices.length > 0) {
		upnpDevice = 0;
		mediaRenderer = new Plug.UPnP_AVTransport( cli._avTransports[0], { debug: false } );
	  }
  }
  if (upnpDevices.length === 1) {
      upnpDevice = 0;
      mediaRenderer = new Plug.UPnP_AVTransport( cli._avTransports[0], { debug: false } );
      return;
  } else if (upnpDevices.length === 0){
      var text = '<p>Aucun Freebox player allumé! <br>Allumez votre freebox player et réactivez ce bouton...</p>';
      $("#upnp-toggle").qtip({
      content : {text: text},
      position: {
        corner: {
          target: 'bottomLeft',
          tooltip: 'bottomLeft'
        },
        position: {
			at: 'bottom left'
		}
      },
      show: { ready: true },
      hide: {
        event: 'unfocus',
        effect: function(offset) {
            $(this).slideDown(1000); // "this" refers to the tooltip
        }
      },
      style: { classes : 'qtip-youtube'},
      // The magic
      api: {
        onRender: function() {
          this.elements.tooltip.click(this.hide) //
        }
      }
    });
  } else {
    var text = $('#upnpPopup').html();
    $("#upnp-toggle").qtip({
      content : {text: text},
      position: {
        corner: {
          target: 'bottomMiddle',
          tooltip: 'topMiddle'
        }
      },
      show: { ready: true },
      hide: {
        event: 'unfocus',
        effect: function(offset) {
            $(this).slideDown(1000); // "this" refers to the tooltip
        }
      },
      style: { classes : 'qtip-youtube'},
      // The magic
      api: {
        onRender: function() {
          this.elements.tooltip.click(this.hide) //
        }
      }
    });
  }
}

var continueTransition = false;
var transitionCount = 0;
upnpStoppedAsked = false;
var upnpDeviceState = '';
function playUpnpRenderer(obj) {
    stopUpnp();
    cleanffar();
    if(mediaRendererType == "chromecast") {
        return playOnChromecast(obj);
    }
    mediaRenderer.stop().then(function(response) {
        setTimeout(function() {
            // stop upnp file loading if needed
            continueTransition = false;
            timeUpdater = null;
            transitionCount = 0;
            if(obj.type === undefined) {
                obj.type = "object.item.videoItem";
            }
            var uri = XMLEscape.xmlEscape(obj.link.replace('&upnp','').replace('&torrent','').replace('&direct',''));
            var infos = JSON.parse(obj.data).protocolInfo;
            var title = XMLEscape.escape(obj.title);
            var type = obj.type;
            currentMedia = obj;
            
            var metaString= '&lt;DIDL-Lite xmlns=\"urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/\" xmlns:upnp=\"urn:schemas-upnp-org:metadata-1-0/upnp/\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:dlna=\"urn:schemas-dlna-org:metadata-1-0/\" xmlns:sec=\"http://www.sec.co.kr/\"&gt;&lt;item id=\"0/0/912/145-0\" parentID=\"0/0/912\" restricted=\"1\"&gt;&lt;upnp:class&gt;'+type+'&lt;/upnp:class&gt;&lt;dc:title&gt;'+title+'&lt;/dc:title&gt;&lt;dc:creator&gt;Unknown Artist&lt;/dc:creator&gt;&lt;upnp:artist&gt;Unknown Artist&lt;/upnp:artist&gt;&lt;upnp:album&gt;Unknown Album&lt;/upnp:album&gt;&lt;res protocolInfo=\"'+infos+':*\"&gt;'+uri+'&lt;/res&gt;&lt;/item&gt;&lt;/DIDL-Lite&gt;'
            mediaRenderer.setAVTransportURI("0",uri,metaString).then(function(response) {
                if (response && response.data) {
                    console.log('UPNP: Ok playing' + uri);
                    // start watching for PLAYING state
                    mediaRenderer.play().then(function(response) {
                        upnpContinuePlay = true;
                        continueTransition = true;
                        transitionCount = 0;
                        getRendererState('PLAYING');
                    });
                } else {
                    console.log("ERROR UPNP " + response)
                    mediaRenderer.stop().then(function(response) {
                        continueTransition = false;
                        upnpMediaPlaying = false;
                        console.log('UPNP: No response for' + uri)
                        getRendererState('STOPPED');
                    });
                }
                
            }).then( null, function( error ) { // Handle any errors

                console.log( "An error occurred: " + error.description );

            });
        },2000);
    });
}

function getRendererState(state) {
    mediaRenderer.getTransportInfo().then(function(response) {
        if (response && response.data) {
            //console.log(response.data.CurrentTransportState, state, continueTransition , transitionCount)
            //console.log(response.data.CurrentTransportState !== state && continueTransition, response.data.CurrentTransportState,state,continueTransition,transitionCount)
            if(response.data.CurrentTransportState !== state && continueTransition) {
                if(response.data.CurrentTransportState === 'TRANSITIONING') {
                    if (transitionCount === 120 && search_engine !== "twitch" && search_engine !== 'dailymotion') {
                        upnpMediaPlaying = false;
                        continueTransition = false;
                        upnpStoppedAsked = true;
                        stopUpnp();
                    } else {
                        transitionCount += 1;
                        $('.mejs-time-current').width(0+'%');
                        $('span.mejs-currenttime').text('--:--');
                        $('span.mejs-duration').text('--:--');
                        $('.mejs-overlay-play').hide();
                        $('.mejs-overlay,.mejs-overlay-loading').show()
                        setTimeout(function(){ 
                            getRendererState(state);
                        },1000);
                    }
                } else if (response.data.CurrentTransportState === "NO_MEDIA_PRESENT") {
                    if(transitionCount < 10 ) {
                        setTimeout(function(){
                            transitionCount +=1;
                            getRendererState('STOPPED');
                        },1000);
                    } else {
                        upnpMediaPlaying = false;
                        continueTransition = false;
                        initPlayer()
                        setTimeout(function(){
                            getRendererState('STOPPED');
                        },1000);
                    }
                } else {
                    $('.mejs-overlay-button,.mejs-overlay,.mejs-overlay-loading,.mejs-overlay-play').hide()
                    upnpMediaPlaying = true;
                    if($('#fbxMsg2').length == 0 && search_engine == "grooveshark" || search_engine == "songza") {
                        $('.mejs-container').append('<div id="fbxMsg2" style="height:calc(100% - 60px);"><div style="top:50%;position: relative;"><img style="margin-left: 50%;left: -100px;position: relative;top: 50%;margin-top: -100px;" src="'+currentMedia.cover+'" /><h3 style="font-weight:bold;text-align: center;">'+currentMedia.title+'</h3></div></div>');
                        $('.mejs-container').append('<p id="fbxMsg" style="height:100px !important;position: absolute;top: 50px;margin: 0 50%;color: white;font-size: 30px;text-align: center;z-index: 10000;width: 450px;right: 50%;left: -225px;">'+_("Playing on your UPNP device !")+'</p>')
                    }
                    if ($('#fbxMsg2').length > 0 && $('#fbxMsg2 img').attr('src') !== currentMedia.cover) {
                        $('#fbxMsg2 img').attr('src',currentMedia.cover);
                        $('#fbxMsg2 h3').text(currentMedia.title);
                    }
                    setTimeout(function(){ 
                        getRendererState(state);
                        getUpnpPosition();
                    },1000);
                }
            } else {
                console.log(state, upnpStoppedAsked)
                if (state === 'PLAYING') {
                    transitionCount = 0;
                    upnpMediaPlaying = true;
                    continueTransition = true;
                    setTimeout(function(){
                        $('#song-title').empty().append(_('Playing: ') + decodeURIComponent(currentMedia.title));
                        updateMiniPlayer();
                        $('.mejs-overlay-button').hide();
                        $('.mejs-overlay-loading').hide();
                        $('.mejs-container p#fbxMsg').remove();
                        $('#fbxMsg2').remove()
                        if(search_engine == "grooveshark" || search_engine == "songza") {
                            $('.mejs-container').append('<div id="fbxMsg2" style="height:calc(100% - 60px);"><div style="top:50%;position: relative;"><img style="margin-left: 50%;left: -100px;position: relative;top: 50%;margin-top: -100px;" src="'+currentMedia.cover+'" /><h3 style="font-weight:bold;text-align: center;">'+currentMedia.title+'</h3></div></div>');
                            $('.mejs-container').append('<p id="fbxMsg" style="height:100px !important;position: absolute;top: 50px;margin: 0 50%;color: white;font-size: 30px;text-align: center;z-index: 10000;width: 450px;right: 50%;left: -225px;">'+_("Playing on your UPNP device !")+'</p>')
                        } else {
                            $('.mejs-container').append('<p id="fbxMsg" style="height:100px !important;position: absolute;top: 45%;margin: 0 50%;color: white;font-size: 30px;text-align: center;z-index: 10000;width: 450px;right: 50%;left: -225px;">'+_("Playing on your UPNP device !")+'</p>')
                        }
                        $('.mejs-controls').width('100%');
                    },1000);
                    // watch for STOPPED state
                    getRendererState('STOPPED');
                } else if (state === 'STOPPED' || state === 'NO_MEDIA_PRESENT') {
                    upnpMediaPlaying = false;
                    continueTransition = false;
                    upnpStoppedAsked = false;
                    if(!play_next && !play_prev) {
                        setTimeout(function(){
                            checkStopped()
                        },2000);
                    } else {
                        play_next = false;
                        play_prev = false;
                    }
                }
            }
        } else {

            console.log("Service is reporting no response");
        }
    }).then( null, function( error ) { // Handle any errors
        console.log( "An error occurred: " + error );
    });
}

function checkStopped() {
    stopUpnp();
    mediaRenderer.getTransportInfo().then(function(response) {
        if (response && response.data) {
            //console.log(response.data.CurrentTransportState, state, continueTransition , transitionCount)
            //console.log(response.data.CurrentTransportState !== state && continueTransition, response.data.CurrentTransportState,state,continueTransition,transitionCount)
            if(response.data.CurrentTransportState == 'STOPPED' || response.data.CurrentTransportState === 'NO_MEDIA_PRESENT') {
                on_media_finished();
            } else {
                setTimeout(function(){
                    checkStopped()
                },1000);
            }
        }
    });
}

function stopUpnp() {
	continueTransition = false;
	// if user asked stop
	if(upnpMediaPlaying === false) {
		console.log("upnp stopped")
		continueTransition = false;
		// else continue
	} else {
		console.log('upnp finished playing...')
		continueTransition = false;
		upnpMediaPlaying = false;
		playFromUpnp = false;
		upnpStoppedAsked = false;
        $("#subPlayer-title").text(' '+_('Waiting...'));
        $('#subPlayer-play').show();
        $('#subPlayer-pause').hide();
        $('#subPlayer-Progress progress').val(0);
        $('#subPlayer-Timer .mejs-duration,.mejs-currenttime').text('00:00:00')
        $('#subPlayer-img').attr('src','images/play-overlay.png');
	}
}

function startUPNPserver() {
    try {
    var upnpDirs = [];
    $.each(settings.shared_dirs, function(index, dir) {
        var share = {};
        share.path = dir;
        share.mountPoint = path.basename(dir).replace(' ', '_');
        upnpDirs.push(share);
        if (index + 1 == settings.shared_dirs.length) {
            UPNPserver = new upnpServer({
                name: 'StreamStudio_' + os.hostname(),
                uuid: uuid.v4()
            }, upnpDirs);
            UPNPserver.start();
        }
    });
} catch(err) {
    console.log(err)
}
}

function playOnChromecast(currentMedia) {
    if(currentMedia.link.indexOf('http://'+ipaddress+':8887/?file=') == -1 && currentMedia.link.indexOf('stream.php?streamKey') == -1 && currentMedia.link.indexOf('vp8') == -1 && currentMedia.link.indexOf('mp4') == -1 && currentMedia.link.indexOf('.ogg') == -1 && currentMedia.link.indexOf('.wav') == -1 && currentMedia.link.indexOf('.mp3') == -1 && currentMedia.link.indexOf('.mp4') == -1 && currentMedia.title.indexOf('.mkv') == -1 && currentMedia.title.toLowerCase().indexOf('264') == -1 || currentMedia.title.toLowerCase().indexOf('ac3') !== -1 || currentMedia.title.toLowerCase().indexOf('dts') !== -1 || currentMedia.title.toLowerCase().indexOf('hevc') !== -1 || currentMedia.title.toLowerCase().indexOf('x265') !== -1) {
        var link = 'http://'+ipaddress+':8887/?file='+currentMedia.link.replace('&upnp','');
        currentMedia.link = link;
    }
    mediaRenderer.play(currentMedia.link,null,null,win.window);
    ChromecastInterval = setInterval(getChromeCastPos,1000);
    mediaRenderer.on('status',function(status) {
        if(status.playerState == 'IDLE') {
            if(chromeCastplaying) {
                clearInterval(ChromecastInterval);
                chromeCastplaying = false;
            }
            on_media_finished();
        } else if(status.playerState == 'PLAYING' || status.playerState == 'BUFFERING') {
            $('.mejs-overlay-button,.mejs-overlay,.mejs-overlay-loading,.mejs-overlay-play').hide()
            $('#fbxMsg2,#fbxMsg').remove();
            chromeCastplaying = true;
            updateProgressBar();
            if(currentMedia.cover) {
                $('.mejs-container').append('<div id="fbxMsg2" style="height:calc(100% - 60px);"><div style="top:50%;position: relative;"><img style="margin-left: 50%;left: -200px;position: relative;top: 50%;margin-top: -200px;width:400px;max-height:400px;" src="'+currentMedia.cover+'" /><h3 style="font-weight:bold;text-align: center;">'+currentMedia.title+'</h3></div></div>');
                $('.mejs-container').append('<p id="fbxMsg" style="height:100px !important;position: absolute;top: 50%;margin: 0 50%;color: white;font-size: 30px;text-align: center;z-index: 10000;width: 100%;right: 50%;left: -50%;top: calc(50% - 350px);">'+_("Playing on your Chromecast device !")+'</p>')
            } else {
                $('.mejs-container').append('<p id="fbxMsg" style="height:100px !important;position: absolute;top: 45%;margin: 0 50%;color: white;font-size: 30px;text-align: center;z-index: 10000;width: 100%;right: 50%;left: -50%;">'+currentMedia.title+' <br/> '+_("Playing on your Chromecast device !")+'</p>')
            }
        } else if(status.playerState == 'BUFFERING') {
            $('#fbxMsg2').remove();
            $('.mejs-overlay,.mejs-overlay-loading').show()
            $('.mejs-overlay-play').hide()
        }
    });
}

function getChromeCastPos() {
    mediaRenderer.getStatus(function(data){
        try {
            mediaDuration = data.media.duration;
            player.media.duration = mediaDuration;
            player.media.currentTime = data.currentTime;
            updateProgressBar();
        } catch(err) {

        }

    })
}

// start 
startUPNPserver();
