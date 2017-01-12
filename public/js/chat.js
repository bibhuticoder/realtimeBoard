(function (window, document) {


    var chat = {

        status: true,
        
        members: [],

        maximize: function () {
            $(".chatWidget").css('top', $(window).height() - $(".chatWidget").height());
            $("#chatMinMax").html('<i class = "fa fa-caret-down"></i>');
            $("#chatNotifier").css("visibility", "hidden");
            chat.status = true;
        },

        minimize: function () {
            $(".chatWidget").css('top', board.height - $("#chatMinMax").height() - 2 * parseInt($("#chatMinMax").css('border-radius')) - 4 * parseInt($("#chatMinMax").css('padding')));
            $("#chatMinMax").html('<i class = "fa fa-caret-up"></i>');
            chat.status = false;

        },

        send: function (msg) {
            if (msg.length > 0) {
                rtMan.socket.emit('chatMsg', {
                    roomname: rtMan.roomname,
                    from: rtMan.username,
                    msg: msg,
                });

                $(".chatBody").html($(".chatBody").html() + '<div class="chatMsgContainer">' + rtMan.username + ' : ' + $("#txtChatMsg").val() + '</div>');
                $("#txtChatMsg").val("");
                chat.autoScroll();
            }
        },

        autoScroll: function () {
            $(".chatBody").scrollTop($(".chatBody")[0].scrollHeight);
        }
    };

    // expose chat to global scope
    window.chat = chat;

    $("#chatMinMax").click(function () {

        if (chat.status) {
            chat.minimize();

        } else {
            chat.maximize();
        }

    });

    $("#btnSend").click(function () {
        chat.send($("#txtChatMsg").val());
    });

    $("#txtChatMsg").keydown(function (e) {
        // console.log(e.keyCode);
        if (e.keyCode === 13) {
            chat.send($("#txtChatMsg").val());
        }
    });

}(window, document));