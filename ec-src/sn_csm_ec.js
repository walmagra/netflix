var SN_CSM_EC = (function() {
    var IFRAMR_SRC = "";
    var IFRAMR_LOGOUT_SRC = "";
    var IFRAME_WIDTH = "420px";
    var IFRAME_HEIGHT = "700px";
    var ID_TOKEN = "";
    var CONFIG_ID = "";
    var PORTAL_ID = "";
    var SN_DOMAIN = "";
    var CONTEXT = "";
    var IFRAME_LAUNCHER_ICON_SRC = "";
    var STORAGE_LAUNCHER_STATUS_KEY = "ecLauncher";

    var launcher, widgetFrame, widgetWrapper, popupObjectReference, configResolver, isLoggedInUser = false;

    var onLoadConfig = new Promise(function(success) {
        return configResolver = success;
    });

    var fetchTokenCallback = function() {
        return Promise.resolve();
    };

    function setConfig(configData) {
        if (configData) {
            fetchTokenCallback = configData.tokenCallBack || fetchTokenCallback;
            CONTEXT = configData.context ? "?" + configData.context : "";
            var idArray = configData.moduleID.split("#");
            SN_DOMAIN = idArray[0];
            CONFIG_ID = idArray[1];
            return loadConfig();
        } else {
            throw new Error("Module ID is mandatory");
        }
    }

    function loadConfig() {
        return fetchRequest({
            method: "GET",
            url: SN_DOMAIN + "api/sn_csm_ec/engagement_center_api/module/" + CONFIG_ID            
        }).then(function(response){
            var config = JSON.parse(response);
            configResolver(config.result.SSOMedium);
            PORTAL_ID = config.result.portal;
            IFRAMR_SRC = SN_DOMAIN + PORTAL_ID + CONTEXT;
            IFRAMR_LOGOUT_SRC = SN_DOMAIN + "logout.do?sysparm_goto_url=" + SN_DOMAIN + PORTAL_ID;
            customizeMessenger(config);
            return config;
        }, function(){
            throw new Error("Incorrect Module ID provided");
        })
    }

    function customizeMessenger(data) {
        IFRAME_HEIGHT = data.height || IFRAME_HEIGHT;
        IFRAME_WIDTH = data.width || IFRAME_WIDTH;
        IFRAME_LAUNCHER_ICON_SRC = data.result.icon || IFRAME_LAUNCHER_ICON_SRC;
    }

    function getTemplate(TEMPLATE_SRC) {
        return '<div class="ecEmbedWrapper">' +
            '<img class="ecEmbedWidgetlauncher" src=' + IFRAME_LAUNCHER_ICON_SRC + ' alt="Messanger- closed" decoding="async">' +
            '<iframe class="" frameborder="0" src=' + TEMPLATE_SRC + '></iframe>' +
            '<style type="text/css">' +
            'img.ecEmbedWidgetlauncher{' +
            'box-shadow: none;' +            
            'position: absolute;' +
            'width: 64px;' +
            'height: 64px;' +
            'padding: 0px;' +
            'margin: 0px;' +
            'border: 0px;' +
            'bottom: 69px;' +
            'right: 70px;' +
            '}' +
            'img.ecEmbedWidgetlauncher:active {' +
            'outline: none;' +
            '}' +
            '.ecEmbedWrapper{' +
            'bottom: 15px;' +
            'min-height: 73px;' +
            'min-width: 65px;' +
            'overflow: hidden;' +
            'position: fixed;' +
            'height: ' + IFRAME_HEIGHT + ';' +
            'width: ' + IFRAME_WIDTH + ';' +
            'right: 15px;' +
            'z-index: 2147483600;' +
            'max-height: calc(100% - 15px);' +
            'opacity: 1;' +
            'transition: width .5s ease-out,height .5s ease-out;' +
            '}' +
            '.ecEmbedWrapper.mobile{' +
            'height: 100%;' +
            'width: 100%;' +
            'position: absolute;' +
            'max-height: 100%;' +
            'bottom: 0px;' +
            'right: 0px;' +
            '}' +
            '.ecEmbedWrapper.maxHeight{' +
            'height: 100%;' +
            'bottom: 0px;' +
            'max-height: 100%;' +
            'right: 0px;' +
            '}' +
            '.ecEmbedWrapper iframe{' +
            'border: 0;' +
            'height: calc(100% - 35px);' +
            'width: 100%;' +
            'position: absolute;' +
            'left: 0;' +
            'bottom: 0;' +
            '}' +
            '.ecEmbedWrapper .hidden{' +
            'display: none;' +
            '}' +
            '</style>' +
            '</div>';
    }

    function fetchRequest (opts) {
        if(local-debug){

        }else{
        opts.headers = opts.headers || {};
        opts.props = opts.props || {};
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open(opts.method, opts.url);
            xhr.onload = function () {
                resolve(xhr.responseText);
            };
            xhr.onerror = function () {
                reject({ status: this.status, statusText: xhr.statusText });
            };            
            Object.keys(opts.headers).forEach(function (key) {
                xhr.setRequestHeader(key, opts.headers[key]);
            });
            Object.keys(opts.props).forEach(function (key) {
                xhr[key] = opts.props[key];
            });
            xhr.send(opts);
        });
        }
    }
      

    function initilizeWidget() {
        if (ID_TOKEN) {            
            fetchRequest({
                method: "post",
                url: SN_DOMAIN + "api/sn_csm_ec/engagement_center_api/connectnow",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + ID_TOKEN
                },
                props:{
                    "withCredentials": true
                }
            }).then(function(){
                complileTemplate(IFRAMR_SRC);
            });            
        } else {
            complileTemplate(IFRAMR_SRC);
        }
    }

    function complileTemplate(templateSrc) {
        destroyWidget();
        var wrapper = document.createElement('div');
        wrapper.innerHTML = getTemplate(templateSrc);
        document.body.appendChild(wrapper.firstChild);
        widgetWrapper = document.querySelector(".ecEmbedWrapper");
        launcher = document.querySelector(".ecEmbedWidgetlauncher");
        widgetFrame = document.querySelector(".ecEmbedWrapper iframe");
        isMobilePlatform() && widgetWrapper.classList.add("mobile");
        launcher.addEventListener("click", openWidget);
        hideWidget();
        widgetFrame.addEventListener('load', showWidget);
        window.addEventListener('resize', checkMobile);
    }

    function logoutWidget() {
        ID_TOKEN = "";
        complileTemplate(IFRAMR_LOGOUT_SRC);
    }

    function isMobilePlatform() {
        var userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return new RegExp(/Android|iPhone|IEMobile|Windows Phone|BlackBerry|BB/gm).test(userAgent);
    }

    function checkMobile() {
        setTimeout(function() {
            isMobilePlatform() ? widgetWrapper.classList.add("mobile") : widgetWrapper.classList.remove("mobile");
        }, 100);
    }

    function hideLauncherIcon(){
        launcher.classList.add("hidden");
    }
    function showLauncherIcon(){
        launcher.classList.remove("hidden");
    }
    function hideMessengerFrame(){
        widgetFrame.classList.add("hidden");
    }
    function showMessengerFrame(){
        widgetFrame.classList.remove("hidden");
    }
    
    function wasLauncherOpened(){
        return localStorage.getItem(STORAGE_LAUNCHER_STATUS_KEY) === "opened";
    }

    function openWidget() {
        showMessengerFrame();
        hideLauncherIcon();
        localStorage.setItem(STORAGE_LAUNCHER_STATUS_KEY, "opened");
    }

    function closeWidget() {
        hideMessengerFrame();
        showLauncherIcon();
        localStorage.setItem(STORAGE_LAUNCHER_STATUS_KEY, "closed");
    }

    function hideWidget() {
        hideMessengerFrame();
        hideLauncherIcon();
    }

    function showWidget() {
        hideMessengerFrame();
        showLauncherIcon();
        !isMobilePlatform() && wasLauncherOpened() && openWidget();
    }

    function destroyWidget() {
        widgetWrapper && widgetWrapper.parentNode.removeChild(widgetWrapper);
    }

    function onExternalUserLogin() {
        onLoadConfig.then(function(SSOType) {
            if (SSOType === "OIDC") {
                try{
                    fetchTokenCallback().then(function(token) {
                        if (token && token != ID_TOKEN) {
                            ID_TOKEN = token;
                            initilizeWidget();
                        }
                    });
                }catch(err){
                    ID_TOKEN = "";
                    initilizeWidget();
                    throw new Error("Token fetch failed");
                }
            } else if (SSOType === "SAML") {
                !isLoggedInUser && document.body.addEventListener('click', authenticateUsingSSO);
            }
        });
    }

    function authenticateUsingSSO() {
        var popupFeature = "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=300, height=300";
        popupObjectReference = !isLoggedInUser ? window.open(SN_DOMAIN + 'saml_auth_landing_page', "login", popupFeature) : null;
        document.body.removeEventListener('click', authenticateUsingSSO);
    }

    function setMaxHeight() {
        widgetWrapper.classList.add("maxHeight");
    }

    function resetHeight() {
        widgetWrapper.classList.remove("maxHeight");
    }

    window.addEventListener("message", function(e) {
        if (e.data.type === "IFRAME_DOC_OUT") {
            setMaxHeight();
        } else if (e.data.type === "IFRAME_DOC_IN") {
            resetHeight();
        } else if (e.data.type === "CLOSE_MESSENGER") {
            closeWidget();
        } else if (e.data.type === "LOGIN_EVENT") {
            popupObjectReference && popupObjectReference.close();
            initilizeWidget();
        } else if (e.data.type === "USER_STATE_CHANGE") {
            isLoggedInUser = e.data.status;
        } else if (e.data.type === "GLIDE_REFRESH") {
            isLoggedInUser = false;
            authenticateUsingSSO();
        }
    });

    // Public API's exposed to third party
    return {
        init: function(e) {
            setConfig(e).then(initilizeWidget);
        },
        destroy: function() {
            destroyWidget();
        },
        hide: function() {
            hideWidget();
        },
        show: function() {
            showWidget();
        },
        open: function() {
            openWidget();
        },
        close: function() {
            closeWidget();
        },
        dockOut: function() {
            setMaxHeight();
        },
        dockIn: function() {
            resetHeight();
        },
        onLogin: function() {
            onExternalUserLogin();
        },
        onLogout: function() {
            logoutWidget();
        }
    };
})();