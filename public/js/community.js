/**
 * ===================================================================
 * public/js/community.js — Developer Community Client-Side Logic
 * ===================================================================
 * Channel switching, message loading/posting/deleting, auto-polling,
 * auto-resize textarea, mobile sidebar toggles, keyboard shortcuts.
 * Scroll listeners use { passive: true }.
 * ===================================================================
 */

(function () {
  'use strict';

  /* ========== PARSE EMBEDDED DATA ========== */
  var dataEl = document.getElementById('communityData');
  var data = {};
  try {
    data = JSON.parse(dataEl.textContent);
  } catch (e) {
    data = { isLoggedIn: false, currentUser: null, channels: [], proChannels: [] };
  }

  var isLoggedIn = data.isLoggedIn;
  var currentUser = data.currentUser;
  var allChannels = data.channels.concat(data.proChannels);

  /* ========== STATE ========== */
  var activeChannel = 'general';
  var pollingInterval = null;
  var lastMessageId = 0;
  var isLoadingMessages = false;

  /* ========== DOM REFERENCES ========== */
  var sidebar = document.getElementById('communitySidebar');
  var membersPanel = document.getElementById('communityMembers');
  var channelItems = document.querySelectorAll('.channel-item');
  var channelHeaderName = document.getElementById('channelHeaderName');
  var channelHeaderIcon = document.getElementById('channelHeaderIcon');
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

  /* ========== HELPERS ========== */

  /**
   * Escape HTML special characters to prevent XSS.
   */
  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /**
   * Format ISO date to relative time string.
   */
  function timeAgo(dateStr) {
    var now = Date.now();
    var then = new Date(dateStr).getTime();
    var diff = Math.floor((now - then) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';

    var d = new Date(dateStr);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  /**
   * Format date for date separator.
   */
  function formatDateSeparator(dateStr) {
    var d = new Date(dateStr);
    var today = new Date();
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  /**
   * Get initials from a display name.
   */
  function getInitials(name) {
    if (!name) return '?';
    var parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * Generate a consistent color for a username (for avatars).
   */
  function getUserColor(username) {
    var colors = [
      '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#ef4444',
      '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
      '#3b82f6', '#6366f1'
    ];
    var hash = 0;
    for (var i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Find channel data by ID.
   */
  function getChannelById(channelId) {
    for (var i = 0; i < allChannels.length; i++) {
      if (allChannels[i].id === channelId) return allChannels[i];
    }
    return null;
  }

  /**
   * Scroll messages container to bottom.
   */
  function scrollToBottom(smooth) {
    if (messagesContainer) {
      messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }

  /**
   * Check if user is near bottom of messages (within 100px).
   */
  function isNearBottom() {
    if (!messagesContainer) return true;
    return messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 100;
  }

  /* ========== RENDER A SINGLE MESSAGE ========== */
  function renderMessage(msg) {
    var isPro = !!msg.is_pro;
    var isOwn = isLoggedIn && currentUser && msg.user_id === currentUser.id;
    var initials = getInitials(msg.display_name || msg.username);
    var avatarColor = isPro ? '' : 'background-color:' + getUserColor(msg.username) + ';';
    var avatarClass = isPro ? 'message-avatar message-avatar-pro' : 'message-avatar message-avatar-default';
    var authorClass = isPro ? 'message-author message-author-pro' : 'message-author';

    var html = '';
    html += '<div class="message" data-message-id="' + msg.id + '" data-user-id="' + msg.user_id + '">';

    /* Avatar */
    html += '<span class="' + avatarClass + '" style="' + avatarColor + '" aria-hidden="true">' + escapeHtml(initials) + '</span>';

    /* Body */
    html += '<div class="message-body">';

    /* Header */
    html += '<div class="message-header">';
    html += '<span class="' + authorClass + '">' + escapeHtml(msg.display_name || msg.username) + '</span>';
    if (isPro) {
      html += '<span class="message-pro-badge">PRO</span>';
    }
    html += '<span class="message-time" title="' + escapeHtml(msg.created_at) + '">' + timeAgo(msg.created_at) + '</span>';
    html += '</div>';

    /* Content — simple inline code detection with backticks */
    var content = escapeHtml(msg.content);
    content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
    html += '<div class="message-content">' + content + '</div>';

    html += '</div>';

    /* Delete button (own messages only) */
    if (isOwn) {
      html += '<div class="message-actions">';
      html += '<button class="message-delete-btn" data-delete-id="' + msg.id + '" type="button" aria-label="Delete message" title="Delete message">';
      html += '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 4h10M5 4V3a1 1 0 011-1h2a1 1 0 011 1v1M6 6.5v3M8 6.5v3M3 4l.5 7.5a1 1 0 001 .5h5a1 1 0 001-.5L11 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      html += '</button>';
      html += '</div>';
    }

    html += '</div>';

    return html;
  }

  /* ========== RENDER DATE SEPARATOR ========== */
  function renderDateSeparator(dateStr) {
    return '<div class="message-date-separator"><span class="message-date-text">' + formatDateSeparator(dateStr) + '</span></div>';
  }

  /* ========== LOAD MESSAGES FOR ACTIVE CHANNEL ========== */
  async function loadMessages() {
    if (isLoadingMessages) return;
    isLoadingMessages = true;

    /* Show loading state */
    messagesLoading.style.display = 'flex';
    messagesEmpty.style.display = 'none';
    messagesList.innerHTML = '';

    try {
      var response = await fetch('/community/api/messages/' + activeChannel);
      var result = await response.json();

      messagesLoading.style.display = 'none';

      if (!result.success) {
        messagesList.innerHTML = '<div class="messages-empty"><span class="messages-empty-icon" aria-hidden="true">⚠️</span><h2 class="messages-empty-title">' + escapeHtml(result.error) + '</h2></div>';
        isLoadingMessages = false;
        return;
      }

      var messages = result.messages;

      if (messages.length === 0) {
        messagesEmpty.style.display = 'flex';
        lastMessageId = 0;
        isLoadingMessages = false;
        return;
      }

      messagesEmpty.style.display = 'none';

      /* Render messages with date separators */
      var html = '';
      var lastDate = '';

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

      /* Scroll to bottom */
      scrollToBottom(false);

    } catch (err) {
      messagesLoading.style.display = 'none';
      messagesList.innerHTML = '<div class="messages-empty"><span class="messages-empty-icon" aria-hidden="true">⚠️</span><h2 class="messages-empty-title">Failed to load messages</h2><p class="messages-empty-desc">Please check your connection and try again.</p></div>';
    }

    isLoadingMessages = false;
  }

  /* ========== POLL FOR NEW MESSAGES ========== */
  async function pollMessages() {
    if (isLoadingMessages) return;

    try {
      var response = await fetch('/community/api/messages/' + activeChannel);
      var result = await response.json();

      if (!result.success || result.messages.length === 0) return;

      var messages = result.messages;
      var newLastId = messages[messages.length - 1].id;

      /* Only update if there are new messages */
      if (newLastId > lastMessageId) {
        var wasNearBottom = isNearBottom();

        /* Find new messages */
        var newMessages = messages.filter(function (msg) {
          return msg.id > lastMessageId;
        });

        if (newMessages.length > 0) {
          var html = '';
          newMessages.forEach(function (msg) {
            html += renderMessage(msg);
          });
          messagesList.insertAdjacentHTML('beforeend', html);

          /* Hide empty state */
          messagesEmpty.style.display = 'none';

          /* Auto-scroll if user was near bottom */
          if (wasNearBottom) {
            scrollToBottom(true);
          }
        }

        lastMessageId = newLastId;
      }
    } catch (err) {
      /* Silently fail on poll errors */
    }
  }

  /* ========== START/STOP POLLING ========== */
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

  /* ========== SWITCH CHANNEL ========== */
  function switchChannel(channelId) {
    if (channelId === activeChannel) return;

    var channel = getChannelById(channelId);
    if (!channel) return;

    /* Check pro access */
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

    /* Update active state in sidebar */
    channelItems.forEach(function (item) {
      if (item.getAttribute('data-channel') === channelId) {
        item.classList.add('is-active');
        item.setAttribute('aria-selected', 'true');
      } else {
        item.classList.remove('is-active');
        item.setAttribute('aria-selected', 'false');
      }
    });

    /* Update channel header */
    channelHeaderIcon.textContent = channel.icon;
    channelHeaderName.innerHTML = '<span class="channel-header-icon" id="channelHeaderIcon" aria-hidden="true">' + channel.icon + '</span> ' + escapeHtml(channel.name);
    channelHeaderDesc.textContent = channel.description;

    /* Update members panel description */
    if (membersChannelDesc) {
      membersChannelDesc.textContent = channel.description;
    }

    /* Update input placeholder */
    if (messageInput) {
      messageInput.placeholder = 'Message #' + channel.name.toLowerCase() + '...';
    }

    /* Close mobile sidebar */
    closeSidebar();

    /* Load messages for new channel */
    loadMessages();

    /* Restart polling */
    startPolling();
  }

  /* ========== SEND MESSAGE ========== */
  async function sendMessage() {
    if (!isLoggedIn || !messageInput) return;

    var content = messageInput.value.trim();
    if (content.length === 0 || content.length > 2000) return;

    /* Disable input while sending */
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
        /* Append message to list */
        var html = renderMessage(result.message);
        messagesList.insertAdjacentHTML('beforeend', html);

        /* Update last message ID */
        lastMessageId = Math.max(lastMessageId, result.message.id);

        /* Hide empty state */
        messagesEmpty.style.display = 'none';

        /* Clear input and reset state */
        messageInput.value = '';
        updateCharCount();      /* sets disabled=true when len===0 */
        autoResizeTextarea();

        /* Scroll to bottom */
        scrollToBottom(true);
      } else {
        alert(result.error || 'Failed to send message.');
      }
    } catch (err) {
      alert('Failed to send message. Please check your connection.');
    }

    /* Re-enable input (button state driven by updateCharCount above) */
    messageInput.disabled = false;
    messageInput.focus();
  }

  /* ========== DELETE MESSAGE ========== */
  async function deleteMessage(messageId) {
    if (!confirm('Delete this message?')) return;

    try {
      var response = await fetch('/community/api/messages/' + messageId, {
        method: 'DELETE'
      });

      var result = await response.json();

      if (result.success) {
        var msgEl = document.querySelector('.message[data-message-id="' + messageId + '"]');
        if (msgEl) {
          msgEl.remove();
        }

        /* Check if no messages remain */
        if (messagesList.querySelectorAll('.message').length === 0) {
          messagesEmpty.style.display = 'flex';
        }
      } else {
        alert(result.error || 'Failed to delete message.');
      }
    } catch (err) {
      alert('Failed to delete message.');
    }
  }

  /* ========== TEXTAREA AUTO-RESIZE ========== */
  function autoResizeTextarea() {
    if (!messageInput) return;
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
  }

  /* ========== CHARACTER COUNT ========== */
  function updateCharCount() {
    if (!messageInput || !messageCharCount || !messageSendBtn) return;
    var len = messageInput.value.length;
    messageCharCount.textContent = len + '/2000';

    if (len > 1800) {
      messageCharCount.style.color = 'var(--error)';
    } else if (len > 1500) {
      messageCharCount.style.color = 'var(--warning)';
    } else {
      messageCharCount.style.color = 'var(--subtle)';
    }

    messageSendBtn.disabled = len === 0 || len > 2000;
  }

  /* ========== MOBILE SIDEBAR TOGGLES ========== */
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

  /* ========== OVERLAY ========== */
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

  /* ========== EVENT LISTENERS ========== */

  /* Channel item clicks */
  channelItems.forEach(function (item) {
    item.addEventListener('click', function () {
      var channelId = this.getAttribute('data-channel');
      switchChannel(channelId);
    });

    /* Keyboard support */
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        var channelId = this.getAttribute('data-channel');
        switchChannel(channelId);
      }
    });
  });

  /* Message form submission */
  if (messageForm) {
    messageForm.addEventListener('submit', function (e) {
      e.preventDefault();
      sendMessage();
    });
  }

  /* Message input events */
  if (messageInput) {
    messageInput.addEventListener('input', function () {
      updateCharCount();
      autoResizeTextarea();
    });

    /* Enter to send (Shift+Enter for new line) */
    messageInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  /* Delete message delegation */
  if (messagesList) {
    messagesList.addEventListener('click', function (e) {
      var deleteBtn = e.target.closest('.message-delete-btn');
      if (deleteBtn) {
        var messageId = parseInt(deleteBtn.getAttribute('data-delete-id'), 10);
        if (!isNaN(messageId)) {
          deleteMessage(messageId);
        }
      }
    });
  }

  /* Mobile sidebar buttons */
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

  /* Escape key closes panels */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeSidebar();
      closeMembers();
    }
  });

  /* ========== ONLINE COUNT (live feel) ========== */
  var onlineCountEl = document.getElementById('onlineCount');

  function updateOnlineCount() {
    if (!onlineCountEl) return;
    /* Seed off current minute so the number is consistent within a minute */
    var seed = Math.floor(Date.now() / 60000);
    var base = ((seed * 1103515245 + 12345) & 0x7fffffff) % 18;
    var count = 12 + base;   /* 12–29 online */
    onlineCountEl.textContent = count + ' online';
  }

  updateOnlineCount();
  setInterval(updateOnlineCount, 60000);

  /* ========== INITIALIZE ========== */
  loadMessages();
  startPolling();

  /* Cleanup on page unload */
  window.addEventListener('beforeunload', function () {
    stopPolling();
  });

})();