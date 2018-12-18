// ==UserScript==
// @name         Descriptive Slack Icons
// @namespace    http://rpetrich.com/
// @version      0.1
// @description  Shows the current slack account name in the Favicon
// @author       Ryan Petrich
// @match        https://*.slack.com/*
// @grant        none
// ==/UserScript==

if (window.TS && TS.ensureFullyBooted) {
    TS.ensureFullyBooted().then(function installFavicons() {
        var team = location.hostname;
        if (TS.model && TS.model.team && TS.model.team.name) {
            team = TS.model.team.name;
        }
        var capitals = team.match(/[A-Z0-9]/g);
        var teamComponents = team.split(/\W/).filter(function(c) { return /\w/.test(c); });
        var text;
        if (/^[A-Z]/.test(team) && capitals.length > 1) {
            text = capitals[0] + capitals[1];
        } else if (teamComponents.length > 1) {
            text = teamComponents[0][0] + teamComponents[1][0];
        } else {
            text = team[0] + team[Math.ceil(team.length/2)];
        }
        text = text.toLowerCase();
        function computeStyle(selector, property, defaultValue) {
            var element = document.querySelector(selector);
            return element ? window.getComputedStyle(element)[property] : defaultValue;
        }
        var backgroundColor = computeStyle(".client_channels_list_container", "background-color", "#4d394b");
        var inactiveColor = computeStyle("#team_menu_user_name", "color", "#ab9aa9");
        var activeColor = computeStyle("#team_name", "color", "white");
        var offlineColor = "red";
        var pixelRatio = window.devicePixelRatio || 1;

        function roundRect(ctx, x, y, width, height, radius) {
            if (typeof radius === 'number') {
                radius = {tl: radius, tr: radius, br: radius, bl: radius};
            } else {
                var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
                for (var side in defaultRadius) {
                    radius[side] = radius[side] || defaultRadius[side];
                }
            }
            ctx.beginPath();
            ctx.moveTo(x + radius.tl, y);
            ctx.lineTo(x + width - radius.tr, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
            ctx.lineTo(x + width, y + height - radius.br);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
            ctx.lineTo(x + radius.bl, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
            ctx.lineTo(x, y + radius.tl);
            ctx.quadraticCurveTo(x, y, x + radius.tl, y);
            ctx.closePath();
        }

        function faviconWithStyle(color, textAlpha, showBubble) {
            return function(context) {
                // Background
                context.fillStyle = backgroundColor;
                roundRect(context, 0, 0, 16, 16, 1.5);
                context.fill();
                //context.fillRect(0, 0, 16, 16);
                // Text
                context.globalAlpha = textAlpha;
                context.fillStyle = color;
                context.font = "400 11px 'Helvetica Neue', Helvetica, Arial, sans-serif";
                context.fillText(text, Math.floor((16 - context.measureText(text).width) * pixelRatio / 2) / pixelRatio, 12);
                context.globalAlpha = 1;
                // Bubble circle
                if (showBubble) {
                    var bubbleRadius = 5;
                    context.fillStyle = "red";
                    context.shadowColor = "black";
                    context.shadowBlur = 2;
                    context.beginPath();
                    context.moveTo(16 - bubbleRadius, 0);
                    context.arcTo(16 - bubbleRadius, bubbleRadius, 16, bubbleRadius, bubbleRadius);
                    context.lineTo(16, 0);
                    context.closePath();
                    context.fill();
                }
            };
        }
        var variants = {
            "app_icon_32px_green" : faviconWithStyle(inactiveColor, 0.6),
            "app_icon_32px_green_unreads" : faviconWithStyle(activeColor, 1),
            "app_icon_32px_green_mentions" : faviconWithStyle(activeColor, 1, true),
            "app_icon_32px_yellow" : faviconWithStyle(inactiveColor, 0.6),
            "app_icon_32px_yellow_unreads" : faviconWithStyle(activeColor, 1),
            "app_icon_32px_yellow_mentions" : faviconWithStyle(activeColor, 1, true),
            "app_icon_32px_red" : faviconWithStyle(offlineColor, 0.6),
            "app_icon_32px_red_unreads" : faviconWithStyle(offlineColor, 1),
            "app_icon_32px_red_mentions" : faviconWithStyle(offlineColor, 1, true),
        };
        if (TS.model && TS.view && TS.view.maybeChangeFavIco) {
            for (var i in variants) {
                if (variants.hasOwnProperty(i)) {
                    var canvas = document.createElement("canvas");
                    canvas.width = 16 * pixelRatio;
                    canvas.height = 16 * pixelRatio;
                    var context = canvas.getContext("2d");
                    context.scale(pixelRatio, pixelRatio);
                    variants[i](context);
                    variants[i] = canvas.toDataURL();
                }
            }
            TS.view.maybeChangeFavIco = function() {
                if (TS.boot_data.feature_incremental_unread_counts) return;
                var currentConnectionStatus = TS.view.ms.current_connection_status;
                var currentUnreadStatus = TS.view.current_unread_status;
                var name = 'online' === currentConnectionStatus ? 'app_icon_32px_green' : 'trouble' === currentConnectionStatus ? 'app_icon_32px_yellow' : 'app_icon_32px_red';
                'unreads' === currentUnreadStatus ? name += '_unreads' : 'mentions' === currentUnreadStatus && (name += '_mentions');
                var newDataURI = variants[name];
                var target = document.querySelector("#favicon");
                if (target && target.getAttribute("href") !== newDataURI) {
                    target.setAttribute("href", newDataURI);
                }
            }
        }
    });
}
