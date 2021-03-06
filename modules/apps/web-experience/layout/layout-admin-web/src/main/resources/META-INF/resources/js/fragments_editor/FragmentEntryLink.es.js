import Component from 'metal-component';
import {Config} from 'metal-state';
import {isFunction, isObject, object} from 'metal';
import Soy from 'metal-soy';

import templates from './FragmentEntryLink.soy';

const ARROW_DOWN_KEYCODE = 40;

const ARROW_UP_KEYCODE = 38;

/**
 * FragmentEntryLink
 * @review
 */

class FragmentEntryLink extends Component {

	/**
	 * @inheritDoc
	 * @review
	 */

	created() {
		this._handleEditorChange = this._handleEditorChange.bind(this);

		Liferay.on('beforeNavigate', () => this._destroyEditors());
	}

	/**
	 * @inheritDoc
	 * @review
	 */

	disposed() {
		this._destroyEditors();
	}

	/**
	 * @inheritDoc
	 * @review
	 */

	prepareStateForRender(state) {
		return Object.assign(
			{},
			state,
			{
				content: this.content ? Soy.toIncDom(this.content) : null
			}
		);
	}

	/**
	 * After each render, script tags need to be reapended to the DOM
	 * in order to trigger an execution (content changes do not trigger it).
	 * @inheritDoc
	 * @review
	 */

	rendered() {
		if (this.refs.content) {
			this._destroyEditors();
			this._executeFragmentScripts(this.refs.content);
			this._enableEditableFields(this.refs.content);
		}
	}

	/**
	 * @inheritDoc
	 * @review
	 */

	shouldUpdate(changes) {
		return !!changes.content;
	}

	/**
	 * Destroy existing editors
	 * @private
	 * @review
	 */

	_destroyEditors() {
		this._editors.forEach(
			editor => {
				editor.destroy();
			}
		);

		this._editors = [];
	}

	/**
	 * Emits a move event with the fragmentEntryLinkId and the direction.
	 * @param {!number} direction
	 * @private
	 */

	_emitMoveEvent(direction) {
		this.emit(
			'move',
			{
				direction,
				fragmentEntryLinkId: this.fragmentEntryLinkId
			}
		);
	}

	/**
	 * Allow inline edition using AlloyEditor
	 * @param {!HTMLElement} content
	 * @private
	 * @review
	 */

	_enableEditableFields(content) {
		this._editors = [].slice
			.call(content.querySelectorAll('lfr-editable'))
			.map(
				editableElement => {
					const editableId = editableElement.id;

					const editableContent = editableElement.innerHTML;

					const wrapper = document.createElement('div');

					wrapper.dataset.lfrEditableId = editableId;
					wrapper.innerHTML = editableContent;

					editableElement.parentNode.replaceChild(
						wrapper,
						editableElement
					);

					const editor = AlloyEditor.editable(
						wrapper,
						object.mixin(
							this.defaultEditorConfiguration.editorConfig,
							{
								enterMode: CKEDITOR.ENTER_BR,
								extraPlugins: [
									'ae_autolink',
									'ae_dragresize',
									'ae_addimages',
									'ae_imagealignment',
									'ae_placeholder',
									'ae_selectionregion',
									'ae_tableresize',
									'ae_tabletools',
									'ae_uicore',
									'itemselector',
									'media',
									'adaptivemedia'
								].join(','),
								removePlugins: [
									'contextmenu',
									'elementspath',
									'image',
									'link',
									'liststyle',
									'magicline',
									'resize',
									'tabletools',
									'toolbar',
									'ae_embed'
								].join(',')
							}
						)
					);

					const nativeEditor = editor.get('nativeEditor');

					nativeEditor.name = `${this.portletNamespace}fragmentEntryLink_`;

					nativeEditor.on(
						'change',
						this._handleEditorChange
					);

					nativeEditor.on(
						'selectionChange',
						this._handleEditorChange
					);

					return editor;
				}
			);
	}

	/**
	 * After each render, script tags need to be reapended to the DOM
	 * in order to trigger an execution (content changes do not trigger it).
	 * @param {!HTMLElement} content
	 * @private
	 * @review
	 */

	_executeFragmentScripts(content) {
		AUI().use(
			'aui-parse-content',
			A => {
				const content = A.one(this.refs.content);

				content.plug(A.Plugin.ParseContent);

				content.setContent(this.content);
			}
		);
	}

	/**
	 * Handle AlloyEditor changes and propagate them with an
	 * "editableChanged" event.
	 * @param {!Object} event
	 * @private
	 * @review
	 */

	_handleEditorChange(event) {
		this.emit(
			'editableChanged',
			{
				editableId: event.editor.element.$.dataset.lfrEditableId,
				fragmentEntryLinkId: this.fragmentEntryLinkId,
				value: event.editor.getData()
			}
		);
	}

	/**
	 * Handle fragment keyup event so it can emit when it
	 * should be moved or selected.
	 * @param {KeyboardEvent} event
	 * @private
	 * @review
	 */

	_handleFragmentKeyUp(event) {
		if (document.activeElement === this.refs.fragmentEntryLinkWrapper) {
			switch (event.which) {
			case ARROW_DOWN_KEYCODE:
				this._emitMoveEvent(FragmentEntryLink.MOVE_DIRECTIONS.DOWN);
				break;
			case ARROW_UP_KEYCODE:
				this._emitMoveEvent(FragmentEntryLink.MOVE_DIRECTIONS.UP);
				break;
			}
		}
	}

	/**
	 * Callback executed when the fragment move down button is clicked.
	 * It emits a 'moveDown' event with
	 * the FragmentEntryLink id.
	 * @private
	 * @review
	 */

	_handleFragmentMoveDownButtonClick() {
		this._emitMoveEvent(FragmentEntryLink.MOVE_DIRECTIONS.DOWN);
	}

	/**
	 * Callback executed when the fragment move up button is clicked.
	 * It emits a 'moveUp' event with
	 * the FragmentEntryLink id.
	 * @private
	 * @review
	 */

	_handleFragmentMoveUpButtonClick() {
		this._emitMoveEvent(FragmentEntryLink.MOVE_DIRECTIONS.UP);
	}

	/**
	 * Callback executed when the fragment remove button is clicked.
	 * It emits a 'remove' event with
	 * the FragmentEntryLink id.
	 * @private
	 */

	_handleFragmentRemoveButtonClick() {
		this.emit(
			'remove',
			{
				fragmentEntryLinkId: this.fragmentEntryLinkId
			}
		);
	}
}

/**
 * Directions where a fragment can be moved to
 * @review
 * @static
 * @type {!object}
 */

FragmentEntryLink.MOVE_DIRECTIONS = {
	DOWN: 1,
	UP: -1
};

/**
 * State definition.
 * @review
 * @static
 * @type {!Object}
 */

FragmentEntryLink.STATE = {

	/**
	 * Fragment content to be rendered
	 * @default ''
	 * @instance
	 * @memberOf FragmentEntryLink
	 * @review
	 * @type {string}
	 */

	content: Config.any()
		.setter(
			content => {
				return !isFunction(content) && isObject(content) ? content.value.content : content;
			}
		)
		.value(''),

	/**
	 * Default configuration for AlloyEditor instances.
	 * @default {}
	 * @instance
	 * @memberOf FragmentEntryLink
	 * @review
	 * @type {object}
	 */

	defaultEditorConfiguration: Config.object().value({}),

	/**
	 * Editable values that should be used instead of the default ones
	 * inside editable fields.
	 * @default {}
	 * @instance
	 * @memberOf FragmentEntryLink
	 * @review
	 * @type {!Object}
	 */

	editableValues: Config.object().value({}),

	/**
	 * FragmentEntryLink id
	 * @default undefined
	 * @instance
	 * @memberOf FragmentEntryLink
	 * @review
	 * @type {!string}
	 */

	fragmentEntryLinkId: Config.string().required(),

	/**
	 * Fragment name
	 * @default ''
	 * @instance
	 * @memberOf FragmentEntryLink
	 * @review
	 * @type {string}
	 */

	name: Config.string().value(''),

	/**
	 * Shows FragmentEntryLink control toolbar
	 * @default true
	 * @instance
	 * @memberOf FragmentEntryLink
	 * @review
	 * @type {!bool}
	 */

	showControlBar: Config.bool().value(true),

	/**
	 * Portlet namespace needed for prefixing Alloy Editor instances
	 * @default undefined
	 * @instance
	 * @memberOf FragmentEntryLink
	 * @review
	 * @type {!string}
	 */

	portletNamespace: Config.string().required(),

	/**
	 * Fragment spritemap
	 * @default undefined
	 * @instance
	 * @memberOf FragmentEntryLink
	 * @review
	 * @type {!string}
	 */

	spritemap: Config.string().required(),

	/**
	 * List of AlloyEditor instances used for inline edition
	 * @default []
	 * @instance
	 * @memberOf FragmentEntryLink
	 * @private
	 * @review
	 * @type {Array<AlloyEditor>}
	 */

	_editors: Config.arrayOf(Config.object())
		.internal()
		.value([])
};

Soy.register(FragmentEntryLink, templates);

export {FragmentEntryLink};
export default FragmentEntryLink;