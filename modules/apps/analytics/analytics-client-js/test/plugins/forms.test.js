const Analytics = window.Analytics;
const assert = chai.assert;
const expect = chai.expect;

describe('Forms Plugin', () => {
	describe('formViewed event', () => {
		it('should be fired for every form on the page', () => {
			Analytics.create();

			const form = document.createElement('form');
			form.dataset.analytics = 'true';
			form.id = 'myId';
			document.body.appendChild(form);

			const event = new Event('load');
			window.dispatchEvent(event);

			const events = Analytics.events.filter(
				({eventId}) => eventId === 'formViewed'
			);

			expect(events.length).to.be.at.least(1);

			events[0].should.deep.include({
				applicationId: 'forms',
				eventId: 'formViewed',
				properties: {
					formId: 'myId'
				}
			});
		});
	});

	describe('formSubmitted event', () => {
		it('should be fired when a form is submitted', () => {
			Analytics.create();

			const form = document.createElement('form');
			form.dataset.analytics = 'true';
			form.id = 'myId';
			document.body.appendChild(form);
			form.addEventListener('submit', event => event.preventDefault());

			const event = new Event('submit', {
				cancelable: true
			});
			form.dispatchEvent(event);

			const events = Analytics.events.filter(
				({eventId}) => eventId === 'formSubmitted'
			);

			expect(events.length).to.be.at.least(1);

			events[0].should.deep.include({
				applicationId: 'forms',
				eventId: 'formSubmitted',
				properties: {
					formId: 'myId'
				}
			});
		});
	});

	describe('fieldFocused event', () => {
		it('should be fired whenever a field is focused', () => {
			Analytics.create();

			const form = document.createElement('form');
			form.dataset.analytics = 'true';
			form.id = 'myId';
			document.body.appendChild(form);
			const field = document.createElement('input');
			field.name = 'myField';
			field.type = 'text';
			form.appendChild(field);

			field.dispatchEvent(new Event('focus'));

			const events = Analytics.events.filter(
				({eventId}) => eventId === 'fieldFocused'
			);

			expect(events.length).to.be.at.least(1);

			events[0].should.deep.include({
				applicationId: 'forms',
				eventId: 'fieldFocused',
				properties: {
					formId: 'myId',
					fieldName: 'myField'
				}
			});
		});
	});

	describe('fieldBlurred event', () => {
		it('should be fired whenever a field is blurred', (done) => {
			Analytics.create();

			const form = document.createElement('form');
			form.dataset.analytics = 'true';
			form.id = 'myId';
			document.body.appendChild(form);
			const field = document.createElement('input');
			field.name = 'myField';
			field.type = 'text';
			form.appendChild(field);

			field.dispatchEvent(new Event('focus'));

			setTimeout(() => {
				field.dispatchEvent(new Event('blur'));

				const events = Analytics.events.filter(
					({eventId}) => eventId === 'fieldBlurred'
				);

				expect(events.length).to.be.at.least(1);

				events[0].applicationId.should.equal('forms');
				events[0].eventId.should.equal('fieldBlurred');
				events[0].properties.formId.should.equal('myId');
				events[0].properties.fieldName.should.equal('myField');
				events[0].properties.focusDuration.should.be.at.least(1500);

				done();
			}, 1500);
		});
	});
});