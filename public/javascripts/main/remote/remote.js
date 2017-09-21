var addTabs = function(options) {
    var id = options.id;
    var tabid = 'tab_' + id;
    $(".nav-tabs .active").removeClass("active");
    $(".tab-content .active").removeClass("active");

    var url = '';
    if ('ssh' == options.type) {
        url = options.path + '/' + options.type + '/' + options.username + '/' + options.ip + '/' + options.port;
    } else if('telnet' == options.type){
        url = options.path + '/' + options.type + '/' + options.ip + '/' + options.port;
    } else {
        url = options.path;
    }

    //如果TAB不存在，创建一个新的TAB
    if (!$("#" + id)[0]) {
        //固定TAB中IFRAME高度
        mainHeight = $(window).height() - $('.nav-tabs').height();
        console.log(mainHeight)
        //创建新TAB的title
        var title = '<li role="presentation" id="' + tabid + '"><a href="#' + id + '" aria-controls="' + id + '" role="tab" data-toggle="tab"><span>' + options.title + '</span>';
        title += ' <i class="glyphicon glyphicon-remove" tabclose="' + id + '"></i>';
        title += '</a></li>';
        //是否指定TAB内容
        if (options.content) {
            content = '<div role="tabpanel" class="tab-pane" id="' + id + '">' + options.content + '</div>';
        } else { //没有内容，使用IFRAME打开链接
            content = '<div role="tabpanel" class="tab-pane" id="' + id + '"><iframe src="' + url + '" width="100%" height="' + mainHeight + '" frameborder="no" border="0" marginwidth="0" marginheight="0" scrolling="no" allowtransparency="yes" z-look="no"></iframe></div>';
        }
        //加入TABS
        $(".nav-tabs").append(title);
        $(".tab-content").append(content);
    }
    //激活TAB
    $("#tab_" + id).addClass('active');
    $("#" + id).addClass("active");
};
var closeTab = function(id) {
    //如果关闭的是当前激活的TAB，激活他的前一个TAB或后一个TAB
    if ($(".nav-tabs li.active").attr('id') == "tab_" + id) {
        if ('BUTTON' != $("#tab_" + id).prev().prop("tagName")) {
            $("#tab_" + id).prev().addClass('active');
            $("#" + id).prev().addClass('active');
        } else {
            $("#tab_" + id).next().addClass('active');
            $("#" + id).next().addClass('active');
        }
    }
    //关闭TAB
    $("#tab_" + id).remove();
    $("#" + id).remove();
};

function blindClickEvent() {
    $('#ssh-submit').on('click', function(e) {
        var ip = $('#ssh-ip').val();
        var username = $('#ssh-username').val();
        var port = $('#ssh-port').val();
        if (ip === '' || username === '' || port === '') {
            alert('不可为空');
            return;
        }
        var type = 'ssh';
        var id = Math.floor(Math.random() * 1000)
       
        var options = {
            id: id,
            title: ip + '(' + type + ')',
            ip: ip,
            username: username,
            port: port,
            // path: 'http://10.4.45.19:2002/wetty',
            path: location.origin + '/wetty',
            type: type
        }
        addTabs(options);
        $('#add-ssh').modal('hide');
        $('#add-ssh').find('input').val('');
    });

    $('#telnet-submit').on('click', function(e) {
        var ip = $('#telnet-ip').val();
        var port = $('#telnet-port').val();
        if (ip === '' || port === '') {
            alert('不可为空');
            return;
        }
        var type = 'telnet';
        var id = Math.floor(Math.random() * 1000)
        var options = {
            id: id,
            title: ip + '(' + type + ')',
            ip: ip,
            port: port,
            path: location.origin + '/wetty',
            type: type
        }
        addTabs(options);
        $('#add-telnet').modal('hide');
        $('#add-telnet').find('input').val('');
    });

    $('#add-mstsc').on('click', function(e) {
      var type = 'mstsc';
      var id = Math.floor(Math.random() * 1000)
      var options = {
          id: id,
          title: '(' + type + ')',
          path: location.origin + '/mstsc',
          type: type
      };
      addTabs(options);
    });

    $(".nav-tabs").on("click", "[tabclose]", function(e) {
        var id = $(this).attr("tabclose");
        closeTab(id);
    });
    $('.nav-tabs').on('mousedown', "a[role='tab']", function(event) {
        if (event.which == 2) {
            var id = $(this).find('[tabclose]').attr('tabclose');
            closeTab(id);
        }
    })
}

function blindKeyDownEvent() {
    $(document).bind('keydown', 'ctrl+shift+x', function(event) {
        $('#add-ssh').modal('show');
        event.stopPropagation(); //  阻止事件冒泡
    });
    $(document).bind('keydown', 'ctrl+shift+z', function(event) {
        $('#add-telnet').modal('show');
        event.stopPropagation(); //  阻止事件冒泡
    });
    $('#add-ssh').keypress(function(e) {
        // 回车键事件
        if (e.which == 13) {
            $('#ssh-submit').click();
        }
    });
    $('#add-telnet').keypress(function(e) {
        // 回车键事件
        if (e.which == 13) {
            $('#telnet-submit').click();
        }
    });
}

function init() {
    blindClickEvent();
    blindKeyDownEvent();
}

$(function() {
    init()
});
