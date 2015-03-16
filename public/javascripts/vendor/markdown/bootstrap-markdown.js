/* ===================================================
 * bootstrap-markdown.js v2.8.0
 * http://github.com/toopay/bootstrap-markdown
 * ===================================================
 * Copyright 2013-2014 Taufan Aditya
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */

!function ($) {

    "use strict"; // jshint ;_;

    /* MARKDOWN CLASS DEFINITION
     * ========================== */

    var Markdown = function (element, options) {
        // @TODO : remove this BC on next major release
        // @see : https://github.com/toopay/bootstrap-markdown/issues/109
        var opts = ['autofocus', 'savable', 'hideable', 'width',
            'height', 'resize', 'iconlibrary', 'language', 'imgurl', 'base64url',
            'footer', 'fullscreen', 'hiddenButtons', 'disabledButtons'];
        $.each(opts, function (_, opt) {
            if (typeof $(element).data(opt) !== 'undefined') {
                options = typeof options == 'object' ? options : {};
                options[opt] = $(element).data(opt)
            }
        });
        // End BC

        // Class Properties
        this.$ns = 'bootstrap-markdown';
        this.$element = $(element);
        this.$editable = {el: null, type: null, attrKeys: [], attrValues: [], content: null};
        this.$options = $.extend(true, {}, $.fn.markdown.defaults, options, this.$element.data('options'));
        this.$oldContent = null;
        this.$isPreview = false;
        this.$isFullscreen = false;
        this.$editor = null;
        //add by wpl show markdown preview
        this.$uploadMode = false;
        this.$fullPreview = null;
        this.$innerPreview = null;
        this.$uploadPanel = null;
        this.$inputFile = null;
        this.$stateBar = null;
        this.$cutPaste = null;
        //上传进度条
        this.$progress = null;
        this.$percent = null;
        //上传文件限制512kb
        this.$fileSize = 524288;
        //end
        this.$textarea = null;
        this.$handler = [];
        this.$callback = [];
        this.$nextTab = [];

        this.showEditor();
    };

    Markdown.prototype = {

        constructor: Markdown

        , __alterButtons: function (name, alter) {
            var handler = this.$handler, isAll = (name == 'all'), that = this;

            $.each(handler, function (k, v) {
                var halt = true;
                if (isAll) {
                    halt = false;
                } else {
                    halt = v.indexOf(name) < 0;
                }

                if (halt === false) {
                    alter(that.$editor.find('button[data-handler="' + v + '"]'));
                }
            });
        }

        , __buildButtons: function (buttonsArray, container) {
            var i,
                ns = this.$ns,
                handler = this.$handler,
                callback = this.$callback;

            for (i = 0; i < buttonsArray.length; i++) {
                // Build each group container
                var y, btnGroups = buttonsArray[i];
                for (y = 0; y < btnGroups.length; y++) {
                    // Build each button group
                    var z,
                        buttons = btnGroups[y].data,
                        btnGroupContainer = $('<div/>', {
                            'class': 'btn-group'
                        });

                    for (z = 0; z < buttons.length; z++) {
                        var button = buttons[z],
                            buttonContainer, buttonIconContainer,
                            buttonHandler = ns + '-' + button.name,
                            buttonIcon = this.__getIcon(button.icon),
                            btnText = button.btnText ? button.btnText : '',
                            btnClass = button.btnClass ? button.btnClass : 'btn',
                            tabIndex = button.tabIndex ? button.tabIndex : '-1',
                            hotkey = typeof button.hotkey !== 'undefined' ? button.hotkey : '',
                            hotkeyCaption = typeof jQuery.hotkeys !== 'undefined' && hotkey !== '' ? ' (' + hotkey + ')' : '';

                        // Construct the button object
                        buttonContainer = $('<button></button>');
                        buttonContainer.text(' ' + this.__localize(btnText)).addClass('btn-default btn-sm').addClass(btnClass);
                        if (btnClass.match(/btn\-(primary|success|info|warning|danger|link)/)) {
                            buttonContainer.removeClass('btn-default');
                        }
                        buttonContainer.attr({
                            'type': 'button',
                            'title': this.__localize(button.title) + hotkeyCaption,
                            'tabindex': tabIndex,
                            'data-provider': ns,
                            'data-handler': buttonHandler,
                            'data-hotkey': hotkey
                        });
                        if (button.toggle === true) {
                            buttonContainer.attr('data-toggle', 'button');
                        }
                        buttonIconContainer = $('<span/>');
                        buttonIconContainer.addClass(buttonIcon);
                        buttonIconContainer.prependTo(buttonContainer);

                        // Attach the button object
                        btnGroupContainer.append(buttonContainer);

                        // Register handler and callback
                        handler.push(buttonHandler);
                        callback.push(button.callback);
                    }

                    // Attach the button group into container dom
                    container.append(btnGroupContainer);
                }
            }

            return container;
        }
        , __setListener: function () {
            // Set size and resizable Properties
            var hasRows = typeof this.$textarea.attr('rows') !== 'undefined',
                maxRows = this.$textarea.val().split("\n").length > 5 ? this.$textarea.val().split("\n").length : '5',
                rowsVal = hasRows ? this.$textarea.attr('rows') : maxRows;

            this.$textarea.attr('rows', rowsVal);
            if (this.$options.resize) {
                this.$textarea.css('resize', this.$options.resize);
            }

            this.$textarea
                .on('focus', $.proxy(this.focus, this))
                .on('keypress', $.proxy(this.keypress, this))
                .on('keyup', $.proxy(this.keyup, this))
                .on('change', $.proxy(this.change, this));

            if (this.eventSupported('keydown')) {
                this.$textarea.on('keydown', $.proxy(this.keydown, this));
            }

            // Re-attach markdown data
            this.$textarea.data('markdown', this);
        }

        , __handle: function (e) {
            var target = $(e.currentTarget),
                handler = this.$handler,
                callback = this.$callback,
                handlerName = target.attr('data-handler'),
                callbackIndex = handler.indexOf(handlerName),
                callbackHandler = callback[callbackIndex];

            // Trigger the focusin
            $(e.currentTarget).focus();

            callbackHandler(this);

            // Trigger onChange for each button handle
            this.change(this);

            // Unless it was the save handler,
            // focusin the textarea
            if (handlerName.indexOf('cmdSave') < 0) {
                this.$textarea.focus();
            }

            e.preventDefault();
        }

        , __localize: function (string) {
            var messages = $.fn.markdown.messages,
                language = this.$options.language;
            if (
                typeof messages !== 'undefined' &&
                typeof messages[language] !== 'undefined' &&
                typeof messages[language][string] !== 'undefined'
            ) {
                return messages[language][string];
            }
            return string;
        }

        , __getIcon: function (src) {
            return typeof src == 'object' ? src[this.$options.iconlibrary] : src;
        }

        , setFullscreen: function (mode) {
            var $editor = this.$editor,
                $textarea = this.$textarea,
                $innerPreview = this.$innerPreview,
            //小预览窗口
                preview = $('div[data-provider="markdown-preview"]'),
            //预览按钮
                previewButton = $('button[data-handler="bootstrap-markdown-cmdPreview"]');
            if (mode) {
                $editor.addClass('md-fullscreen-mode');
                $('body').addClass('md-nooverflow');
                this.$options.onFullscreen(this);

                $innerPreview.html(marked($textarea.val()));
                $textarea.keyup(function (evt) {
                    $innerPreview.html(marked($textarea.val()));
                });
                //up by wpl
                if (preview) {
                    preview.remove();
                }
                if (previewButton) {
                    previewButton.hide();
                }
            } else {
                $editor.removeClass('md-fullscreen-mode');
                $('body').removeClass('md-nooverflow');
                //up by wpl
                if (previewButton) {
                    previewButton.show();
                }
                if (this.$isPreview) {
                    this.showPreview();
                }
            }

            this.$isFullscreen = mode;
            $textarea.focus();
        }, showEditor: function () {

            var instance = this,
                textarea,
                ns = this.$ns,
                container = this.$element,
                originalHeigth = container.css('height'),
                originalWidth = container.css('width'),
                editable = this.$editable,
                handler = this.$handler,
                callback = this.$callback,
                options = this.$options,
                _fullPreview = this.$fullPreview,
                innerPreview = this.$fullPreview,
                cutPaste = this.$cutPaste,
                editor = $('<div/>', {
                    'class': 'md-editor',
                    click: function () {
                        instance.focus();
                    }
                });

            // Prepare the editor
            if (this.$editor === null) {
                // Create the panel
                var editorHeader = $('<div/>', {
                    'class': 'md-header btn-toolbar'
                });

                // Merge the main & additional button groups together
                var allBtnGroups = [];
                if (options.buttons.length > 0) allBtnGroups = allBtnGroups.concat(options.buttons[0]);
                if (options.additionalButtons.length > 0) allBtnGroups = allBtnGroups.concat(options.additionalButtons[0]);

                // Reduce and/or reorder the button groups
                if (options.reorderButtonGroups.length > 0) {
                    allBtnGroups = allBtnGroups
                        .filter(function (btnGroup) {
                            return options.reorderButtonGroups.indexOf(btnGroup.name) > -1;
                        })
                        .sort(function (a, b) {
                            if (options.reorderButtonGroups.indexOf(a.name) < options.reorderButtonGroups.indexOf(b.name)) return -1;
                            if (options.reorderButtonGroups.indexOf(a.name) > options.reorderButtonGroups.indexOf(b.name)) return 1;
                            return 0;
                        });
                }

                // Build the buttons
                if (allBtnGroups.length > 0) {
                    editorHeader = this.__buildButtons([allBtnGroups], editorHeader);
                }

                if (options.fullscreen.enable) {
                    editorHeader.append('<div class="md-controls"><a class="md-control md-control-fullscreen" href="#"><span class="' + this.__getIcon(options.fullscreen.icons.fullscreenOn) + '"></span></a></div>').on('click', '.md-control-fullscreen', function (e) {
                        e.preventDefault();
                        instance.setFullscreen(true);
                    });
                }

                editor.append(editorHeader);
                var _localCache = '';
                if (window.localStorage) {
                    _localCache = localStorage.getItem('text');
                }
                // Wrap the textarea
                if (container.is('textarea')) {
                    container.before(editor);
                    textarea = container;
                    textarea.addClass('md-input');
                    textarea.val(_localCache);
                    editor.append(textarea);
                } else {
                    var rawContent = (typeof toMarkdown == 'function') ? toMarkdown(container.html()) : container.html(),
                        currentContent = $.trim(rawContent);
                    // This is some arbitrary content that could be edited
                    textarea = $('<textarea/>', {
                        'class': 'md-input',
                        'val': currentContent,
                        'text': _localCache
                    });

                    editor.append(textarea);

                    // Save the editable
                    editable.el = container;
                    editable.type = container.prop('tagName').toLowerCase();
                    editable.content = container.html();

                    $(container[0].attributes).each(function () {
                        editable.attrKeys.push(this.nodeName);
                        editable.attrValues.push(this.nodeValue);
                    });

                    // Set editor to blocked the original container
                    container.replaceWith(editor);
                }

                //add by wpl
                if (options.fullscreen.enable && _fullPreview === null) {
                    _fullPreview = $('<div/>', {
                        'class': 'md-full-preview'
                    });
                    var previewBody = $('<div/>', {
                        'class': 'md-full-preview-body'
                    });

                    innerPreview = $('<div/>', {
                        'class': 'md-full-preview-inner'
                    });
                    previewBody.append(innerPreview);
                    _fullPreview.append(previewBody);
                    var leftTool = $('<div/>', {
                        'class': 'md-full-preview-tool'
                    });
                    _fullPreview.append(leftTool);
                    editor.append(_fullPreview);

                    this.$innerPreview = innerPreview;
                    this.$fullPreview = _fullPreview;
                }

                var editorFooter = $('<div/>', {
                        'class': 'md-footer'
                    }),
                    createFooter = false,
                    footer = '';
                // Create the footer if savable
                if (options.savable) {
                    createFooter = true;
                    var saveHandler = 'cmdSave';

                    // Register handler and callback
                    handler.push(saveHandler);
                    callback.push(options.onSave);

                    editorFooter.append('<button class="btn btn-success" data-provider="'
                    + ns
                    + '" data-handler="'
                    + saveHandler
                    + '"><i class="icon icon-white icon-ok"></i> '
                    + this.__localize('Save')
                    + '</button>');
                }

                if (null === cutPaste) {
                    cutPaste = $('<div/>', {
                        class: 'md-cut-paste',
                        contenteditable: true
                    });

                    editor.append(cutPaste);
                }

                footer = typeof options.footer === 'function' ? options.footer(this) : options.footer;

                if ($.trim(footer) !== '') {
                    createFooter = true;
                    editorFooter.append(footer);
                }

                if (createFooter) editor.append(editorFooter);

                // Set width
                if (options.width && options.width !== 'inherit') {
                    if (jQuery.isNumeric(options.width)) {
                        editor.css('display', 'table');
                        textarea.css('width', options.width + 'px');
                    } else {
                        editor.addClass(options.width);
                    }
                }

                // Set height
                if (options.height && options.height !== 'inherit') {
                    if (jQuery.isNumeric(options.height)) {
                        var height = options.height;
                        if (editorHeader) height = Math.max(0, height - editorHeader.outerHeight());
                        if (editorFooter) height = Math.max(0, height - editorFooter.outerHeight());
                        textarea.css('height', height + 'px');
                    } else {
                        editor.addClass(options.height);
                    }
                }

                // Reference
                this.$editor = editor;
                this.$textarea = textarea;
                this.$editable = editable;
                this.$cutPaste = cutPaste;
                this.$oldContent = this.getContent();

                this.__setListener();

                // Set editor attributes, data short-hand API and listener
                this.$editor.attr('id', (new Date()).getTime());
                this.$editor.on('click', '[data-provider="bootstrap-markdown"]', $.proxy(this.__handle, this));

                if (this.$element.is(':disabled') || this.$element.is('[readonly]')) {
                    this.$editor.addClass('md-editor-disabled');
                    this.disableButtons('all');
                }

                if (this.eventSupported('keydown') && typeof jQuery.hotkeys === 'object') {
                    editorHeader.find('[data-provider="bootstrap-markdown"]').each(function () {
                        var $button = $(this),
                            hotkey = $button.attr('data-hotkey');
                        if (hotkey.toLowerCase() !== '') {
                            textarea.bind('keydown', hotkey, function () {
                                $button.trigger('click');
                                return false;
                            });
                        }
                    });
                }

                if (options.initialstate === 'preview') {
                    this.showPreview();
                } else if (options.initialstate === 'fullscreen' && options.fullscreen.enable) {
                    this.setFullscreen(true);
                }

            } else {
                this.$editor.show();
            }

            if (options.autofocus) {
                this.$textarea.focus();
                this.$editor.addClass('active');
            }

            if (options.fullscreen.enable && options.fullscreen !== false) {
                this.$editor.append('\
          <div class="md-fullscreen-controls">\
            <a href="#" class="exit-fullscreen" title="Exit fullscreen"><span class="' + this.__getIcon(options.fullscreen.icons.fullscreenOff) + '"></span></a>\
          </div>');

                this.$editor.on('click', '.exit-fullscreen', function (e) {
                    e.preventDefault();
                    instance.setFullscreen(false);
                });
            }

            // hide hidden buttons from options
            this.hideButtons(options.hiddenButtons);

            // disable disabled buttons from options
            this.disableButtons(options.disabledButtons);

            // Trigger the onShow hook
            options.onShow(this);

            this.registPaste();
            this.localCache();

            return this;
        }

        , parseContent: function (val) {
            var content;

            // parse with supported markdown parser
            var val = val || this.$textarea.val();
            if (typeof markdown == 'object') {
                content = markdown.toHTML(val);
            } else if (typeof marked == 'function') {
                content = marked(val);
            } else {
                content = val;
            }

            return content;
        }
        , showUpload: function (e) {
            var _this = this,
                uploadPanel = this.$uploadPanel,
                editor = this.$editor,
            //upload panel
                mdUpload = null,
                mdDialog = null,
                mdContent = null,
                mdContentHeader = null,
                mdContentBody = null,
                mdContentFooter = null,
                inputGroup = null,
                localUpload = null,
                localUploadField = null,
                urlInput = null,
                stateBar = null,
                cancleButton = null,
                okButton = null,
                progressBar = null,
                progress = null,
                percent = null;
            if (this.$editor !== null && uploadPanel == null) {
                mdUpload = $('<div />', {
                    'class': 'md-upload',
                    'data-provide': 'markdown-upload'
                }).on('click', function (evt) {
                    if ($(evt.target).is('div.md-upload'))
                        _this.hideUpload();
                });

                mdDialog = $('<div/>', {
                    'class': 'md-dialog',
                    'data-provide': 'markdown-upload-dialog'
                });

                mdContent = $('<div/>', {
                    'class': 'md-content',
                    'data-provide': 'markdown-upload-content'
                });


                mdContentHeader = $('<div/>', {
                    'class': 'md-content-header',
                    'data-provide': 'markdown-upload-content-header'
                }).append($('<i/>', {
                    type: 'button',
                    class: 'md-content-header-button glyphicon glyphicon-remove'
                })).on('click', function (evt) {
                    if ($(evt.target).is('i.md-content-header-button'))
                        _this.hideUpload();
                }).append($('<h2/>', {
                    class: 'md-content-header-title',
                    text: e.__localize('Image')
                }));

                mdContentBody = $('<div/>', {
                    'class': 'md-content-body',
                    'data-provide': 'markdown-upload-content-body'
                }).append($('<div/>', {
                    class: 'md-content-body-danger',
                    text: e.__localize('ImageTip')
                })).append($('<p/>', {
                    text: e.__localize('ImageInputTip')
                }));

                inputGroup = $('<div/>', {
                    class: 'md-content-body-input-group'
                });

                localUpload = $('<span />', {
                    class: 'md-input-group-addon glyphicon glyphicon-picture'
                });
                localUploadField = $('<input>', {
                    type: 'file',
                    class: 'md-input-insert-image',
                    formenctype: 'multipart/form-data'
                });
                localUploadField.change(function () {
                    _this.fileUpload();
                });

                localUpload.on('click', function (evt) {
                    if (typeof FormData === "undefined") {
                        stateBar.html(e.__localize('BrowerSupportTip'));
                        return;
                    }
                    localUploadField.trigger('click');
                    return false;
                });

                urlInput = $('<input>', {
                    type: 'text',
                    class: 'md-input-image-url',
                    placeholder: 'http://example.com/image.jpg'
                });

                progressBar = $('<div/>', {class: 'md-progress-bar'});
                progress = $('<progress/>', {max: 100, value: 0});
                percent = $('<span/>', {
                    text: _this.__localize('Progress') + '0%'
                });

                progressBar.append(percent).append(progress);

                inputGroup.append(localUpload).append(localUploadField).append(urlInput);

                mdContentBody.append(inputGroup).append(progressBar);

                mdContentFooter = $('<div/>', {
                    'class': 'md-content-footer',
                    'data-provide': 'markdown-upload-content-footer'
                });

                stateBar = $('<span/>', {class: 'md-state-bar'});

                cancleButton = $('<button/>', {
                    class: 'btn btn-default',
                    text: e.__localize('Cancle')
                });

                cancleButton.bind('click', function () {
                    _this.hideUpload();
                });

                okButton = $('<button/>', {
                    class: 'btn btn-primary',
                    text: e.__localize('Insert')
                });

                okButton.bind('click', function () {
                    var link = urlInput.val();
                    if(null === link || '' === link){
                        _this.setState(_this.__localize('ImageInputTip'));
                        return false;
                    }
                    _this.setImageLink(link);
                    _this.setPercent(_this.__localize('Progress') + '0%');
                    if(_this.$isFullscreen){
                        _this.$innerPreview.html(marked(_this.$textarea.val()));
                    }
                    return false;
                });

                mdContentFooter.append(stateBar).append(cancleButton).append(okButton);

                mdContent.append(mdContentHeader).append(mdContentBody).append(mdContentFooter);

                mdDialog.append(mdContent);

                editor.append(mdUpload.append(mdDialog));

                this.$uploadPanel = mdUpload;
                this.$inputFile = localUploadField;
                this.$progress = progress;
                this.$percent = percent;
                this.$stateBar = stateBar;
                return;
            }

            uploadPanel.show();
        },
        setPercent: function (progress) {
            if (this.$percent) {
                this.$percent.html(e.__localize('Progress') + progress + '%');
            }
        },
        setState: function (text) {
            var _this = this;
            if (_this.$stateBar) {
                _this.$stateBar.html(text);
                setTimeout(function () {
                    _this.$stateBar.html('');
                }, 3000);
            }
        },
        fileUpload: function () {
            //ajax上传文件
            var _this = this,
                imgUrl = this.$options.imgurl,
                xhr = null,
                progress = this.$progress,
                file = null,
                maxFileSize = this.$fileSize,
                uploadImgURL = "",
                uploadPanel = this.$uploadPanel,
                inputFile = this.$inputFile,
                _fileSize = 0,
                _fileName = '',
                _suffixReg = /^.*\.(?:jpg|png|gif)$/,
                formData = new FormData();
            if (null === imgUrl || '' === imgUrl) {
                _this.setState(e.__localize('UploadPathTip'));
                return;
            }
            if (inputFile.files && inputFile.files.length > 0) {
                formData.append('img', inputFile.files[0]);
                file = inputFile.files[0];
                _fileSize = file.size();
                _fileName = file.name.toLowerCase();

                if (!_fileName.match(_suffixReg)) {
                    _this.setState(e.__localize('SupportTypeTip'));
                    return;
                }

                if (_fileSize > maxFileSize) {
                    _this.setState(e.__localize('FileSizeTip'));
                    return;
                }

                xhr = new XMLHttpRequest();
                xhr.upload.onprogress = function (evt) {
                    _this.setPercent(Math.round(evt.loaded * 100 / evt.total));
                    progress.max = evt.total;
                    progress.value = evt.loaded;
                };

                xhr.upload.onload = function () {
                    setTimeout(function () {
                        _this.setPercent(0);
                        progress.max = 100;
                        progress.value = 0;
                    }, 1000);
                };

                xhr.upload.onerror = function () {
                    _this.setPercent(0);
                    progress.max = 100;
                    progress.value = 0;

                    uploadPanel.find('input.md-input-insert-image').val('');
                    uploadPanel.find('input.md-input-image-url').val('');

                    _this.setState(e.__localize('UploadEooroTip'));
                };

                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        uploadImgURL = xhr.responseText;
                        if ('' !== uploadImgURL) {
                            _this.setImageLink(uploadImgURL);
                        }
                    }
                };

                xhr.open('POST', imgUrl, true);
                xhr.setRequestHeader("Cache-Control", "no-cache");
                xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                xhr.send(formData);
            }
        }
        , xhrImageUpload: function (base64) {
            var _this = this,
                base64Url = this.$options.base64url;
            if (null === base64Url || '' === base64Url)
                return;
            if (base64.indexOf("data:image/png;base64") !== -1) {
                var imageFormData = new FormData();
                imageFormData.append("base64Date", base64);
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        var link = xhr.responseText;
                        if ('' !== link) {
                            _this.setImageLink(link);
                        }
                    }
                };
                xhr.upload.onerror = function () {
                    alert(_this.__localize('ImagePasteField'));
                };
                xhr.open("POST", base64Url, true);
                xhr.setRequestHeader("Cache-Control", "no-cache");
                xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                xhr.send(imageFormData);
            }
        }
        , setImageLink: function (link) {
            // Give ![] surround the selection and prepend the image link
            var chunk, cursor, instance = this, selected = instance.getSelection(), content = instance.getContent(), _link = link;

            if (selected.length === 0) {
                // Give extra word
                chunk = instance.__localize('enter image description here');
            } else {
                chunk = selected.text;
            }

            //link = prompt(e.__localize('Insert Image Hyperlink'), 'http://');

            if (_link !== null && _link !== '' && _link !== 'http://' && (_link.substr(0, 4) === 'http' || _link.substr(0, 21) === 'data:image/png;base64')) {
                var sanitizedLink = $('<div>' + _link + '</div>').text();

                // transform selection and set the cursor into chunked text
                instance.replaceSelection('![' + chunk + '](' + sanitizedLink + ' "' + instance.__localize('enter image title here') + '")');
                cursor = selected.start + 2;

                // Set the next tab
                instance.setNextTab(instance.__localize('enter image title here'));

                // Set the cursor
                instance.setSelection(cursor, cursor + chunk.length);

                this.hideUpload();
            } else {

            }
        }
        , hideUpload: function () {
            var uploadPanel = this.$uploadPanel,
                textarea = this.$textarea;
            if (null !== uploadPanel) {
                textarea.focus();
                uploadPanel.find('input.md-input-insert-image').val('');
                uploadPanel.find('input.md-input-image-url').val('');
                uploadPanel.hide();
                this.$uploadMode = false;
            }
        }
        , localCache: function () {
            var textarea = this.$textarea;
            if (window.localStorage) {
                setInterval(function () {
                    localStorage.setItem('text', textarea.val());
                }, 1000);
            }
        }
        , registPaste: function () {
            var _this = this,
                cutPaste = this.$cutPaste,
                textarea = this.$textarea,
                editor = this.$editor,
                browser = navigator.userAgent.toLowerCase();
            if (null === cutPaste)
                return;

            var firefox = false,
                chrome = false,
                trident = false;

            if (/firefox/i.test(browser)) {
                editor.keypress(function (event) {
                    _this.pasteFunc(event, firefox)
                });
            } else if (/chrome/i.test(browser) && /webkit/i.test(browser) && /mozilla/i.test(browser)) {
                chrome = true;
                editor.on('paste', function (event) {
                    _this.pasteFunc(event, chrome)
                });
            } else if (/trident/i.test(browser)) {
                editor.keydown(function (event) {
                    _this.pasteFunc(event, trident)
                });
            }

        }
        , pasteFunc: function (event, chrome) {
            var _this = this,
                cutPaste = this.$cutPaste,
                textarea = this.$textarea,
                uploadMode = this.$uploadMode;

            if (!chrome) {
                //防止一个粘贴BUG
                if (uploadMode)
                    return;
            }
            if (!chrome && (event.ctrlKey || event.metaKey) && (event.keyCode === 86 || event.key === 'v')) {
                cutPaste.focus();
                setTimeout(function () {
                    var imgs = cutPaste.find('img'), img = null, base64 = null;
                    textarea.focus();
                    if (imgs && imgs.length > 0) {
                        img = imgs[0];
                        base64 = img.src;
                        if (base64 && '' !== base64) {
                            _this.xhrImageUpload(base64);
                        }
                        imgs.remove();
                    }
                    var text = '';
                    if (window.clipboardData) {
                        text = window.clipboardData.getData('Text');
                    } else {
                        text = cutPaste.html();
                        text = text.replace(/<br\s*\/?>|<br\s*?>/ig, "\n")
                            .replace(/<\/?[^>]*>/g, "")
                            .replace(/[ | ]*\n/g, "\n")
                            .replace(/&nbsp;/g, " ")
                            .replace(/&lt;/g, "<")
                            .replace(/&gt;/g, ">")
                            .replace(/&amp;/g, "&");
                    }
                    if (text) {
                        var selection = _this.getSelection().start;
                        _this.replaceSelection(text);
                        _this.setSelection(selection + text.length, selection + text.length);
                    }
                    cutPaste.empty();
                }, 10);
            } else if (chrome) {
                var clipboardData, items, item, _i = 0, _length, _ref;
                if (((_ref = event.originalEvent) !== null ? _ref.clipboardData : void 0) !== null) {
                    clipboardData = event.originalEvent.clipboardData;
                    if (items = clipboardData.items) {
                        _length = items.length;
                        for (; _i < _length; ++_i) {
                            item = items[_i];
                            if (item && item.type.match(/^image\//)) {
                                var blob = item.getAsFile(), reader = new FileReader(), base64 = null;
                                reader.onload = function (evt) {
                                    base64 = evt.target.result;
                                    if (base64 && '' !== base64) {
                                        _this.xhrImageUpload(base64);
                                    }
                                };
                                reader.readAsDataURL(blob);
                            }
                        }
                    }
                }
            }
        }
        , showPreview: function () {
            var options = this.$options,
                container = this.$textarea,
                afterContainer = container.next(),
                replacementContainer = $('<div/>', {'class': 'md-preview', 'data-provider': 'markdown-preview'}),
                content,
                callbackContent;

            // Give flag that tell the editor enter preview mode
            this.$isPreview = true;
            // Disable all buttons
            this.disableButtons('all').enableButtons('cmdPreview');

            // Try to get the content from callback
            callbackContent = options.onPreview(this);
            // Set the content based from the callback content if string otherwise parse value from textarea
            content = typeof callbackContent == 'string' ? callbackContent : this.parseContent();

            // Build preview element
            replacementContainer.html(content);

            if (afterContainer && afterContainer.attr('class') == 'md-footer') {
                // If there is footer element, insert the preview container before it
                replacementContainer.insertBefore(afterContainer);
            } else {
                // Otherwise, just append it after textarea
                container.parent().append(replacementContainer);
            }

            // Set the preview element dimensions
            replacementContainer.css({
                //width: container.outerWidth() + 'px',
                width: '100%',
                height: container.outerHeight() + 'px'
            });

            if (this.$options.resize) {
                replacementContainer.css('resize', this.$options.resize);
            }

            // Hide the last-active textarea
            container.hide();

            // Attach the editor instances
            replacementContainer.data('markdown', this);

            if (this.$element.is(':disabled') || this.$element.is('[readonly]')) {
                this.$editor.addClass('md-editor-disabled');
                this.disableButtons('all');
            }
            return this;
        }

        , hidePreview: function () {
            // Give flag that tell the editor quit preview mode
            this.$isPreview = false;

            // Obtain the preview container
            var container = this.$editor.find('div[data-provider="markdown-preview"]');

            // Remove the preview container
            container.remove();

            // Enable all buttons
            this.enableButtons('all');
            // Disable configured disabled buttons
            this.disableButtons(this.$options.disabledButtons);

            // Back to the editor
            this.$textarea.show();
            this.__setListener();

            return this;
        }

        , isDirty: function () {
            return this.$oldContent != this.getContent();
        }

        , getContent: function () {
            return this.$textarea.val();
        }

        , setContent: function (content) {
            this.$textarea.val(content);

            return this;
        }

        , findSelection: function (chunk) {
            var content = this.getContent(), startChunkPosition;

            if (startChunkPosition = content.indexOf(chunk), startChunkPosition >= 0 && chunk.length > 0) {
                var oldSelection = this.getSelection(), selection;

                this.setSelection(startChunkPosition, startChunkPosition + chunk.length);
                selection = this.getSelection();

                this.setSelection(oldSelection.start, oldSelection.end);

                return selection;
            } else {
                return null;
            }
        }
        , getSelection: function () {

            var e = this.$textarea[0];

            return (

            ('selectionStart' in e && function () {
                var l = e.selectionEnd - e.selectionStart;
                return {
                    start: e.selectionStart,
                    end: e.selectionEnd,
                    length: l,
                    text: e.value.substr(e.selectionStart, l)
                };
            }) ||

                /* browser not supported */
            function () {
                return null;
            }

            )();

        }

        , setSelection: function (start, end) {

            var e = this.$textarea[0];

            return (

            ('selectionStart' in e && function () {
                e.selectionStart = start;
                e.selectionEnd = end;
                return;
            }) ||

                /* browser not supported */
            function () {
                return null;
            }

            )();

        }

        , replaceSelection: function (text) {

            var e = this.$textarea[0];

            return (

            ('selectionStart' in e && function () {
                e.value = e.value.substr(0, e.selectionStart) + text + e.value.substr(e.selectionEnd, e.value.length);
                // Set cursor to the last replacement end
                e.selectionStart = e.value.length;
                return this;
            }) ||

                /* browser not supported */
            function () {
                e.value += text;
                return jQuery(e);
            }

            )();
        }

        , getNextTab: function () {
            // Shift the nextTab
            if (this.$nextTab.length === 0) {
                return null;
            } else {
                var nextTab, tab = this.$nextTab.shift();

                if (typeof tab == 'function') {
                    nextTab = tab();
                } else if (typeof tab == 'object' && tab.length > 0) {
                    nextTab = tab;
                }

                return nextTab;
            }
        }

        , setNextTab: function (start, end) {
            // Push new selection into nextTab collections
            if (typeof start == 'string') {
                var that = this;
                this.$nextTab.push(function () {
                    return that.findSelection(start);
                });
            } else if (typeof start == 'number' && typeof end == 'number') {
                var oldSelection = this.getSelection();

                this.setSelection(start, end);
                this.$nextTab.push(this.getSelection());

                this.setSelection(oldSelection.start, oldSelection.end);
            }

            return;
        }

        , __parseButtonNameParam: function (nameParam) {
            var buttons = [];

            if (typeof nameParam == 'string') {
                buttons = nameParam.split(',')
            } else {
                buttons = nameParam;
            }

            return buttons;
        }

        , enableButtons: function (name) {
            var buttons = this.__parseButtonNameParam(name),
                that = this;

            $.each(buttons, function (i, v) {
                that.__alterButtons(buttons[i], function (el) {
                    el.removeAttr('disabled');
                });
            });

            return this;
        }

        , disableButtons: function (name) {
            var buttons = this.__parseButtonNameParam(name),
                that = this;

            $.each(buttons, function (i, v) {
                that.__alterButtons(buttons[i], function (el) {
                    el.attr('disabled', 'disabled');
                });
            });

            return this;
        }

        , hideButtons: function (name) {
            var buttons = this.__parseButtonNameParam(name),
                that = this;

            $.each(buttons, function (i, v) {
                that.__alterButtons(buttons[i], function (el) {
                    el.addClass('hidden');
                });
            });

            return this;
        }

        , showButtons: function (name) {
            var buttons = this.__parseButtonNameParam(name),
                that = this;

            $.each(buttons, function (i, v) {
                that.__alterButtons(buttons[i], function (el) {
                    el.removeClass('hidden');
                });
            });

            return this;
        }

        , eventSupported: function (eventName) {
            var isSupported = eventName in this.$element;
            if (!isSupported) {
                this.$element.setAttribute(eventName, 'return;');
                isSupported = typeof this.$element[eventName] === 'function';
            }
            return isSupported;
        }

        , keyup: function (e) {
            var blocked = false;
            switch (e.keyCode) {
                case 40: // down arrow
                case 38: // up arrow
                case 16: // shift
                case 17: // ctrl
                case 18: // alt
                    break;

                case 9: // tab
                    var nextTab;
                    if (nextTab = this.getNextTab(), nextTab !== null) {
                        // Get the nextTab if exists
                        var that = this;
                        setTimeout(function () {
                            that.setSelection(nextTab.start, nextTab.end);
                        }, 500);

                        blocked = true;
                    } else {
                        // The next tab memory contains nothing...
                        // check the cursor position to determine tab action
                        var cursor = this.getSelection();

                        if (cursor.start == cursor.end && cursor.end == this.getContent().length) {
                            // The cursor already reach the end of the content
                            blocked = false;
                        } else {
                            // Put the cursor to the end
                            this.setSelection(this.getContent().length, this.getContent().length);

                            blocked = true;
                        }
                    }

                    break;

                case 13: // enter
                    blocked = false;
                    break;
                case 27: // escape
                    if (this.$isFullscreen) this.setFullscreen(false);
                    blocked = false;
                    break;

                default:
                    blocked = false;
            }

            if (blocked) {
                e.stopPropagation();
                e.preventDefault();
            }

            this.$options.onChange(this);
        }

        , change: function (e) {
            this.$options.onChange(this);
            return this;
        }

        , focus: function (e) {
            var options = this.$options,
                isHideable = options.hideable,
                editor = this.$editor;

            editor.addClass('active');

            // Blur other markdown(s)
            $(document).find('.md-editor').each(function () {
                if ($(this).attr('id') !== editor.attr('id')) {
                    var attachedMarkdown;

                    if (attachedMarkdown = $(this).find('textarea').data('markdown'),
                        attachedMarkdown === null) {
                        attachedMarkdown = $(this).find('div[data-provider="markdown-preview"]').data('markdown');
                    }

                    if (attachedMarkdown) {
                        attachedMarkdown.blur();
                    }
                }
            });

            // Trigger the onFocus hook
            options.onFocus(this);

            return this;
        }

        , blur: function (e) {
            var options = this.$options,
                isHideable = options.hideable,
                editor = this.$editor,
                editable = this.$editable;

            if (editor.hasClass('active') || this.$element.parent().length === 0) {
                editor.removeClass('active');

                if (isHideable) {
                    // Check for editable elements
                    if (editable.el !== null) {
                        // Build the original element
                        var oldElement = $('<' + editable.type + '/>'),
                            content = this.getContent(),
                            currentContent = (typeof markdown == 'object') ? markdown.toHTML(content) : content;

                        $(editable.attrKeys).each(function (k, v) {
                            oldElement.attr(editable.attrKeys[k], editable.attrValues[k]);
                        });

                        // Get the editor content
                        oldElement.html(currentContent);

                        editor.replaceWith(oldElement);
                    } else {
                        editor.hide();
                    }
                }

                // Trigger the onBlur hook
                options.onBlur(this);
            }

            return this;
        }

    };

    /* MARKDOWN PLUGIN DEFINITION
     * ========================== */

    var old = $.fn.markdown;

    $.fn.markdown = function (option) {
        return this.each(function () {
            var $this = $(this)
                , data = $this.data('markdown')
                , options = typeof option == 'object' && option;
            if (!data) $this.data('markdown', (data = new Markdown(this, options)))
        })
    };

    $.fn.markdown.messages = {};

    $.fn.markdown.defaults = {
        /* Editor Properties */
        autofocus: true,
        hideable: false,
        savable: false,
        width: 'inherit',
        height: 'inherit',
        resize: 'none',
        iconlibrary: 'glyph',
        language: 'en',
        initialstate: 'editor',
        imgurl: '',
        base64url: '',
        /* Buttons Properties */
        buttons: [
            [{
                name: 'groupFont',
                data: [{
                    name: 'cmdBold',
                    hotkey: 'Ctrl+B',
                    title: 'Bold',
                    icon: {glyph: 'glyphicon glyphicon-bold', fa: 'fa fa-bold', 'fa-3': 'icon-bold'},
                    callback: function (e) {
                        // Give/remove ** surround the selection
                        var chunk, cursor, selected = e.getSelection(), content = e.getContent();

                        if (selected.length === 0) {
                            // Give extra word
                            chunk = e.__localize('strong text');
                        } else {
                            chunk = selected.text;
                        }

                        // transform selection and set the cursor into chunked text
                        if (content.substr(selected.start - 2, 2) === '**'
                            && content.substr(selected.end, 2) === '**') {
                            e.setSelection(selected.start - 2, selected.end + 2);
                            e.replaceSelection(chunk);
                            cursor = selected.start - 2;
                        } else {
                            e.replaceSelection('**' + chunk + '**');
                            cursor = selected.start + 2;
                        }

                        // Set the cursor
                        e.setSelection(cursor, cursor + chunk.length);
                    }
                }, {
                    name: 'cmdItalic',
                    title: 'Italic',
                    hotkey: 'Ctrl+I',
                    icon: {glyph: 'glyphicon glyphicon-italic', fa: 'fa fa-italic', 'fa-3': 'icon-italic'},
                    callback: function (e) {
                        // Give/remove * surround the selection
                        var chunk, cursor, selected = e.getSelection(), content = e.getContent();

                        if (selected.length === 0) {
                            // Give extra word
                            chunk = e.__localize('emphasized text');
                        } else {
                            chunk = selected.text;
                        }

                        // transform selection and set the cursor into chunked text
                        if (content.substr(selected.start - 1, 1) === '_'
                            && content.substr(selected.end, 1) === '_') {
                            e.setSelection(selected.start - 1, selected.end + 1);
                            e.replaceSelection(chunk);
                            cursor = selected.start - 1;
                        } else {
                            e.replaceSelection('_' + chunk + '_');
                            cursor = selected.start + 1;
                        }

                        // Set the cursor
                        e.setSelection(cursor, cursor + chunk.length);
                    }
                }, {
                    name: 'cmdHeading',
                    title: 'Heading',
                    hotkey: 'Ctrl+H',
                    icon: {glyph: 'glyphicon glyphicon-header', fa: 'fa fa-header', 'fa-3': 'icon-font'},
                    callback: function (e) {
                        // Append/remove ### surround the selection
                        var chunk, cursor, selected = e.getSelection(), content = e.getContent(), pointer = 4, prevChar;

                        if (selected.length === 0) {
                            // Give extra word
                            chunk = e.__localize('heading text');
                        } else {
                            chunk = selected.text + '\n';
                        }

                        // transform selection and set the cursor into chunked text
                        if (content.substr(selected.start - pointer, pointer) === '### '
                            || content.substr(selected.start - (--pointer), pointer) === '###') {
                            e.setSelection(selected.start - pointer, selected.end);
                            e.replaceSelection(chunk);
                            cursor = selected.start - pointer;
                        } else if (selected.start > 0 && (prevChar = content.substr(selected.start - 1, 1), !!prevChar && prevChar != '\n')) {
                            e.replaceSelection('\n\n### ' + chunk);
                            cursor = selected.start + 6;
                        } else {
                            // Empty string before element
                            e.replaceSelection('### ' + chunk);
                            cursor = selected.start + 4;
                        }

                        // Set the cursor
                        e.setSelection(cursor, cursor + chunk.length);
                    }
                }]
            }, {
                name: 'groupLink',
                data: [{
                    name: 'cmdUrl',
                    title: 'URL/Link',
                    hotkey: 'Ctrl+L',
                    icon: {glyph: 'glyphicon glyphicon-link', fa: 'fa fa-link', 'fa-3': 'icon-link'},
                    callback: function (e) {
                        // Give [] surround the selection and prepend the link
                        var chunk, cursor, selected = e.getSelection(), content = e.getContent(), link;

                        if (selected.length === 0) {
                            // Give extra word
                            chunk = e.__localize('enter link description here');
                        } else {
                            chunk = selected.text;
                        }

                        link = prompt(e.__localize('Insert Hyperlink'), 'http://');

                        if (link !== null && link !== '' && link !== 'http://' && link.substr(0, 4) === 'http') {
                            var sanitizedLink = $('<div>' + link + '</div>').text();

                            // transform selection and set the cursor into chunked text
                            e.replaceSelection('[' + chunk + '](' + sanitizedLink + ')');
                            cursor = selected.start + 1;

                            // Set the cursor
                            e.setSelection(cursor, cursor + chunk.length);
                        }
                    }
                }, {
                    name: 'cmdImage',
                    title: 'Image',
                    hotkey: 'Ctrl+G',
                    icon: {glyph: 'glyphicon glyphicon-picture', fa: 'fa fa-picture-o', 'fa-3': 'icon-picture'},
                    callback: function (e) {
                        e.$uploadMode = true;
                        e.showUpload(e);

                    }
                }]
            }, {
                name: 'groupMisc',
                data: [{
                    name: 'cmdList',
                    hotkey: 'Ctrl+U',
                    title: 'Unordered List',
                    icon: {glyph: 'glyphicon glyphicon-list', fa: 'fa fa-list', 'fa-3': 'icon-list-ul'},
                    callback: function (e) {
                        // Prepend/Give - surround the selection
                        var chunk, cursor, selected = e.getSelection(), content = e.getContent();

                        // transform selection and set the cursor into chunked text
                        if (selected.length === 0) {
                            // Give extra word
                            chunk = e.__localize('list text here');

                            e.replaceSelection('- ' + chunk);
                            // Set the cursor
                            cursor = selected.start + 2;
                        } else {
                            if (selected.text.indexOf('\n') < 0) {
                                chunk = selected.text;

                                e.replaceSelection('- ' + chunk);

                                // Set the cursor
                                cursor = selected.start + 2;
                            } else {
                                var list = [];

                                list = selected.text.split('\n');
                                chunk = list[0];

                                $.each(list, function (k, v) {
                                    list[k] = '- ' + v;
                                });

                                e.replaceSelection('\n\n' + list.join('\n'));

                                // Set the cursor
                                cursor = selected.start + 4;
                            }
                        }

                        // Set the cursor
                        e.setSelection(cursor, cursor + chunk.length);
                    }
                },
                    {
                        name: 'cmdListO',
                        hotkey: 'Ctrl+O',
                        title: 'Ordered List',
                        icon: {glyph: 'glyphicon glyphicon-th-list', fa: 'fa fa-list-ol', 'fa-3': 'icon-list-ol'},
                        callback: function (e) {

                            // Prepend/Give - surround the selection
                            var chunk, cursor, selected = e.getSelection(), content = e.getContent();

                            // transform selection and set the cursor into chunked text
                            if (selected.length === 0) {
                                // Give extra word
                                chunk = e.__localize('list text here');
                                e.replaceSelection('1. ' + chunk);
                                // Set the cursor
                                cursor = selected.start + 3;
                            } else {
                                if (selected.text.indexOf('\n') < 0) {
                                    chunk = selected.text;

                                    e.replaceSelection('1. ' + chunk);

                                    // Set the cursor
                                    cursor = selected.start + 3;
                                } else {
                                    var list = [];

                                    list = selected.text.split('\n');
                                    chunk = list[0];

                                    $.each(list, function (k, v) {
                                        list[k] = '1. ' + v;
                                    });

                                    e.replaceSelection('\n\n' + list.join('\n'));

                                    // Set the cursor
                                    cursor = selected.start + 5;
                                }
                            }

                            // Set the cursor
                            e.setSelection(cursor, cursor + chunk.length);
                        }
                    },
                    {
                        name: 'cmdCode',
                        hotkey: 'Ctrl+K',
                        title: 'Code',
                        icon: {glyph: 'glyphicon glyphicon-asterisk', fa: 'fa fa-code', 'fa-3': 'icon-code'},
                        callback: function (e) {
                            // Give/remove ** surround the selection
                            var chunk, cursor, selected = e.getSelection(), content = e.getContent();

                            if (selected.length === 0) {
                                // Give extra word
                                chunk = e.__localize('code text here');
                            } else {
                                chunk = selected.text;
                            }

                            // transform selection and set the cursor into chunked text
                            if (content.substr(selected.start - 4, 4) === '```\n'
                                && content.substr(selected.end, 4) === '\n```') {
                                e.setSelection(selected.start - 4, selected.end + 4);
                                e.replaceSelection(chunk);
                                cursor = selected.start - 4;
                            } else if (content.substr(selected.start - 1, 1) === '`'
                                && content.substr(selected.end, 1) === '`') {
                                e.setSelection(selected.start - 1, selected.end + 1);
                                e.replaceSelection(chunk);
                                cursor = selected.start - 1;
                            } else if (content.indexOf('\n') > -1) {
                                e.replaceSelection('```\n' + chunk + '\n```');
                                cursor = selected.start + 4;
                            } else {
                                e.replaceSelection('`' + chunk + '`');
                                cursor = selected.start + 1;
                            }

                            // Set the cursor
                            e.setSelection(cursor, cursor + chunk.length);
                        }
                    },
                    {
                        name: 'cmdQuote',
                        hotkey: 'Ctrl+Q',
                        title: 'Quote',
                        icon: {glyph: 'glyphicon glyphicon-comment', fa: 'fa fa-quote-left', 'fa-3': 'icon-quote-left'},
                        callback: function (e) {
                            // Prepend/Give - surround the selection
                            var chunk, cursor, selected = e.getSelection(), content = e.getContent();

                            // transform selection and set the cursor into chunked text
                            if (selected.length === 0) {
                                // Give extra word
                                chunk = e.__localize('quote here');

                                e.replaceSelection('> ' + chunk);

                                // Set the cursor
                                cursor = selected.start + 2;
                            } else {
                                if (selected.text.indexOf('\n') < 0) {
                                    chunk = selected.text;

                                    e.replaceSelection('> ' + chunk);

                                    // Set the cursor
                                    cursor = selected.start + 2;
                                } else {
                                    var list = [];

                                    list = selected.text.split('\n');
                                    chunk = list[0];

                                    $.each(list, function (k, v) {
                                        list[k] = '> ' + v;
                                    });

                                    e.replaceSelection('\n\n' + list.join('\n'));

                                    // Set the cursor
                                    cursor = selected.start + 4;
                                }
                            }

                            // Set the cursor
                            e.setSelection(cursor, cursor + chunk.length);
                        }
                    }]
            }, {
                name: 'groupUtil',
                data: [{
                    name: 'cmdPreview',
                    toggle: true,
                    hotkey: 'Ctrl+P',
                    title: 'Preview',
                    btnText: 'Preview',
                    btnClass: 'btn btn-primary btn-sm',
                    icon: {glyph: 'glyphicon glyphicon-search', fa: 'fa fa-search', 'fa-3': 'icon-search'},
                    callback: function (e) {
                        // Check the preview mode and toggle based on this flag
                        var isPreview = e.$isPreview, content;

                        if (isPreview === false) {
                            // Give flag that tell the editor enter preview mode
                            e.showPreview();
                        } else {
                            e.hidePreview();
                        }
                    }
                }]
            }]
        ],
        additionalButtons: [], // Place to hook more buttons by code
        reorderButtonGroups: [],
        hiddenButtons: [], // Default hidden buttons
        disabledButtons: [], // Default disabled buttons
        footer: '',
        fullscreen: {
            enable: true,
            icons: {
                fullscreenOn: {
                    fa: 'fa fa-expand',
                    glyph: 'glyphicon glyphicon-fullscreen',
                    'fa-3': 'icon-resize-full'
                },
                fullscreenOff: {
                    fa: 'fa fa-compress',
                    glyph: 'glyphicon glyphicon-fullscreen',
                    'fa-3': 'icon-resize-small'
                }
            }
        },

        /* Events hook */
        onShow: function (e) {
        },
        onPreview: function (e) {
        },
        onSave: function (e) {
        },
        onBlur: function (e) {
        },
        onFocus: function (e) {
        },
        onChange: function (e) {
        },
        onFullscreen: function (e) {
        }
    };

    $.fn.markdown.Constructor = Markdown;


    /* MARKDOWN NO CONFLICT
     * ==================== */

    $.fn.markdown.noConflict = function () {
        $.fn.markdown = old;
        return this;
    };

    /* MARKDOWN GLOBAL FUNCTION & DATA-API
     * ==================================== */
    var initMarkdown = function (el) {
        var $this = el;

        if ($this.data('markdown')) {
            $this.data('markdown').showEditor();
            return;
        }

        $this.markdown()
    };

    var blurNonFocused = function (e) {
        var $activeElement = $(document.activeElement);

        // Blur event
        $(document).find('.md-editor').each(function () {
            var $this = $(this),
                focused = $activeElement.closest('.md-editor')[0] === this,
                attachedMarkdown = $this.find('textarea').data('markdown') ||
                    $this.find('div[data-provider="markdown-preview"]').data('markdown');

            if (attachedMarkdown && !focused) {
                attachedMarkdown.blur();
            }
        })
    };

    $(document)
        .on('click.markdown.data-api', '[data-provide="markdown-editable"]', function (e) {
            initMarkdown($(this));
            e.preventDefault();
        })
        .on('click focusin', function (e) {
            blurNonFocused(e);
        })
        .ready(function () {
            $('textarea[data-provide="markdown"]').each(function () {
                initMarkdown($(this));
            })
        });

}(window.jQuery);