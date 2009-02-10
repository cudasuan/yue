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
    
    preview: function(pblock){
        var doc = CmdUtils.getDocument();
        var doc_url = doc.location.href;
        
        if (!yue_preview.is_login || yue_preview[doc_url] == null) {
            jQuery.ajax({
                type: "GET",
                url: yue_host + "/exist?url=" + encodeURIComponent(doc_url),
                dataType: "json",
                cache: false,
                error: function(){
                    yue_preview.status = 'Please <a href="' + yue_host + '/login"><b style="color:red">login</b> at Yue use your google account</a> first!';
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
        
        var selection_html = CmdUtils.getHtmlSelection();
        var selection = CmdUtils.getSelection();
        var sel = 'No selection';
        if (selection_html != null) {
            sel = selection_html;
            if (selection.length > 150) {
                sel = selection.substring(0, 146) + '...<br/><em>(trucated for preview, saved version will be complete)</em>';
            }
        }
        
        var re = context.chromeWindow.gUbiquity.__textBox.value;
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
    execute: function(){
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
        var selection_html = CmdUtils.getHtmlSelection();
        if (selection_html != null) {
            postData.sel = selection_html;
        }
        
        var re = context.chromeWindow.gUbiquity.__textBox.value;
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
