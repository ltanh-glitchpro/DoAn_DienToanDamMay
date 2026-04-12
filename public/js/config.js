/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see https://ckeditor.com/legal/ckeditor-oss-license
 */

CKEDITOR.editorConfig = function( config ) {
	config.language = 'vi';
	config.uiColor = '#74c0fc';
	config.height = 500;
	config.removePlugins = 'elementspath,exportpdf';
	config.resize_enabled = false;
	
	config.toolbarGroups = [
		{ name: 'document', groups: [ 'mode', 'document', 'doctools' ] },
		{ name: 'clipboard', groups: [ 'clipboard', 'undo' ] },
		{ name: 'editing', groups: [ 'find', 'selection', 'spellchecker', 'editing' ] },
		{ name: 'forms', groups: [ 'forms' ] },
		{ name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
		{ name: 'links', groups: [ 'links' ] },
		{ name: 'tools', groups: [ 'tools' ] },
		'/',
		{ name: 'styles', groups: [ 'styles' ] },
		{ name: 'paragraph', groups: [ 'list', 'indent', 'bidi', 'blocks', 'align', 'paragraph' ] },
		{ name: 'insert', groups: [ 'insert' ] },
		{ name: 'colors', groups: [ 'colors' ] },
		{ name: 'others', groups: [ 'others' ] },
		{ name: 'about', groups: [ 'about' ] }
	];
	config.removeButtons = 'Save,Print,ExportPdf,Paste,PasteFromWord,Scayt,Form,Checkbox,Radio,TextField,Textarea,Select,Button,ImageButton,HiddenField,Subscript,Superscript,Language,Anchor,Flash,SpecialChar,PageBreak';
};

// Hide only the insecure-version warning before it renders.
CKEDITOR.on('instanceCreated', function(evt) {
	evt.editor.on('notificationShow', function(notificationEvt) {
		var message = notificationEvt.data && notificationEvt.data.message;
		if (typeof message === 'string' &&
			message.indexOf('CKEditor') !== -1 &&
			message.indexOf('version is not secure') !== -1) {
			notificationEvt.cancel();
		}
	});
});

if (!window.__ckEditorWarningObserverAttached) {
	window.__ckEditorWarningObserverAttached = true;
	var observer = new MutationObserver(function() {
		var notifications = document.querySelectorAll('.cke_notification');
		for (var i = 0; i < notifications.length; i++) {
			var content = notifications[i].textContent || '';
			if (content.indexOf('CKEditor') !== -1 && content.indexOf('version is not secure') !== -1) {
				notifications[i].remove();
			}
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true
	});
}