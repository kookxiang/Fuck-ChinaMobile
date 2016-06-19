var pollutionSites = [
    "amazon.cn",
    "amazon.com",
    "gome.com.cn",
    "jd.com",
    "suning.com",
    "taobao.com",
    "yixun.com",
    "z.cn"
];
var blackListSite = [
    "72hui.com",
    "72link.com",
    "798zs.net",
    "linktech.cn",
    "shuyang5.com",
    "sun-ying.com",
    "yiqifa.com"
];
var whiteListSite = [];     // Reserved
var maxTries = 5;
var lastRequest = {
    from: "",
    to: "",
    count: 1,
}

chrome.webRequest.onHeadersReceived.addListener(function (details) {
    if (details.statusCode != 302 && details.statusCode != 301) return;
    var locationHeader = details.responseHeaders.filter(value => value.name.toLowerCase() == "location");
    if (locationHeader.length == 0) return;
    var originalUrl = details.url;
    var toURL = locationHeader[0].value;
    var fromSite = tldjs.getDomain(originalUrl);
    var toSite = tldjs.getDomain(toURL);

    if (lastRequest.from == originalUrl && lastRequest.to == toURL) {
        lastRequest.count++;
        if (lastRequest.count >= maxTries) {
            if (blackListSite.indexOf(toSite) < 0) {       // Not-allow black-listed site to bypass this check
                return { cancel: true };
            } else {
                console.info("Allowed:", fromSite, "redirected to", toSite, "(tried " + lastRequest.count + " times)")
                return {};
            }
        } else {
            return { redirectUrl: originalUrl };
        }
    } else {
        lastRequest = {
            from: originalUrl,
            to: toURL,
            count: 1,
        }
    }

    if (whiteListSite.indexOf(toSite) >= 0 || pollutionSites.indexOf(toSite) >= 0) {
        console.info("Allowed:", fromSite, "redirected to", toSite, "(whitelisted)")
        return {};
    } else if (blackListSite.indexOf(toSite) >= 0) {
        console.warn("Blocked:", fromSite, "try to redirect to", toSite);
        chrome.notifications.create({
            type: "basic",
            iconUrl: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaGVpZ2h0PSI2MHB4IiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCA2MCA2MCIgd2lkdGg9IjYwcHgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6c2tldGNoPSJodHRwOi8vd3d3LmJvaGVtaWFuY29kaW5nLmNvbS9za2V0Y2gvbnMiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48dGl0bGUvPjxkZXNjLz48ZGVmcy8+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiBpZD0iUGFnZS0xIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSI+PGcgZmlsbD0iIzBBMEIwOSIgaWQ9IkZpbGwtMjgiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDkuMDAwMDAwLCAwLjAwMDAwMCkiPjxwYXRoIGQ9Ik0zNywyNSBDMzUuODY4LDI1IDM0LjgwOCwyNS40MzkgMzMuOTQ4LDI2LjEyOSBDMzMuNjY0LDIzLjUxOSAzMi4wOTIsMjEgMjksMjEgQzI3Ljc2LDIxIDI2Ljc2NywyMS40MDkgMjYsMjIuMDYzIEwyNiw1IEMyNiwyLjMzNyAyMy42NjQsMCAyMSwwIEMxOC4zMzYsMCAxNiwyLjMzNyAxNiw1IEwxNiwyMi4wNjMgQzE1LjIzMywyMS40MDkgMTQuMjQsMjEgMTMsMjEgQzkuNTY0LDIxIDgsMjQuMTEgOCwyNyBMOCwyOSBMNSwyOSBDMCwyOSAwLDM0LjA4NCAwLDM5IEMwLDQxLjE0MiAwLjE4Niw0NC4xNTggMS4wNzEsNDYuMzcxIEwxLjIxNCw0Ni43MjkgQzMuMTk1LDUxLjY5MiA2LjUxLDYwIDE1LDYwIEwzMCw2MCBDMzUuOTUxLDYwIDQyLDQ3LjgxMSA0Miw0MSBMNDIsMzAgQzQyLDI3LjMzNyAzOS42NjMsMjUgMzcsMjUgTDM3LDI1IFogTTQwLDQxIEM0MCw0Ny44MzIgMzQuMDE5LDU4IDMwLDU4IEwxNSw1OCBDNy44NjYsNTggNS4wOTUsNTEuMDU3IDMuMDcxLDQ1Ljk4NiBMMi45MjgsNDUuNjI5IEMyLjMyMSw0NC4xMSAyLDQxLjgxOCAyLDM5IEMyLDMzLjMxNSAyLjI3MiwzMSA1LDMxIEw4LDMxIEw4LDM5IEM4LDM5LjU1MyA4LjQ0OCw0MCA5LDQwIEM5LjU1Miw0MCAxMCwzOS41NTMgMTAsMzkgTDEwLDI3IEMxMCwyNi44MzcgMTAuMDM0LDIzIDEzLDIzIEMxNS45NjYsMjMgMTYsMjYuODM3IDE2LDI3IEwxNiwyOSBDMTYsMjkuNTUzIDE2LjQ0OCwzMCAxNywzMCBDMTcuNTUyLDMwIDE4LDI5LjU1MyAxOCwyOSBMMTgsNSBDMTgsMy40NTggMTkuNDU4LDIgMjEsMiBDMjIuNTQyLDIgMjQsMy40NTggMjQsNSBMMjQsMjkgQzI0LDI5LjU1MyAyNC40NDgsMzAgMjUsMzAgQzI1LjU1MiwzMCAyNiwyOS41NTMgMjYsMjkgTDI2LDI3IEMyNiwyNi44MzcgMjYuMDM0LDIzIDI5LDIzIEMzMS45NjYsMjMgMzIsMjYuODM3IDMyLDI3IEwzMiwzMyBDMzIsMzMuNTUzIDMyLjQ0NywzNCAzMywzNCBDMzMuNTUzLDM0IDM0LDMzLjU1MyAzNCwzMyBMMzQsMzAgQzM0LDI4LjQ1OCAzNS40NTgsMjcgMzcsMjcgQzM4LjU0MiwyNyA0MCwyOC40NTggNDAsMzAgTDQwLDQxIEw0MCw0MSBaIi8+PC9nPjwvZz48L3N2Zz4=",
            title: "干他妈的中国移动",
            message: "老子上个 " + fromSite + " 又他妈的被劫持了"
        });
        return { redirectUrl: originalUrl };
    } else if (pollutionSites.indexOf(fromSite) >= 0) {
        console.warn("Suspicious:", fromSite, "try to redirect to", toSite);
        chrome.notifications.create({
            type: "basic",
            iconUrl: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/Pjxzdmcgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMTAxLjQ3OCA4MS40OTQ7IiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAxMDEuNDc4IDgxLjQ5NCIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+PGcgaWQ9ImRhbmdlciI+PGc+PHBhdGggZD0iTTk3LjU1Niw4MS40OTRMMy45MDQsODEuMjg1Yy0zLjA2My0wLjAwNy00LjkyNy0zLjM3Ni0zLjMwNS01Ljk3NEw0Ni40NDcsMS44MzhjMS41MTQtMi40MjYsNS4wMzUtMi40NTcsNi41OTEtMC4wNTggICAgbDQ3LjgwNCw3My42ODFDMTAyLjUzLDc4LjA2NCwxMDAuNjU4LDgxLjUwMSw5Ny41NTYsODEuNDk0eiBNMTIuODQxLDc2LjM0bDc1LjU2MywwLjE2OWMzLjEwMiwwLjAwNyw0Ljk3NC0zLjQzLDMuMjg2LTYuMDMzICAgIGwtMzguNTcxLTU5LjQ1Yy0xLjU1Ni0yLjM5OS01LjA3Ny0yLjM2OC02LjU5MSwwLjA1OEw5LjUzNSw3MC4zNjZDNy45MTQsNzIuOTY1LDkuNzc4LDc2LjMzMywxMi44NDEsNzYuMzR6Ii8+PHBhdGggZD0iTTU0LjgwMSw2NS4xOGMwLDEuMjUxLTAuNDUyLDIuMzE3LTEuMzU3LDMuMTk5Yy0wLjkwNCwwLjg4Mi0xLjk4MiwxLjMyMy0zLjIzMiwxLjMyM2MtMS4yNTEsMC0yLjMyOC0wLjQ0MS0zLjIzMi0xLjMyMyAgICBjLTAuOTA0LTAuODgyLTEuMzU2LTEuOTQ4LTEuMzU2LTMuMTk5YzAtMS4yNSwwLjQ1Mi0yLjMyOCwxLjM1Ni0zLjIzMmMwLjkwNC0wLjkwNSwxLjk4MS0xLjM1NywzLjIzMi0xLjM1NyAgICBjMS4yNSwwLDIuMzI4LDAuNDUyLDMuMjMyLDEuMzU3QzU0LjM0OSw2Mi44NTIsNTQuODAxLDYzLjkzLDU0LjgwMSw2NS4xOHoiLz48cGF0aCBkPSJNNTQuNSwyNC43ODhjMCwxLjExNy0wLjM2OSw0Ljg2OC0xLjEwNSwxMS4yNTRjLTAuNzM3LDYuMzg2LTEuMzg1LDEyLjU2LTEuOTQzLDE4LjUyMmgtMi42MTMgICAgYy0wLjQ5MS01Ljk2Mi0xLjEtMTIuMTM1LTEuODI1LTE4LjUyMmMtMC43MjYtNi4zODYtMS4wODgtMTAuMTM3LTEuMDg4LTExLjI1NGMwLTEuMjczLDAuNDAyLTIuMzQ0LDEuMjA1LTMuMjE1ICAgIGMwLjgwNC0wLjg3MSwxLjgzMS0xLjMwNiwzLjA4Mi0xLjMwNmMxLjI1LDAsMi4yNzgsMC40MywzLjA4MSwxLjI4OUM1NC4wOTgsMjIuNDE1LDU0LjUsMjMuNDkzLDU0LjUsMjQuNzg4eiIvPjwvZz48L2c+PGcgaWQ9ItCh0LvQvtC5XzEiLz48L3N2Zz4=",
            title: "疑似的劫持",
            message: fromSite + " 疑似被劫持到了 " + toSite + ", 如有误杀请及时反馈"
        });
        return { redirectUrl: originalUrl };
    } else {
        console.log(fromSite, "redirected to", toSite);
    }

    return {};
}, {
        urls: ["<all_urls>"],
        types: ["main_frame", "sub_frame", "xmlhttprequest", "other"]
    }, ["blocking", "responseHeaders"]);


