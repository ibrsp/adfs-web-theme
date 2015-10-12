// This file is adapted from the default provided by Microsoft following the instructions at
// https://technet.microsoft.com/en-us/library/dn636121.aspx
//
// The Javascript code from the Shibboleth Embedded Discovery Service (EDS) is included
// and then edited to load entityID and displayName information from that already
// provided in the default form that ADFS would normally display.
//
//
// This file contains several workarounds on inconsistent browser behaviors that administrators may customize.
"use strict";

// iPhone email friendly keyboard does not include "\" key, use regular keyboard instead.
// Note change input type does not work on all versions of all browsers.
if (navigator.userAgent.match(/iPhone/i) != null) {
    var emails = document.querySelectorAll("input[type='email']");
    if (emails) {
        for (var i = 0; i < emails.length; i++) {
            emails[i].type = 'text';
        }
    }
}

// In the CSS file we set the ms-viewport to be consistent with the device dimensions, 
// which is necessary for correct functionality of immersive IE. 
// However, for Windows 8 phone we need to reset the ms-viewport's dimension to its original
// values (auto), otherwise the viewport dimensions will be wrong for Windows 8 phone.
// Windows 8 phone has agent string 'IEMobile 10.0'
if (navigator.userAgent.match(/IEMobile\/10\.0/)) {
    var msViewportStyle = document.createElement("style");
    msViewportStyle.appendChild(
        document.createTextNode(
            "@-ms-viewport{width:auto!important}"
        )
    );
    msViewportStyle.appendChild(
        document.createTextNode(
            "@-ms-viewport{height:auto!important}"
        )
    );
    document.getElementsByTagName("head")[0].appendChild(msViewportStyle);
}

// If the innerWidth is defined, use it as the viewport width.
if (window.innerWidth && window.outerWidth && window.innerWidth !== window.outerWidth) {
    var viewport = document.querySelector("meta[name=viewport]");
    viewport.setAttribute('content', 'width=' + window.innerWidth + 'px; initial-scale=1.0; maximum-scale=1.0');
}

// Gets the current style of a specific property for a specific element.
function getStyle(element, styleProp) {
    var propStyle = null;

    if (element && element.currentStyle) {
        propStyle = element.currentStyle[styleProp];
    }
    else if (element && window.getComputedStyle) {
        propStyle = document.defaultView.getComputedStyle(element, null).getPropertyValue(styleProp);
    }

    return propStyle;
}

// The script below is used for downloading the illustration image 
// only when the branding is displaying. This script work together
// with the code in PageBase.cs that sets the html inline style
// containing the class 'illustrationClass' with the background image.
var computeLoadIllustration = function () {
    var branding = document.getElementById("branding");
    var brandingDisplay = getStyle(branding, "display");
    var brandingWrapperDisplay = getStyle(document.getElementById("brandingWrapper"), "display");

    if (brandingDisplay && brandingDisplay !== "none" &&
        brandingWrapperDisplay && brandingWrapperDisplay !== "none") {
        var newClass = "illustrationClass";

        if (branding.classList && branding.classList.add) {
            branding.classList.add(newClass);
        } else if (branding.className !== undefined) {
            branding.className += " " + newClass;
        }
        if (window.removeEventListener) {
            window.removeEventListener('load', computeLoadIllustration, false);
            window.removeEventListener('resize', computeLoadIllustration, false);
        }
        else if (window.detachEvent) {
            window.detachEvent('onload', computeLoadIllustration);
            window.detachEvent('onresize', computeLoadIllustration);
        }
    }
};

if (window.addEventListener) {
    window.addEventListener('resize', computeLoadIllustration, false);
    window.addEventListener('load', computeLoadIllustration, false);
}
else if (window.attachEvent) {
    window.attachEvent('onresize', computeLoadIllustration);
    window.attachEvent('onload', computeLoadIllustration);
}

// add text to choose how to login
var chooseLoginNode = document.createElement("h2");
var chooseLoginText = document.createTextNode("Please choose how to login");
chooseLoginNode.appendChild(chooseLoginText);
document.getElementById("workArea").appendChild(chooseLoginNode);

// add the div for the Shibboleth EDS style IdP selector
var idpSelectorNode = document.createElement("div");
idpSelectorNode.setAttribute("id", "idpSelect");
document.getElementById("workArea").appendChild(idpSelectorNode);

// hide the ADFS default form
document.getElementById("hrdArea").style.display = 'none';

// set the header
document.getElementById("header").innerHTML = 'IBRSP SharePoint 2013';

// equivalent of typeahead.js from Shibboleth EDS

function TypeAheadControl(jsonObj, box, orig, submit, maxchars, getName, getEntityId, geticon, ie6hack, alwaysShow, maxResults, getKeywords)
{
    //
    // Squirrel away the parameters we were given
    //
    this.elementList = jsonObj;
    this.textBox = box;
    this.origin = orig;
    this.submit = submit;
    this.results = 0;
    this.alwaysShow = alwaysShow;
    this.maxResults = maxResults;
    this.ie6hack = ie6hack;
    this.maxchars = maxchars;
    this.getName = getName;
    this.getEntityId = getEntityId;
    this.geticon = geticon;
    this.getKeywords = getKeywords;
}

TypeAheadControl.prototype.draw = function(setFocus) {

    //
    // Make a closure on this so that the embedded functions
    // get access to it.
    //
    var myThis = this;
   

    //
    // Set up the 'dropDown'
    //
    this.dropDown = document.createElement('ul');
    this.dropDown.className = 'IdPSelectDropDown';
    this.dropDown.style.visibility = 'hidden';

    this.dropDown.style.width = this.textBox.offsetWidth;
    this.dropDown.current = -1;
    this.textBox.setAttribute('role', 'listbox');
    document.body.appendChild(this.dropDown);

    //
    // Set ARIA on the input
    //
    this.textBox.setAttribute('role', 'combobox');
    this.textBox.setAttribute('aria-controls', 'IdPSelectDropDown');
    this.textBox.setAttribute('aria-owns', 'IdPSelectDropDown');

    //
    // mouse listeners for the dropdown box
    //
    this.dropDown.onmouseover = function(event) {
        if (!event) {
            event = window.event;
        }
        var target;
        if (event.target){
            target = event.target;
        }
        if (typeof target == 'undefined') {
            target = event.srcElement;
        }
        myThis.select(target);
    };
   
    this.dropDown.onmousedown = function(event) {
        if (-1 != myThis.dropDown.current) {
            myThis.textBox.value = myThis.results[myThis.dropDown.current][0];
        }
    };

    //
    // Add the listeners to the text box
    //
    this.textBox.onkeyup = function(event) {
        //
        // get window event if needed (because of browser oddities)
        //
        if (!event) {
            event = window.event;
        }
        myThis.handleKeyUp(event);
    };

    this.textBox.onkeydown = function(event) {
        if (!event) {
            event = window.event;
        }

        myThis.handleKeyDown(event);
    };

    this.textBox.onblur = function() {
        myThis.hideDrop();
    };

    this.textBox.onfocus = function() {
        myThis.handleChange();
    };

    if (null == setFocus || setFocus) {
        this.textBox.focus();
    }
};

//
// Given a name return the first maxresults, or all possibles
//
TypeAheadControl.prototype.getPossible = function(name) {
    var possibles = [];
    var inIndex = 0;
    var outIndex = 0;
    var strIndex = 0;
    var str;
    var ostr;

    name = name.toLowerCase();
        
    while (outIndex <= this.maxResults && inIndex < this.elementList.length) {
        var hit = false;
        var thisName = this.getName(this.elementList[inIndex]);

        //
        // Check name
        //
        if (thisName.toLowerCase().indexOf(name) != -1) {
            hit = true;
        }  
        //
        // Check entityID
        //
        if (!hit && this.getEntityId(this.elementList[inIndex]).toLowerCase().indexOf(name) != -1) {
            hit = true;
        }

        if (!hit) {
            var thisKeywords = this.getKeywords(this.elementList[inIndex]);
            if (null != thisKeywords && 
                thisKeywords.toLowerCase().indexOf(name) != -1) {
                hit = true;
            }
        }  
                
        if (hit) {
            possibles[outIndex] = [thisName, this.getEntityId(this.elementList[inIndex]), this.geticon(this.elementList[inIndex])];
            outIndex ++;
        }
                
        inIndex ++;
    }
    //
    // reset the cursor to the top
    //
    this.dropDown.current = -1;
    
    return possibles;
};

TypeAheadControl.prototype.handleKeyUp = function(event) {
    var key = event.keyCode;

    if (27 == key) {
        //
        // Escape - clear
        //
        this.textBox.value = '';
        this.handleChange();
    } else if (8 == key || 32 == key || (key >= 46 && key < 112) || key > 123) {
        //
        // Backspace, Space and >=Del to <F1 and > F12
        //
        this.handleChange();
    }
};
 
TypeAheadControl.prototype.handleKeyDown = function(event) {

    var key = event.keyCode;

    if (38 == key) {
        //
        // up arrow
        //
        this.upSelect();

    } else if (40 == key) {
        //
        // down arrow
        //
        this.downSelect();
    }
};

TypeAheadControl.prototype.hideDrop = function() {
    var i = 0;
    if (null !== this.ie6hack) {
        while (i < this.ie6hack.length) {
            this.ie6hack[i].style.visibility = 'visible';
            i++;
        }
    }
    this.dropDown.style.visibility = 'hidden';
    this.textBox.setAttribute('aria-expanded', 'false');


    if (-1 == this.dropDown.current) {
        this.doUnselected();
    }
};

TypeAheadControl.prototype.showDrop = function() {
    var i = 0;
    if (null !== this.ie6hack) {
        while (i < this.ie6hack.length) {
            this.ie6hack[i].style.visibility = 'hidden';
            i++;
        }
    }
    this.dropDown.style.visibility = 'visible';
    this.dropDown.style.width = this.textBox.offsetWidth +"px";
    this.textBox.setAttribute('aria-expanded', 'true');
};


TypeAheadControl.prototype.doSelected = function() {
    this.submit.disabled = false;
};

TypeAheadControl.prototype.doUnselected = function() {
    this.submit.disabled = true;
    this.textBox.setAttribute('aria-activedescendant', '');
};

TypeAheadControl.prototype.handleChange = function() {

    var val = this.textBox.value;
    var res = this.getPossible(val);


    if (0 === val.length || 
        0 === res.length ||
        (!this.alwaysShow && this.maxResults < res.length)) {
        this.hideDrop();
        this.doUnselected();
        this.results = [];
        this.dropDown.current = -1;
    } else {
        this.results = res;
        this.populateDropDown(res);
        if (1 == res.length) {
            this.select(this.dropDown.childNodes[0]);
            this.doSelected();
        } else {
            this.doUnselected();
        }
    }
};

//
// A lot of the stuff below comes from 
// http://www.webreference.com/programming/javascript/ncz/column2
//
// With thanks to Nicholas C Zakas
//
TypeAheadControl.prototype.populateDropDown = function(list) {
    this.dropDown.innerHTML = '';
    var i = 0;
    var li;
    var img;
    var str;

    while (i < list.length) {
        li = document.createElement('li');
        li.id='IdPSelectOption' + i;
        str = list[i][0];

	if (null !== list[i][2]) {

	    img = document.createElement('img');
	    img.src = list[i][2];
	    img.width = 16;
	    img.height = 16;
	    img.alt = '';
	    li.appendChild(img);
	    //
	    // trim string back further in this case
	    //
	    if (str.length > this.maxchars - 2) {
		str = str.substring(0, this.maxchars - 2);
	    }
	    str = ' ' + str;
	} else {
	    if (str.length > this.maxchars) {
		str = str.substring(0, this.maxchars);
	    }
	}
        li.appendChild(document.createTextNode(str));
        li.setAttribute('role', 'option');
        this.dropDown.appendChild(li);
        i++;
    }
    var off = this.getXY();
    this.dropDown.style.left = off[0] + 'px';
    this.dropDown.style.top = off[1] + 'px';
    this.showDrop();
};

TypeAheadControl.prototype.getXY = function() {

    var node = this.textBox;
    var sumX = 0;
    var sumY = node.offsetHeight;
   
    while(node.tagName != 'BODY') {
        sumX += node.offsetLeft;
        sumY += node.offsetTop;
        node = node.offsetParent;
    }
    //
    // And add in the offset for the Body
    //
    sumX += node.offsetLeft;
    sumY += node.offsetTop;

    return [sumX, sumY];
};

TypeAheadControl.prototype.select = function(selected) {
    var i = 0;
    var node;
    this.dropDown.current = -1;
    this.doUnselected();
    while (i < this.dropDown.childNodes.length) {
        node = this.dropDown.childNodes[i];
        if (node == selected) {
            //
            // Highlight it
            //
            node.className = 'IdPSelectCurrent';
            node.setAttribute('aria-selected', 'true');
            this.textBox.setAttribute('aria-activedescendant', 'IdPSelectOption' + i);

            //
            // turn on the button
            //
            this.doSelected();
            //
            // setup the cursor
            //
            this.dropDown.current = i;
            //
            // and the value for the Server
            //
            this.origin.value = this.results[i][1];
            this.origin.textValue = this.results[i][0];
        } else {
            node.setAttribute('aria-selected', 'false');
            node.className = '';
        }
        i++;
    }
    this.textBox.focus();
};

TypeAheadControl.prototype.downSelect = function() {
    if (this.results.length > 0) {

        if (-1 == this.dropDown.current) {
            //
            // mimic a select()
            //
            this.dropDown.current = 0;
            this.dropDown.childNodes[0].className = 'IdPSelectCurrent';
            this.dropDown.childNodes[0].setAttribute('aria-selected', 'true');
            this.textBox.setAttribute('aria-activedescendant', 'IdPSelectOption' + 0);
            this.doSelected();
            this.origin.value = this.results[0][1];
            this.origin.textValue = this.results[0][0];

        } else if (this.dropDown.current < (this.results.length-1)) {
            //
            // turn off highlight
            //
            this.dropDown.childNodes[this.dropDown.current].className = '';
            //
            // move cursor
            //
            this.dropDown.current++;
            //
            // and 'select'
            //
            this.dropDown.childNodes[this.dropDown.current].className = 'IdPSelectCurrent';
            this.dropDown.childNodes[this.dropDown.current].setAttribute('aria-selected', 'true');
            this.textBox.setAttribute('aria-activedescendant', 'IdPSelectOption' + this.dropDown.current);
            this.doSelected();
            this.origin.value = this.results[this.dropDown.current][1];
            this.origin.textValue = this.results[this.dropDown.current][0];

        }
    }
};


TypeAheadControl.prototype.upSelect = function() {
    if ((this.results.length > 0) &&
        (this.dropDown.current > 0)) {
    
            //
            // turn off highlight
            //
            this.dropDown.childNodes[this.dropDown.current].className = '';
            //
            // move cursor
            //
            this.dropDown.current--;
            //
            // and 'select'
            //
            this.dropDown.childNodes[this.dropDown.current].className = 'IdPSelectCurrent';
            this.dropDown.childNodes[this.dropDown.current].setAttribute('aria-selected', 'true');
            this.textBox.setAttribute('aria-activedescendant', 'IdPSelectOption' + this.dropDown.current);
            this.doSelected();
            this.origin.value = this.results[this.dropDown.current][1];
            this.origin.textValue = this.results[this.dropDown.current][0];
        }
};


// equivalent of the file idpselect_config.js from Shibboleth EDS

/** @class IdP Selector UI */
function IdPSelectUIParms(){
    //
    // Adjust the following to fit into your local configuration
    //
    this.alwaysShow = true;          // If true, this will show results as soon as you start typing
    this.dataSource = '/Shibboleth.sso/DiscoFeed';   // Where to get the data from
    this.defaultLanguage = 'en';     // Language to use if the browser local doesnt have a bundle
    this.defaultLogo = 'blank.gif';  // Replace with your own logo
    this.defaultLogoWidth = 1;
    this.defaultLogoHeight = 1 ;
    this.defaultReturn = null;       // If non null, then the default place to send users who are not
                                     // Approaching via the Discovery Protocol for example
    //this.defaultReturn = "https://example.org/Shibboleth.sso/DS?SAMLDS=1&target=https://example.org/secure";
    this.defaultReturnIDParam = null;
    this.helpURL = 'https://wiki.shibboleth.net/confluence/display/SHIB2/DSRoadmap';
    this.ie6Hack = null;             // An array of structures to disable when drawing the pull down (needed to 
                                     // handle the ie6 z axis problem
    this.insertAtDiv = 'idpSelect';  // The div where we will insert the data
    this.maxResults = 10;            // How many results to show at once or the number at which to
                                     // start showing if alwaysShow is false
    this.myEntityID = null;          // If non null then this string must match the string provided in the DS parms
    this.preferredIdP = null;        // Array of entityIds to always show
    this.hiddenIdPs = ['http://fsdev.iceruganda.org/adfs/services/trust'];          // Array of entityIds to delete
    this.ignoreKeywords = false;     // Do we ignore the <mdui:Keywords/> when looking for candidates
    this.showListFirst = false;      // Do we start with a list of IdPs or just the dropdown
    this.samlIdPCookieTTL = 730;     // in days
    this.setFocusTextBox = true;     // Set to false to supress focus 
    this.testGUI = false;


    //
    // Language support. 
    //
    // The minified source provides "en", "de", "pt-br" and "jp".  
    //
    // Override any of these below, or provide your own language
    //
    //this.langBundles = {
    //'en': {
    //    'fatal.divMissing': '<div> specified  as "insertAtDiv" could not be located in the HTML',
    //    'fatal.noXMLHttpRequest': 'Browser does not support XMLHttpRequest, unable to load IdP selection data',
    //    'fatal.wrongProtocol' : 'Policy supplied to DS was not "urn:oasis:names:tc:SAML:profiles:SSO:idpdiscovery-protocol:single"',
    //    'fatal.wrongEntityId' : 'entityId supplied by SP did not match configuration',
    //    'fatal.noData' : 'Metadata download returned no data',
    //    'fatal.loadFailed': 'Failed to download metadata from ',
    //    'fatal.noparms' : 'No parameters to discovery session and no defaultReturn parameter configured',
    //    'fatal.noReturnURL' : "No URL return parameter provided",
    //    'fatal.badProtocol' : "Return request must start with https:// or http://",
    //    'idpPreferred.label': 'Use a suggested selection:',
    //    'idpEntry.label': 'Or enter your organization\'s name',
    //    'idpEntry.NoPreferred.label': 'Enter your organization\'s name',
    //    'idpList.label': 'Or select your organization from the list below',
    //    'idpList.NoPreferred.label': 'Select your organization from the list below',
    //    'idpList.defaultOptionLabel': 'Please select your organization...',
    //    'idpList.showList' : 'Allow me to pick from a list',
    //    'idpList.showSearch' : 'Allow me to specify the site',
    //    'submitButton.label': 'Continue',
    //    'helpText': 'Help',
    //    'defaultLogoAlt' : 'DefaultLogo'
    //}
    //};

    //
    // The following should not be changed without changes to the css.  Consider them as mandatory defaults
    //
    this.maxPreferredIdPs = 3;
    this.maxIdPCharsButton = 33;
    this.maxIdPCharsDropDown = 58;
    this.maxIdPCharsAltTxt = 60;

    this.minWidth = 20;
    this.minHeight = 20;
    this.maxWidth = 115;
    this.maxHeight = 69;
    this.bestRatio = Math.log(80 / 60);
}

// equivalent of idpselect_languages.js from Shibboleth EDS

 
/** @class IdP Selector UI */
function IdPSelectLanguages(){
    //
    // Globalization stuff
    //
    this.langBundles = {
    'en': {
        'fatal.divMissing': '<div> specified  as "insertAtDiv" could not be located in the HTML',
        'fatal.noXMLHttpRequest': 'Browser does not support XMLHttpRequest, unable to load IdP selection data',
        'fatal.wrongProtocol' : 'Policy supplied to DS was not "urn:oasis:names:tc:SAML:profiles:SSO:idpdiscovery-protocol:single"',
        'fatal.wrongEntityId' : 'entityId supplied by SP did not match configuration',
        'fatal.noData' : 'Metadata download returned no data',
        'fatal.loadFailed': 'Failed to download metadata from ',
        'fatal.noparms' : 'No parameters to discovery session and no defaultReturn parameter configured',
        'fatal.noReturnURL' : "No URL return parameter provided",
        'fatal.badProtocol' : "Return request must start with https:// or http://",
        'idpPreferred.label': 'Use a suggested selection:',
        'idpEntry.label': 'Or enter your organization\'s name',
        'idpEntry.NoPreferred.label': 'Enter your organization\'s name',
        'idpList.label': 'Or select your organization from the list below',
        'idpList.NoPreferred.label': 'Select your organization from the list below',
        'idpList.defaultOptionLabel': 'Please select your organization...',
        'idpList.showList' : 'Allow me to pick from a list',
        'idpList.showSearch' : 'Allow me to specify the site',
        'submitButton.label': 'Continue',
        'helpText': 'Help',
        'defaultLogoAlt' : 'DefaultLogo'
    },
    'de': {
        'fatal.divMissing': 'Das notwendige Div Element fehlt',
        'fatal.noXMLHttpRequest': 'Ihr Webbrowser unterst\u00fctzt keine XMLHttpRequests, IdP-Auswahl kann nicht geladen werden',
        'fatal.wrongProtocol' : 'DS bekam eine andere Policy als "urn:oasis:names:tc:SAML:profiles:SSO:idpdiscovery-protocol:single"',
        'fatal.wrongEntityId' : 'Die entityId ist nicht korrekt',
        'fatal.loadFailed': 'Metadaten konnten nicht heruntergeladen werden: ',
        'fatal.noparms' : 'Parameter f\u00fcr das Discovery Service oder \'defaultReturn\' fehlen',
        'fatal.noReturnURL' : "URL return Parmeter fehlt",
        'fatal.badProtocol' : "return Request muss mit https:// oder http:// beginnen",
        'idpPreferred.label': 'Vorherige Auswahl:',
        'idpEntry.label': 'Oder geben Sie den Namen (oder Teile davon) an:',
        'idpEntry.NoPreferred.label': 'Namen (oder Teile davon) der Institution angeben:',
        'idpList.label': 'Oder w\u00e4hlen Sie Ihre Institution aus einer Liste:',
        'idpList.NoPreferred.label': 'Institution aus folgender Liste w\u00e4hlen:',
        'idpList.defaultOptionLabel': 'W\u00e4hlen Sie Ihre Institution aus...',
        'idpList.showList' : 'Institution aus einer Liste w\u00e4hlen',
        'idpList.showSearch' : 'Institution selbst angeben',
        'submitButton.label': 'OK',
        'helpText': 'Hilfe',
        'defaultLogoAlt' : 'Standard logo'
        },
    'ja': {
        'fatal.divMissing': '"insertAtDiv" の ID を持つ <div> が HTML 中に存在しません',
        'fatal.noXMLHttpRequest': 'ブラウザが XMLHttpRequest をサポートしていないので IdP 情報を取得できません',
        'fatal.wrongProtocol' : 'DSへ渡された Policy パラメータが "urn:oasis:names:tc:SAML:profiles:SSO:idpdiscovery-protocol:single" ではありません',
        'fatal.wrongEntityId' : 'SP から渡された entityId が設定値と異なります',
        'fatal.noData' : 'メタデータが空です',
        'fatal.loadFailed': '次の URL からメタデータをダウンロードできませんでした: ',
        'fatal.noparms' : 'DSにパラメータが渡されておらず defaultReturn も設定されていません',
        'fatal.noReturnURL' : "戻り URL が指定されていません",
        'fatal.badProtocol' : "戻り URL は https:// か http:// で始まらなければなりません",
        'idpPreferred.label': '選択候補の IdP:',
        'idpEntry.label': 'もしくはあなたの所属機関名を入力してください',
        'idpEntry.NoPreferred.label': 'あなたの所属機関名を入力してください',
        'idpList.label': 'もしくはあなたの所属機関を選択してください',
        'idpList.NoPreferred.label': 'あなたの所属機関を一覧から選択してください',
        'idpList.defaultOptionLabel': '所属機関を選択してください...',
        'idpList.showList' : '一覧から選択する',
        'idpList.showSearch' : '機関名を入力する',
        'submitButton.label': '選択',
        'helpText': 'Help',
        'defaultLogoAlt' : 'DefaultLogo'
    },
    'pt-br': {
        'fatal.divMissing': 'A tag <div> com "insertAtDiv" não foi encontrada no arquivo HTML',
        'fatal.noXMLHttpRequest': 'Seu navegador não suporta "XMLHttpRequest", impossível de carregador os dados do IdP selecionado',
        'fatal.wrongProtocol' : 'A política "Policy" fornecida para o DS não foi "urn:oasis:names:tc:SAML:profiles:SSO:idpdiscovery-protocol:single"',
        'fatal.wrongEntityId' : 'entityId oferecido pelo SP não confere com o da configuração',
        'fatal.noData' : 'O arquivo de metadados não retornou nada;',
        'fatal.loadFailed': 'Falhou ao realizar download do metadado de ',
        'fatal.noparms' : 'Sem parâmetros para sessão de descoberta e sem parâmetro "defaultReturn" configurado',
        'fatal.noReturnURL' : "Não foi definida um endereço (URL) de retorno no parâmetro",
        'fatal.badProtocol' : "Retorno do endereço requisitado deve começar com https:// ou http://",
        'idpPreferred.label': 'Use estas Instituições sugeridas: ',
        'idpEntry.label': 'Ou informe o nome da sua Instituição',
        'idpEntry.NoPreferred.label': 'Informe o nome da sua Instituição',
        'idpList.label': 'Ou selecione sua Instituição através da lista abaixo',
        'idpList.NoPreferred.label': 'Selecione sua Instituição através da lista abaixo',
        'idpList.defaultOptionLabel': 'Por favor, selecione sua Instituição: ',
        'idpList.showList' : 'Permitir que eu escolha um IdP através de uma lista',
        'idpList.showSearch' : 'Permitir que eu especifique o IdP',
        'submitButton.label': 'Continuar ',
        'helpText': 'Ajuda',
        'defaultLogoAlt' : 'Logo padrão'
        }
    };
}


// modified idpselect.js from Shibboleth EDS 
function IdPSelectUI() {
    //
    // module locals
    //
    var idpData;
    var base64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var idpSelectDiv;
    var lang;
    var majorLang;
    var defaultLang;
    var langBundle;
    var defaultLangBundle;
    var defaultLogo;
    var defaultLogoWidth;
    var defaultLogoHeight;
    var minWidth;
    var minHeight;
    var maxWidth;
    var maxHeight;
    var bestRatio;
    var doNotCollapse;

    //
    // Parameters passed into our closure
    //
    var preferredIdP;
    var maxPreferredIdPs;
    var helpURL;
    var ie6Hack;
    var samlIdPCookieTTL;
    var maxIdPCharsDropDown;
    var maxIdPCharsButton;
    var maxIdPCharsAltTxt;
    var alwaysShow;
    var maxResults;
    var ignoreKeywords;
    var showListFirst;
    var noWriteCookie;
    var ignoreURLParams;

    //
    // The cookie contents
    //
    var userSelectedIdPs;
    //
    // Anchors used inside autofunctions
    //
    var idpEntryDiv;
    var idpListDiv;
    var idpSelect;
    var listButton;
    
    //
    // local configuration
    //
    var idPrefix = 'idpSelect';
    var classPrefix = 'IdPSelect';
    var dropDownControl;

    //
    // DS protocol configuration
    //
    var returnString = '';
    var returnBase='';
    var returnParms= [];
    // var returnIDParam = 'entityID';
    var returnIDParam = 'HomeRealmSelection';

    // *************************************
    // Public functions
    // *************************************
    
    /**
       Draws the IdP Selector UI on the screen.  This is the main
       method for the IdPSelectUI class.
    */
    this.draw = function(parms){

        if (!setupLocals(parms)) {
            return;
        }

        idpSelectDiv = document.getElementById(parms.insertAtDiv);
        if(!idpSelectDiv){
            fatal(getLocalizedMessage('fatal.divMissing'));
            return;
        }

        if (!load(parms.dataSource)) {
            return;
        }
        deDupe();
        stripHidden(parms.hiddenIdPs);

        idpData.sort(function(a,b) {return getLocalizedName(a).localeCompare(getLocalizedName(b));});
        
        var idpSelector = buildIdPSelector();
        idpSelectDiv.appendChild(idpSelector);
        dropDownControl.draw(parms.setFocusTextBox);
    } ;
    
    // *************************************
    // Private functions
    //
    // Data Manipulation
    //
    // *************************************

    /**
       Copies the "parameters" in the function into namesspace local
       variables.  This means most of the work is done outside the
       IdPSelectUI object
    */

    var setupLocals = function (paramsSupplied) {
        //
        // Copy parameters in
        //
        var suppliedEntityId;

        preferredIdP = paramsSupplied.preferredIdP;
        maxPreferredIdPs = paramsSupplied.maxPreferredIdPs;
        helpURL = paramsSupplied.helpURL;
        ie6Hack = paramsSupplied.ie6Hack;
        samlIdPCookieTTL = paramsSupplied.samlIdPCookieTTL;
        alwaysShow = paramsSupplied.alwaysShow;
        maxResults = paramsSupplied.maxResults;
        ignoreKeywords = paramsSupplied.ignoreKeywords;
        if (paramsSupplied.showListFirst) {
            showListFirst = paramsSupplied.showListFirst;
        } else {
            showListFirst = false;
        }
        if (paramsSupplied.noWriteCookie) {
            noWriteCookie = paramsSupplied.noWriteCookie;
        } else {
            noWriteCookie = false;
        }
        if (paramsSupplied.ignoreURLParams) {
            ignoreURLParams = paramsSupplied.ignoreURLParams;
        } else {
            ignoreURLParams = false;
        }

        defaultLogo = paramsSupplied.defaultLogo;
        defaultLogoWidth = paramsSupplied.defaultLogoWidth;
        defaultLogoHeight = paramsSupplied.defaultLogoHeight;
        minWidth = paramsSupplied.minWidth;
        minHeight = paramsSupplied.minHeight;
        maxWidth = paramsSupplied.maxWidth;
        maxHeight = paramsSupplied.maxHeight;
        bestRatio = paramsSupplied.bestRatio;
        if (null == paramsSupplied.doNotCollapse) { 
            doNotCollapse = true;
        } else {
            doNotCollapse = paramsSupplied.doNotCollapse;
        }
            
        maxIdPCharsButton = paramsSupplied.maxIdPCharsButton;
        maxIdPCharsDropDown = paramsSupplied.maxIdPCharsDropDown;
        maxIdPCharsAltTxt = paramsSupplied.maxIdPCharsAltTxt;

        var lang;

        if (typeof navigator == 'undefined') {
            lang = paramsSupplied.defaultLanguage;
        } else {
            lang = navigator.language || navigator.userLanguage || paramsSupplied.defaultLanguage;
        }
        lang = lang.toLowerCase();

        if (lang.indexOf('-') > 0) {
            majorLang = lang.substring(0, lang.indexOf('-'));
        }

        var providedLangs = new IdPSelectLanguages();

        defaultLang = paramsSupplied.defaultLanguage;

        if (typeof paramsSupplied.langBundles != 'undefined' && typeof paramsSupplied.langBundles[lang] != 'undefined') {
            langBundle = paramsSupplied.langBundles[lang];
        } else if (typeof providedLangs.langBundles[lang] != 'undefined') {
            langBundle = providedLangs.langBundles[lang];
        } else if (typeof majorLang != 'undefined') {
            if (typeof paramsSupplied.langBundles != 'undefined' && typeof paramsSupplied.langBundles[majorLang] != 'undefined') {
                langBundle = paramsSupplied.langBundles[majorLang];
            } else if (typeof providedLangs.langBundles[majorLang] != 'undefined') {
                langBundle = providedLangs.langBundles[majorLang];
            }
        }
        
        if (typeof paramsSupplied.langBundles != 'undefined' && typeof paramsSupplied.langBundles[paramsSupplied.defaultLanguage] != 'undefined') {
            defaultLangBundle = paramsSupplied.langBundles[paramsSupplied.defaultLanguage];
        } else {
            defaultLangBundle = providedLangs.langBundles[paramsSupplied.defaultLanguage];
        }

        //
        // Setup Language bundles
        //
        if (!defaultLangBundle) {
            fatal('No languages work');
            return false;
        }
        if (!langBundle) {
            debug('No language support for ' + lang);
            langBundle = defaultLangBundle;
        }

        // We short circuit the params testing and policing here because
        // unlike with the Shibboleth EDS we are not using the SAML2 discovery
        // service protocol but instead just the ADFS non-standard protocol for
        // discovery.
        return true;

        if (paramsSupplied.testGUI) {
            //
            // no policing of parms
            //
            return true;
        }
        //
        // Now set up the return values from the URL
        //
        var policy = 'urn:oasis:names:tc:SAML:profiles:SSO:idpdiscovery-protocol:single';
        var i;
        var isPassive = false;
        var parms;
        var parmPair;
        var win = window;
        while (null !== win.parent && win !== win.parent) {
            win = win.parent;
        }
        var loc = win.location;
        var parmlist = loc.search;
        if (ignoreURLParams || null == parmlist || 0 == parmlist.length || parmlist.charAt(0) != '?') {

            if ((null == paramsSupplied.defaultReturn)&& !ignoreURLParams) {

                fatal(getLocalizedMessage('fatal.noparms'));
                return false;
            }
            //
            // No parameters, so just collect the defaults
            //
            suppliedEntityId  = paramsSupplied.myEntityID;
            returnString = paramsSupplied.defaultReturn;
            if (null != paramsSupplied.defaultReturnIDParam) {
                returnIDParam = paramsSupplied.defaultReturnIDParam;
            }
            
        } else {
            parmlist = parmlist.substring(1);

            //
            // protect against various hideousness by decoding. We re-encode just before we push
            //

            parms = parmlist.split('&');
            if (parms.length === 0) {

                fatal(getLocalizedMessage('fatal.noparms'));
                return false;
            }

            for (i = 0; i < parms.length; i++) {
                parmPair = parms[i].split('=');
                if (parmPair.length != 2) {
                    continue;
                }
                if (parmPair[0] == 'entityID') {
                    suppliedEntityId = decodeURIComponent(parmPair[1]);
                } else if (parmPair[0] == 'return') {
                    returnString = decodeURIComponent(parmPair[1]);
                } else if (parmPair[0] == 'returnIDParam') {
                    returnIDParam = decodeURIComponent(parmPair[1]);
                } else if (parmPair[0] == 'policy') {
                    policy = decodeURIComponent(parmPair[1]);
                } else if (parmPair[0] == 'isPassive') {
                    isPassive = (parmPair[1].toUpperCase() == "TRUE");
                }
            }
        }
        if (policy != 'urn:oasis:names:tc:SAML:profiles:SSO:idpdiscovery-protocol:single') {
            fatal(getLocalizedMessage('fatal.wrongProtocol'));
            return false;
        }
        if (paramsSupplied.myEntityID !== null && paramsSupplied.myEntityID != suppliedEntityId) {
            fatal(getLocalizedMessage('fatal.wrongEntityId') + '"' + suppliedEntityId + '" != "' + paramsSupplied.myEntityID + '"');
            return false;
        }
        if (null === returnString || returnString.length === 0) {
            fatal(getLocalizedMessage('fatal.noReturnURL'));
            return false;
        }
        if (!validProtocol(returnString)) {
            fatal(getLocalizedMessage('fatal.badProtocol'));
            return false;
        }

        //
        // isPassive
        //
        if (isPassive) {
            var prefs = retrieveUserSelectedIdPs();
            if (prefs.length == 0) {
                //
                // no preference, go back
                //
                location.href = returnString;
                return false;
            } else {
                var retString = returnIDParam + '=' + encodeURIComponent(prefs[0]);
                //
                // Compose up the URL
                //
                if (returnString.indexOf('?') == -1) {
                    retString = '?' + retString;
                } else {
                    retString = '&' + retString;
                }
                location.href = returnString + retString;
                return false;
            }            
        }

        //
        // Now split up returnString
        //
        i = returnString.indexOf('?');
        if (i < 0) {
            returnBase = returnString;
            return true;
        }
        returnBase = returnString.substring(0, i);
        parmlist = returnString.substring(i+1);
        parms = parmlist.split('&');
        for (i = 0; i < parms.length; i++) {
            parmPair = parms[i].split('=');
            if (parmPair.length != 2) {
                continue;
            }
            parmPair[1] = decodeURIComponent(parmPair[1]);
            returnParms.push(parmPair);
        }
        return true;
    };

    /** Deduplicate by entityId */
    var deDupe = function() {
        var names = [];
        var j;
        for (j = 0; j < idpData.length; ) {
            var eid = getEntityId(idpData[j]);
            if (null == names[eid]) {
                names[eid] = eid;
                j = j + 1;
            } else {
                idpData.splice(j, 1);
            }
        }
    }

    /**
       Strips the supllied IdP list from the idpData
    */
    var stripHidden = function(hiddenList) {
    
        if (null == hiddenList || 0 == hiddenList.length) {
            return;
        }
        var i;
        var j;
        for (i = 0; i < hiddenList.length; i++) {
            for (j = 0; j < idpData.length; j++) {
                if (getEntityId(idpData[j]) == hiddenList[i]) {
                    idpData.splice(j, 1);
                    break;
                }
            }
        }
    }


    /**
     * Strip the "protocol://host" bit out of the URL and check the protocol
     * @param the URL to process
     * @return whether it starts with http: or https://
     */

    var validProtocol = function(s) {
        if (null === s) {
            return false;
        }
        var marker = "://";
        var protocolEnd = s.indexOf(marker);
        if (protocolEnd < 0) {
            return false;
        }
        s = s.substring(0, protocolEnd);
        if (s == "http" || s== "https") {
            return true;
        }
        return false;
    };

    /**
     * We need to cache bust on IE.  So how do we know?  Use a bigger hammer.
     */
    var isIE = function() {
        if (null == navigator) {
            return false;
        }
        var browserName = navigator.appName;
        if (null == browserName) {
            return false;
        }
        return (browserName == 'Microsoft Internet Explorer') ;
    } ;


    /**
       Loads the data used by the IdP selection UI.  Data is loaded 
       by parsing the default form that ADFS would normally display.
    */
    var load = function(dataSource){
        idpData = [];
        var re = /^HRD\.selection\('(.+)'\).*/;

        var idpDivsParent = document.getElementById("bySelection");
        for (var i = 0; i < idpDivsParent.childNodes.length; i++) {
            if (idpDivsParent.childNodes[i].className == "idp") {
                var onclickString = idpDivsParent.childNodes[i].getAttribute("onclick");
                var match = re.exec(onclickString);
                var entityID = match[1];
                var displayName = idpDivsParent.childNodes[i].getElementsByTagName("span")[0].childNodes[0].nodeValue;
                idpData.push({ "entityID": entityID, "DisplayNames": [{"value": displayName, "lang": "en"}]});
            }
        }

        return true;
    };

    /**
       Returns the idp object with the given name.

       @param (String) the name we are interested in
       @return (Object) the IdP we care about
    */

    var getIdPFor = function(idpName) {

        for (var i = 0; i < idpData.length; i++) {
            if (getEntityId(idpData[i]) == idpName) {
                return idpData[i];
            }
        }
        return null;
    };

    /**
       Returns a suitable image from the given IdP
       
       @param (Object) The IdP
       @return Object) a DOM object suitable for insertion
       
       TODO - rather more careful selection
    */

    var getImageForIdP = function(idp, useDefault) {

        var getBestFit = function(language) {
            //
            // See GetLocalizedEntry
            //
            var bestFit = null;
            var i;
            if (null == idp.Logos) {
                return null;
            }
            for (i in idp.Logos) {
                if (idp.Logos[i].lang == language &&
                    idp.Logos[i].width != null &&  
                    idp.Logos[i].width >= minWidth &&
                    idp.Logos[i].height != null && 
                    idp.Logos[i].height >= minHeight) {
                    if (bestFit === null) {
                        bestFit = idp.Logos[i];
                    } else {
                        me = Math.abs(bestRatio - Math.log(idp.Logos[i].width/idp.Logos[i].height));
                        him = Math.abs(bestRatio - Math.log(bestFit.width/bestFit.height));
                        if (him > me) {
                            bestFit = idp.Logos[i];
                        }
                    }
                }
            }
            return bestFit;
        } ;

        var bestFit = null;
        var img = document.createElement('img');
        setClass(img, 'IdPImg');

        bestFit = getBestFit(lang);
        if (null === bestFit && typeof majorLang != 'undefined') {
            bestFit = getBestFit(majorLang);
        }
        if (null === bestFit) {
            bestFit = getBestFit(null);
        }
        if (null === bestFit) {
            bestFit = getBestFit(defaultLang);
        }
               
        if (null === bestFit) {
            if (!useDefault) {
                return null;
            }
            img.src = defaultLogo;
            img.width = defaultLogoWidth;
            img.height = defaultLogoHeight;
            img.alt = getLocalizedMessage('defaultLogoAlt');
            return img;
        }

        img.src = bestFit.value;
        var altTxt = getLocalizedName(idp);
        if (altTxt.length > maxIdPCharsAltTxt) {
            altTxt = altTxt.substring(0, maxIdPCharsAltTxt) + '...';
        }
        img.alt = altTxt;

        var w = bestFit.width;
        var h = bestFit.height;
        if (w>maxWidth) {
            h = (maxWidth/w) * h;
            w = maxWidth;
        }
        if (h> maxHeight) {
            w = (maxHeight/h) * w;
            w = maxHeight;
        }
            
        img.setAttribute('width', w);
        img.setAttribute('height', h);
        return img;
    };

    // *************************************
    // Private functions
    //
    // GUI Manipulation
    //
    // *************************************
    
    /**
       Builds the IdP selection UI.

       Three divs. PreferredIdPTime, EntryTile and DropdownTile
      
       @return {Element} IdP selector UI
    */
    var buildIdPSelector = function(){
        var containerDiv = buildDiv('IdPSelector');
        var preferredTileExists;
        preferredTileExists = buildPreferredIdPTile(containerDiv);
        buildIdPEntryTile(containerDiv, preferredTileExists);
        buildIdPDropDownListTile(containerDiv, preferredTileExists);
        return containerDiv;
    };

    /**
      Builds a button for the provided IdP
        <div class="preferredIdPButton">
          <a href="XYX" onclick=setparm('ABCID')>
            <div class=
            <img src="https:\\xyc.gif"> <!-- optional -->
            XYX Text
          </a>
        </div>

      @param (Object) The IdP
      
      @return (Element) preselector for the IdP
    */

    var composePreferredIdPButton = function(idp, uniq, useDefault) {
        var div = buildDiv(undefined, 'PreferredIdPButton');
        var aval = document.createElement('a');
        var retString = returnIDParam + '=' + encodeURIComponent(getEntityId(idp));
        var retVal = returnString;
        var img = getImageForIdP(idp, useDefault);
        //
        // Compose up the URL
        //
        if (retVal.indexOf('?') == -1) {
            retString = '?' + retString;
        } else {
            retString = '&' + retString;
        }
        aval.href = retVal + retString;
        aval.onclick = function () {
            selectIdP(getEntityId(idp));
        };
        if (null != img) {
            var imgDiv=buildDiv(undefined, 'PreferredIdPImg');
            imgDiv.appendChild(img);
            aval.appendChild(imgDiv);
        }

        var nameDiv = buildDiv(undefined, 'TextDiv');
        var nameStr = getLocalizedName(idp);
        if (nameStr.length > maxIdPCharsButton) {
            nameStr = nameStr.substring(0, maxIdPCharsButton) + '...';
        }
        div.title = nameStr;
        nameDiv.appendChild(document.createTextNode(nameStr));
        aval.appendChild(nameDiv);

        div.appendChild(aval);
        return div;
    };

    /**
     * Builds and populated a text Div
     */
    var buildTextDiv = function(parent, textId)
    {
        var div  = buildDiv(undefined, 'TextDiv');
        var introTxt = document.createTextNode(getLocalizedMessage(textId)); 
        div.appendChild(introTxt);
        parent.appendChild(div);
    } ;

    var setSelector = function (selector, selected) {
        if (null === selected || 0 === selected.length || '-' == selected.value) {
            return;
        }
        var i = 0;
        while (i < selector.options.length) {
            if (selector.options[i].value == selected) {
                selector.options[i].selected = true;
                break;
            }
            i++;
        }
    }

    /**
       Builds the preferred IdP selection UI (top half of the UI w/ the
       IdP buttons)

       <div id=prefix+"PreferredIdPTile">
          <div> [see comprosePreferredIdPButton </div>
          [repeated]
       </div>
      
       @return {Element} preferred IdP selection UI
    */
    var buildPreferredIdPTile = function(parentDiv) {

        var preferredIdPs = getPreferredIdPs();
        if (0 === preferredIdPs.length) {
            return false;
        }

        var atLeastOneImg = doNotCollapse;
        for(var i = 0 ; i < maxPreferredIdPs && i < preferredIdPs.length; i++){
            if (preferredIdPs[i] && getImageForIdP(preferredIdPs[i], false)) {
                atLeastOneImg = true;
            }
        }
        
        var preferredIdPDIV;
        if (atLeastOneImg) {
            preferredIdPDIV = buildDiv('PreferredIdPTile');
        } else {
            preferredIdPDIV = buildDiv('PreferredIdPTileNoImg');
        }


        buildTextDiv(preferredIdPDIV, 'idpPreferred.label');


        for(var i = 0 ; i < maxPreferredIdPs && i < preferredIdPs.length; i++){
            if (preferredIdPs[i]) {
                var button = composePreferredIdPButton(preferredIdPs[i],i, atLeastOneImg);
                preferredIdPDIV.appendChild(button);
            }
        }

        parentDiv.appendChild(preferredIdPDIV);
        return true;
    };

    /**
     * Build the <form> from the return parameters
     */

    var buildSelectForm = function ()
    {
        var form = document.createElement('form');
        idpEntryDiv.appendChild(form);

        // form.action = returnBase;
        form.action = document.getElementById("hrd").getAttribute("action");
        // form.method = 'GET';
        form.method = 'POST';
        form.setAttribute('autocomplete', 'OFF');
        var i = 0;
        for (i = 0; i < returnParms.length; i++) {
            var hidden = document.createElement('input');
            hidden.setAttribute('type', 'hidden');
            hidden.name = returnParms[i][0];
            hidden.value= returnParms[i][1];
            form.appendChild(hidden);
        }

        return form;
    } ;


    /**
       Build the manual IdP Entry tile (bottom half of UI with
       search-as-you-type field).

       <div id = prefix+"IdPEntryTile">
         <form>
           <input type="text", id=prefix+"IdPSelectInput/> // select text box
           <input type="hidden" /> param to send
           <input type="submit" />
           
      
       @return {Element} IdP entry UI tile
    */
    var buildIdPEntryTile = function(parentDiv, preferredTile) {


        idpEntryDiv = buildDiv('IdPEntryTile');
        if (showListFirst) {
            idpEntryDiv.style.display = 'none';
        }
        
        var label = document.createElement('label');
        label.setAttribute('for', idPrefix + 'Input');

        if (preferredTile) {
            buildTextDiv(label, 'idpEntry.label');
        } else {
            buildTextDiv(label, 'idpEntry.NoPreferred.label');
        }

        var form = buildSelectForm();
        form.appendChild(label);
      
        var textInput = document.createElement('input');
        form.appendChild(textInput);

        textInput.type='text';
        setID(textInput, 'Input');

        var hidden = document.createElement('input');
        hidden.setAttribute('type', 'hidden');
        form.appendChild(hidden);

        hidden.name = returnIDParam;
        hidden.value='-';

        var button = buildContinueButton('Select');
        button.disabled = true;
        form.appendChild(button);
        
        form.onsubmit = function () {
            //
            // Make sure we cannot ask for garbage
            //
            if (null === hidden.value || 0 === hidden.value.length || '-' == hidden.value) {
                return false;
            }
            //
            // And always ask for the cookie to be updated before we continue
            //
            textInput.value = hidden.textValue;
            selectIdP(hidden.value);
            return true;
        };

        dropDownControl = new TypeAheadControl(idpData, textInput, hidden, button, maxIdPCharsDropDown, getLocalizedName, getEntityId, geticon, ie6Hack, alwaysShow, maxResults, getKeywords);

        var a = document.createElement('a');
        a.appendChild(document.createTextNode(getLocalizedMessage('idpList.showList')));
        a.href = '#';
        setClass(a, 'DropDownToggle');
        a.onclick = function() { 
            idpEntryDiv.style.display='none';
            setSelector(idpSelect, hidden.value);
            idpListDiv.style.display='';
            listButton.focus();
            return false;
        };
        idpEntryDiv.appendChild(a);
        buildHelpText(idpEntryDiv);
                                              
        parentDiv.appendChild(idpEntryDiv);
    };
    
    /**
       Builds the drop down list containing all the IdPs from which a
       user may choose.

       <div id=prefix+"IdPListTile">
          <label for="idplist">idpList.label</label>
          <form action="URL from IDP Data" method="GET">
          <select name="param from IdP data">
             <option value="EntityID">Localized Entity Name</option>
             [...]
          </select>
          <input type="submit"/>
       </div>
        
       @return {Element} IdP drop down selection UI tile
    */
    var buildIdPDropDownListTile = function(parentDiv, preferredTile) {
        idpListDiv = buildDiv('IdPListTile');
        if (!showListFirst) {
            idpListDiv.style.display = 'none';
        }

        var label = document.createElement('label');
        label.setAttribute('for', idPrefix + 'Selector');

        if (preferredTile) {
            buildTextDiv(label, 'idpList.label');
        } else {
            buildTextDiv(label, 'idpList.NoPreferred.label');
        }

        idpSelect = document.createElement('select');
        setID(idpSelect, 'Selector');
        idpSelect.name = returnIDParam;
        idpListDiv.appendChild(idpSelect);
        
        var idpOption = buildSelectOption('-', getLocalizedMessage('idpList.defaultOptionLabel'));
        idpOption.selected = true;

        idpSelect.appendChild(idpOption);
    
        var idp;
        for(var i=0; i<idpData.length; i++){
            idp = idpData[i];
            idpOption = buildSelectOption(getEntityId(idp), getLocalizedName(idp));
            idpSelect.appendChild(idpOption);
        }

        var form = buildSelectForm();
        form.appendChild(label);
        form.appendChild(idpSelect);

        form.onsubmit = function () {
            //
            // The first entery isn't selectable
            //
            if (idpSelect.selectedIndex < 1) {
                return false;
            }
            //
            // otherwise update the cookie
            //
            selectIdP(idpSelect.options[idpSelect.selectedIndex].value);
            return true;
        };

        var button = buildContinueButton('List');
        listButton = button;
        form.appendChild(button);

        idpListDiv.appendChild(form);

        //
        // The switcher
        //
        var a = document.createElement('a');
        a.appendChild(document.createTextNode(getLocalizedMessage('idpList.showSearch')));
        a.href = '#';
        setClass(a, 'DropDownToggle');
        a.onclick = function() { 
            idpEntryDiv.style.display='';
            idpListDiv.style.display='none';
            return false;
        };
        idpListDiv.appendChild(a);
        buildHelpText(idpListDiv);

        parentDiv.appendChild(idpListDiv);
    };

    /**
       Builds the 'continue' button used to submit the IdP selection.
      
       @return {Element} HTML button used to submit the IdP selection
    */
    var buildContinueButton = function(which) {
        var button  = document.createElement('input');
        button.setAttribute('type', 'submit');
        button.value = getLocalizedMessage('submitButton.label');
        setID(button, which + 'Button');

        return button;
    };

    /**
       Builds an aref to point to the helpURL
    */

    var buildHelpText = function(containerDiv) {
        var aval = document.createElement('a');
        aval.href = helpURL;
        aval.appendChild(document.createTextNode(getLocalizedMessage('helpText')));
        setClass(aval, 'HelpButton');
        containerDiv.appendChild(aval);
    } ;
    
    /**
       Creates a div element whose id attribute is set to the given ID.
      
       @param {String} id ID for the created div element
       @param {String} [class] class of the created div element
       @return {Element} DOM 'div' element with an 'id' attribute
    */
    var buildDiv = function(id, whichClass){
        var div = document.createElement('div');
        if (undefined !== id) {
            setID(div, id);
        }
        if(undefined !== whichClass) {

            setClass(div, whichClass);
        }
        return div;
    };
    
    /**
       Builds an HTML select option element
      
       @param {String} value value of the option when selected
       @param {String} label displayed label of the option
    */
    var buildSelectOption = function(value, text){
        var option = document.createElement('option');
        option.value = value;
        if (text.length > maxIdPCharsDropDown) {
            text = text.substring(0, maxIdPCharsDropDown);
        }
        option.appendChild(document.createTextNode(text));
        return option;
    };
    
    /**
       Sets the attribute 'id' on the provided object
       We do it through this function so we have a single
       point where we can prepend a value
       
       @param (Object) The [DOM] Object we want to set the attribute on
       @param (String) The Id we want to set
    */

    var setID = function(obj, name) {
        obj.id = idPrefix + name;
    };

    var setClass = function(obj, name) {
        obj.setAttribute('class', classPrefix + name);
    };

    /**
       Returns the DOM object with the specified id.  We abstract
       through a function to allow us to prepend to the name
       
       @param (String) the (unprepended) id we want
    */
    var locateElement = function(name) {
        return document.getElementById(idPrefix + name);
    };

    // *************************************
    // Private functions
    //
    // GUI actions.  Note that there is an element of closure going on
    // here since these names are invisible outside this module.
    // 
    //
    // *************************************

    /**
     * Base helper function for when an IdP is selected
     * @param (String) The UN-encoded entityID of the IdP
    */

    var selectIdP = function(idP) {
        updateSelectedIdPs(idP);
        saveUserSelectedIdPs(userSelectedIdPs);
    };

    // *************************************
    // Private functions
    //
    // Localization handling
    //
    // *************************************

    /**
       Gets a localized string from the given language pack.  This
       method uses the {@link langBundles} given during construction
       time.

       @param {String} messageId ID of the message to retrieve

       @return (String) the message
    */
    var getLocalizedMessage = function(messageId){

        var message = langBundle[messageId];
        if(!message){
            message = defaultLangBundle[messageId];
        }
        if(!message){
            message = 'Missing message for ' + messageId;
        }
        
        return message;
    };

    var getEntityId = function(idp) {
        return idp.entityID;
    };

    /**
       Returns the icon information for the provided idp

       @param (Object) an idp.  This should have an array 'names' with sub
        elements 'lang' and 'name'.

       @return (String) The localized name
    */
    var geticon = function(idp) {
        var i;

        if (null == idp.Logos) { 
            return null;
        }
        for (i =0; i < idp.Logos.length; i++) {
	    var logo = idp.Logos[i];

	    if (logo.height == "16" && logo.width == "16") {
		if (null == logo.lang ||
		    lang == logo.lang ||
		    (typeof majorLang != 'undefined' && majorLang == logo.lang) ||
		    defaultLang == logo.lang) {
		    return logo.value;
		}
	    }
	}

	return null;
    } ;

    /**
       Returns the localized name information for the provided idp

       @param (Object) an idp.  This should have an array 'names' with sub
        elements 'lang' and 'name'.

       @return (String) The localized name
    */
    var getLocalizedName = function(idp) {
        var res = getLocalizedEntry(idp.DisplayNames);
        if (null !== res) {
            return res;
        }
        debug('No Name entry in any language for ' + getEntityId(idp));
        return getEntityId(idp);
    } ;

    var getKeywords = function(idp) {
        if (ignoreKeywords || null == idp.Keywords) {
            return null;
        }
        var s = getLocalizedEntry(idp.Keywords);

        return s;
    }
        
    var getLocalizedEntry = function(theArray){
        var i;

        //
        // try by full name
        //
        for (i in theArray) {
            if (theArray[i].lang == lang) {
                return theArray[i].value;
            }
        }
        //
        // then by major language
        //
        if (typeof majorLang != 'undefined') {
            for (i in theArray) {
                if (theArray[i].lang == majorLang) {
                    return theArray[i].value;
                }
            }
        }
        //
        // then by null language in metadata
        //
        for (i in theArray) {
            if (theArray[i].lang == null) {
                return theArray[i].value;
            }
        }
        
        //
        // then by default language
        //
        for (i in theArray) {
            if (theArray[i].lang == defaultLang) {
                return theArray[i].value;
            }
        }

        return null;
    };

    
    // *************************************
    // Private functions
    //
    // Cookie and preferred IdP Handling
    //
    // *************************************

    /**
       Gets the preferred IdPs.  The first elements in the array will
       be the preselected preferred IdPs.  The following elements will
       be those past IdPs selected by a user.  The size of the array
       will be no larger than the maximum number of preferred IdPs.
    */
    var getPreferredIdPs = function() {
        var idps = [];
        var offset = 0;
        var i;
        var j;

        //
        // populate start of array with preselected IdPs
        //
        if(null != preferredIdP){
            for(i=0; i < preferredIdP.length && i < maxPreferredIdPs-1; i++){
                idps[i] = getIdPFor(preferredIdP[i]);
                offset++;
            }
        }
        
        //
        // And then the cookie based ones
        //
        userSelectedIdPs = retrieveUserSelectedIdPs();
        for (i = offset, j=0; i < userSelectedIdPs.length && i < maxPreferredIdPs; i++, j++){
            idps.push(getIdPFor(userSelectedIdPs[j]));
        }
        return idps;
    };

    /**
       Update the userSelectedIdPs list with the new value.

       @param (String) the newly selected IdP
    */
    var updateSelectedIdPs = function(newIdP) {

        //
        // We cannot use split since it does not appear to
        // work as per spec on ie8.
        //
        var newList = [];

        //
        // iterate through the list copying everything but the old
        // name
        //
        while (0 !== userSelectedIdPs.length) {
            var what = userSelectedIdPs.pop();
            if (what != newIdP) {
                newList.unshift(what);
            }
        }

        //
        // And shove it in at the top
        //
        newList.unshift(newIdP);
        userSelectedIdPs = newList;
        return;
    };
    
    /**
       Gets the IdP previously selected by the user.
      
       @return {Array} user selected IdPs identified by their entity ID
    */
    var retrieveUserSelectedIdPs = function(){
        var userSelectedIdPs = [];
        var i, j;
        var cookies;

        cookies = document.cookie.split( ';' );
        for (i = 0; i < cookies.length; i++) {
            //
            // Do not use split('='), '=' is valid in Base64 encoding!
            //
            var cookie = cookies[i];
            var splitPoint = cookie.indexOf( '=' );
            var cookieName = cookie.substring(0, splitPoint);
            var cookieValues = cookie.substring(splitPoint+1);
                                
            if ( '_saml_idp' == cookieName.replace(/^\s+|\s+$/g, '') ) {
                cookieValues = cookieValues.replace(/^\s+|\s+$/g, '');
                cookieValues = cookieValues.replace('+','%20');
                cookieValues = cookieValues.split('%20');
                for(j=cookieValues.length; j > 0; j--){
                    if (0 === cookieValues[j-1].length) {
                        continue;
                    }
                    var dec = base64Decode(decodeURIComponent(cookieValues[j-1]));
                    if (dec.length > 0) {
                        userSelectedIdPs.push(dec);
                    }
                }
            }
        }

        return userSelectedIdPs;
    };
    
    /**
       Saves the IdPs selected by the user.
      
       @param {Array} idps idps selected by the user
    */
    var saveUserSelectedIdPs = function(idps){
        var cookieData = [];
        var length = idps.length;

        if (noWriteCookie) {
            return;
        }

        if (length > 5) {
            length = 5;
        }
        for(var i=length; i > 0; i--){
            if (idps[i-1].length > 0) {
                cookieData.push(encodeURIComponent(base64Encode(idps[i-1])));
            }
        }
        
        var expireDate = null;
        if(samlIdPCookieTTL){
            var now = new Date();
            cookieTTL = samlIdPCookieTTL * 24 * 60 * 60 * 1000;
            expireDate = new Date(now.getTime() + cookieTTL);
        }
        
        document.cookie='_saml_idp' + '=' + cookieData.join('%20') + '; path = /' +
            ((expireDate===null) ? '' : '; expires=' + expireDate.toUTCString());
        
    };
    
    /**
       Base64 encodes the given string.
      
       @param {String} input string to be encoded
      
       @return {String} base64 encoded string
    */
    var base64Encode = function(input) {
        var output = '', c1, c2, c3, e1, e2, e3, e4;

        for ( var i = 0; i < input.length; ) {
            c1 = input.charCodeAt(i++);
            c2 = input.charCodeAt(i++);
            c3 = input.charCodeAt(i++);
            e1 = c1 >> 2;
            e2 = ((c1 & 3) << 4) + (c2 >> 4);
            e3 = ((c2 & 15) << 2) + (c3 >> 6);
            e4 = c3 & 63;
            if (isNaN(c2)){
                e3 = e4 = 64;
            } else if (isNaN(c3)){
                e4 = 64;
            }
            output += base64chars.charAt(e1) +
                base64chars.charAt(e2) +
                base64chars.charAt(e3) + 
                base64chars.charAt(e4);
        }

        return output;
    };
    
    /**
       Base64 decodes the given string.
      
       @param {String} input string to be decoded
      
       @return {String} base64 decoded string
    */
    var base64Decode = function(input) {
        var output = '', chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        // Remove all characters that are not A-Z, a-z, 0-9, +, /, or =
        var base64test = /[^A-Za-z0-9\+\/\=]/g;
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');

        do {
            enc1 = base64chars.indexOf(input.charAt(i++));
            enc2 = base64chars.indexOf(input.charAt(i++));
            enc3 = base64chars.indexOf(input.charAt(i++));
            enc4 = base64chars.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

            chr1 = chr2 = chr3 = '';
            enc1 = enc2 = enc3 = enc4 = '';

        } while (i < input.length);

        return output;
    };

    // *************************************
    // Private functions
    //
    // Error Handling.  we'll keep it separate with a view to eventual
    //                  exbedding into log4js
    //
    // *************************************
    /**
       
    */

    var fatal = function(message) {
        alert('FATAL - DISCO UI:' + message);
        var txt = document.createTextNode(message); 
        idpSelectDiv.appendChild(txt);
    };

    var debug = function() {
        //
        // Nothing
    };
}

(new IdPSelectUI()).draw(new IdPSelectUIParms());
