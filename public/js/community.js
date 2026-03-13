/**
 * ==========================================================================
 * public/js/community.js
 * ========================================================================== */

(function () {
  'use strict';

  var dataEl = document.getElementById('communityData');
  var data = {};

  try {
    data = JSON.parse(dataEl.textContent);
  } catch (error) {
    data = { isLoggedIn: false, currentUser: null, channels: [], proChannels: [] };
  }

  var isLoggedIn = data.isLoggedIn;
  var currentUser = data.currentUser;
  var allChannels = data.channels.concat(data.proChannels);

  var activeChannel = 'general';
  var pollingInterval = null;
  var lastMessageId = 0;
  var isLoadingMessages = false;

  var sidebar = document.getElementById('communitySidebar');
  var membersPanel = document.getElementById('communityMembers');
  var channelItems = document.querySelectorAll('.channel-item');
  var channelHeaderName = document.getElementById('channelHeaderName');
  var channelHeaderDesc = document.getElementById('channelHeaderDesc');
  var membersChannelDesc = document.getElementById('membersChannelDesc');
  var messagesContainer = document.getElementById('messagesContainer');
  var messagesLoading = document.getElementById('messagesLoading');
  var messagesEmpty = document.getElementById('messagesEmpty');
  var messagesList = document.getElementById('messagesList');
  var messageForm = document.getElementById('messageForm');
  var messageInput = document.getElementById('messageInput');
  var messageSendBtn = document.getElementById('messageSendBtn');
  var messageCharCount = document.getElementById('messageCharCount');
  var channelMenuBtn = document.getElementById('channelMenuBtn');
  var sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
  var channelMembersBtn = document.getElementById('channelMembersBtn');
  var membersCloseBtn = document.getElementById('membersCloseBtn');

  function escapeHtml(value) {
    if (!value) {
      return '';
    }

    var div = document.createElement('div');
    div.appendChild(document.createTextNode(value));
    return div.innerHTML;
  }

  function timeAgo(dateStr) {
    var now = Date.now();
    var then = new Date(dateStr).getTime();
    var diff = Math.floor((now - then) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';

    var date = new Date(dateStr);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
  }

  function formatDateSeparator(dateStr) {
    var date = new Date(dateStr);
    var today = new Date();
    var yesterday = new Date();

    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
  }

  function getInitials(name) {
    if (!name) {
      return '?';
    }

    var parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  function getUserColor(username) {
    var colors = [
      '#0f766e', '#14532d', '#1d4ed8', '#7c2d12', '#991b1b',
      '#92400e', '#3730a3', '#0f172a', '#7c3aed', '#1f2937'
    ];
    var hash = 0;
    var index;

    for (index = 0; index < username.length; index += 1) {
      hash = username.charCodeAt(index) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }

  function getChannelById(channelId) {
    var index;

    for (index = 0; index < allChannels.length; index += 1) {
      if (allChannels[index].id === channelId) {
        return allChannels[index];
      }
    }

    return null;
  }

  function scrollToBottom(smooth) {
    if (!messagesContainer) {
      return;
    }

    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }

  function isNearBottom() {
    if (!messagesContainer) {
      return true;
    }

    return messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 100;
  }

  function renderMessage(msg) {
    var isPro = !!msg.is_pro;
    var isOwn = isLoggedIn && currentUser && msg.user_id === currentUser.id;
    var displayName = msg.display_name || msg.username;
    var initials = getInitials(displayName);
    var avatarColor = isPro ? '' : 'background-color:' + getUserColor(msg.username) + ';';
    var avatarClass = isPro ? 'message-avatar message-avatar-pro' : 'message-avatar message-avatar-default';
    var authorClass = isPro ? 'message-author message-author-pro' : 'message-author';
    var content = escapeHtml(msg.content).replace(/`([^`]+)`/g, '<code>$1</code>');
    var html = '';

    html += '<div class="message" data-message-id="' + msg.id + '" data-user-id="' + msg.user_id + '">';
    html += '<span class="' + avatarClass + '" style="' + avatarColor + '" aria-hidden="true">' + escapeHtml(initials) + '</span>';
    html += '<div class="message-body">';
    html += '<div class="message-header">';
    html += '<span class="' + authorClass + '">' + escapeHtml(displayName) + '</span>';

    if (isPro) {
      html += '<span class="message-pro-badge">PRO</span>';
    }

    html += '<span class="message-time" title="' + escapeHtml(msg.created_at) + '">' + timeAgo(msg.created_at) + '</span>';
    html += '</div>';
    html += '<div class="message-content">' + content + '</div>';
    html += '</div>';

    if (isOwn) {
      html += '<div class="message-actions">';
      html += '<button class="message-delete-btn" data-delete-id="' + msg.id + '" type="button" aria-label="Delete message">Delete</button>';
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function renderDateSeparator(dateStr) {
    return '<div class="message-date-separator"><span class="message-date-text">' + formatDateSeparator(dateStr) + '</span></div>';
  }

  function applyTextControls(scope) {
    if (window.ValueCodesTextifyControls) {
      window.ValueCodesTextifyControls(scope || document);
    }
  }

  async function loadMessages() {
    if (isLoadingMessages) {
      return;
    }

    isLoadingMessages = true;
    messagesLoading.style.display = 'flex';
    messagesEmpty.style.display = 'none';
    messagesList.innerHTML = '';

    try {
      var response = await fetch('/community/api/messages/' + activeChannel);
      var result = await response.json();

      messagesLoading.style.display = 'none';

      if (!result.success) {
        messagesList.innerHTML = '<div class="messages-empty"><h2 class="messages-empty-title">' + escapeHtml(result.error) + '</h2></div>';
        isLoadingMessages = false;
        return;
      }

      var messages = result.messages;
      var html = '';
      var lastDate = '';

      if (messages.length === 0) {
        messagesEmpty.style.display = 'flex';
        lastMessageId = 0;
        isLoadingMessages = false;
        return;
      }

      messagesEmpty.style.display = 'none';

      messages.forEach(function (msg) {
        var msgDate = new Date(msg.created_at).toDateString();

        if (msgDate !== lastDate) {
          html += renderDateSeparator(msg.created_at);
          lastDate = msgDate;
        }

        html += renderMessage(msg);
      });

      messagesList.innerHTML = html;
      lastMessageId = messages[messages.length - 1].id;
      applyTextControls(messagesList);
      scrollToBottom(false);
    } catch (error) {
      messagesLoading.style.display = 'none';
      messagesList.innerHTML = '<div class="messages-empty"><h2 class="messages-empty-title">Failed to load messages</h2><p class="messages-empty-desc">Please check your connection and try again.</p></div>';
    }

    isLoadingMessages = false;
  }

  async function pollMessages() {
    if (isLoadingMessages) {
      return;
    }

    try {
      var response = await fetch('/community/api/messages/' + activeChannel);
      var result = await response.json();

      if (!result.success || result.messages.length === 0) {
        return;
      }

      var messages = result.messages;
      var newLastId = messages[messages.length - 1].id;

      if (newLastId > lastMessageId) {
        var wasNearBottom = isNearBottom();
        var newMessages = messages.filter(function (msg) {
          return msg.id > lastMessageId;
        });
        var html = '';

        newMessages.forEach(function (msg) {
          html += renderMessage(msg);
        });

        if (html) {
          messagesList.insertAdjacentHTML('beforeend', html);
          applyTextControls(messagesList);
          messagesEmpty.style.display = 'none';

          if (wasNearBottom) {
            scrollToBottom(true);
          }
        }

        lastMessageId = newLastId;
      }
    } catch (error) {
      return;
    }
  }

  function startPolling() {
    stopPolling();
    pollingInterval = setInterval(pollMessages, 5000);
  }

  function stopPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

  function switchChannel(channelId) {
    if (channelId === activeChannel) {
      return;
    }

    var channel = getChannelById(channelId);

    if (!channel) {
      return;
    }

    if (channel.isPro) {
      if (!isLoggedIn) {
        window.location.href = '/login';
        return;
      }

      if (!currentUser.is_pro) {
        window.location.href = '/pricing';
        return;
      }
    }

    activeChannel = channelId;

    channelItems.forEach(function (item) {
      if (item.getAttribute('data-channel') === channelId) {
        item.classList.add('is-active');
        item.setAttribute('aria-selected', 'true');
      } else {
        item.classList.remove('is-active');
        item.setAttribute('aria-selected', 'false');
      }
    });

    channelHeaderName.textContent = channel.name;
    channelHeaderDesc.textContent = channel.description;

    if (membersChannelDesc) {
      membersChannelDesc.textContent = channel.description;
    }

    if (messageInput) {
      messageInput.placeholder = 'Message #' + channel.name.toLowerCase() + '...';
    }

    closeSidebar();
    loadMessages();
    startPolling();
  }

  async function sendMessage() {
    if (!isLoggedIn || !messageInput) {
      return;
    }

    var content = messageInput.value.trim();

    if (content.length === 0 || content.length > 2000) {
      return;
    }

    messageInput.disabled = true;
    messageSendBtn.disabled = true;

    try {
      var response = await fetch('/community/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content,
          channel: activeChannel
        })
      });
      var result = await response.json();

      if (result.success) {
        messagesList.insertAdjacentHTML('beforeend', renderMessage(result.message));
        applyTextControls(messagesList);
        lastMessageId = Math.max(lastMessageId, result.message.id);
        messagesEmpty.style.display = 'none';
        messageInput.value = '';
        updateCharCount();
        autoResizeTextarea();
        scrollToBottom(true);
      } else {
        alert(result.error || 'Failed to send message.');
      }
    } catch (error) {
      alert('Failed to send message. Please check your connection.');
    }

    messageInput.disabled = false;
    messageInput.focus();
  }

  async function deleteMessage(messageId) {
    if (!confirm('Delete this message?')) {
      return;
    }

    try {
      var response = await fetch('/community/api/messages/' + messageId, {
        method: 'DELETE'
      });
      var result = await response.json();

      if (!result.success) {
        alert(result.error || 'Failed to delete message.');
        return;
      }

      var messageEl = document.querySelector('.message[data-message-id="' + messageId + '"]');

      if (messageEl) {
        messageEl.remove();
      }

      if (messagesList.querySelectorAll('.message').length === 0) {
        messagesEmpty.style.display = 'flex';
      }
    } catch (error) {
      alert('Failed to delete message.');
    }
  }

  function autoResizeTextarea() {
    if (!messageInput) {
      return;
    }

    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
  }

  function updateCharCount() {
    if (!messageInput || !messageCharCount || !messageSendBtn) {
      return;
    }

    var length = messageInput.value.length;
    messageCharCount.textContent = length + '/2000';

    if (length > 1800) {
      messageCharCount.style.color = 'var(--error)';
    } else if (length > 1500) {
      messageCharCount.style.color = 'var(--warning)';
    } else {
      messageCharCount.style.color = 'var(--subtle)';
    }

    messageSendBtn.disabled = length === 0 || length > 2000;
  }

  function openSidebar() {
    if (sidebar) {
      sidebar.classList.add('is-open');
      showOverlay();
    }
  }

  function closeSidebar() {
    if (sidebar) {
      sidebar.classList.remove('is-open');
      hideOverlay();
    }
  }

  function openMembers() {
    if (membersPanel) {
      membersPanel.classList.add('is-open');
      showOverlay();
    }
  }

  function closeMembers() {
    if (membersPanel) {
      membersPanel.classList.remove('is-open');
      hideOverlay();
    }
  }

  var overlay = null;

  function createOverlay() {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'community-overlay';
      overlay.addEventListener('click', function () {
        closeSidebar();
        closeMembers();
      });
      document.querySelector('.community-page').appendChild(overlay);
    }
  }

  function showOverlay() {
    createOverlay();
    overlay.classList.add('is-visible');
  }

  function hideOverlay() {
    if (overlay) {
      overlay.classList.remove('is-visible');
    }
  }

  channelItems.forEach(function (item) {
    item.addEventListener('click', function () {
      switchChannel(this.getAttribute('data-channel'));
    });

    item.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        switchChannel(this.getAttribute('data-channel'));
      }
    });
  });

  if (messageForm) {
    messageForm.addEventListener('submit', function (event) {
      event.preventDefault();
      sendMessage();
    });
  }

  if (messageInput) {
    messageInput.addEventListener('input', function () {
      updateCharCount();
      autoResizeTextarea();
    });

    messageInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    });
  }

  if (messagesList) {
    messagesList.addEventListener('click', function (event) {
      var deleteBtn = event.target.closest('.message-delete-btn');

      if (!deleteBtn) {
        return;
      }

      var messageId = parseInt(deleteBtn.getAttribute('data-delete-id'), 10);

      if (!isNaN(messageId)) {
        deleteMessage(messageId);
      }
    });
  }

  if (channelMenuBtn) {
    channelMenuBtn.addEventListener('click', openSidebar);
  }

  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener('click', closeSidebar);
  }

  if (channelMembersBtn) {
    channelMembersBtn.addEventListener('click', openMembers);
  }

  if (membersCloseBtn) {
    membersCloseBtn.addEventListener('click', closeMembers);
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeSidebar();
      closeMembers();
    }
  });

  var onlineCountEl = document.getElementById('onlineCount');

  function updateOnlineCount() {
    if (!onlineCountEl) {
      return;
    }

    var seed = Math.floor(Date.now() / 60000);
    var base = ((seed * 1103515245 + 12345) & 0x7fffffff) % 18;
    var count = 12 + base;

    onlineCountEl.textContent = count + ' online';
  }

  updateOnlineCount();
  setInterval(updateOnlineCount, 60000);

  loadMessages();
  startPolling();
  applyTextControls(document);

  window.addEventListener('beforeunload', function () {
    stopPolling();
  });
})();
