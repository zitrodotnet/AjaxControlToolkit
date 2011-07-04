// (c) 2010 CodePlex Foundation
/// <reference name='MicrosoftAjax.js' />
/// <reference path='../ExtenderBase/BaseScripts.js' />
/// <reference path='../Common/Common.js' />

(function () {

    var scriptName = 'HtmlEditorExtenderBehavior';

    function execute() {
        Type.registerNamespace('Sys.Extended.UI');

        Sys.Extended.UI.HtmlEditorExtenderBehavior = function (element) {
            /// <summary>
            /// Html Extender behavior which Extends TextBox 
            /// </summmary>
            /// <param name='element' type='Sys.UI.DomElement'>The element to attach to</param>
            Sys.Extended.UI.HtmlEditorExtenderBehavior.initializeBase(this, [element]);
            this._textbox = Sys.Extended.UI.TextBoxWrapper.get_Wrapper(element);

            var id = this.get_id();

            this._ButtonWidth = 23;
            this._ButtonHeight = 21;

            this._containerTemplate = {
                nodeName: 'div',
                properties: {
                    id: id + '_ExtenderContainer'
                },
                cssClasses: ['unselectable', 'ajax__html_editor_extender_container']
            };

            this._editableTemplate = {
                nodeName: 'div',
                properties: {
                    id: id + '_ExtenderContentEditable',
                    style: {
                        width: '100%',
                        height: '80%',
                        overflow: 'auto',
                        clear: 'both'
                    },
                    contentEditable: true
                },
                cssClasses: ['ajax__html_editor_extender_texteditor']
            };

            this._buttonTemplate = {
                nodeName: 'input',
                properties: {
                    type: 'button',
                    style: {
                        width: this._ButtonWidth + 'px',
                        height: this._ButtonHeight + 'px'
                    }
                },
                cssClasses: ['ajax__html_editor_extender_button']
            };

            this._textboxTemplate = {
                nodeName: 'input',
                properties: {
                    type: 'text'                    
                }                
            };

            this._dropDownTemplate = {
                nodeName: 'select',
                properties: {
                    style: {
                        width: this._ButtonWidth + 'px',
                        height: this._ButtonHeight + 'px'
                    }
                },
                cssClasses: ['ajax__html_editor_extender_button']
            };

            this._topButtonContainerTemplate = {
                nodeName: 'div',
                properties: {
                    id: id + '_ExtenderButtonContainer'
                },
                cssClasses: ['ajax__html_editor_extender_buttoncontainer']
            };

            this._container = null;
            this._toolbarButtons = null;
            this._editableDiv = null;
            this._topButtonContainer = null;
            this._buttons = [];
            this._btnClickHandler = null;
            this._requested_buttons = new Array();
            this._colorPicker = null;
            this._txtBoxForColor = null;

            if ((typeof (WebForm_OnSubmit) == 'function') && !Sys.Extended.UI.HtmlEditorExtenderBehavior._originalWebForm_OnSubmit) {
                Sys.Extended.UI.HtmlEditorExtenderBehavior._originalWebForm_OnSubmit = WebForm_OnSubmit;
                WebForm_OnSubmit = Sys.Extended.UI.HtmlEditorExtenderBehavior.WebForm_OnSubmit;
            }
        }

        Sys.Extended.UI.HtmlEditorExtenderBehavior.prototype = {
            initialize: function () {
                Sys.Extended.UI.HtmlEditorExtenderBehavior.callBaseMethod(this, 'initialize');

                var idx = 0;
                this._button_list = new Array();
                this._createContainer();
                this._createTopButtonContainer();
                this._createEditableDiv();
                this._createButton();

                var formElement = this._textbox._element.parentNode;
                while (formElement != null && formElement.nodeName != 'FORM') {
                    formElement = formElement.parentNode;
                }

                if (formElement == null)
                    throw 'Missing Form tag';

                var delTextBox_onblur = Function.createDelegate(this, this._textBox_onblur);
                var delEditableDiv_onblur = Function.createDelegate(this, this._editableDiv_onblur);
                var btnClickHandler = Function.createDelegate(this, this._executeCommand);

                $addHandler(this._textbox._element, 'blur', delTextBox_onblur, true);
                $addHandler(this._editableDiv, 'blur', delEditableDiv_onblur, true);
                $addHandler(this._topButtonContainer, 'click', btnClickHandler);                
            },

            _dispose: function () {
                $removeHandler(this._textbox._element, 'blur', delTextBox_onblur);
                $removeHandler(this._editableDiv, 'blur', delEditableDiv_onblur);
                $removeHandler(_topButtonContainer, 'click', btnClickHandler);

                Sys.Extended.UI.HtmlEditorExtenderBehavior.callBaseMethod(this, 'dispose');
            },

            _createContainer: function () {
                var e = this.get_element();
                this._container = $common.createElementFromTemplate(this._containerTemplate, e.parentNode);

                var bounds = $common.getBounds(this._textbox._element);
                $common.setSize(this._container, {
                    width: bounds.width,
                    height: bounds.height
                });

                $common.wrapElement(this._textbox._element, this._container, this._container);
            },

            _createTopButtonContainer: function () {
                this._topButtonContainer = $common.createElementFromTemplate(this._topButtonContainerTemplate, this._container);
            },

            _createButton: function () {
                for (i = 0; i < this._toolbarButtons.length; i++) {
                    var _btn;
                    if (this._toolbarButtons[i].CommandName == 'FontName') {
                        _btn = $common.createElementFromTemplate({
                            nodeName: "nobr",
                            properties: {
                                style: {
                                    cssFloat: 'left',
                                    fontSize: '11px'
                                }
                            },
                            children : [{
                                nodeName: "span",
                                properties: {
                                    innerText: "Font ",
                                    style: {
                                        paddingLeft: '5px',
                                        fontWeight: 'bold'
                                    }
                                }
                            }]
                        }, this._topButtonContainer);
                        
                        _select = $common.createElementFromTemplate({
                            nodeName: "select",
                            properties: {
                                style: {
                                    fontSize: '11px',
                                    fontFamily: 'Arial',
                                    height: "20px",
                                    width: '115px'
                                }
                            },
                            events: {
                                change : function(e) {                                         
                                        document.execCommand("FontName", false, this.options[this.selectedIndex].value);
                                    }
                            }
                        }, _btn);                                               

                        var option = [
                            { Text: "Arial", Value: "arial,helvetica,sans-serif" },
                            { Text: "Courier New", Value: "courier new,courier,monospace" },
                            { Text: "Georgia", Value: "georgia,times new roman,times,serif"},
                            { Text: "Tahoma", Value: "tahoma,arial,helvetica,sans-serif" },
                            { Text: "Times New Roman", Value: "times new roman,times,serif" },
                            { Text: "Verdana", Value: "verdana,arial,helvetica,sans-serif" },
                            { Text: "Impact", Value: "impact" },
                            { Text: "WingDings", Value: "wingdings" }
                            ];

                        for (x in option)
                        {
                            var elOptNew = document.createElement('option');
                            elOptNew.text = option[x].Text;
                            elOptNew.value = option[x].Value;
                            try {
                              _select.add(elOptNew, null); // standards compliant; doesn't work in IE
                            }
                            catch(ex) {
                              _select.add(elOptNew); // IE only
                            }
                        }
                        
                        _select.setAttribute('id', this._id + this._toolbarButtons[i].CommandName);
                        _select.setAttribute('name', this._toolbarButtons[i].CommandName);
                        _select.setAttribute('title', this._toolbarButtons[i].Tooltip);
                        _select.setAttribute('unselectable', 'on');
                    }   
                    else if (this._toolbarButtons[i].CommandName == 'FontSize') {
                        _btn = $common.createElementFromTemplate({
                            nodeName: "nobr",
                            properties: {
                                style: {
                                    cssFloat: 'left',
                                    fontSize: '11px'
                                }
                            },
                            children : [{
                                nodeName: "span",
                                properties: {
                                    innerText: "Font ",
                                    style: {
                                        paddingLeft: '5px',
                                        fontWeight: 'bold'
                                    }
                                }
                            }]
                        }, this._topButtonContainer);
                        
                        _select = $common.createElementFromTemplate({
                            nodeName: "select",
                            properties: {
                                style: {
                                    fontSize: '11px',
                                    fontFamily: 'Arial',
                                    height: "20px",
                                    width: '50px'
                                }
                            },
                            events: {
                                change : function(e) { 
                                        document.execCommand("FontSize", false, this.options[this.selectedIndex].value);
                                    }
                            }
                        }, _btn);                        

                        var option = [
                            { Text: "1", Value: "1" },
                            { Text: "2", Value: "2" },
                            { Text: "3", Value: "3" },
                            { Text: "4", Value: "4" },
                            { Text: "5", Value: "5" },
                            { Text: "6", Value: "6" },
                            { Text: "7", Value: "7" }                            
                            ];

                        for (x in option)
                        {
                            var elOptNew = document.createElement('option');
                            elOptNew.text = option[x].Text;
                            elOptNew.value = option[x].Value;
                            try {
                              _select.add(elOptNew, null); // standards compliant; doesn't work in IE
                            }
                            catch(ex) {
                              _select.add(elOptNew); // IE only
                            }
                        }
                        
                        _select.setAttribute('id', this._id + this._toolbarButtons[i].CommandName);
                        _select.setAttribute('name', this._toolbarButtons[i].CommandName);
                        _select.setAttribute('title', this._toolbarButtons[i].Tooltip);
                        _select.setAttribute('unselectable', 'on');
                    }                                     
                    else {
                        var map = {
                                Copy: 1,
                                Cut: 1,
                                Paste: 1
                        }
                                                
                        if (Sys.Browser.agent == Sys.Browser.Firefox && map[this._toolbarButtons[i].CommandName]) {
                        }
                        else
                        {
                            _btn = $common.createElementFromTemplate(this._buttonTemplate, this._topButtonContainer);
                            _btn.setAttribute('id', this._id + this._toolbarButtons[i].CommandName);
                            _btn.setAttribute('name', this._toolbarButtons[i].CommandName);
                            _btn.setAttribute('title', this._toolbarButtons[i].Tooltip);
                            _btn.setAttribute('unselectable', 'on');
                            _btn.setAttribute('class', 'ajax__html_editor_extender_button ajax__html_editor_extender_' + this._toolbarButtons[i].CommandName);
                        }
                    }
                    Array.add(this._buttons, _btn);
                }
            },

            _createEditableDiv: function () {
                this._editableDiv = $common.createElementFromTemplate(this._editableTemplate, this._container);
                this._editableDiv.innerHTML = this._textbox._element.value;
                $common.setVisible(this._textbox._element, false);
            },

            _editableDiv_onblur: function () {
                this._textbox._element.value = this.innerHTML;
            },

            _textBox_onblur: function () {
                this._editableDiv.innerHTML = this.value;
            },

            _editableDiv_submit: function () {
                var char = 3;
                var sel = null;
                this._editableDiv.focus();
                if (Sys.Browser.agent != Sys.Browser.Firefox) {
                    if (document.selection) {
                        sel = document.selection.createRange();
                        sel.moveStart('character', char);
                        sel.select();
                    }
                    else {
                        sel = window.getSelection();
                        sel.collapse(this._editableDiv.firstChild, char);
                    }
                }

                var encodedHtml = this._editableDiv.innerHTML.replace(/&/ig, '&amp;').replace(/</ig, '&lt;').replace(/>/ig, '&gt;').replace(/\'/ig, '&quot;').replace(/\xA0/ig, '&nbsp;');
                encodedHtml = encodedHtml.replace(/&lt;STRONG&gt;/ig, '&lt;b&gt;').replace(/&lt;\/STRONG&gt;/ig, '&lt;/b&gt;').replace(/&lt;EM&gt;/ig, '&lt;i&gt;').replace(/&lt;\/EM&gt;/ig, '&lt;/i&gt;');
                this._textbox._element.value = encodedHtml;
            },

            _executeCommand: function (command) {
                var isFireFox = Sys.Browser.agent == Sys.Browser.Firefox;

                if (isFireFox) {
                    document.execCommand('styleWithCSS', false, false);
                }

                var map = {
                    JustifyRight: 1,
                    JustifyLeft: 1,
                    JustifyCenter: 1,
                    JustifyFull: 1
                }

                if (map[command.target.name]) {
                    try {
                        document.execCommand(command.target.name, false, null);
                    }
                    catch (e) {
                        if (e && e.result == 2147500037) {
                            var range = window.getSelection().getRangeAt(0);
                            var dummy = document.createElement('div');

                            var restoreSelection = false;
                            dummy.style.height = '1px;';

                            if (range.startContainer.contentEditable == 'true') {
                                window.getSelection().collapseToEnd();
                                restoreSelection = true;
                            }

                            var ceNode = window.getSelection().getRangeAt(0).startContainer;

                            while (ceNode && ceNode.contentEditable != 'true')
                                ceNode = ceNode.parentNode;

                            if (!ceNode) throw 'Selected node is not editable!';

                            ceNode.insertBefore(dummy, ceNode.childNodes[0]);
                            document.execCommand(command.target.name, false, null);
                            dummy.parentNode.removeChild(dummy);

                            if (restoreSelection) {
                                window.getSelection().addRange(range);
                            }
                        }
                        else if (window.console && window.console.log) {
                            window.console.log(e);
                        }
                    }
                }
                else if (command.target.name == "createLink") {
                    var url = prompt('Please insert  URL', '');
                    if (url) {
                        document.execCommand('createLink', false, url);
                    }
                }                
                else if (command.target.name == 'BackColor' || command.target.name == 'ForeColor') {                    
                    var color = prompt('Please insert  Color', '');
                    if (color) {
                        document.execCommand(command.target.name, false, color);
                    }
                }                
                else {
                    document.execCommand(command.target.name, false, null);
                }

            },

            get_ButtonWidth: function () {
                return this._ButtonWidth;
            },

            set_ButtonWidth: function (value) {
                if (this._ButtonWidth != value) {
                    this._ButtonWidth = value;
                    this.raisePropertyChanged('ButtonWidth');
                }
            },

            get_ButtonHeight: function () {
                return this._ButtonHeight;
            },

            set_ButtonHeight: function (value) {
                if (this._ButtonHeight != value) {
                    this._ButtonHeight = value;
                    this.raisePropertyChanged('ButtonHeight');
                }
            },

            get_ToolbarButtons: function () {
                return this._toolbarButtons;
            },

            set_ToolbarButtons: function (value) {
                if (this._toolbarButtons != value) {
                    this._toolbarButtons = value;
                    this.raisePropertyChanged('ToolbarButtons');
                }
            }

        };

        Sys.Extended.UI.HtmlEditorExtenderBehavior.registerClass('Sys.Extended.UI.HtmlEditorExtenderBehavior', Sys.Extended.UI.BehaviorBase);
        Sys.registerComponent(Sys.Extended.UI.HtmlEditorExtenderBehavior, { name: 'HtmlEditorExtender', parameters: [{ name: 'ToolbarButtons', type: 'HtmlEditorExtenderButton[]'}] });

        Sys.Extended.UI.HtmlEditorExtenderBehavior.WebForm_OnSubmit = function () {
            /// <summary>
            /// Wraps ASP.NET's WebForm_OnSubmit in order to encode tags prior to submission
            /// </summary>
            /// <returns type='Boolean'>
            /// Result of original WebForm_OnSubmit
            /// </returns>
            var result = Sys.Extended.UI.HtmlEditorExtenderBehavior._originalWebForm_OnSubmit();
            if (result) {
                var components = Sys.Application.getComponents();
                for (var i = 0; i < components.length; i++) {
                    var component = components[i];
                    if (Sys.Extended.UI.HtmlEditorExtenderBehavior.isInstanceOfType(component)) {
                        component._editableDiv_submit();
                    }
                }
            }
            return result;
        }

    } // execute

    if (window.Sys && Sys.loader) {
        Sys.loader.registerScript(scriptName, ['ExtendedBase', 'ExtendedCommon'], execute);

    }
    else {
        execute();
    }

})();    