import { mount } from 'cypress/angular';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { Component, NgZone } from '@angular/core';
import { appRoutes } from 'apps/todo-app/src/app/app.routes';
import { AppModule } from 'apps/todo-app/src/app/app.module';
import * as config from 'apps/todo-app/src/assets/app-config.json';
import { TodoItem } from '@todo/shared/todo-interfaces';
import { TodoListResourcesService } from 'libs/todo-app/domain/src/lib/todo-list/resources/todo-list-resources.service';
import { Observable, of } from 'rxjs';
import {
	TranslateLoader,
	TranslateModule,
	TranslateService,
} from '@ngx-translate/core';
import { formatDate } from '@angular/common';
import * as transactions from 'apps/todo-service/src/assets/i18n/en-lang.json';

class CustomLoader implements TranslateLoader {
	getTranslation(lang: string): Observable<any> {
		return of(transactions);
	}
}

describe('TodoListComponent', () => {
	@Component({
		selector: 'app-wrapper-component',
		template: '<router-outlet></router-outlet>',
	})
	class WrapperComponent {
		constructor(translateService: TranslateService) {
			(window as any).config = config;

			translateService.addLangs(['en']);
			translateService.setDefaultLang('en');
		}
	}

	const setup = (initTodoItems: TodoItem[] = []) => {
		return mount(WrapperComponent, {
			imports: [
				RouterTestingModule.withRoutes([...appRoutes]),
				AppModule,
				TranslateModule.forRoot({
					loader: {
						provide: TranslateLoader,
						useClass: CustomLoader,
					},
				}),
			],
		}).then(
			async ({
				fixture: {
					debugElement: { injector },
				},
			}) => {
				const ngZone = injector.get(NgZone);
				const router = injector.get(Router);
				const todoListResourceService = injector.get(TodoListResourcesService);

				// or mock service worker
				todoListResourceService.getTodos = () => {
					return of(initTodoItems);
				};

				await ngZone.run(() => router.navigate(['']));

				return {
					ngZone,
					router,
					injector,
				};
			},
		);
	};

	it('should show todo item', () => {
		const title = 'Item to show';
		const description = 'This item should be shown';
		const dueDate = new Date().toLocaleDateString('en-US');
		setup([
			{
				id: '1',
				title,
				description,
				dueDate,
			} as TodoItem,
		]).then(({}) => {
			cy.get('[data-test=todo-item]').contains(title);
			cy.get('[data-test=todo-item]').contains(description);
			const formattedDueDate = formatDate(dueDate, 'shortDate', 'en-US');
			cy.get('[data-test=todo-item]').contains(formattedDueDate);
		});
	});

	it('should create todo item', () => {});
});
