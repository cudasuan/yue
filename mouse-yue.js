// -----------------------------------------------------------------
// Yue Note COMMANDS
// -----------------------------------------------------------------

var yue_host = "http://yue.yimudi.org";
var yue_preview = {
    status: '',
    is_login: false,
}

var yue_split_input = function(re){
    if (re.substr(0, 2) == "y " || re == "y") {
        re = re.substr(2);
    }
    else 
        if (re.substr(0, 3) == "yu " || re == "yu") {
            re = re.substr(3);
        }
        else 
            if (re.substr(0, 4) == "yue ") {
                re = re.substr(4);
            }
            else 
                if (re.substr(0, 3) == "yue") {
                    re = re.substr(3);
                }
    
    var tag = '';
    var note = '';
    var special = '';
    
    var split_pos = re.indexOf("|");
    if (split_pos != -1) {
        tag = re.substr(0, split_pos);
        note = re.substr(split_pos + 1);
    }
    else {
        tag = re;
    }
    if (note.substr(-2) == "|a") {
        note = note.substr(0, note.length-2);
        special = "append";
    }
    return [tag, note, special];
}

CmdUtils.CreateCommand({
    name: "yue",
    icon: yue_host + "/favicon.ico",
    homepage: yue_host,
    author: {
        name: "Changliang (Charlie) Xu",
        email: "xuchangliang@gmail.com"
    },
    description: "Yue(阅) roughly can translate to 'Read' in English, and this command is for you to mark, tag, comment your readings",
    help: "Select, add your comment and tags if you want, hit enter, done! <br/> Just rememeber hit enter, others are optional. See  <a href=\"" + yue_host + "\">complete instruction/demo</a>",
    takes: {
        "tag1, tag2, ...|note": noun_arb_text
    },
    
    preview: function(pblock, input){
        var doc = CmdUtils.getDocument();
        var doc_url = doc.location.href;
        
        if (!yue_preview.is_login || yue_preview[doc_url] == null) {
            jQuery.ajax({
                type: "GET",
                url: yue_host + "/exist?url=" + encodeURIComponent(doc_url),
                dataType: "json",
                cache: false,
                error: function(){
                    yue_preview.status = 'Please <a href="' + yue_host + '/login" target="_blank"><b style="color:red">login</b> at Yue use your google account</a> first!';
                    yue_preview.is_login = false;
                },
                success: function(msg){
                    if (msg.msg == null) {
                        yue_preview.status = 'Please <a href="' + yue_host + '/login"><b style="color:red">login</b> at Yue use your google account</a> first!';
                    }
                    else {
                        yue_preview.is_login = true;
                        yue_preview[doc_url] = 1;
                        yue_preview.status = msg.msg;
                    }
                }
            });
        }
        
        var selection_html = '';
        var selection = '';
        var re = '';
        if (input.selection_html) {
            selection_html = input.selection_html;
            selection = selection_html.replace(/<[^>]*>/g, '');
            re = 'y ' + input.text;
        } else {
            selection_html = CmdUtils.getHtmlSelection();
            selection = CmdUtils.getSelection();
            re = Utils.currentChromeWindow.gUbiquity.__textBox.value;
        }

        var sel = 'No selection';
        if (selection_html != null) {
            sel = selection_html;
            if (selection.length > 150) {
                sel = selection.substring(0, 146) + '...<br/><em>(trucated for preview, saved version will be complete)</em>';
            }
        }
        
        var split_input = yue_split_input(re);
        var tag = split_input[0];
        var note = split_input[1];
        var special = split_input[2];
        var url_status = yue_preview.status;
        if (special == 'append') {
            url_status = '<b style="color:blue">Appending</b> selection etc. to an entry';
        }
        
        var output = 'Url status:<div style="background-color: #666; padding: 20px 10px; margin: 10px">' + url_status + "</div>" +
        'Your tags:<div style="background-color: #888; padding: 20px 10px; margin: 10px">' +
        tag +
        "</div>" +
        'Your note:<div style="background-color: #888; padding: 20px 10px; margin: 10px">' +
        note +
        "</div>" +
        'Your selection:<div style="background-color: #777; padding: 20px 10px; margin: 10px">' +
        sel +
        "</div>";
        pblock.innerHTML = output;
    },
    execute: function(input){
        var doc = CmdUtils.getDocument();
        var doc_url = doc.location.href;
        var postData = {
            sel: '',
            tag: '',
            note: '',
            special: '',
            url: doc_url,
            title: doc.title
        };

        var selection_html = '';
        var re = '';
        if (input.selection_html) {
            selection_html = input.selection_html;
            re = 'y ' + input.text;
        } else {
            selection_html = CmdUtils.getHtmlSelection();
            re = Utils.currentChromeWindow.gUbiquity.__textBox.value;
        }

        if (selection_html != null) {
            postData.sel = selection_html;
        }
        
        var split_input = yue_split_input(re);
        postData.tag = split_input[0];
        postData.note = split_input[1];
        postData.special = split_input[2];
        
        jQuery.ajax({
            data: postData,
            url: yue_host + "/mark",
            dataType: "text",
            type: "POST",
            cache: false, //this seems no effect
            success: function(msg){
                delete (yue_preview[doc_url]);
                yue_preview.status = '';
                yue_preview.is_login = true;
                displayMessage(msg);
            },
            error: function(msg){
                displayMessage("failed to update: " + msg);
            }
        });
    }
});

// start the mouse.js part
// UTILITY FUNCTIONS
var LAST_SEL_TEXT = "";
var LAST_SEL_HTML = "";

function getUbiquity(){
  return Utils.currentChromeWindow.gUbiquity;
}

function getCommandByName( name ) {
  var ubiq = getUbiquity();
  return ubiq.__cmdManager.__cmdSource.getCommand( name );
}

function createFormUI( cmd, selectedText, elem, mods ) {
  doc = CmdUtils.getDocument();
  
  // Check if the form interface exists:
  if( jQuery("#UbiquityForm", doc).length == 0 )
    jQuery("#UbiquityDiv", doc).prepend("<div id='UbiquityForm'></div>");
  else
    jQuery("#UbiquityForm", doc).empty();
    
  var button = doc.createElement("input");
  jQuery(button)
    .attr("type", "button")
    .attr("value", cmd.name)
    .css({backgroundColor: "#999", border:"1px solid #AAA", marginLeft:"10px"})
    .click(function(event){
      if (cmd.name == "yue") {
        cmd.execute( {}, {text:input.value, selection_html:LAST_SEL_HTML}, mods || {});
      } else {
        cmd.preview( {}, {text:input.value}, mods || {}, elem );      
      }
    })

  var input = doc.createElement("input");
  jQuery(input)
    .attr("type", "text")
    .attr("value", selectedText)
    .blur(function(){ LAST_SEL_TEXT = this.value; })
    .keydown(function(event){
      if( event.which == 13 ){
        button.click();
      }
    })
    .keyup(function(){
      if (cmd.name == "yue") {
        cmd.preview( {}, {text:input.value, selection_html:LAST_SEL_HTML}, mods || {}, elem );      
      } else {
        cmd.preview( {}, {text:input.value}, mods || {}, elem );      
      }
    })
    .css({width:"330px", opacity:.6})
    
  var go = doc.createElement("input");
  jQuery(go)
    .attr("type", "button")
    .attr("value", ">")
    .css({backgroundColor: "#999", border:"1px solid #AAA"})
    .click(function(event){
      if (cmd.name == "yue") {
        cmd.execute( {}, {text:input.value, selection_html:LAST_SEL_HTML}, mods || {});
      } else {
        cmd.execute( {}, {text:input.value}, mods || {});
      }
    })
      
  jQuery('#UbiquityForm', doc)
    .append( input, button, go );
}

function putYuePreviewInElement( commandName, elem, mods ) {
  var cmd = getCommandByName( commandName );

  LAST_SEL_TEXT= CmdUtils.getWindow().getSelection().toString();
  cmd.preview( {}, {text:'', selection_html:LAST_SEL_HTML}, mods || {}, elem );
  
  createFormUI( cmd, '', elem, mods )
}

function putCommandPreviewInElement( commandName, elem, mods ) {
  var cmd = getCommandByName( commandName );

  var selText = CmdUtils.getWindow().getSelection().toString();
  selText = selText || LAST_SEL_TEXT;
  LAST_SEL_TEXT = selText;
  cmd.preview( {}, {text:selText}, mods || {}, elem );
  
  createFormUI( cmd, selText, elem, mods )
}

// Scrolling Related  utitlies
function _openScrollPane(){
  var WIDTH = 500;
  var WIDTHPX = WIDTH + "px"
  
  var win = CmdUtils.getWindow();
  var doc = CmdUtils.getDocumentInsecure();
  winWidth = jQuery("body")
  var div = doc.createElement("div");
  var hidden = doc.createElement("div");
  
  var iframe = doc.createElement("iframe");
  jQuery(iframe).css({
    width: 450,
    height: 500,
    border: "none",
  });

  jQuery("body",doc).append(div);
  div.appendChild(iframe);
  div.id = "UbiquityDiv";
  
  iframe.contentDocument.open();
  iframe.contentDocument.write('');
  iframe.contentDocument.close();
  
  iframe.id = "UbiquityIframe";  

  jQuery(iframe.contentDocument.body).css({
    color:"#dadada",
  })
  
  iframe.contentDocument.linkColor = "white";
  iframe.contentDocument.vlinkColor = "white";  

  jQuery("body", doc).css("overflow", "hidden");

  jQuery(hidden).css({position:"absolute", left: win.innerWidth, top:0, width:1, height:1, display:"hidden"})
  jQuery("body", doc).append(hidden);

  jQuery(div).css({
    position:"fixed", top: 0, left:win.innerWidth,
    width:WIDTH, height: win.innerHeight,
    backgroundColor: "#333", color: "white", fontSize: "16px",
    padding: "20px",
    zIndex: 10001
  }).click(function(event){ event.stopPropagation(); });  
    
  Utils.setTimeout(function(){
    jQuery("html,body", doc).animate({"scrollLeft":"500px"});
    jQuery(div, doc).animate({"left":"-=" + WIDTHPX});
    jQuery(hidden, doc).animate({"left":"+=" + WIDTHPX});   

    jQuery("#UbiquityBadge", doc).remove();
    
    jQuery("body", doc).one("click", function(event){
      
      event.stopPropagation();
      event.preventDefault();
      
      if( event.originalTarget.parentNode && event.originalTarget.parentNode.id == "UbiquityDiv" ){
        return;
      }
      
      jQuery(div, doc).animate({"left":"+=" + WIDTHPX});
      jQuery(hidden, doc).animate({"left":"-=" + WIDTHPX}, function(){
        jQuery(hidden,doc).hide();
      });     

      jQuery("html,body", doc).animate({"scrollLeft":"0"}, function(){
        jQuery("body", doc).css("overflow", "visible");
        jQuery("#UbiquityDiv",doc).remove();
      })

    })

  }, 200)    
  
  return {pane: div, preview:iframe.contentDocument};  
}


// COMMANDS

CmdUtils.CreateCommand({
  name:"scroll",
  execute: function(){
    
    var pointers = _openScrollPane();
    var preview = pointers.preview;
    var pane = pointers.pane;

    //LAST_SEL_HTML = CmdUtils.getHtmlSelection();
    //LAST_SEL_HTML = CmdUtils.getWindow().getSelection().toString();
    putYuePreviewInElement( "yue", preview.body );

    var doc = CmdUtils.getDocumentInsecure();
    
    var cmds = {
      "yue": {},
      "define": {},
      "google": {},
      "wikipedia": {in:"en"},
      "youtube": {},
      "calculate":{},
      "flickr": {},
      "translate": {to:"cn"},
      "weather": {in:"f"},
      "word-count":{},
      "yahoo-search":{},
      "twitter":{},
    }
    jQuery(pane).append("<br/>");
    
    for( var cmd in cmds ){
      var a = doc.createElement("span");
      
      jQuery(a)
        .html( cmd+", " )
        // We need to store the command name in the object, otherwise
        // closure scoping will always yield the last one in cmds.
        .attr("name", cmd )
        .css({cursor: "pointer", fontSize: "15px"})
        .click( function(event){
          var name = jQuery(this).attr("name");
          if (name == "yue") {
            putYuePreviewInElement( name, preview.body, cmds[name] );       
          } else {
            putCommandPreviewInElement( name, preview.body, cmds[name] );       
          }
        })
        .hover(
          function(event){
            var span = doc.createElement("span");
            var name = jQuery(this).attr("name");
            jQuery(span).html("[!]").attr("id","UbiquityGo").css({
              position:"absolute",
              marginTop:"-20px",
              marginLeft: "-30px",
              opacity: .8,
              backgroundColor: "#333",
              padding: "3px",
              cursor: "pointer"
            });
            jQuery(this).append(span);
          },
          function(){ jQuery("#UbiquityGo", doc).remove(); }
        )
        
        jQuery(pane).append(a);
    }
  }
})

CmdUtils.CreateCommand({
  name: "setup",
  execute: function(){
    doc = CmdUtils.getDocument();
    win = CmdUtils.getWindow();
    
    jQuery("body", doc).mousedown(function(event){
      jQuery("#UbiquityBadge", doc).remove();
    })

    jQuery("body", doc).mouseup(function(event){
      
      var selection = win.getSelection(); 
      if( !selection.isCollapsed && jQuery("#UbiquityBadge", doc).length == 0 ){
        var badge = doc.createElement("span");
        jQuery(badge)
          .css({
            height:31,
            width:26,
            backgroundImage: "url(http://azarask.in/verbs/mouse/selection_mark.png)",
            position:"absolute",
            "-moz-background-inline-policy":"continuous",
            cursor:"pointer",
            "margin-top": "-20px",
            "margin-left": "-10px",
            "opacity": .3 })
          .attr("id", "UbiquityBadge")
          .mousedown(function(event){            
            LAST_SEL_HTML = selection.toString();
            cmd_scroll();
          });

        var range = selection.getRangeAt(0);
        newRange = doc.createRange();
        newRange.setStart(selection.focusNode, range.endOffset);
        newRange.insertNode(badge);
        
        jQuery(badge).hover(
          function(){ jQuery(this).animate({opacity:1},100) },
          function(){ jQuery(this).animate({opacity:.3},100) }
        );
        
        /*
        // Experimental method of showing thingy.
        jQuery("body", doc).mousemove(function(event){
          var pos = jQuery(badge).position();
          var dY = pos.top - event.pageY;
          var dX = pos.left - event.pageX;
          var norm = Math.sqrt( dY*dY + dX*dX);
          
          if( norm > 100 ){ norm = 100; }
          if( norm < 50 ){ norm = 0; }
          var norm = norm/100;
          
          jQuery(badge).css({opacity:1-norm});
        })
        */
        
      }
    })
    
  }
})

function pageLoad_setup(){
  cmd_setup();
}
