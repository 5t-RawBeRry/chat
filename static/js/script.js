document.addEventListener("DOMContentLoaded", () => {
    const roomListDiv = document.getElementById('room-list');
    const messagesDiv = document.getElementById('messages');
    const newMessageForm = document.getElementById('new-message');
    const newRoomForm = document.getElementById('new-room');
    const statusDiv = document.getElementById('status');
    const roomTemplate = document.getElementById('room');
    const messageTemplate = document.getElementById('message');
    const messageField = newMessageForm.querySelector("#message");
    const sendField = newMessageForm.querySelector("#send");
    const roomNameField = newRoomForm.querySelector("#name");
    let usernameField = localStorage.getItem("username");
    let avatarField = localStorage.getItem("avatar");
    let backgroundField = localStorage.getItem("background");
    let lastRoom = localStorage.getItem("lastRoom");
    const userholder = document.getElementById("userholder");
    const whoisavatar = document.getElementById("whoisavatar");
    const whoisavatarDiv = document.getElementById("whoisavatarDiv");
    const RoomName = document.getElementById("RoomName");

    const url = new URL(window.location.href);
    let room = 'main';
    if (lastRoom) {
        if (url.searchParams.get("room")) {
            room = url.searchParams.get("room")
        } else room = lastRoom;

    }
    roomNameField.value = room;

    const STATE = {
        room: room,
        rooms: {},
        connected: false,
    };

    const hashColor = str => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
            hash = hash & hash;
        }
        return `hsl(${hash % 350}, 100%, 70%)`;
    };

    const addRoom = name => {
        if (STATE[name]) {
            changeRoom(name);
            return false;
        }

        const node = roomTemplate.content.cloneNode(true);
        const room = node.querySelector(".room");
        room.addEventListener("click", () => changeRoom(name));
        room.textContent = name;
        room.dataset.name = name;
        roomListDiv.appendChild(node);

        STATE[name] = [];
        changeRoom(name);
        return true;
    };

    const changeRoom = name => {
        if (STATE.room === name) return;

        const newRoom = roomListDiv.querySelector(`.room[data-name='${name}']`);
        const oldRoom = roomListDiv.querySelector(`.room[data-name='${STATE.room}']`);
        if (!newRoom || !oldRoom) return;

        STATE.room = name;
        oldRoom.classList.remove("active");
        newRoom.classList.add("active");

        messagesDiv.innerHTML = '';
        STATE[name].forEach(data => addMessage(name, data.username, data.avatar, data.message, data.timestamp));
    };

    const addMessage = (room, username, avatar, message, timestamp, push = false) => {
        if (push) STATE[room].push({ username, avatar, message, timestamp });

        if (STATE.room === room) {
            const node = messageTemplate.content.cloneNode(true);
            if (username.includes("#")) {
                const [name, hit] = username.split("#");
                node.querySelector(".message .badge").dataset.badge = hit;
                node.querySelector(".message .badge").style.backgroundColor = hashColor(hit);
                username = name;
                node.querySelector(".message").id = `message_${hit}_${timestamp}`;
                if (!username) return;
            }
            node.querySelector(".message .avatar").src = avatar !== "noAvatar" ? avatar : "/images/9b4815d6-bc7d-4bf9-aba3-18975efc89d1.avif";
            if (timestamp === 0) {
                setSystemMessage(node, message);
            } else {
                const date = new Date(timestamp);
                node.querySelector(".message .timestamp").textContent = date.toLocaleTimeString();
                node.querySelector(".message .badge").textContent = username;
                setContentNode(node, message);
            }
            messagesDiv.appendChild(node);
            hljs.highlightAll();
        }
    };

    const setSystemMessage = (node, message) => {
        node.querySelector(".message").id = "system_message";
        node.querySelector(".message .timestamp").textContent = "系统消息";
        node.querySelector(".message .timestamp").style.backgroundColor = "black";
        node.querySelector(".message .badge").style.backgroundColor = "gray";
        node.querySelector(".message .badge").style.color = "#fefefe";
        node.querySelector(".message .badge").textContent = "系统";
        const markdownMessage = DOMPurify.sanitize(marked.parse(message));
        node.querySelector(".message .text").innerHTML = markdownMessage;
        hljs.highlightAll();
    };

    const setContentNode = (node, message) => {
        const textNode = node.querySelector(".message .text");
        const markdownMessage = DOMPurify.sanitize(marked.parse(message));
        textNode.innerHTML = markdownMessage;
        hljs.highlightAll();
    };

    const subscribe = uri => {
        let retryTime = 1;

        const connect = uri => {
            const events = new EventSource(uri);

            events.addEventListener("message", ev => {
                const msg = JSON.parse(ev.data);
                console.log(msg);
                if (!msg.message || !msg.room || !msg.username) return;

                if (msg.message.startsWith("/")) handleCommand(msg);
                else addMessage(msg.room, msg.username, msg.avatar, msg.message, msg.timestamp, true);
            });

            events.addEventListener("open", () => {
                setConnectedStatus(true);
                console.log(`connected to event stream at ${uri}`);
                retryTime = 1;
            });

            events.addEventListener("error", () => {
                setConnectedStatus(false);
                events.close();

                let timeout = retryTime;
                retryTime = Math.min(64, retryTime * 2);
                console.log(`connection lost. attempting to reconnect in ${timeout}s`);
                setTimeout(() => connect(uri), timeout * 1000);
            });
        };

        connect(uri);
    };

    const handleCommand = msg => {
        const [command, ...args] = msg.message.slice(1).split(" ");
        switch (command) {
            case "bg":
                changeBackground(args[0], msg.room);
                break;
            default:
                console.log("Unknown command", command);
        }
    };

    const changeBackground = (url, room) => {
        if (url && url.match(/^(https?:\/\/.*\.(jpg|jpeg|png|gif|ico|avif))$/i)) {
            document.body.style.backgroundImage = `url(${url})`;
            addMessage(room, "通知#SRV0_INFO", 'noAvatar', `背景图片已更换为 ${url}`, 0, true);
        } else {
            document.body.style.backgroundImage = "url(/images/113113442_p0.avif)";
            addMessage(room, "通知#SRV0_INFO", 'noAvatar', "背景图片已更换为默认背景", 0, true);
        }
    };

    const setConnectedStatus = status => {
        STATE.connected = status;
        statusDiv.className = status ? "connected" : "reconnecting";
        document.title = status ? room.toUpperCase() : "Reconnecting | " + room.toUpperCase();
    };

    const uploadAvatar = () => {
        const fileInput = createFileInput("image/*");
        fileInput.onchange = () => handleFileUpload(fileInput.files[0], url => {
            localStorage.setItem("avatar", url);
            avatarField = url;
            whoisavatar.src = url;
        });
    };

    const upload = set => {
        const fileInput = createFileInput("image/*,audio/*,video/*");
        fileInput.onchange = () => handleFileUpload(fileInput.files[0], url => {
            if (set) return url;
            if (url.match(/(jpg|jpeg|png|gif|avif)$/i)) {
                messageField.value = `![Auto Uploader Images](${url})`;
            } else if (url.match(/(mp4|webm|ogg)$/i)) {
                messageField.value = `<video src="${url}" controls></video>`;
            } else if (url.match(/(mp3|wav|ogg)$/i)) {
                messageField.value = `<audio src="${url}" controls></audio>`;
            } else {
                messageField.value = url;
            }
        });
    };

    const createFileInput = accept => {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = accept;
        fileInput.click();
        return fileInput;
    };

    const handleFileUpload = (file, callback) => {
        toggleLoading(whoisavatarDiv, true);
        toggleLoading(sendField, true);
        toggleLoading(messageField, true);
        const formData = new FormData();
        formData.append("file", file);
        fetch("https://up1oad.eeuu.cc/", {
            method: "POST",
            body: formData
        }).then(response => response.json()).then(data => {
            if (data.url) {
                callback(data.url);
            } else {
                showToast("上传失败");
            }
            toggleLoading(whoisavatarDiv, false);
            toggleLoading(sendField, false);
            toggleLoading(messageField, false);
        });
    };

    function showToast(message) {
        Toastify({
            text: message,
            duration: 1500,
            gravity: "top",
            position: "center",
            className: "toast_loaded",
            stopOnFocus: true,
            backgroundColor: "#fefefe50"
        }).showToast();
    }
    const toggleLoading = (element, isLoading) => {
        element.classList.toggle('disabled', isLoading);
        element.classList.toggle('loading', isLoading);
    };

    const UserChangeRoom = name => {
        window.location.href = `?room=${name}`;
    };

    const init = () => {
        if (!usernameField) window.location.href = "login";
        addRoom(roomNameField.value);
        changeRoom(roomNameField.value);
        if (localStorage.getItem("new") === "true") {
            addMessage(roomNameField.value, "通知#SRV0_INFO", 'noAvatar', `> #### 欢迎新用户 \` ${usernameField.split("#")[0]} \` 加入 ${room.toUpperCase()} ！\n> 初次进入请保存好您的唯一身份凭证: \` ${usernameField} \` \n> 本条消息将在网页刷新后永久隐藏。`, 0, true);
            localStorage.removeItem("new");
        } else {
            addMessage(roomNameField.value, "通知#SRV0_INFO", 'noAvatar', `>  #### 欢迎来到 ${room.toUpperCase()} ！\n> 发送消息 \` @h \` 查看帮助信息。\n> 虽然这里是匿名的，但是请友好发言哦！`, 0, true);
        }
        RoomName.innerHTML = `<i class="icon icon-location"></i>&nbsp;` + room.toUpperCase();
        userholder.textContent = usernameField.split("#")[0];
        whoisavatar.src = avatarField || "/images/9b4815d6-bc7d-4bf9-aba3-18975efc89d1.avif";
        document.body.style.backgroundImage = `url(${backgroundField || "/images/113113442_p0.avif"})`;

        window.history.pushState(null, null, `?room=${roomNameField.value}`);
        newMessageForm.addEventListener("submit", handleNewMessage);
        whoisavatar.addEventListener("click", uploadAvatar);
        subscribe(`/events/${roomNameField.value}`);

        localStorage.setItem("lastRoom", roomNameField.value);

        messageField.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleNewMessage(event);
            }
        });
    };

    const handleNewMessage = async e => {
        e.preventDefault();

        const room = STATE.room;
        const message = messageField.value.trim();
        const avatar = avatarField || "noAvatar";
        const username = usernameField || alert("请先登录") || "";
        const timestamp = Date.now();

        if (!username) return;

        switch (message) {
            case "@q":
                localStorage.clear();
                location.reload();
                break;
            case "@hitokoto":
                await fetchHitokoto();
                break;
            case "@upload":
                upload();
                break;
            case "@room":
                const newRoom = prompt("请输入房间名（不输入内容将返回大厅）", "") || 'main';
                UserChangeRoom(newRoom);
                break;
            case "@avatar":
                uploadAvatar();
                break;
            case "@localbg":
                const bg = prompt("请输入背景图片地址", "");
                if (bg) {
                    document.body.style.backgroundImage = `url(${bg})`;
                    addMessage(room, "通知#SRV0_INFO", 'noAvatar', "背景图片已更换", 0, true);
                }
                break;
            case "@clear":
                messagesDiv.innerHTML = '';
                addMessage(roomNameField.value, "通知#SRV0_INFO", 'noAvatar', `> ### 欢迎来到 ${roomNameField.value.toUpperCase()} ！\n> 发送消息 \` @h \` 查看帮助信息。`, 0, true);
                break;
            case "@h":
            case "@help":
                displayHelpInfo(room);
                break;
            case "@info":
                addMessage(room, "通知#SRV0_INFO", 'noAvatar', `> ##### 唯一身份凭证: \` ${username} \``, 0, true);
                break;
            default:
                if (!message) {
                    upload();
                } else if (STATE.connected) {
                    sendMessage(room, username, avatar, message, timestamp);
                }
                break;
        }
    };

    const fetchHitokoto = async() => {
        messageField.disabled = true;
        sendField.disabled = true;
        try {
            const response = await fetch('https://v1.hitokoto.cn/?c=i');
            const data = await response.json();
            messageField.value = data.hitokoto;
        } catch (error) {
            console.error("Error fetching hitokoto:", error);
        } finally {
            messageField.disabled = false;
            sendField.disabled = false;
            messageField.focus();
        }
    };

    const displayHelpInfo = room => {
        const helpMessages = `> \` @info \` 可以查看唯一身份凭证。
> \` @q \` 即可退出登录。
> \` @hitokoto \` 可以获取一句随机的一言。
> \` @upload \` 可以上传图片、音频、视频文件。
> \` @room \` 可以切换房间。
> \` @avatar \` 可以上传头像。
> \` @localbg \` 可以更换本地背景图片。
> \` @clear \` 可以清空聊天记录。
> \` @h \` 或  \` @help \` 可以查看帮助信息。`;
        addMessage(room, "通知#SRV0_INFO", 'noAvatar', helpMessages, 0, true);
    };

    const sendMessage = async(room, username, avatar, message, timestamp) => {
        try {
            const response = await fetch("/message", {
                method: "POST",
                body: new URLSearchParams({ room, username, avatar, message, timestamp }),
            });
            if (response.ok) {
                messageField.value = "";
            } else {
                console.error("Failed to send message:", response.statusText);
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    init();
});